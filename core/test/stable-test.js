const { expect } = require("chai");
const { ethers } = require("hardhat");

const START_DATE = 20220101;

describe("StableFactory", () => {
  /** @type{import("../typechain-types/StableFactory").StableFactory} */
  let stableFactory;

  let owner;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const StableFactory = await ethers.getContractFactory(
      "StableFactory",
      owner
    );

    stableFactory = await StableFactory.deploy(
      ["ZC", "ZW", "ZR", "ZS", "KE"],
      [1, 1, 1, 1, 1],
      "bafybeig7zusrlit7xdhjkw7tkrtkmgqilt4dfoscp256yoawc3uxdwpgxe",
      "TOP3_AVG",
      1
    );

    await stableFactory.deployed();
  });

  it("should be able to create child contracts", async () => {
    await stableFactory.createStable("US", "USD", START_DATE, 10);
    await stableFactory.createStable("UK", "GBP", 20220101, 10);

    expect(await stableFactory.childContracts("US")).to.not.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(await stableFactory.childContracts("UK")).to.not.equal(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("should update product basket correctly", async () => {
    await stableFactory.updateBasket("ZC", 4);
    await stableFactory.updateBasket("KE", 3);

    expect(await stableFactory.productBasket("ZC")).to.equal(4);
    expect(await stableFactory.productBasket("KE")).to.equal(3);
    expect(await stableFactory.productBasket("ZW")).to.equal(1);
    expect(await stableFactory.productBasket("ZS")).to.equal(1);
  });

  it("should be able to add new product", async () => {
    await expect(
      stableFactory.addProduct(
        "BTC",
        2,
        "bafybeig7zusrlit7xdhjkw7tkrtkmgqilt4dfoscp256yoawc3uxdwpgxe"
      )
    )
      .to.emit(stableFactory, "ProductDetailsUpdated")
      .withArgs("bafybeig7zusrlit7xdhjkw7tkrtkmgqilt4dfoscp256yoawc3uxdwpgxe");

    // This will be 6th item, as 5 products are already added in beforeEach
    expect(await stableFactory.productIds(5)).to.equal("BTC");

    expect(await stableFactory.productBasket("BTC")).to.equal(2);
  });
});

describe("Stable", () => {
  /** @type{import("../typechain-types/Stable").Stable} */
  let stable;

  let owner;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const StableFactory = await ethers.getContractFactory(
      "StableFactory",
      owner
    );

    /** @type{import("../typechain-types/StableFactory").StableFactory} */
    const stableFactory = await StableFactory.deploy(
      ["ZC", "ZW", "ZR", "ZS", "KE"],
      [1, 1, 1, 1, 1],
      "bafybeig7zusrlit7xdhjkw7tkrtkmgqilt4dfoscp256yoawc3uxdwpgxe",
      "TOP3_AVG",
      1
    );

    await stableFactory.deployed();

    await stableFactory.createStable("UK", "GBP", 20220101, 10);

    stable = await ethers.getContractAt(
      "Stable",
      await stableFactory.childContracts("UK"),
      owner
    );
  });

  it("should be able to add price for one product", async () => {
    expect(await stable.submitPrices(20220101, ["ZW"], [2350], "manual"))
      .to.emit(stable, "PricesSubmitted")
      .withArgs(["ZW"], [2350], "manual");
  });

  it("should be able to add price for multiple products", async () => {
    expect(
      await stable.submitPrices(
        20220101,
        ["ZW", "BTC"],
        [2350, 36000],
        "manual"
      )
    )
      .to.emit(stable, "PricesSubmitted")
      .withArgs(["ZW", "BTC"], [2350, 36000], "manual");
  });

  it("should be able to update price and price index", async () => {
    await stable.updatePrices(20220101, ["ZW", "BTC"], [2350, 36000], 15000);

    expect(await stable.prices("ZW")).to.equal(2350);
    expect(await stable.prices("BTC")).to.equal(36000);
    expect(await stable.priceIndex()).to.equal(15000);
  });
});
