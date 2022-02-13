//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StableToken.sol";
import "./StabilizerToken.sol";
import "./CountryTracker.sol";

contract Stable is Ownable {
  StabilizerToken public szrToken; // SZR - Project token, maintans the stability of STABLE.
  StableToken public stableToken; // STABLE token pegged to price index.

  string[] public countries; // Country code
  mapping(string => address) public countryTrackers; // Tracker contracts for countries.
  mapping(string => uint8) public countryWeightage; // Weightage of a country in the golbal price index.

  uint32 public overCollateralizationRatio; // Ratio of how much STABLE can be minted in addition to callateral (supplier redeemable).

  string[] public productIds; // ID of proucts tracked.
  string public priceAggregationMethod = "TOP3_AVG"; // Method of price aggregation to be used (for aggregator offchain calculation).
  uint8 public mininumPriceConfirmations = 1; // Minimum confimrations required on a price to be considered for aggregation.
  string public productDetailsCID; // IPFS CID of JSON with product details.

  uint256 public aggregationRoundId; // Start date (timestamp) of the current aggregation round.
  uint32 public aggregationDuration = 1 days;
  uint16 public aggregationRoundOverdueDuration = 3 hours; // Time after aggregation end time in which an aggregator should update prices.
  uint256 public szrRewardPerAggregationRound = 2; // SZR tokens rewarded to aggregator for each aggregation round.
  uint256 public aggregatorLockDuration = 30 days; // Duration after which aggregator can withdraw their locked SZR.
  mapping(address => uint32) public aggregatorLockedAmounts; // SZR locked by aggregators to claim aggregation rounds.
  mapping(address => uint256) public aggregatorLastUpdateTime; // Timestamp at which aggregator joined.
  mapping(address => uint16) public aggregationRoundsClaimed; // Rounds claimed by aggreagtors.
  mapping(address => uint256) public rewards; // Rewards in SZR for aggregators and suppliers.
  uint32 public totalLockedAmount; // Total amount locked by all aggreagtors.
  address public currentAggregator;

  struct Supplier {
    string name;
    uint256 stablesRedeemable; // Total StableTokens that supplier promised to redeem later.
    uint256 stablesRedeemed; // Total StableTokens that supplier redeemed to customers.
    uint16 claimPercent; // Percentage of the "SZR equivalent to redeemable StableTokens" claimable.
    uint256 szrRewardsPerRedemption; // SZR tokens rewarded to supplier for redemption of each Stable tokens;
  }
  mapping(address => Supplier) public suppliers;
  uint256 public totalStablesRedeemable; // Current total StableTokens redeemable at all suppliers
  uint256 public totalSZRClaimable; // Total SZRTokens claimable by all suppliers

  // Events
  event AggregationRoundStarted(uint256 aggregationRoundId);
  event AggregationRoundCompleted(uint256 aggregationRoundId);
  event CountryTrackerCreated(
    string country,
    string currency,
    address stableAddress,
    string[] productIds,
    uint8[] weightages
  );
  event ProductDetailsUpdated(string productDetailsCID);
  event AggregationSettingsUpdated(string priceAggregationMethod, uint8 mininumPriceConfirmations);

  constructor(
    uint256 _initialSZRSupply,
    uint32 _overCollateralizationRatio,
    uint256 _initialAggregationRoundId,
    string[] memory _productIds,
    string memory _productDetailsCid
  ) {
    szrToken = new StabilizerToken();
    stableToken = new StableToken();
    aggregationRoundId = _initialAggregationRoundId;
    overCollateralizationRatio = _overCollateralizationRatio;
    productIds = _productIds;
    productDetailsCID = _productDetailsCid;

    // Mint initial supply
    szrToken.mint(msg.sender, _initialSZRSupply);

    emit ProductDetailsUpdated(productDetailsCID);
    emit AggregationSettingsUpdated(priceAggregationMethod, mininumPriceConfirmations);
  }

  function createCountryTracker(
    string memory _country,
    string memory _currency,
    uint8 _countryWeightage,
    string[] memory _productIds,
    uint8[] memory _productWeightages
  ) public onlyOwner {
    CountryTracker _tracker = new CountryTracker(_country, _currency, _productIds, _productWeightages);

    _tracker.updateAggregationRound(aggregationRoundId, aggregationRoundId + aggregationDuration);

    countries.push(_country);
    countryTrackers[_country] = address(_tracker);
    countryWeightage[_country] = _countryWeightage;

    emit CountryTrackerCreated(_country, _currency, address(_tracker), _productIds, _productWeightages);
  }

  // Add new product
  function addProduct(string memory _productId, string memory _updatedProductDetailsCid) public onlyOwner {
    productIds.push(_productId);
    productDetailsCID = _updatedProductDetailsCid;

    emit ProductDetailsUpdated(productDetailsCID);
  }

  // Update product basket of a country
  function updateBasket(
    string memory _country,
    string[] memory _productIds,
    uint8[] memory _weightages
  ) public onlyOwner {
    CountryTracker(countryTrackers[_country]).updateBasket(_productIds, _weightages);
  }

  // Set Stable over collateralization raio
  function updateOverCollateralizationRatio(uint8 _overCollateralizationRatio) public onlyOwner {
    overCollateralizationRatio = _overCollateralizationRatio;
  }

  function updateAggregationSettings(
    string memory _priceAggregationMethod,
    uint8 _mininumPriceConfirmations,
    uint16 _aggregationRoundOverdueDuration,
    uint256 _szrRewardPerAggregationRound,
    uint256 _aggregatorLockDuration
  ) public onlyOwner {
    priceAggregationMethod = _priceAggregationMethod;
    mininumPriceConfirmations = _mininumPriceConfirmations;
    szrRewardPerAggregationRound = _szrRewardPerAggregationRound;
    aggregationRoundOverdueDuration = _aggregationRoundOverdueDuration;
    aggregatorLockDuration = _aggregatorLockDuration;

    emit AggregationSettingsUpdated(priceAggregationMethod, mininumPriceConfirmations);
  }

  /**************
    Aggregator functions
  ***************/

  // Lockup SZR and become aggregator
  function becomeAggregator(uint32 _amount) public {
    szrToken.transferFrom(msg.sender, address(this), _amount);
    aggregatorLockedAmounts[msg.sender] += _amount;
    aggregatorLastUpdateTime[msg.sender] = block.timestamp;
    totalLockedAmount += _amount;
  }

  // Claim future aggregation rounds
  function claimNextAggregationRound() public {
    require(canClaimNextAggregationRound(msg.sender), "Agg. round not claimable");

    for (uint8 i = 0; i < countries.length; i++) {
      CountryTracker(countryTrackers[countries[i]]).setAggregator(msg.sender);
    }
    currentAggregator = msg.sender;
  }

  // Close this aggregation round and get rewards after updating price for all country
  function completeAggregation() public {
    require(currentAggregator == msg.sender, "Not the aggregator");

    for (uint8 i = 0; i < countries.length; i++) {
      require(
        CountryTracker(countryTrackers[countries[i]]).priceUpdatedForAggRound() == true,
        "All countries not updated"
      );
    }

    aggregationRoundsClaimed[msg.sender]++;
    emit AggregationRoundCompleted(aggregationRoundId);

    aggregationRoundId += aggregationDuration;
    for (uint8 i = 0; i < countries.length; i++) {
      CountryTracker(countryTrackers[countries[i]]).updateAggregationRound(
        aggregationRoundId,
        aggregationRoundId + aggregationDuration
      );
    }

    emit AggregationRoundStarted(aggregationRoundId);

    rewards[msg.sender] += szrRewardPerAggregationRound;
  }

  // Withdraw locked amount and stop being aggregator
  function aggregatorWithdrawLocked() public {
    // TODO: Guard for miner timestamp manipulation
    require(block.timestamp > aggregatorLastUpdateTime[msg.sender] + aggregatorLockDuration, "Not yet unlocked");

    szrToken.transfer(msg.sender, aggregatorLockedAmounts[msg.sender]);
  }

  // For DAO to slash aggregator locked funds for bad behaviour
  function slashAggregator(address aggregator, uint32 _amount) public onlyOwner {
    aggregatorLockedAmounts[aggregator] -= _amount;
  }

  // Withdraw rewards (aggregator and supplier)
  function withdrawRewards(uint256 _amount) public {
    require(_amount >= rewards[msg.sender], "Not enough balance");

    rewards[msg.sender] -= _amount;
    szrToken.transfer(msg.sender, _amount);
  }

  /**************
    Supplier functions
  ***************/

  function addSupplier(
    address _address,
    string memory _name,
    uint256 _stablesRedeemable,
    uint16 _claimPercent,
    uint256 _szrRewardsPerRedemption
  ) public onlyOwner {
    suppliers[_address] = Supplier({
      name: _name,
      stablesRedeemable: _stablesRedeemable,
      stablesRedeemed: 0,
      claimPercent: _claimPercent,
      szrRewardsPerRedemption: _szrRewardsPerRedemption
    });
    totalStablesRedeemable += _stablesRedeemable;
  }

  function updateSupplierConfig(
    address _address,
    uint256 _stablesRedeemable,
    uint8 _claimPercent,
    uint256 _szrRewardsPerRedemption
  ) public onlyOwner {
    suppliers[_address].stablesRedeemable = _stablesRedeemable;
    suppliers[_address].claimPercent = _claimPercent;
    suppliers[_address].szrRewardsPerRedemption = _szrRewardsPerRedemption;
  }

  // Supplier claim SZR
  function supplierWithdrawSZR(uint32 _amount) public {
    require(getSZRWithdrawableBySupplier(msg.sender) >= _amount, "Not enough balance");

    szrToken.transfer(msg.sender, _amount);
  }

  // Customer redeeming at supplier
  function redeemStable(uint32 _amount, address _supplier) public {
    suppliers[_supplier].stablesRedeemed += _amount;
    totalStablesRedeemable -= _amount;

    uint256 reward = suppliers[_supplier].szrRewardsPerRedemption;

    // Burn the redeemedstable from circulation
    // Mint equivalent SZR and add to contract - to be claimed by suppliers later
    // Also mint the reward to be claimed by the supplier - value for this mint is backed by the growth of the project due to redemption
    uint256 equivalentSZR = (_amount * getStableTokenPrice()) / getSZRPriceInUSD();
    stableToken.burn(msg.sender, _amount);
    szrToken.mint(address(this), equivalentSZR + reward);
    totalSZRClaimable += equivalentSZR;

    rewards[_supplier] += reward;
  }

  /**************
    Mint/Exchane Stable/SZR functions
  ***************/

  // Exchange SZR for Stable
  function mintStable(uint32 _amount) public {
    // Ensure new minted amount is within mintable limit (backed by suppliers + over collateralizd)
    uint256 currentSupply = stableToken.totalSupply();
    require((getMintableStableTokenCount() + _amount) > currentSupply, "No collateral to mint");

    // Calculate required amount of SZR
    // To mint $1 worth of Stable, claim $1 worth of SZR
    uint256 equivalentSZR = (_amount * getStableTokenPrice()) / getSZRPriceInUSD();

    // Stables minted that is not collaterazlied (redeeamble at supplier) is created out of nothing,
    // SZR received for that is seigniorage - this should be burned
    uint256 szrToBurn = 0;
    if (currentSupply + _amount > totalStablesRedeemable) {
      uint256 nonCollateralizedPercent = ((currentSupply + _amount - totalStablesRedeemable) * 100) /
        totalStablesRedeemable;
      szrToBurn = (nonCollateralizedPercent * equivalentSZR) / 100;
    }

    // Burn and transfer required SZR
    szrToken.transferFrom(msg.sender, address(this), equivalentSZR - szrToBurn);
    szrToken.burn(msg.sender, szrToBurn);
    totalSZRClaimable += equivalentSZR - szrToBurn;

    // Mint and transfer Stables
    stableToken.mint(msg.sender, _amount);
  }

  // Exchange Stable for SZR
  function burnStable(uint32 _amount) public {
    uint256 equivalentSZR = (_amount * getStableTokenPrice()) / getSZRPriceInUSD();
    stableToken.burn(msg.sender, _amount);
    szrToken.mint(msg.sender, equivalentSZR);
  }

  /**************
    Views
  ***************/

  function getSZRPriceInUSD() public view returns (uint256) {
    // TODO: This should come from an Oracle (and cached in contract maybe)
    // Mocked for now to simulate price based on supply
    return 10000000 / (szrToken.totalSupply() / 2);
  }

  function getStableTokenPrice() public view returns (uint256) {
    return getGlobalPriceIndex();
  }

  // Get amount of SZR claimable by the supplier
  function getSZRWithdrawableBySupplier(address _account) public view returns (uint256) {
    uint256 claimShare = suppliers[_account].stablesRedeemable / totalStablesRedeemable;

    return (claimShare * totalSZRClaimable * suppliers[_account].claimPercent) / 100;
  }

  function getMintableStableTokenCount() public view returns (uint256) {
    return totalStablesRedeemable + ((totalStablesRedeemable * overCollateralizationRatio) / 100);
  }

  function getGlobalPriceIndex() public view returns (uint32) {
    uint32 weightedSum = 0;
    for (uint8 i = 0; i < countries.length; i++) {
      weightedSum += CountryTracker(countryTrackers[countries[i]]).priceIndex();
    }

    return uint32(weightedSum / countries.length);
  }

  function isAggregationRoundOverdue() public view returns (bool) {
    if ((block.timestamp + aggregationRoundOverdueDuration) > (aggregationRoundId + aggregationDuration)) {
      return true;
    }
    return false;
  }

  function canClaimNextAggregationRound(address aggregator) public view returns (bool) {
    // If current agg has not updated in due time, then any agg can claim
    if (isAggregationRoundOverdue() && aggregatorLockedAmounts[aggregator] != 0) {
      return true;
    }

    uint32 aggregatatorShare = aggregatorLockedAmounts[aggregator] / totalLockedAmount;
    uint32 totalAggregationRoundsSinceLock = uint32(aggregationRoundId / aggregationDuration);
    uint32 claimedShare = aggregationRoundsClaimed[aggregator] / totalAggregationRoundsSinceLock;

    return aggregatatorShare >= claimedShare;
  }
}
