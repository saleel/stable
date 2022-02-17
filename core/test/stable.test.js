const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Stable", () => {
  /** @type{import("../typechain-types/Stable").Stable} */
  let stable;

  /** @type{import("../typechain-types/CountryTracker").CountryTracker} */
  let ukTracker;

  /** @type{import("../typechain-types/StabilizerToken").StabilizerToken} */
  let SZRToken;

  /** @type{import("../typechain-types/StableToken").StableToken} */
  let StableToken;

  let owner;
  let user1;
  let user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    const Stable = await ethers.getContractFactory("Stable", owner);

    stable = await Stable.deploy(
      1000, // SCR supply
      20, // over-coll ratio
      Math.round(new Date().getTime() / 1000) - 2 * 86400, // 2 days before
      "bafkreibroamdx2xuh4p3vjqiuhk7564vz7kgz2lyed5v4jqyuhmdsyrtpa"
    );

    await stable.deployed();

    await stable.createCountryTracker("UK", "GBP", 10);

    await stable.updateBasket(
      "UK",
      ["ZC", "ZW", "ZR", "ZS", "KE"],
      [1, 1, 1, 1, 1]
    );

    ukTracker = await ethers.getContractAt(
      "CountryTracker",
      await stable.countryTrackers("UK")
    );

    SZRToken = await ethers.getContractAt(
      "StabilizerToken",
      stable.szrToken(),
      owner
    );

    SZRToken.transfer(user1.address, 100);
    SZRToken.transfer(user2.address, 600);

    StableToken = await ethers.getContractAt(
      "StableToken",
      stable.stableToken()
    );
  });

  // Helper function for some tests
  async function updatePrices(expectedPI = 1000) {
    if ((await stable.aggregatorLockedAmounts(user1.address)) === 0) {
      await SZRToken.connect(user1).approve(stable.address, 200);
      await stable.connect(user1).enrollAsAggregator(100);
    }

    await stable.connect(user1).claimNextAggregationRound();
    await ukTracker
      .connect(user1)
      .updatePrices(
        await stable.aggregationRoundId(),
        ["ZC", "ZW", "ZR", "ZS", "KE"],
        [expectedPI, expectedPI, expectedPI, expectedPI, expectedPI],
        expectedPI
      );
    await stable.connect(user1).completeAggregation();
  }

  it("should be able to create country tracker contracts", async () => {
    await stable.createCountryTracker("US", "USD", 10);

    await stable.createCountryTracker("UK", "GBP", 10);
    await stable.updateBasket("UK", ["ZC", "ZW"], [2, 2]);

    expect(await stable.countryTrackers("US")).to.not.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(await stable.countryTrackers("UK")).to.not.equal(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("should be able to add new product", async () => {
    await expect(
      stable.updateProducts(
        "bafkreibroamdx2xuh4p3vjqiuhk7564vz7kgz2lyed5v4jqyuhmdsyrtpa"
      )
    )
      .to.emit(stable, "ProductDetailsUpdated")
      .withArgs("bafkreibroamdx2xuh4p3vjqiuhk7564vz7kgz2lyed5v4jqyuhmdsyrtpa");
  });

  it("should allow user to function as aggregator", async () => {
    await SZRToken.connect(user1).approve(stable.address, 200);
    await stable.connect(user1).enrollAsAggregator(100);

    expect(await stable.aggregatorLockedAmounts(user1.address)).to.equal(100);

    await stable.connect(user1).claimNextAggregationRound();

    expect(await ukTracker.aggregator()).to.equal(user1.address);

    await ukTracker
      .connect(user1)
      .updatePrices(
        await stable.aggregationRoundId(),
        ["ZC", "ZW", "ZR", "ZS", "KE"],
        [10, 10, 10, 10, 10],
        10
      );

    expect(await ukTracker.priceUpdatedForAggRound()).to.equal(true);
    await stable.connect(user1).completeAggregation();

    expect(await stable.rewards(user1.address)).to.equal(2);

    await stable.connect(user1).withdrawRewards(2);

    expect(await SZRToken.balanceOf(user1.address)).to.equal(2);
  });

  it("should allow supplier to claim SZR", async () => {
    // Update price to set price index
    await updatePrices();

    await stable.addSupplier(user1.address, "ABC Market", 1000, 50, 2);

    const priceOfStable = await stable.getStableTokenPrice();
    const priceOfSZR = await stable.getSZRPriceInUSD();

    await SZRToken.connect(user2).approve(stable.address, 60);

    const stablesToMint = await stable.getMintableStableTokenCount(); // max possible

    await stable.connect(user2).mintStable(stablesToMint);

    const totalSZRClaimable =
      ((stablesToMint * priceOfStable) / priceOfSZR) * (1 - 20 / 100); // minus burned

    const claimable = Math.round((50 / 100) * totalSZRClaimable);

    expect(await stable.getSZRWithdrawableBySupplier(user1.address)).to.equal(
      claimable
    );

    await stable.connect(user1).supplierWithdrawSZR(claimable);

    expect(await SZRToken.balanceOf(user1.address)).to.equal(claimable);
  });

  it("should allow users to exchange SZR for Stables", async () => {
    // Update price to set price index
    await updatePrices(1000);

    await stable.addSupplier(user1.address, "ABC Market", 1000, 50, 0);
    await SZRToken.connect(user2).approve(stable.address, 60);

    let priceOfSZR = await stable.getSZRPriceInUSD();

    const szrBalanceStarting = await SZRToken.balanceOf(user2.address);
    const stablesToMint = await stable.getMintableStableTokenCount(); // max possible
    await stable.connect(user2).mintStable(stablesToMint);

    expect(await StableToken.totalSupply()).to.equal(stablesToMint);
    expect(await StableToken.balanceOf(user2.address)).to.equal(stablesToMint);

    const szrUsedForMinting =
      szrBalanceStarting - (await SZRToken.balanceOf(user2.address));
    const szrBalanceAfterMint = szrBalanceStarting - szrUsedForMinting;
    const usdSpentForMinting = szrUsedForMinting * priceOfSZR;

    priceOfSZR = await stable.getSZRPriceInUSD();

    await updatePrices(1100); // 10% increase
    await stable.connect(user2).burnStable(stablesToMint);

    const usdToReceiveAfterBurn = (usdSpentForMinting * 1100) / 1000; // 10% extra
    const expectedSZRReceived = Math.floor(usdToReceiveAfterBurn / priceOfSZR);

    expect(await SZRToken.balanceOf(user2.address)).to.equal(
      szrBalanceAfterMint + expectedSZRReceived
    );
  });
});
