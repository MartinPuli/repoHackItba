const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StrongBox", function () {
    let owner;
    let guardian1;
    let guardian2;
    let heir1;
    let heir2;
    let outsider;
    let recipient;

    let guardianContract;
    let heirContract;
    let strongBox;

    const TIME_LIMIT = 60 * 60 * 24 * 180; // 180 días

    async function deployStrongBoxFixture() {
        [owner, guardian1, guardian2, heir1, heir2, outsider, recipient] =
            await ethers.getSigners();

        const Guardian = await ethers.getContractFactory("Guardian");
        guardianContract = await Guardian.deploy(
            guardian1.address,
            guardian2.address
        );
        await guardianContract.waitForDeployment();

        const Heir = await ethers.getContractFactory("Heir");
        heirContract = await Heir.deploy(heir1.address, heir2.address);
        await heirContract.waitForDeployment();

        const StrongBox = await ethers.getContractFactory("StrongBox");
        strongBox = await StrongBox.deploy(
            owner.address,
            await guardianContract.getAddress(),
            await heirContract.getAddress(),
            TIME_LIMIT
        );
        await strongBox.waitForDeployment();
    }

    beforeEach(async function () {
        await deployStrongBoxFixture();
    });

    describe("deployment", function () {
        it("should set the correct owner", async function () {
            expect(await strongBox.getOwner()).to.equal(owner.address);
        });

        it("should expose its own address", async function () {
            expect(await strongBox.getAddress()).to.equal(
                await strongBox.getAddress()
            );
        });

        it("should set initial lastTimeUsed", async function () {
            const lastTimeUsed = await strongBox.getLastTimeUsed();
            expect(lastTimeUsed).to.be.gt(0);
        });

        it("should set the correct time limit", async function () {
            expect(await strongBox.getTimeLimit()).to.equal(TIME_LIMIT);
        });
    });

    describe("deposit", function () {
        it("should allow only owner to deposit", async function () {
            await expect(
                strongBox.connect(owner).deposit({ value: ethers.parseEther("1") })
            ).to.not.be.reverted;

            await expect(
                strongBox.connect(outsider).deposit({ value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(strongBox, "NotOwner");
        });

        it("should revert if deposit amount is zero", async function () {
            await expect(
                strongBox.connect(owner).deposit({ value: 0 })
            ).to.be.revertedWithCustomError(strongBox, "InvalidAmount");
        });

        it("should increase contract balance after deposit", async function () {
            const amount = ethers.parseEther("1");

            await expect(() =>
                strongBox.connect(owner).deposit({ value: amount })
            ).to.changeEtherBalances([owner, strongBox], [-amount, amount]);

            expect(await ethers.provider.getBalance(await strongBox.getAddress())).to.equal(amount);
        });

        it("should update lastTimeUsed on deposit", async function () {
            const before = await strongBox.getLastTimeUsed();

            await time.increase(100);

            await strongBox.connect(owner).deposit({ value: ethers.parseEther("1") });

            const after = await strongBox.getLastTimeUsed();
            expect(after).to.be.gt(before);
        });
    });

    describe("getBalance", function () {
        it("should allow only owner to query balance", async function () {
            await strongBox.connect(owner).deposit({ value: ethers.parseEther("1") });

            expect(await strongBox.connect(owner).getBalance()).to.equal(
                ethers.parseEther("1")
            );

            await expect(
                strongBox.connect(outsider).getBalance()
            ).to.be.revertedWithCustomError(strongBox, "NotOwner");
        });
    });

    describe("withdrawal requests", function () {
        beforeEach(async function () {
            await strongBox.connect(owner).deposit({ value: ethers.parseEther("2") });
        });

        it("should allow owner to create a withdrawal request", async function () {
            const amount = ethers.parseEther("0.5");

            await expect(
                strongBox.connect(owner).withdraw(amount, recipient.address)
            )
                .to.emit(strongBox, "WithdrawalRequested")
                .withArgs(1, owner.address, recipient.address, amount);

            expect(await strongBox.getWithdrawalRequestCount()).to.equal(1);
            expect(await strongBox.hasPendingWithdrawalRequest()).to.equal(true);
            expect(await strongBox.getActiveWithdrawalRequestId()).to.equal(1);

            const request = await strongBox.getWithdrawalRequest(1);
            expect(request.amount).to.equal(amount);
            expect(request.to).to.equal(recipient.address);
            expect(request.executed).to.equal(false);
            expect(request.guardian1Approved).to.equal(false);
            expect(request.guardian2Approved).to.equal(false);
        });

        it("should allow only owner to create a withdrawal request", async function () {
            await expect(
                strongBox
                    .connect(outsider)
                    .withdraw(ethers.parseEther("0.5"), recipient.address)
            ).to.be.revertedWithCustomError(strongBox, "NotOwner");
        });

        it("should revert if withdrawal amount is zero", async function () {
            await expect(
                strongBox.connect(owner).withdraw(0, recipient.address)
            ).to.be.revertedWithCustomError(strongBox, "InvalidAmount");
        });

        it("should revert if recipient is zero address", async function () {
            await expect(
                strongBox
                    .connect(owner)
                    .withdraw(ethers.ZeroAddress, ethers.ZeroAddress)
            ).to.be.reverted;
        });

        it("should revert if amount exceeds balance", async function () {
            await expect(
                strongBox
                    .connect(owner)
                    .withdraw(ethers.parseEther("5"), recipient.address)
            ).to.be.revertedWithCustomError(strongBox, "InsufficientBalance");
        });

        it("should not allow a second withdrawal request while one is active", async function () {
            await strongBox
                .connect(owner)
                .withdraw(ethers.parseEther("0.5"), recipient.address);

            await expect(
                strongBox
                    .connect(owner)
                    .withdraw(ethers.parseEther("0.3"), recipient.address)
            ).to.be.revertedWithCustomError(strongBox, "ActiveWithdrawalRequestExists");
        });

        it("should update lastTimeUsed on withdrawal request", async function () {
            const before = await strongBox.getLastTimeUsed();

            await time.increase(100);

            await strongBox
                .connect(owner)
                .withdraw(ethers.parseEther("0.5"), recipient.address);

            const after = await strongBox.getLastTimeUsed();
            expect(after).to.be.gt(before);
        });
    });

    describe("withdraw approvals", function () {
        const amount = ethers.parseEther("0.5");

        beforeEach(async function () {
            await strongBox.connect(owner).deposit({ value: ethers.parseEther("2") });
            await strongBox.connect(owner).withdraw(amount, recipient.address);
        });

        it("should allow guardian1 to approve", async function () {
            await expect(strongBox.connect(guardian1).approveWithdrawal(1))
                .to.emit(strongBox, "WithdrawalApproved")
                .withArgs(1, guardian1.address);

            const request = await strongBox.getWithdrawalRequest(1);
            expect(request.guardian1Approved).to.equal(true);
            expect(request.guardian2Approved).to.equal(false);
            expect(request.executed).to.equal(false);
        });

        it("should allow guardian2 to approve", async function () {
            await expect(strongBox.connect(guardian2).approveWithdrawal(1))
                .to.emit(strongBox, "WithdrawalApproved")
                .withArgs(1, guardian2.address);

            const request = await strongBox.getWithdrawalRequest(1);
            expect(request.guardian1Approved).to.equal(false);
            expect(request.guardian2Approved).to.equal(true);
            expect(request.executed).to.equal(false);
        });

        it("should not allow non-guardian to approve", async function () {
            await expect(
                strongBox.connect(outsider).approveWithdrawal(1)
            ).to.be.revertedWithCustomError(strongBox, "NotGuardian");
        });

        it("should execute withdrawal after both guardians approve", async function () {
            await strongBox.connect(guardian1).approveWithdrawal(1);

            await expect(() =>
                strongBox.connect(guardian2).approveWithdrawal(1)
            ).to.changeEtherBalances([strongBox, recipient], [-amount, amount]);

            const request = await strongBox.getWithdrawalRequest(1);
            expect(request.executed).to.equal(true);
            expect(await strongBox.hasPendingWithdrawalRequest()).to.equal(false);
        });

        it("should revert if same guardian approves twice", async function () {
            await strongBox.connect(guardian1).approveWithdrawal(1);

            await expect(
                strongBox.connect(guardian1).approveWithdrawal(1)
            ).to.be.revertedWithCustomError(strongBox, "RequestAlreadyApproved");
        });

        it("should reject approval if request does not exist", async function () {
            await expect(
                strongBox.connect(guardian1).approveWithdrawal(999)
            ).to.be.revertedWithCustomError(strongBox, "RequestDoesNotExist");
        });
    });

    describe("withdraw rejection", function () {
        beforeEach(async function () {
            await strongBox.connect(owner).deposit({ value: ethers.parseEther("2") });
            await strongBox
                .connect(owner)
                .withdraw(ethers.parseEther("0.5"), recipient.address);
        });

        it("should allow a guardian to reject a withdrawal request", async function () {
            await expect(strongBox.connect(guardian1).rejectWithdrawal(1))
                .to.emit(strongBox, "WithdrawalRejected")
                .withArgs(1, guardian1.address);

            expect(await strongBox.isWithdrawalRequestCancelled(1)).to.equal(true);
            expect(await strongBox.hasPendingWithdrawalRequest()).to.equal(false);
        });

        it("should prevent approval after rejection", async function () {
            await strongBox.connect(guardian1).rejectWithdrawal(1);

            await expect(
                strongBox.connect(guardian2).approveWithdrawal(1)
            ).to.be.revertedWithCustomError(strongBox, "RequestAlreadyCancelled");
        });

        it("should not allow non-guardian to reject", async function () {
            await expect(
                strongBox.connect(outsider).rejectWithdrawal(1)
            ).to.be.revertedWithCustomError(strongBox, "NotGuardian");
        });
    });

    describe("inherit", function () {
        beforeEach(async function () {
            await strongBox.connect(owner).deposit({ value: ethers.parseEther("2") });
        });

        it("should not allow inherit before time limit", async function () {
            await expect(
                strongBox.connect(heir1).inherit()
            ).to.be.revertedWithCustomError(strongBox, "TimeLimitNotReached");
        });

        it("should not allow non-heir to inherit", async function () {
            await time.increase(TIME_LIMIT + 1);

            await expect(
                strongBox.connect(outsider).inherit()
            ).to.be.revertedWithCustomError(strongBox, "NotHeir");
        });

        it("should allow heir1 to claim 50% after time limit", async function () {
            const initialStrongBoxBalance = await ethers.provider.getBalance(
                await strongBox.getAddress()
            );
            expect(initialStrongBoxBalance).to.equal(ethers.parseEther("2"));

            await time.increase(TIME_LIMIT + 1);

            await expect(() => strongBox.connect(heir1).inherit()).to.changeEtherBalances(
                [strongBox, heir1],
                [-(ethers.parseEther("1")), ethers.parseEther("1")]
            );

            expect(await strongBox.getHeir1Claimed()).to.equal(true);
            expect(await strongBox.getHeir2Claimed()).to.equal(false);
        });

        it("should allow heir2 to claim the remaining 50%", async function () {
            await time.increase(TIME_LIMIT + 1);

            await strongBox.connect(heir1).inherit();

            await expect(() => strongBox.connect(heir2).inherit()).to.changeEtherBalances(
                [strongBox, heir2],
                [-(ethers.parseEther("1")), ethers.parseEther("1")]
            );

            expect(await strongBox.getHeir1Claimed()).to.equal(true);
            expect(await strongBox.getHeir2Claimed()).to.equal(true);
            expect(await ethers.provider.getBalance(await strongBox.getAddress())).to.equal(0);
        });

        it("should not allow the same heir to claim twice", async function () {
            await time.increase(TIME_LIMIT + 1);

            await strongBox.connect(heir1).inherit();

            await expect(
                strongBox.connect(heir1).inherit()
            ).to.be.revertedWithCustomError(strongBox, "AlreadyClaimed");
        });

        it("should revert if there is nothing to claim", async function () {
            // consumimos todo el balance primero
            await strongBox.connect(owner).withdraw(ethers.parseEther("2"), recipient.address);
            await strongBox.connect(guardian1).approveWithdrawal(1);
            await strongBox.connect(guardian2).approveWithdrawal(1);

            await time.increase(TIME_LIMIT + 1);

            await expect(
                strongBox.connect(heir1).inherit()
            ).to.be.revertedWithCustomError(strongBox, "NothingToClaim");
        });
    });
});