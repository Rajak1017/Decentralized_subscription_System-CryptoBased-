import { expect } from "chai";
import { ethers } from "hardhat";

describe("Subscriptions", function () {
  let subscriptions: any;
  let treasury: any, relayer: any, user: any, other: any, token: any;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    const owner = signers[0];
    treasury = signers[1];
    relayer = signers[2];
    user = signers[3];
    other = signers[4];

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    token = await ERC20Mock.deploy("MockToken", "MTK");
    await token.waitForDeployment();

    const Subscriptions = await ethers.getContractFactory("Subscriptions");
    subscriptions = await Subscriptions.deploy(treasury.address, relayer.address);
    await subscriptions.waitForDeployment();
  });

  it("Should let owner create a native subscription plan", async function () {
    const tx = await subscriptions.createPlan(
      ethers.ZeroAddress,
      ethers.parseEther("1"),
      3600
    );
    await tx.wait();

    const plan = await subscriptions.plans(0);
    expect(plan.active).to.equal(true);
    expect(plan.price).to.equal(ethers.parseEther("1"));
  });

  it("Should allow user to subscribe with native token", async function () {
    await subscriptions.createPlan(ethers.ZeroAddress, ethers.parseEther("1"), 3600);

    const tx = await subscriptions.connect(user).subscribeNative(0, {
      value: ethers.parseEther("1"),
    });
    await tx.wait();

    const info = await subscriptions.subscriptions(user.address, 0);
    expect(info.active).to.equal(true);
    expect(info.expiry).to.be.gt(0);
  });

  it("Should allow user to subscribe with ERC20 token", async function () {
    await subscriptions.createPlan((token as any).target, ethers.parseUnits("100", 18), 3600);

    await token.mint(user.address, ethers.parseUnits("1000", 18));
    await token.connect(user).approve(await subscriptions.getAddress(), ethers.parseUnits("100", 18));

    const tx = await subscriptions.connect(user).subscribeERC20(0);
    await tx.wait();

    const info = await subscriptions.subscriptions(user.address, 0);
    expect(info.active).to.equal(true);
  });

  it("Only relayer should be able to renew", async function () {
    await subscriptions.createPlan((token as any).target, ethers.parseUnits("100", 18), 3600);

    await token.mint(user.address, ethers.parseUnits("1000", 18));
    await token.connect(user).approve(await subscriptions.getAddress(), ethers.parseUnits("500", 18));

    await subscriptions.connect(user).subscribeERC20(0);

    await expect(subscriptions.connect(relayer).renewFor(user.address, 0)).to.emit(subscriptions, "Renewed");

    await expect(subscriptions.connect(other).renewFor(user.address, 0)).to.be.revertedWith("Only relayer");
  });
});

import { expect } from "chai";
import ethers from "hardhat";

describe("Subscriptions", function () {
  let Subscriptions: any, subscriptions: any;
  let owner: any, treasury: any, relayer: any, user: any, other: any, token: any;

  beforeEach(async function () {
    [owner, treasury, relayer, user, other] = await ethers.getSigners();

    // Deploy a mock ERC20 token for testing
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    token = await ERC20Mock.deploy("MockToken", "MTK");
    await token.waitForDeployment();

    // Deploy Subscriptions contract
    Subscriptions = await ethers.getContractFactory("Subscriptions");
    subscriptions = await Subscriptions.deploy(treasury.address, relayer.address);
    await subscriptions.waitForDeployment();
  });

  it("Should let owner create a native subscription plan", async function () {
    const tx = await subscriptions.createPlan(
      ethers.ZeroAddress, // native token
      ethers.parseEther("1"), // price
      3600 // 1 hour
    );
    await tx.wait();

    const plan = await subscriptions.plans(0);
    expect(plan.active).to.equal(true);
    expect(plan.price).to.equal(ethers.parseEther("1"));
  });

  it("Should allow user to subscribe with native token", async function () {
    await subscriptions.createPlan(ethers.ZeroAddress, ethers.parseEther("1"), 3600);

    const tx = await subscriptions.connect(user).subscribeNative(0, {
      value: ethers.parseEther("1"),
    });
    await tx.wait();

    const info = await subscriptions.subscriptions(user.address, 0);
    expect(info.active).to.equal(true);
    expect(info.expiry).to.be.gt(0);
  });

  it("Should allow user to subscribe with ERC20 token", async function () {
    await subscriptions.createPlan(token.target, ethers.parseUnits("100", 18), 3600);

    // Mint tokens to user
    await token.mint(user.address, ethers.parseUnits("1000", 18));

    // Approve subscription contract
    await token.connect(user).approve(await subscriptions.getAddress(), ethers.parseUnits("100", 18));

    // Subscribe
    const tx = await subscriptions.connect(user).subscribeERC20(0);
    await tx.wait();

    const info = await subscriptions.subscriptions(user.address, 0);
    expect(info.active).to.equal(true);
  });

  it("Only relayer should be able to renew", async function () {
    await subscriptions.createPlan(token.target, ethers.parseUnits("100", 18), 3600);

    await token.mint(user.address, ethers.parseUnits("1000", 18));
    await token.connect(user).approve(await subscriptions.getAddress(), ethers.parseUnits("500", 18));

    await subscriptions.connect(user).subscribeERC20(0);

    // Renew using relayer
    await expect(subscriptions.connect(relayer).renewFor(user.address, 0))
      .to.emit(subscriptions, "Renewed");

    // Non-relayer should fail
    await expect(subscriptions.connect(other).renewFor(user.address, 0))
      .to.be.revertedWith("Only relayer");
  });
});
