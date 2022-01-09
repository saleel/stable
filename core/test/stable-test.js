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

    stable = await Stable.deploy("USD", START_DATE, 5, "cid");
    await stable.deployed();

    await stable.setQuantities([1, 1, 1, 2, 1]);
  });

  it("should return the updated basket quantity", async function () {
    await stable.setQuantities([1, 1, 1, 2, 1, 1]);

    expect(await stable.getBasketQuantity(1)).to.equal(1);
    expect(await stable.getBasketQuantity(3)).to.equal(2);
  });

  it("should be able to add price for one product", async function () {
    await stable.submitPrices(20220101, [
      {
        productId: 1,
        price: 2350,
      },
    ]);

    expect(await stable.submittedPrices(1, 0)).to.equal(2350);
    expect(await stable.submittedUsers(1, 2350, 0)).to.equal(owner.address);
  });

  it("should be able to add price for multiple products", async function () {
    await stable.submitPrices(20220101, [
      {
        productId: 0,
        price: 1350,
      },
      {
        productId: 1,
        price: 1550,
      },
    ]);

    expect(await stable.submittedPrices(0, 0)).to.equal(1350);
    expect(await stable.submittedPrices(1, 0)).to.equal(1550);
  });

  it("multiple users should be able to submit same prices", async function () {
    await stable.connect(addr1).submitPrices(20220101, [
      {
        productId: 1,
        price: 2350,
      },
    ]);

    await stable.connect(addr2).submitPrices(20220101, [
      {
        productId: 1,
        price: 2350,
      },
    ]);

    expect(await stable.submittedPrices(1, 0)).to.equal(2350);
    expect(await stable.submittedPrices(1, 1)).to.equal(2350);
    expect(await stable.submittedUsers(1, 2350, 0)).to.equal(addr1.address);
    expect(await stable.submittedUsers(1, 2350, 1)).to.equal(addr2.address);
  });

  it("multiple users should be able to submit different prices", async function () {
    await stable.connect(addr1).submitPrices(20220101, [
      {
        productId: 1,
        price: 2350,
      },
    ]);

    await stable.connect(addr2).submitPrices(20220101, [
      {
        productId: 1,
        price: 1300,
      },
    ]);

    expect(await stable.submittedPrices(1, 0)).to.equal(2350);
    expect(await stable.submittedPrices(1, 1)).to.equal(1300);
    expect(await stable.submittedUsers(1, 2350, 0)).to.equal(addr1.address);
    expect(await stable.submittedUsers(1, 1300, 0)).to.equal(addr2.address);
  });

  it("should calculate price for products correctly when same price is submitted", async function () {
    await stable.connect(addr1).submitPrices(20220101, [
      {
        productId: 1,
        price: 2350,
      },
    ]);

    await stable.connect(addr2).submitPrices(20220101, [
      {
        productId: 1,
        price: 2350,
      },
    ]);

    await stable.calculate();

    expect(await stable.prices(1)).to.equal(2350);
  });

  it("should calculate price for products correctly by taking most common price", async function () {
    await stable.connect(addr1).submitPrices(20220101, [
      {
        productId: 1,
        price: 2350,
      },
    ]);

    await stable.connect(addr2).submitPrices(20220101, [
      {
        productId: 1,
        price: 1350,
      },
    ]);

    await stable.connect(addr2).submitPrices(20220101, [
      {
        productId: 1,
        price: 1350,
      },
    ]);

    await stable.calculate();

    expect(await stable.prices(1)).to.equal(1350);
  });

  it("should emit event on Price Update", async function () {
    await stable.connect(addr1).submitPrices(20220101, [
      {
        productId: 1,
        price: 2350,
      },
    ]);

    await expect(stable.calculate())
      .to.emit(stable, "PriceUpdated")
      .withArgs(START_DATE, 1, 2350, 1);
  });

  it("should calculate price index correctly", async function () {
    await stable.setQuantities([2, 3]);

    await stable.connect(addr1).submitPrices(20220101, [
      {
        productId: 0,
        price: 500,
      },
    ]);

    await stable.connect(addr2).submitPrices(20220101, [
      {
        productId: 1,
        price: 1000,
      },
    ]);

    const expectedIndex = 2 * 500 + 3 * 1000;

    await expect(stable.calculate())
      .to.emit(stable, "PriceIndexUpdated")
      .withArgs(START_DATE, expectedIndex);

    expect(await stable.priceIndex()).to.equal(expectedIndex);
  });
});
