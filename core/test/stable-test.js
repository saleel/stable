const { expect } = require("chai");
const { ethers } = require("hardhat");

const now = Math.round(new Date().getTime() / 1000);

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
      "bafybeig7zusrlit7xdhjkw7tkrtkmgqilt4dfoscp256yoawc3uxdwpgxe",
      "TOP3_AVG",
      1
    );

    await stableFactory.deployed();
  });

  it("should be able to create child contracts", async () => {
    await stableFactory.createStable(
      "US",
      "USD",
      now,
      10,
      ["ZC", "ZW", "ZR", "ZS", "KE"],
      [1, 1, 1, 1, 1]
    );

    await stableFactory.createStable(
      "UK",
      "GBP",
      20220101,
      10,
      ["ZC", "ZW"],
      [2, 2]
    );

    expect(await stableFactory.childContracts("US")).to.not.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(await stableFactory.childContracts("UK")).to.not.equal(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("should be able to add new product", async () => {
    await expect(
      stableFactory.addProduct(
        "BTC",
        "bafybeig7zusrlit7xdhjkw7tkrtkmgqilt4dfoscp256yoawc3uxdwpgxe"
      )
    )
      .to.emit(stableFactory, "ProductDetailsUpdated")
      .withArgs("bafybeig7zusrlit7xdhjkw7tkrtkmgqilt4dfoscp256yoawc3uxdwpgxe");

    // This will be 6th item, as 5 products are already added in beforeEach
    expect(await stableFactory.productIds(5)).to.equal("BTC");
  });
});

describe("Stable", () => {
  /** @type{import("../typechain-types/Stable").Stable} */
  let ukStable;

  /** @type{import("../typechain-types/Stable").Stable} */
  let usStable;

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
      "bafybeig7zusrlit7xdhjkw7tkrtkmgqilt4dfoscp256yoawc3uxdwpgxe",
      "TOP3_AVG",
      1
    );

    await stableFactory.deployed();

    await stableFactory.createStable(
      "UK",
      "GBP",
      now,
      10,
      ["BTC", "ETH"],
      [1, 1]
    );

    ukStable = await ethers.getContractAt(
      "Stable",
      await stableFactory.childContracts("UK"),
      owner
    );

    await stableFactory.createStable(
      "US",
      "USA",
      20220101,
      10,
      ["ZC", "ZW", "ZR", "ZS", "KE"],
      [1, 1, 1, 1, 1]
    );

    usStable = await ethers.getContractAt(
      "Stable",
      await stableFactory.childContracts("US"),
      owner
    );
  });

  it.only("should update product basket correctly", async () => {
    expect(await usStable.productBasket("ZC")).to.equal(1);
    expect(await usStable.productBasket("KE")).to.equal(1);

    await expect(usStable.updateBasket(["ZC", "KE"], [4, 3]))
      .to.emit(usStable, "ProductBasketUpdated")
      .withArgs(["ZC", "KE"], [4, 3]);

    expect(await usStable.productBasket("ZC")).to.equal(4);
    expect(await usStable.productBasket("KE")).to.equal(3);
    expect(await usStable.productBasket("ZW")).to.equal(1);
    expect(await usStable.productBasket("ZS")).to.equal(1);
  });

  it("should be able to add price for one product", async () => {
    const roundId = await ukStable.previousAggregationRoundId();
    await expect(ukStable.submitPrices(["ZW"], [2350], "manual"))
      .to.emit(ukStable, "PricesSubmitted")
      .withArgs(roundId, ["ZW"], [2350], "manual");
  });

  it("should be able to add price for multiple products", async () => {
    const roundId = await ukStable.previousAggregationRoundId();
    await expect(ukStable.submitPrices(["ZW", "BTC"], [2350, 36000], "manual"))
      .to.emit(ukStable, "PricesSubmitted")
      .withArgs(roundId, ["ZW", "BTC"], [2350, 36000], "manual");
  });

  it("should be able to update price and price index", async () => {
    const roundId = await ukStable.previousAggregationRoundId();
    await ukStable.updatePrices(
      roundId,
      ["ZW", "BTC"],
      [2350, 36000],
      [2, 2],
      15000
    );

    expect(await ukStable.prices("ZW")).to.equal(2350);
    expect(await ukStable.prices("BTC")).to.equal(36000);
    expect(await ukStable.priceIndex()).to.equal(15000);
  });

  it("should emit PricesUpdated on price and price index update", async () => {
    const roundId = await ukStable.previousAggregationRoundId();

    await expect(
      ukStable.updatePrices(
        roundId,
        ["ZW", "BTC"],
        [2350, 36000],
        [10, 5],
        15000
      )
    )
      .to.emit(ukStable, "PricesUpdated")
      .withArgs(roundId, ["ZW", "BTC"], [2350, 36000], [10, 5]);
  });

  it("should emit PriceIndexUpdated on price and price index update", async () => {
    const roundId = await ukStable.previousAggregationRoundId();

    await expect(
      ukStable.updatePrices(
        roundId,
        ["ZW", "BTC"],
        [2350, 36000],
        [10, 5],
        15000
      )
    )
      .to.emit(ukStable, "PriceIndexUpdated")
      .withArgs(roundId, 15000);
  });
});
