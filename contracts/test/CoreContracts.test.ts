import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

// Tests para los contratos core actuales: Factory, Wallet, StrongBox, HeirGuardians
describe("Contratos Core", function () {

  async function deployFixture() {
    const [deployer, user, heir1, heir2, attacker] = await ethers.getSigners();
    return { deployer, user, heir1, heir2, attacker };
  }

  // ============================================================
  // Wallet
  // ============================================================
  describe("Wallet", function () {
    it("debe deployar con el owner correcto", async function () {
      const { user } = await loadFixture(deployFixture);

      const WalletFactory = await ethers.getContractFactory("Wallet");
      const wallet = await WalletFactory.deploy(user.address);
      await wallet.waitForDeployment();

      expect(await wallet.getOwner()).to.equal(user.address);
    });

    it("debe recibir BNB via transferencia directa", async function () {
      const { deployer, user } = await loadFixture(deployFixture);

      const WalletFactory = await ethers.getContractFactory("Wallet");
      const wallet = await WalletFactory.deploy(user.address);
      const walletAddr = await wallet.getAddress();

      await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("1") });
      expect(await wallet.getBalance()).to.equal(ethers.parseEther("1"));
    });

    it("debe permitir al owner enviar fondos", async function () {
      const { deployer, user } = await loadFixture(deployFixture);

      const WalletFactory = await ethers.getContractFactory("Wallet");
      const wallet = await WalletFactory.deploy(user.address);
      const walletAddr = await wallet.getAddress();

      // Fondear la wallet
      await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("2") });

      const balBefore = await ethers.provider.getBalance(deployer.address);
      await wallet.connect(user).sendTo(deployer.address, ethers.parseEther("1"));
      const balAfter = await ethers.provider.getBalance(deployer.address);

      expect(balAfter - balBefore).to.equal(ethers.parseEther("1"));
      expect(await wallet.getBalance()).to.equal(ethers.parseEther("1"));
    });

    it("NO debe permitir a un atacante enviar fondos", async function () {
      const { deployer, user, attacker } = await loadFixture(deployFixture);

      const WalletFactory = await ethers.getContractFactory("Wallet");
      const wallet = await WalletFactory.deploy(user.address);
      const walletAddr = await wallet.getAddress();

      await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("1") });

      await expect(
        wallet.connect(attacker).sendTo(attacker.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(wallet, "NotOwner");
    });

    it("NO debe permitir enviar mas de lo que tiene", async function () {
      const { deployer, user } = await loadFixture(deployFixture);

      const WalletFactory = await ethers.getContractFactory("Wallet");
      const wallet = await WalletFactory.deploy(user.address);
      const walletAddr = await wallet.getAddress();

      await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("1") });

      await expect(
        wallet.connect(user).sendTo(deployer.address, ethers.parseEther("5"))
      ).to.be.revertedWithCustomError(wallet, "InvalidAmount");
    });

    it("NO debe permitir enviar a address(0)", async function () {
      const { deployer, user } = await loadFixture(deployFixture);

      const WalletFactory = await ethers.getContractFactory("Wallet");
      const wallet = await WalletFactory.deploy(user.address);
      const walletAddr = await wallet.getAddress();

      await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("1") });

      await expect(
        wallet.connect(user).sendTo(ethers.ZeroAddress, ethers.parseEther("0.5"))
      ).to.be.revertedWithCustomError(wallet, "InvalidAddress");
    });

    it("NO debe deployar con owner address(0)", async function () {
      const WalletFactory = await ethers.getContractFactory("Wallet");

      await expect(
        WalletFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(WalletFactory, "InvalidAddress");
    });
  });

  // ============================================================
  // StrongBox
  // ============================================================
  describe("StrongBox", function () {
    it("debe deployar con el owner correcto y userEOA", async function () {
      const { user } = await loadFixture(deployFixture);

      const SBFactory = await ethers.getContractFactory("StrongBox");
      const sb = await SBFactory.deploy(user.address, user.address);
      expect(await sb.getOwner()).to.equal(user.address);
      expect(await sb.getUserEOA()).to.equal(user.address);
    });

    it("debe aceptar depositos del owner", async function () {
      const { user } = await loadFixture(deployFixture);

      const SBFactory = await ethers.getContractFactory("StrongBox");
      const sb = await SBFactory.deploy(user.address, user.address);

      await sb.connect(user).deposit({ value: ethers.parseEther("2") });
      expect(await sb.getBalance()).to.equal(ethers.parseEther("2"));
    });

    it("debe recibir BNB directo via receive() solo del owner", async function () {
      const { user } = await loadFixture(deployFixture);

      const SBFactory = await ethers.getContractFactory("StrongBox");
      const sb = await SBFactory.deploy(user.address, user.address);
      const sbAddr = await sb.getAddress();

      await user.sendTransaction({ to: sbAddr, value: ethers.parseEther("1") });
      expect(await sb.getBalance()).to.equal(ethers.parseEther("1"));
    });

    it("NO debe aceptar depositos de un atacante", async function () {
      const { user, attacker } = await loadFixture(deployFixture);

      const SBFactory = await ethers.getContractFactory("StrongBox");
      const sb = await SBFactory.deploy(user.address, user.address);

      await expect(
        sb.connect(attacker).deposit({ value: ethers.parseEther("1") })
      ).to.be.reverted;
    });

    it("debe permitir retiro del owner con aprobacion de ambos herederos", async function () {
      const { deployer, user, heir1, heir2 } = await loadFixture(deployFixture);

      const SBFactory = await ethers.getContractFactory("StrongBox");
      const sb = await SBFactory.deploy(user.address, user.address);

      await sb.connect(user).setHeirGuardian1(heir1.address);
      await sb.connect(user).setHeirGuardian2(heir2.address);

      await sb.connect(user).deposit({ value: ethers.parseEther("3") });

      await sb.connect(user).requestWithdrawal(ethers.parseEther("1"), deployer.address);
      const rid = 0n; // primer requestId

      await sb.connect(heir1).approveWithdrawal(rid);
      await sb.connect(heir2).approveWithdrawal(rid);

      const balBefore = await ethers.provider.getBalance(deployer.address);
      await sb.connect(user).executeWithdrawal(rid);
      const balAfter = await ethers.provider.getBalance(deployer.address);

      expect(balAfter - balBefore).to.equal(ethers.parseEther("1"));
      expect(await sb.getBalance()).to.equal(ethers.parseEther("2"));
    });

    it("debe configurar herederos correctamente (owner o userEOA)", async function () {
      const { user, heir1, heir2 } = await loadFixture(deployFixture);

      const SBFactory = await ethers.getContractFactory("StrongBox");
      const sb = await SBFactory.deploy(user.address, user.address);

      await sb.connect(user).setHeirGuardian1(heir1.address);
      await sb.connect(user).setHeirGuardian2(heir2.address);

      expect(await sb.getHeirGuardian1()).to.equal(heir1.address);
      expect(await sb.getHeirGuardian2()).to.equal(heir2.address);
    });

    it("userEOA puede configurar herederos cuando el owner es el contrato Wallet", async function () {
      const { user, heir1, heir2 } = await loadFixture(deployFixture);

      const FactoryContract = await ethers.getContractFactory("Factory");
      const factory = await FactoryContract.deploy();

      await factory.connect(user).createNewWallet("user@test.com", user.address);
      const walletAddr = await factory.getWallet("user@test.com");
      await factory.connect(user).createNewStrongBox(walletAddr);
      const sbAddr = await factory.getStrongBox(walletAddr);

      const sb = await ethers.getContractAt("StrongBox", sbAddr);
      expect(await sb.getOwner()).to.equal(walletAddr);
      expect(await sb.getUserEOA()).to.equal(user.address);

      await sb.connect(user).setHeirGuardian1(heir1.address);
      await sb.connect(user).setHeirGuardian2(heir2.address);

      expect(await sb.getHeirGuardian1()).to.equal(heir1.address);
      expect(await sb.getHeirGuardian2()).to.equal(heir2.address);
    });

    it("NO debe permitir heredero = owner", async function () {
      const { user } = await loadFixture(deployFixture);

      const SBFactory = await ethers.getContractFactory("StrongBox");
      const sb = await SBFactory.deploy(user.address, user.address);

      await expect(
        sb.connect(user).setHeirGuardian1(user.address)
      ).to.be.revertedWithCustomError(sb, "HeirCannotBeOwner");
    });

    it("NO debe permitir herederos duplicados", async function () {
      const { user, heir1 } = await loadFixture(deployFixture);

      const SBFactory = await ethers.getContractFactory("StrongBox");
      const sb = await SBFactory.deploy(user.address, user.address);

      await sb.connect(user).setHeirGuardian1(heir1.address);
      await expect(
        sb.connect(user).setHeirGuardian2(heir1.address)
      ).to.be.revertedWithCustomError(sb, "HeirsMustBeDifferent");
    });
  });

  // ============================================================
  // Factory
  // ============================================================
  describe("Factory", function () {
    it("debe crear wallet y retornar address", async function () {
      const { user } = await loadFixture(deployFixture);

      const FactoryContract = await ethers.getContractFactory("Factory");
      const factory = await FactoryContract.deploy();

      const tx = await factory.connect(user).createNewWallet("user@test.com", user.address);
      await tx.wait();

      const walletAddr = await factory.getWallet("user@test.com");
      expect(walletAddr).to.not.equal(ethers.ZeroAddress);
    });

    it("NO debe crear wallet duplicada para mismo email", async function () {
      const { user } = await loadFixture(deployFixture);

      const FactoryContract = await ethers.getContractFactory("Factory");
      const factory = await FactoryContract.deploy();

      await factory.connect(user).createNewWallet("user@test.com", user.address);

      await expect(
        factory.connect(user).createNewWallet("user@test.com", user.address)
      ).to.be.revertedWithCustomError(factory, "UserAlreadyHaveWallet");
    });

    it("debe crear StrongBox vinculada a wallet", async function () {
      const { user } = await loadFixture(deployFixture);

      const FactoryContract = await ethers.getContractFactory("Factory");
      const factory = await FactoryContract.deploy();

      await factory.connect(user).createNewWallet("user@test.com", user.address);
      const walletAddr = await factory.getWallet("user@test.com");

      await factory.connect(user).createNewStrongBox(walletAddr);
      const sbAddr = await factory.getStrongBox(walletAddr);

      expect(sbAddr).to.not.equal(ethers.ZeroAddress);
    });

    it("NO debe crear StrongBox duplicada", async function () {
      const { user } = await loadFixture(deployFixture);

      const FactoryContract = await ethers.getContractFactory("Factory");
      const factory = await FactoryContract.deploy();

      await factory.connect(user).createNewWallet("user@test.com", user.address);
      const walletAddr = await factory.getWallet("user@test.com");

      await factory.connect(user).createNewStrongBox(walletAddr);

      await expect(
        factory.connect(user).createNewStrongBox(walletAddr)
      ).to.be.revertedWithCustomError(factory, "UserAlreadyHaveStrongBox");
    });
  });
});
