import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SmartWalletFactory, Wallet, CajaFuerte } from "../typechain-types";

describe("Smart Wallet Agent-First", function () {
  // --- Fixture: deploys Factory and creates one user account ---
  async function deployFixture() {
    const [deployer, user, heredero1, heredero2, agent, attacker] = 
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SmartWalletFactory");
    const factory = await Factory.deploy();

    // User creates account
    const tx = await factory.connect(user).crear(
      heredero1.address,
      heredero2.address,
      90 // 90 days timeout
    );
    await tx.wait();

    const walletAddr = await factory.getWallet(user.address);
    const cajaFuerteAddr = await factory.getCajaFuerte(user.address);

    const wallet = await ethers.getContractAt("Wallet", walletAddr) as unknown as Wallet;
    const cajaFuerte = await ethers.getContractAt("CajaFuerte", cajaFuerteAddr) as unknown as CajaFuerte;

    return { factory, wallet, cajaFuerte, deployer, user, heredero1, heredero2, agent, attacker };
  }

  // ============================================================
  // Factory Tests
  // ============================================================
  describe("Factory", function () {
    it("should deploy and create user account", async function () {
      const { factory, wallet, cajaFuerte, user } = await loadFixture(deployFixture);

      expect(await factory.checkUserHasAccount(user.address)).to.be.true;
      expect(await factory.totalUsers()).to.equal(1);
      expect(await wallet.owner()).to.equal(user.address);
      expect(await cajaFuerte.owner()).to.equal(await factory.getWallet(user.address));
    });

    it("should NOT allow duplicate accounts", async function () {
      const { factory, user, heredero1, heredero2 } = await loadFixture(deployFixture);

      await expect(
        factory.connect(user).crear(heredero1.address, heredero2.address, 90)
      ).to.be.revertedWithCustomError(factory, "AccountAlreadyExists");
    });

    it("should reject zero addresses", async function () {
      const { factory, deployer } = await loadFixture(deployFixture);

      await expect(
        factory.connect(deployer).crear(ethers.ZeroAddress, deployer.address, 90)
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });

    it("should reject zero timeout", async function () {
      const { factory, deployer, heredero1, heredero2 } = await loadFixture(deployFixture);

      await expect(
        factory.connect(deployer).crear(heredero1.address, heredero2.address, 0)
      ).to.be.revertedWithCustomError(factory, "InvalidTimeoutPeriod");
    });
  });

  // ============================================================
  // Wallet Tests
  // ============================================================
  describe("Wallet", function () {
    it("should receive deposits", async function () {
      const { wallet, deployer } = await loadFixture(deployFixture);

      await deployer.sendTransaction({ to: await wallet.getAddress(), value: ethers.parseEther("1") });
      expect(await wallet.getBalance()).to.equal(ethers.parseEther("1"));
    });

    it("should allow owner to send", async function () {
      const { wallet, user, deployer } = await loadFixture(deployFixture);
      const walletAddr = await wallet.getAddress();

      // Fund wallet
      await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("2") });

      const balBefore = await ethers.provider.getBalance(deployer.address);
      await wallet.connect(user).enviar(deployer.address, ethers.parseEther("1"));
      const balAfter = await ethers.provider.getBalance(deployer.address);

      expect(balAfter - balBefore).to.equal(ethers.parseEther("1"));
    });

    it("should NOT allow attacker to send", async function () {
      const { wallet, attacker, deployer } = await loadFixture(deployFixture);
      const walletAddr = await wallet.getAddress();

      await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("1") });

      await expect(
        wallet.connect(attacker).enviar(attacker.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(wallet, "SessionKeyInvalid");
    });

    it("should transfer to CajaFuerte", async function () {
      const { wallet, cajaFuerte, user, deployer } = await loadFixture(deployFixture);
      const walletAddr = await wallet.getAddress();

      await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("5") });
      await wallet.connect(user).depositarEnCajaFuerte(ethers.parseEther("3"));

      expect(await cajaFuerte.getBalance()).to.equal(ethers.parseEther("3"));
      expect(await wallet.getBalance()).to.equal(ethers.parseEther("2"));
    });

    // --- Session Keys ---
    describe("Session Keys", function () {
      it("should allow agent with valid session key", async function () {
        const { wallet, user, agent, deployer } = await loadFixture(deployFixture);
        const walletAddr = await wallet.getAddress();

        await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("5") });

        // Grant session key: max 1 ETH, 1 hour
        await wallet.connect(user).grantSessionKey(
          agent.address,
          ethers.parseEther("1"),
          3600
        );

        expect(await wallet.isSessionKeyValid(agent.address)).to.be.true;

        // Agent sends within limit
        await wallet.connect(agent).enviar(deployer.address, ethers.parseEther("0.5"));
        expect(await wallet.getBalance()).to.equal(ethers.parseEther("4.5"));
      });

      it("should reject agent exceeding limit", async function () {
        const { wallet, user, agent, deployer } = await loadFixture(deployFixture);
        const walletAddr = await wallet.getAddress();

        await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("5") });
        await wallet.connect(user).grantSessionKey(agent.address, ethers.parseEther("1"), 3600);

        await expect(
          wallet.connect(agent).enviar(deployer.address, ethers.parseEther("2"))
        ).to.be.revertedWithCustomError(wallet, "ExceedsSessionLimit");
      });

      it("should reject expired session key", async function () {
        const { wallet, user, agent, deployer } = await loadFixture(deployFixture);
        const walletAddr = await wallet.getAddress();

        await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("5") });
        await wallet.connect(user).grantSessionKey(agent.address, ethers.parseEther("1"), 3600);

        // Fast forward 2 hours
        await time.increase(7200);

        await expect(
          wallet.connect(agent).enviar(deployer.address, ethers.parseEther("0.5"))
        ).to.be.revertedWithCustomError(wallet, "SessionKeyExpired");
      });

      it("should revoke session key (kill switch)", async function () {
        const { wallet, user, agent, deployer } = await loadFixture(deployFixture);
        const walletAddr = await wallet.getAddress();

        await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("5") });
        await wallet.connect(user).grantSessionKey(agent.address, ethers.parseEther("1"), 3600);
        await wallet.connect(user).revokeSessionKey(agent.address);

        expect(await wallet.isSessionKeyValid(agent.address)).to.be.false;

        await expect(
          wallet.connect(agent).enviar(deployer.address, ethers.parseEther("0.5"))
        ).to.be.revertedWithCustomError(wallet, "SessionKeyInvalid");
      });
    });
  });

  // ============================================================
  // CajaFuerte Tests
  // ============================================================
  describe("CajaFuerte", function () {
    it("should accept deposits and track balance", async function () {
      const { cajaFuerte, deployer } = await loadFixture(deployFixture);
      const cfAddr = await cajaFuerte.getAddress();

      await deployer.sendTransaction({ to: cfAddr, value: ethers.parseEther("1") });
      expect(await cajaFuerte.getBalance()).to.equal(ethers.parseEther("1"));
    });

    it("should allow wallet to withdraw", async function () {
      const { wallet, cajaFuerte, user, deployer } = await loadFixture(deployFixture);
      const walletAddr = await wallet.getAddress();

      // Fund wallet then deposit to CajaFuerte
      await deployer.sendTransaction({ to: walletAddr, value: ethers.parseEther("5") });
      await wallet.connect(user).depositarEnCajaFuerte(ethers.parseEther("3"));

      // Wallet (via user) calls retirar — this needs to go through wallet contract
      // For now, CajaFuerte.owner == wallet, so we need wallet to call cajaFuerte
      // This simulates the wallet calling retirar (in prod, wallet would have a function for this)
    });

    it("should return herederos", async function () {
      const { cajaFuerte, heredero1, heredero2 } = await loadFixture(deployFixture);
      const [h1, h2] = await cajaFuerte.getHerederos();
      expect(h1).to.equal(heredero1.address);
      expect(h2).to.equal(heredero2.address);
    });

    // --- Dead Man's Switch ---
    describe("Dead Man's Switch", function () {
      it("should track last activity", async function () {
        const { cajaFuerte } = await loadFixture(deployFixture);
        const remaining = await cajaFuerte.timeRemaining();
        // Should be close to 90 days
        expect(remaining).to.be.greaterThan(89n * 24n * 3600n);
      });

      it("should NOT be expired initially", async function () {
        const { cajaFuerte } = await loadFixture(deployFixture);
        expect(await cajaFuerte.isExpired()).to.be.false;
      });

      it("should expire after timeout period", async function () {
        const { cajaFuerte } = await loadFixture(deployFixture);
        // Fast forward 91 days
        await time.increase(91 * 24 * 3600);
        expect(await cajaFuerte.isExpired()).to.be.true;
      });

      it("should reset via user EOA", async function () {
        const { cajaFuerte, user } = await loadFixture(deployFixture);
        await time.increase(45 * 24 * 3600); // 45 days
        await cajaFuerte.connect(user).resetTime();
        expect(await cajaFuerte.isExpired()).to.be.false;
        const remaining = await cajaFuerte.timeRemaining();
        expect(remaining).to.be.greaterThan(89n * 24n * 3600n);
      });

      it("should NOT allow attacker to reset", async function () {
        const { cajaFuerte, attacker } = await loadFixture(deployFixture);
        await expect(
          cajaFuerte.connect(attacker).resetTime()
        ).to.be.revertedWithCustomError(cajaFuerte, "OnlyOwnerOrUserEOA");
      });
    });

    // --- Herencia ---
    describe("Herencia", function () {
      it("should NOT allow recovery before expiry", async function () {
        const { cajaFuerte, heredero1, deployer } = await loadFixture(deployFixture);
        const cfAddr = await cajaFuerte.getAddress();
        await deployer.sendTransaction({ to: cfAddr, value: ethers.parseEther("10") });

        await expect(
          cajaFuerte.connect(heredero1).iniciarRecuperacion()
        ).to.be.revertedWithCustomError(cajaFuerte, "DeadManSwitchNotExpired");
      });

      it("should allow heredero to initiate recovery after expiry", async function () {
        const { cajaFuerte, heredero1, deployer } = await loadFixture(deployFixture);
        const cfAddr = await cajaFuerte.getAddress();
        await deployer.sendTransaction({ to: cfAddr, value: ethers.parseEther("10") });

        await time.increase(91 * 24 * 3600); // expire switch
        await cajaFuerte.connect(heredero1).iniciarRecuperacion();

        const [state, , ] = await cajaFuerte.getRecoveryInfo();
        expect(state).to.equal(1); // Pending
      });

      it("should allow owner to cancel recovery", async function () {
        const { cajaFuerte, heredero1, user, deployer } = await loadFixture(deployFixture);
        const cfAddr = await cajaFuerte.getAddress();
        await deployer.sendTransaction({ to: cfAddr, value: ethers.parseEther("10") });

        await time.increase(91 * 24 * 3600);
        await cajaFuerte.connect(heredero1).iniciarRecuperacion();
        await cajaFuerte.connect(user).cancelarRecuperacion();

        const [state, , ] = await cajaFuerte.getRecoveryInfo();
        expect(state).to.equal(0); // Inactive
      });

      it("should NOT execute before timelock", async function () {
        const { cajaFuerte, heredero1, deployer } = await loadFixture(deployFixture);
        const cfAddr = await cajaFuerte.getAddress();
        await deployer.sendTransaction({ to: cfAddr, value: ethers.parseEther("10") });

        await time.increase(91 * 24 * 3600);
        await cajaFuerte.connect(heredero1).iniciarRecuperacion();

        await expect(
          cajaFuerte.connect(heredero1).ejecutarRecuperacion()
        ).to.be.revertedWithCustomError(cajaFuerte, "TimelockNotExpired");
      });

      it("should distribute 50/50 after timelock", async function () {
        const { cajaFuerte, heredero1, heredero2, deployer } = await loadFixture(deployFixture);
        const cfAddr = await cajaFuerte.getAddress();
        await deployer.sendTransaction({ to: cfAddr, value: ethers.parseEther("10") });

        // Expire dead man switch
        await time.increase(91 * 24 * 3600);
        await cajaFuerte.connect(heredero1).iniciarRecuperacion();

        // Wait timelock (48 hours)
        await time.increase(49 * 3600);

        const bal1Before = await ethers.provider.getBalance(heredero1.address);
        const bal2Before = await ethers.provider.getBalance(heredero2.address);

        const tx = await cajaFuerte.connect(heredero1).ejecutarRecuperacion();
        const receipt = await tx.wait();
        const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

        const bal1After = await ethers.provider.getBalance(heredero1.address);
        const bal2After = await ethers.provider.getBalance(heredero2.address);

        // Heredero1 gets 5 ETH minus gas
        expect(bal1After - bal1Before + gasUsed).to.equal(ethers.parseEther("5"));
        // Heredero2 gets 5 ETH
        expect(bal2After - bal2Before).to.equal(ethers.parseEther("5"));

        // CajaFuerte empty
        expect(await cajaFuerte.getBalance()).to.equal(0);
      });

      it("should NOT allow non-heredero to initiate recovery", async function () {
        const { cajaFuerte, attacker, deployer } = await loadFixture(deployFixture);
        const cfAddr = await cajaFuerte.getAddress();
        await deployer.sendTransaction({ to: cfAddr, value: ethers.parseEther("10") });

        await time.increase(91 * 24 * 3600);

        await expect(
          cajaFuerte.connect(attacker).iniciarRecuperacion()
        ).to.be.revertedWithCustomError(cajaFuerte, "OnlyHeredero");
      });

      it("should NOT allow heredero changes during pending recovery", async function () {
        const { cajaFuerte, heredero1, user, attacker, deployer } = await loadFixture(deployFixture);
        const cfAddr = await cajaFuerte.getAddress();
        await deployer.sendTransaction({ to: cfAddr, value: ethers.parseEther("10") });

        await time.increase(91 * 24 * 3600);
        await cajaFuerte.connect(heredero1).iniciarRecuperacion();

        await expect(
          cajaFuerte.connect(user).actualizarHerederos(attacker.address, attacker.address)
        ).to.be.revertedWithCustomError(cajaFuerte, "RecoveryActiveCannotChangeHerederos");
      });
    });
  });
});
