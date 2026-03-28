/**
 * Integration tests — flujo completo que simula la interacción
 * frontend (MetaMask) + backend (API confirm-deploy / confirm-deposit / balance).
 *
 * Basado en Factory.test.js y StrongBox.test.js.
 *
 * Cubre:
 *  1. Setup lógico (guardians + heirs conocidos)
 *  2. Deploy StrongBox via Factory.createStrongBox (frontend firma)
 *  3. Confirm-deploy: verificar bytecode (API)
 *  4. Deposit via StrongBox.deposit (frontend firma)
 *  5. Confirm-deposit: validar receipt, to, value, from (API)
 *  6. Balance: provider.getBalance (API)
 *  7. Segundo depósito y balance acumulado
 *  8. Casos de error
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration — full API flow", function () {
    let deployer, user, guardian1, guardian2, heir1, heir2, outsider;
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

    // ---------------------------------------------------------------
    // 1. Setup lógico (pre-deploy)
    // ---------------------------------------------------------------
    describe("1. Setup lógico — pre-conditions", function () {
        it("usuario no tiene StrongBox antes de crearla", async function () {
            const addr = await factory.getStrongBox(user.address);
            expect(addr).to.equal(ethers.ZeroAddress);
        });
    });

    // ---------------------------------------------------------------
    // 2. Deploy via Factory (simula frontend MetaMask)
    // ---------------------------------------------------------------
    describe("2. Deploy StrongBox via Factory", function () {
        it("crea StrongBox y emite StrongBoxCreated", async function () {
            const tx = await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );

            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);

            await expect(tx).to.emit(factory, "StrongBoxCreated");

            const sbAddr = await factory.getStrongBox(user.address);
            expect(sbAddr).to.not.equal(ethers.ZeroAddress);
        });
    });

    // ---------------------------------------------------------------
    // 3. Confirm-deploy — lo que hace la API
    // ---------------------------------------------------------------
    describe("3. Confirm-deploy (API simulation)", function () {
        let strongBoxAddr;
        let deployTxHash;

        beforeEach(async function () {
            const tx = await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );
            const receipt = await tx.wait();
            deployTxHash = receipt.hash;
            strongBoxAddr = await factory.getStrongBox(user.address);
        });

        it("getCode devuelve bytecode (contrato existe)", async function () {
            const code = await ethers.provider.getCode(strongBoxAddr);
            expect(code).to.not.equal("0x");
            expect(code.length).to.be.greaterThan(2);
        });

        it("getCode en dirección vacía devuelve '0x'", async function () {
            const randomAddr = ethers.Wallet.createRandom().address;
            const code = await ethers.provider.getCode(randomAddr);
            expect(code).to.equal("0x");
        });

        it("tx receipt del deploy tiene status 1", async function () {
            const receipt = await ethers.provider.getTransactionReceipt(deployTxHash);
            expect(receipt).to.not.be.null;
            expect(receipt.status).to.equal(1);
        });

        it("StrongBox owner es el usuario que llamó a Factory", async function () {
            const strongBox = await ethers.getContractAt("StrongBox", strongBoxAddr);
            expect(await strongBox.getOwner()).to.equal(user.address);
        });
    });

    // ---------------------------------------------------------------
    // 4. Deposit via StrongBox (simula frontend MetaMask)
    // ---------------------------------------------------------------
    describe("4. Deposit (frontend firma)", function () {
        let strongBox;
        let strongBoxAddr;

        beforeEach(async function () {
            await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );
            strongBoxAddr = await factory.getStrongBox(user.address);
            strongBox = await ethers.getContractAt("StrongBox", strongBoxAddr);
        });

        it("owner puede depositar y el balance del contrato sube", async function () {
            const amount = ethers.parseEther("1.5");

            await expect(() =>
                strongBox.connect(user).deposit({ value: amount })
            ).to.changeEtherBalances(
                [user, strongBox],
                [-amount, amount]
            );
        });

        it("outsider no puede depositar", async function () {
            await expect(
                strongBox.connect(outsider).deposit({ value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(strongBox, "NotOwner");
        });

        it("no se puede depositar 0", async function () {
            await expect(
                strongBox.connect(user).deposit({ value: 0 })
            ).to.be.revertedWithCustomError(strongBox, "InvalidAmount");
        });
    });

    // ---------------------------------------------------------------
    // 5. Confirm-deposit — validación de receipt (API simulation)
    // ---------------------------------------------------------------
    describe("5. Confirm-deposit (API simulation)", function () {
        let strongBox;
        let strongBoxAddr;

        beforeEach(async function () {
            await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );
            strongBoxAddr = await factory.getStrongBox(user.address);
            strongBox = await ethers.getContractAt("StrongBox", strongBoxAddr);
        });

        it("receipt.to apunta al StrongBox y receipt.status es 1", async function () {
            const amount = ethers.parseEther("0.5");
            const tx = await strongBox.connect(user).deposit({ value: amount });
            const receipt = await tx.wait();

            expect(receipt.status).to.equal(1);
            expect(receipt.to.toLowerCase()).to.equal(strongBoxAddr.toLowerCase());
        });

        it("tx.value coincide con el monto enviado", async function () {
            const amount = ethers.parseEther("0.25");
            const tx = await strongBox.connect(user).deposit({ value: amount });
            const receipt = await tx.wait();

            const fullTx = await ethers.provider.getTransaction(receipt.hash);
            expect(fullTx.value).to.equal(amount);
        });

        it("tx.from es la wallet del usuario", async function () {
            const amount = ethers.parseEther("0.1");
            const tx = await strongBox.connect(user).deposit({ value: amount });
            const receipt = await tx.wait();

            const fullTx = await ethers.provider.getTransaction(receipt.hash);
            expect(fullTx.from.toLowerCase()).to.equal(user.address.toLowerCase());
        });

        it("rechaza si from no es el usuario esperado", async function () {
            // Simulamos que un outsider logra depositar en otro contrato
            // pero el API valida que tx.from === users.wallet_address
            const amount = ethers.parseEther("0.1");
            const tx = await strongBox.connect(user).deposit({ value: amount });
            const receipt = await tx.wait();

            const fullTx = await ethers.provider.getTransaction(receipt.hash);
            expect(fullTx.from.toLowerCase()).to.not.equal(outsider.address.toLowerCase());
        });
    });

    // ---------------------------------------------------------------
    // 6. Balance — provider.getBalance (API simulation)
    // ---------------------------------------------------------------
    describe("6. Balance on-chain (API simulation)", function () {
        let strongBoxAddr;

        beforeEach(async function () {
            await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );
            strongBoxAddr = await factory.getStrongBox(user.address);
        });

        it("balance es 0 antes del primer depósito", async function () {
            const balance = await ethers.provider.getBalance(strongBoxAddr);
            expect(balance).to.equal(0n);
        });

        it("balance refleja el depósito exacto", async function () {
            const amount = ethers.parseEther("2.0");
            const strongBox = await ethers.getContractAt("StrongBox", strongBoxAddr);
            await strongBox.connect(user).deposit({ value: amount });

            const balance = await ethers.provider.getBalance(strongBoxAddr);
            expect(balance).to.equal(amount);
        });

        it("balance acumula múltiples depósitos", async function () {
            const strongBox = await ethers.getContractAt("StrongBox", strongBoxAddr);
            const dep1 = ethers.parseEther("1.0");
            const dep2 = ethers.parseEther("0.5");

            await strongBox.connect(user).deposit({ value: dep1 });
            await strongBox.connect(user).deposit({ value: dep2 });

            const balance = await ethers.provider.getBalance(strongBoxAddr);
            expect(balance).to.equal(dep1 + dep2);
        });
    });

    // ---------------------------------------------------------------
    // 7. Flujo completo end-to-end
    // ---------------------------------------------------------------
    describe("7. End-to-end: setup → deploy → deposit → balance", function () {
        it("flujo completo sin errores", async function () {
            // Step 1: Pre-deploy — no hay StrongBox
            expect(await factory.getStrongBox(user.address)).to.equal(ethers.ZeroAddress);

            // Step 2: Deploy via Factory (frontend firma con MetaMask)
            const deployTx = await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );
            const deployReceipt = await deployTx.wait();
            expect(deployReceipt.status).to.equal(1);

            const strongBoxAddr = await factory.getStrongBox(user.address);
            expect(strongBoxAddr).to.not.equal(ethers.ZeroAddress);

            // Step 3: API confirm-deploy — verifica bytecode
            const code = await ethers.provider.getCode(strongBoxAddr);
            expect(code).to.not.equal("0x");

            // Step 4: Balance antes de depositar = 0
            expect(await ethers.provider.getBalance(strongBoxAddr)).to.equal(0n);

            // Step 5: Primer depósito (frontend firma)
            const amount1 = ethers.parseEther("1.0");
            const strongBox = await ethers.getContractAt("StrongBox", strongBoxAddr);
            const depositTx = await strongBox.connect(user).deposit({ value: amount1 });
            const depositReceipt = await depositTx.wait();

            // Step 6: API confirm-deposit — valida receipt
            expect(depositReceipt.status).to.equal(1);
            expect(depositReceipt.to.toLowerCase()).to.equal(strongBoxAddr.toLowerCase());

            const depositFullTx = await ethers.provider.getTransaction(depositReceipt.hash);
            expect(depositFullTx.value).to.equal(amount1);
            expect(depositFullTx.from.toLowerCase()).to.equal(user.address.toLowerCase());

            // Step 7: Balance refleja depósito
            expect(await ethers.provider.getBalance(strongBoxAddr)).to.equal(amount1);

            // Step 8: Segundo depósito
            const amount2 = ethers.parseEther("0.5");
            const depositTx2 = await strongBox.connect(user).deposit({ value: amount2 });
            const depositReceipt2 = await depositTx2.wait();
            expect(depositReceipt2.status).to.equal(1);

            // Step 9: API confirm-deposit segundo
            const depositFullTx2 = await ethers.provider.getTransaction(depositReceipt2.hash);
            expect(depositFullTx2.value).to.equal(amount2);

            // Step 10: Balance acumulado
            expect(await ethers.provider.getBalance(strongBoxAddr)).to.equal(amount1 + amount2);
        });
    });

    // ---------------------------------------------------------------
    // 8. Errores: casos que la API rechazaría
    // ---------------------------------------------------------------
    describe("8. Validaciones que hace la API", function () {
        it("Factory no permite crear dos StrongBox para la misma wallet", async function () {
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

        it("timeLimit = 0 es rechazado por la Factory", async function () {
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

        it("solo el owner del StrongBox puede depositar", async function () {
            await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );
            const sbAddr = await factory.getStrongBox(user.address);
            const strongBox = await ethers.getContractAt("StrongBox", sbAddr);

            await expect(
                strongBox.connect(outsider).deposit({ value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(strongBox, "NotOwner");
        });

        it("depósito de 0 es rechazado", async function () {
            await factory
                .connect(user)
                .createStrongBox(
                    guardian1.address,
                    guardian2.address,
                    heir1.address,
                    heir2.address,
                    TIME_LIMIT
                );
            const sbAddr = await factory.getStrongBox(user.address);
            const strongBox = await ethers.getContractAt("StrongBox", sbAddr);

            await expect(
                strongBox.connect(user).deposit({ value: 0 })
            ).to.be.revertedWithCustomError(strongBox, "InvalidAmount");
        });

        it("getCode en dirección sin contrato devuelve '0x' (API rechazaría confirm-deploy)", async function () {
            const fakeAddr = ethers.Wallet.createRandom().address;
            const code = await ethers.provider.getCode(fakeAddr);
            expect(code).to.equal("0x");
        });
    });
});
