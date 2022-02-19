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
  let user3;

  beforeEach(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const Stable = await ethers.getContractFactory("Stable", owner);

    stable = await Stable.deploy(
      ethers.utils.parseEther("100000000"), // SZR initial supply
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

    SZRToken.transfer(user1.address, ethers.utils.parseEther("100"));
    SZRToken.transfer(user2.address, ethers.utils.parseEther("1200"));

    StableToken = await ethers.getContractAt(
      "StableToken",
      stable.stableToken()
    );
  });

  // Helper function for some tests
  async function updatePrices(requiredPI = 1000) {
    if (
      Number(
        ethers.utils.formatEther(
          await stable.aggregatorLockedAmounts(user1.address)
        )
      ) === 0
    ) {
      await SZRToken.connect(user1).approve(
        stable.address,
        ethers.utils.parseEther("2000")
      );
      await stable
        .connect(user1)
        .enrollAsAggregator(ethers.utils.parseEther("100"));
    }

    await stable.connect(user1).claimNextAggregationRound();
    await ukTracker
      .connect(user1)
      .updatePrices(
        await stable.aggregationRoundId(),
        ["ZC", "ZW", "ZR", "ZS", "KE"],
        [requiredPI, requiredPI, requiredPI, requiredPI, requiredPI],
        requiredPI
      );
    await stable.connect(user1).completeAggregation([]);
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
    await SZRToken.connect(user1).approve(
      stable.address,
      ethers.utils.parseEther("100")
    );
    await stable
      .connect(user1)
      .enrollAsAggregator(ethers.utils.parseEther("100"));

    expect(await stable.aggregatorLockedAmounts(user1.address)).to.equal(
      ethers.utils.parseEther("100")
    );

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
    await stable.connect(user1).completeAggregation([user2.address]);

    expect(await stable.rewards(user1.address)).to.equal(
      ethers.utils.parseEther("2")
    ); // agg rewards

    expect(await stable.rewards(user2.address)).to.equal(
      ethers.utils.parseEther("0.5")
    ); // submitter rewards

    await stable.connect(user1).withdrawRewards(ethers.utils.parseEther("2"));

    expect(await SZRToken.balanceOf(user1.address)).to.equal(
      ethers.utils.parseEther("2")
    );
  });

  it("should allow supplier to claim SZR", async () => {
    // Update price to set price index
    await updatePrices();

    await stable.addSupplier(
      user1.address,
      "ABC Market",
      ethers.utils.parseEther("1000"),
      50,
      2
    );

    const stablesToMint = await stable.getMintableStableTokenCount(); // max possible

    // normal user mint stables
    await SZRToken.connect(user2).approve(stable.address, stablesToMint);
    await stable.connect(user2).mintStable(stablesToMint);

    const priceOfStable = await stable.getStableTokenPrice();
    const priceOfSZR = 499; // Because new stable was minted to reward aggregator

    const szrClaimable = Math.round(
      (((1000 * 50) / 100) * priceOfStable) / priceOfSZR
    );

    expect(
      Math.round(
        ethers.utils.formatEther(
          (await stable.getSZRWithdrawableBySupplier(user1.address)).toString()
        )
      )
    ).to.equal(szrClaimable);

    await stable
      .connect(user1)
      .supplierWithdrawSZR(ethers.utils.parseEther(szrClaimable.toString()));

    expect((await SZRToken.balanceOf(user1.address)).toString()).to.equal(
      ethers.utils.parseEther(szrClaimable.toString())
    );
  });

  it("should allow users to exchange SZR for Stables", async () => {
    // Update price to set price index
    await updatePrices(1000);

    await stable.addSupplier(
      user3.address,
      "ABC Market",
      ethers.utils.parseEther("1000"),
      50,
      0
    );
    await SZRToken.connect(user2).approve(
      stable.address,
      ethers.utils.parseEther("250")
    );

    let priceOfSZR = await stable.getSZRPriceInUSD();

    const szrBalanceStarting = ethers.utils.formatEther(
      await SZRToken.balanceOf(user2.address)
    );
    const stablesToMint = await stable.getMintableStableTokenCount(); // max possible
    await stable.connect(user2).mintStable(stablesToMint);

    expect(await StableToken.totalSupply()).to.equal(stablesToMint);
    expect(await StableToken.balanceOf(user2.address)).to.equal(stablesToMint);

    const szrUsedForMinting =
      szrBalanceStarting -
      ethers.utils.formatEther(await SZRToken.balanceOf(user2.address));

    const szrBalanceAfterMint = szrBalanceStarting - szrUsedForMinting;
    const usdSpentForMinting = szrUsedForMinting * priceOfSZR;

    priceOfSZR = await stable.getSZRPriceInUSD();

    await updatePrices(1100); // 10% increase

    await stable.connect(user2).burnStable(stablesToMint);

    const usdToReceiveAfterBurn = (usdSpentForMinting * 1100) / 1000; // 10% extra
    const expectedSZRReceived = Math.floor(usdToReceiveAfterBurn / priceOfSZR);

    expect(
      Math.floor(
        ethers.utils.formatEther(await SZRToken.balanceOf(user2.address))
      )
    ).to.equal(Math.round(szrBalanceAfterMint + expectedSZRReceived));
  });
});
