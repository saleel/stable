//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CountryTracker is Ownable {
  string public currency; // Currrency symbol
  string public country; // Country code
  uint32 public priceIndex; // Latest price index for this country
  mapping(string => uint16) public productBasket; // Mapping of productId -> weightage
  mapping(string => uint32) public prices; // Latest price for all products

  // Aggregation round details
  uint256 public aggregationRoundId;
  uint256 public aggregationRoundEndTime;
  address public aggregator;
  bool public priceUpdatedForAggRound = false;

  event ProductBasketUpdated(string[] productIds, uint16[] weightages);
  event PricesSubmitted(string[] productIds, uint32[] prices, uint256 timestamp, string source);
  event PricesSubmittedUsingIPFS(string pricesCID);
  event PriceIndexUpdated(uint256 aggregationRoundId, uint32 priceIndex);
  event PricesUpdated(uint256 aggregationRoundId, string[] productIds, uint32[] prices);

  constructor(
    string memory _country,
    string memory _currency,
    string[] memory _productIds,
    uint16[] memory _productWeightages
  ) {
    country = _country;
    currency = _currency;

    for (uint16 i = 0; i < _productIds.length; i++) {
      productBasket[_productIds[i]] = _productWeightages.length > 0 ? _productWeightages[i] : 1;
    }
  }

  // Update product baseket (called by parent owner (DAO))
  function updateBasket(string[] memory _productIds, uint16[] memory _weightages) public onlyOwner {
    for (uint16 i = 0; i < _productIds.length; i++) {
      productBasket[_productIds[i]] = _weightages[i];
    }

    emit ProductBasketUpdated(_productIds, _weightages);
  }

  function setAggregator(address _aggregator) public onlyOwner {
    aggregator = _aggregator;
  }

  function updateAggregationRound(uint256 _aggregationRoundId, uint256 _aggregationRoundEndTime) public onlyOwner {
    aggregationRoundId = _aggregationRoundId;
    aggregationRoundEndTime = _aggregationRoundEndTime;
    priceUpdatedForAggRound = false;
  }

  // Function to submit prices
  function submitPrices(
    string[] memory _productIds,
    uint32[] memory _prices,
    uint256 _timestamp,
    string memory _source
  ) public {
    emit PricesSubmitted(_productIds, _prices, _timestamp, _source);
  }

  // Function to submit prices via IPFS (JSON)
  function submitPricesUsingIPFS(string memory _pricesCID) public {
    emit PricesSubmittedUsingIPFS(_pricesCID);
  }

  // Aggregator update calculated prices and prices index
  function updatePrices(
    uint256 _aggregationRoundId,
    string[] memory _productIds,
    uint32[] memory _prices,
    uint32 _priceIndex
  ) public {
    require(aggregator == msg.sender, "Not the current aggregator");
    require(!priceUpdatedForAggRound, "Price already updated");
    require(block.timestamp > aggregationRoundEndTime, "Agg. round not due");
    require(_productIds.length == _prices.length, "Price not found for all products");

    for (uint16 i = 0; i < _productIds.length; i++) {
      prices[_productIds[i]] = _prices[i];
    }

    priceIndex = _priceIndex;
    priceUpdatedForAggRound = true;

    emit PricesUpdated(_aggregationRoundId, _productIds, _prices);
    emit PriceIndexUpdated(_aggregationRoundId, _priceIndex);
  }
}
