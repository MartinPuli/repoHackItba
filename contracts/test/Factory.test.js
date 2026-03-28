const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
    let deployer;
    let user;
    let guardian1;
    let guardian2;
    let heir1;
    let heir2;
    let outsider;

    let factory;

    const TIME_LIMIT = 60 * 60 * 24 * 180; // 180 días

    async function deployFactoryFixture() {
        [deployer, user, guardian1, guardian2, heir1, heir2, outsider] =
            await ethers.getSigners();

        const Factory = await ethers.getContractFactory("Factory");
        factory = await Factory.deploy(deployer.address);
        await factory.waitForDeployment();
    }

    beforeEach(async function () {
        await deployFactoryFixture();
    });

    describe("deployment", function () {
        it("should set correct owner", async function () {
            expect(await factory.getOwner()).to.equal(deployer.address);
        });
    });

    describe("createStrongBox", function () {
        it("should create a StrongBox for a user", async function () {
            const tx = await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );

            await tx.wait();

            const strongBoxAddress = await factory.getStrongBox(user.address);
            expect(strongBoxAddress).to.not.equal(ethers.ZeroAddress);

            const strongBox = await ethers.getContractAt("StrongBox", strongBoxAddress);
            expect(await strongBox.getOwner()).to.equal(user.address);
            expect(await strongBox.getTimeLimit()).to.equal(TIME_LIMIT);
        });

        it("should emit StrongBoxCreated event", async function () {
            await expect(
                factory
                    .connect(user)
                    .createStrongBox(
                        guardian1.address,
                        guardian2.address,
                        heir1.address,
                        heir2.address,
                        TIME_LIMIT
                    )
            ).to.emit(factory, "StrongBoxCreated");
        });

        it("should not allow creating more than one StrongBox per wallet", async function () {
            await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );

            await expect(
                factory
                    .connect(user)
                    .createStrongBox(
                        guardian1.address,
                        guardian2.address,
                        heir1.address,
                        heir2.address,
                        TIME_LIMIT
                    )
            ).to.be.revertedWithCustomError(factory, "StrongBoxAlreadyExists");
        });

        it("should revert with invalid timeLimit", async function () {
            await expect(
                factory
                    .connect(user)
                    .createStrongBox(
                        guardian1.address,
                        guardian2.address,
                        heir1.address,
                        heir2.address,
                        0
                    )
            ).to.be.revertedWithCustomError(factory, "InvalidTimeLimit");
        });
    });

    describe("getStrongBox", function () {
        it("should return zero address if wallet has no StrongBox", async function () {
            expect(await factory.getStrongBox(user.address)).to.equal(ethers.ZeroAddress);
        });

        it("should return correct StrongBox address after creation", async function () {
            await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );

            const strongBoxAddress = await factory.getStrongBox(user.address);
            expect(strongBoxAddress).to.not.equal(ethers.ZeroAddress);
        });
    });

    describe("setStrongBox", function () {
        it("should allow only owner to manually set a StrongBox", async function () {
            const fakeStrongBox = outsider.address;

            await expect(factory.connect(deployer).setStrongBox(user.address, fakeStrongBox))
                .to.emit(factory, "StrongBoxSet")
                .withArgs(user.address, fakeStrongBox);

            expect(await factory.getStrongBox(user.address)).to.equal(fakeStrongBox);
        });

        it("should not allow non-owner to set StrongBox", async function () {
            await expect(
                factory.connect(user).setStrongBox(user.address, outsider.address)
            ).to.be.revertedWithCustomError(factory, "NotOwner");
        });

        it("should revert if wallet is zero address", async function () {
            await expect(
                factory.connect(deployer).setStrongBox(ethers.ZeroAddress, outsider.address)
            ).to.be.revertedWithCustomError(factory, "InvalidAddress");
        });

        it("should revert if strongBox is zero address", async function () {
            await expect(
                factory.connect(deployer).setStrongBox(user.address, ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(factory, "InvalidAddress");
        });
    });
});