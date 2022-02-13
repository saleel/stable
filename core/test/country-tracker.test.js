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

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();

    const Stable = await ethers.getContractFactory("Stable", owner);

    /** @type{import("../typechain-types/Stable").Stable} */
    stable = await Stable.deploy(
      1000, // SCR supply
      20, // coll ratio
      ["ZC", "ZW", "ZR", "ZS", "KE"],
      "bafybeig7zusrlit7xdhjkw7tkrtkmgqilt4dfoscp256yoawc3uxdwpgxe",
      "TOP3_AVG",
      1
    );

    await stable.deployed();

    await stable.createCountryTracker("UK", "GBP", 10, ["BTC", "ETH"], [1, 1]);

    ukTracker = await ethers.getContractAt(
      "CountryTracker",
      await stable.countryTrackers("UK"),
      owner
    );

    await stable.createCountryTracker(
      "US",
      "USA",
      10,
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
    await stable.connect(user1).becomeAggregator(10);
    await stable.connect(user1).claimNextAggregationRound();
  });

  it("should update product basket correctly", async () => {
    expect(await usTracker.productBasket("ZC")).to.equal(1);
    expect(await usTracker.productBasket("KE")).to.equal(1);

    await expect(stable.updateBasket("US", ["ZC", "KE"], [4, 3]))
      .to.emit(usTracker, "ProductBasketUpdated")
      .withArgs(["ZC", "KE"], [4, 3]);

    expect(await usTracker.productBasket("ZC")).to.equal(4);
    expect(await usTracker.productBasket("KE")).to.equal(3);
    expect(await usTracker.productBasket("ZW")).to.equal(1);
    expect(await usTracker.productBasket("ZS")).to.equal(1);
  });

  it("should be able to add price for one product", async () => {
    await expect(ukTracker.submitPrices(["ZW"], [2350], "manual"))
      .to.emit(ukTracker, "PricesSubmitted")
      .withArgs(["ZW"], [2350], "manual");
  });

  it("should be able to add price for multiple products", async () => {
    await expect(ukTracker.submitPrices(["ZW", "BTC"], [2350, 36000], "manual"))
      .to.emit(ukTracker, "PricesSubmitted")
      .withArgs(["ZW", "BTC"], [2350, 36000], "manual");
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
