const { expect } = require("chai");
const { ethers } = require("hardhat");

const START_DATE = 20220101;

describe("Stable", function () {
  /** @type{import("../typechain-types/Stable").Stable} */
  let stable;

  let owner;
  let addr1;
  let addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Stable = await ethers.getContractFactory("Stable");

    stable = await Stable.deploy(
      "USD",
      START_DATE,
      ["ZC", "ZW", "ZR", "ZS", "KE"],
      [1, 1, 1, 1, 1],
      "cid"
    );

    await stable.deployed();
  });

  it("should updated weightage correctly", async function () {
    await stable.updateWeightage(["ZC", "KE"], [4, 3]);

    expect(await stable.productWeightage("ZC")).to.equal(4);
    expect(await stable.productWeightage("KE")).to.equal(3);
    expect(await stable.productWeightage("ZW")).to.equal(1);
    expect(await stable.productWeightage("ZS")).to.equal(1);
  });

  it("should be able to add price for one product", async function () {
    await stable.submitPrices(20220101, ["ZW"], [2350]);

    expect(await stable.submittedPrices("ZW", 0)).to.equal(2350);
    expect(await stable.submittedUsers("ZW", 2350, 0)).to.equal(owner.address);
  });

  it("should be able to add price for multiple products", async function () {
    await stable.submitPrices(20220101, ["ZC", "ZW"], [1350, 1550]);

    expect(await stable.submittedPrices("ZC", 0)).to.equal(1350);
    expect(await stable.submittedPrices("ZW", 0)).to.equal(1550);
  });

  it("multiple users should be able to submit same prices", async function () {
    await stable.connect(addr1).submitPrices(20220101, ["ZW"], [2350]);

    await stable.connect(addr2).submitPrices(20220101, ["ZW"], [2350]);

    expect(await stable.submittedPrices("ZW", 0)).to.equal(2350);
    expect(await stable.submittedPrices("ZW", 1)).to.equal(2350);
    expect(await stable.submittedUsers("ZW", 2350, 0)).to.equal(addr1.address);
    expect(await stable.submittedUsers("ZW", 2350, 1)).to.equal(addr2.address);
  });

  it("multiple users should be able to submit different prices", async function () {
    await stable.connect(addr1).submitPrices(20220101, ["ZW"], [2350]);

    await stable.connect(addr2).submitPrices(20220101, ["ZW"], [1300]);

    expect(await stable.submittedPrices("ZW", 0)).to.equal(2350);
    expect(await stable.submittedPrices("ZW", 1)).to.equal(1300);
    expect(await stable.submittedUsers("ZW", 2350, 0)).to.equal(addr1.address);
    expect(await stable.submittedUsers("ZW", 1300, 0)).to.equal(addr2.address);
  });

  it("should calculate price for products correctly when same price is submitted", async function () {
    await stable.connect(addr1).submitPrices(20220101, ["ZW"], [2350]);

    await stable.connect(addr2).submitPrices(20220101, ["ZW"], [2350]);

    await stable.calculate();

    expect(await stable.prices("ZW")).to.equal(2350);
  });

  it("should calculate price for products correctly by taking most common price", async function () {
    await stable.connect(addr1).submitPrices(20220101, ["ZW"], [2350]);

    await stable.connect(addr2).submitPrices(20220101, ["ZW"], [1300]);

    await stable.connect(addr2).submitPrices(20220101, ["ZW"], [1300]);

    await stable.calculate();

    expect(await stable.prices("ZW")).to.equal(1300);
  });

  it("should emit event on Price Update", async function () {
    await stable.connect(addr1).submitPrices(20220101, ["ZW"], [2350]);

    await expect(stable.calculate())
      .to.emit(stable, "PriceUpdated")
      .withArgs(START_DATE, "ZW", 2350, 1);
  });

  it("should calculate price index correctly", async function () {
    await stable.updateWeightage(["ZC", "ZW"], [9, 7]);

    await stable.connect(addr1).submitPrices(20220101, ["ZC"], [500]);

    await stable.connect(addr2).submitPrices(20220101, ["ZW"], [1000]);

    const expectedIndex = Math.floor((9 * 500 + 7 * 1000) / (9 + 7));

    await expect(stable.calculate())
      .to.emit(stable, "PriceIndexUpdated")
      .withArgs(START_DATE, expectedIndex);

    expect(await stable.priceIndex()).to.equal(expectedIndex);
  });

  it("should calculate price index correctly for updated items", async function () {
    await stable.updateWeightage(["ZC", "ZW"], [9, 7]);

    await stable.connect(addr1).submitPrices(20220101, ["ZC"], [500]);

    await stable.connect(addr2).submitPrices(20220101, ["ZW"], [1000]);

    await stable.calculate();
    const expectedIndex = Math.floor((9 * 500 + 7 * 1000) / (9 + 7));
    expect(await stable.priceIndex()).to.equal(expectedIndex);

    await stable.connect(addr1).submitPrices(20220102, ["ZC"], [2500]);

    await stable.calculate();
    const newExpectedIndex = Math.floor((9 * 2500 + 7 * 1000) / (9 + 7));
    expect(await stable.priceIndex()).to.equal(newExpectedIndex);
  });
});
