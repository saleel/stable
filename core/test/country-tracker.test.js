const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CountryTracker", () => {
  /** @type{import("../typechain-types/Stable").Stable} */
  let stable;

  /** @type{import("../typechain-types/CountryTracker").CountryTracker} */
  let ukTracker;

  /** @type{import("../typechain-types/CountryTracker").CountryTracker} */
  let usTracker;

  let owner;
  let user1;

  const now = Math.round(new Date().getTime() / 1000);

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();

    const Stable = await ethers.getContractFactory("Stable", owner);

    /** @type{import("../typechain-types/Stable").Stable} */
    stable = await Stable.deploy(
      1000, // SCR supply
      20, // coll ratio
      Math.round(new Date().getTime() / 1000) - 2 * 86400, // 2 days before
      "bafkreifmf5gcccn3dry4ddhsrqhhnexlyyyr7ntrmqw3usfwa4ohsyt55e"
    );

    await stable.deployed();

    await stable.createCountryTracker("UK", "GBP", 10);
    await stable.updateBasket("UK", ["BTC", "ETH"], [1, 1]);

    ukTracker = await ethers.getContractAt(
      "CountryTracker",
      await stable.countryTrackers("UK"),
      owner
    );

    await stable.createCountryTracker("US", "USA", 10);

    await stable.updateBasket(
      "UK",
      ["ZC", "ZW", "ZR", "ZS", "KE"],
      [1, 1, 1, 1, 1]
    );

    usTracker = await ethers.getContractAt(
      "CountryTracker",
      await stable.countryTrackers("US"),
      owner
    );

    /** @type{import("../typechain-types/StabilizerToken").StabilizerToken} */
    const SZRToken = await ethers.getContractAt(
      "StabilizerToken",
      stable.szrToken(),
      owner
    );

    // Set user1 as aggregator for test
    SZRToken.transfer(user1.address, 100);
    SZRToken.connect(user1).approve(stable.address, 100);
    await stable.connect(user1).enrollAsAggregator(10);
    await stable.connect(user1).claimNextAggregationRound();
  });

  it("should update product basket correctly", async () => {
    await expect(stable.updateBasket("US", ["ZC", "KE"], [4, 3]))
      .to.emit(usTracker, "ProductBasketUpdated")
      .withArgs(["ZC", "KE"], [4, 3]);

    // Empty array for default weightage of 100
    await expect(stable.updateBasket("US", ["APPLE", "PTRL"], []))
      .to.emit(usTracker, "ProductBasketUpdated")
      .withArgs(["APPLE", "PTRL"], []);

    expect(await usTracker.productBasket("ZC")).to.equal(4);
    expect(await usTracker.productBasket("KE")).to.equal(3);
    expect(await usTracker.productBasket("APPLE")).to.equal(100);
    expect(await usTracker.productBasket("PTRL")).to.equal(100);
  });

  it("should be able to add price for one product", async () => {
    await expect(ukTracker.submitPrices(["ZW"], [2350], now, "manual"))
      .to.emit(ukTracker, "PricesSubmitted")
      .withArgs(["ZW"], [2350], now, "manual");
  });

  it("should be able to add price for multiple products", async () => {
    await expect(
      ukTracker.submitPrices(["ZW", "BTC"], [2350, 36000], now, "manual")
    )
      .to.emit(ukTracker, "PricesSubmitted")
      .withArgs(["ZW", "BTC"], [2350, 36000], now, "manual");
  });

  it("should be able to update price and price index", async () => {
    const roundId = await ukTracker.aggregationRoundId();
    await ukTracker
      .connect(user1)
      .updatePrices(roundId, ["ZW", "BTC"], [2350, 36000], 15000);

    expect(await ukTracker.prices("ZW")).to.equal(2350);
    expect(await ukTracker.prices("BTC")).to.equal(36000);
    expect(await ukTracker.priceIndex()).to.equal(15000);
  });

  it("should emit PricesUpdated on price and price index update", async () => {
    const roundId = await ukTracker.aggregationRoundId();

    await expect(
      ukTracker
        .connect(user1)
        .updatePrices(roundId, ["ZW", "BTC"], [2350, 36000], 15000)
    )
      .to.emit(ukTracker, "PricesUpdated")
      .withArgs(roundId, ["ZW", "BTC"], [2350, 36000]);
  });

  it("should emit PriceIndexUpdated on price and price index update", async () => {
    const roundId = await ukTracker.aggregationRoundId();

    await expect(
      ukTracker
        .connect(user1)
        .updatePrices(roundId, ["ZW", "BTC"], [2350, 36000], 15000)
    )
      .to.emit(ukTracker, "PriceIndexUpdated")
      .withArgs(roundId, 15000);
  });
});
