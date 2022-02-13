//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Stable is Ownable {
    string public currency;
    string public country;
    uint16 public priceIndex;
    mapping(string => uint8) public productBasket; // Mapping of productId -> weightage
    mapping(string => uint16) public prices;

    uint256 public aggregationRoundId;
    uint256 public aggregationRoundEndTime;
    address public aggregator;
    bool public priceUpdatedForAggRound = false;

    event ProductBasketUpdated(string[] productIds, uint8[] weightages);
    event PricesSubmitted(string[] productIds, uint16[] prices, string source);
    event PriceIndexUpdated(uint256 aggregationRoundId, uint16 priceIndex);
    event PricesUpdated(
        uint256 aggregationRoundId,
        string[] productIds,
        uint16[] prices
    );

    constructor(
        string memory _country,
        string memory _currency,
        string[] memory _productIds,
        uint8[] memory _productWeightages
    ) {
        country = _country;
        currency = _currency;

        for (uint16 i = 0; i < _productIds.length; i++) {
            productBasket[_productIds[i]] = _productWeightages[i];
        }
    }

    function updateBasket(
        string[] memory _productIds,
        uint8[] memory _weightages
    ) public onlyOwner {
        for (uint16 i = 0; i < _productIds.length; i++) {
            productBasket[_productIds[i]] = _weightages[i];
        }

        emit ProductBasketUpdated(_productIds, _weightages);
    }

    function setAggregator(address _aggregator) public onlyOwner {
        aggregator = _aggregator;
    }

    function updateAggregationRound(
        uint256 _aggregationRoundId,
        uint256 _aggregationRoundEndTime
    ) public onlyOwner {
        aggregationRoundId = _aggregationRoundId;
        aggregationRoundEndTime = _aggregationRoundEndTime;
        priceUpdatedForAggRound = false;
    }

    function submitPrices(
        string[] memory _productIds,
        uint16[] memory _prices,
        string memory _source
    ) public {
        emit PricesSubmitted(_productIds, _prices, _source);
    }

    function updatePrices(
        uint256 _aggregationRoundId,
        string[] memory _productIds,
        uint16[] memory _prices,
        uint16 _priceIndex
    ) public {
        require(aggregator == msg.sender, "Not the current aggregator");
        require(!priceUpdatedForAggRound, "Price already updated");
        require(
            block.timestamp > aggregationRoundEndTime,
            "Agg. round not due"
        );
        require(
            _productIds.length == _prices.length,
            "Price not found for all products"
        );

        for (uint16 i = 0; i < _productIds.length; i++) {
            // TODO: Optionally verify min confirmations
            prices[_productIds[i]] = _prices[i];
        }

        priceIndex = _priceIndex;
        priceUpdatedForAggRound = true;

        emit PricesUpdated(_aggregationRoundId, _productIds, _prices);
        emit PriceIndexUpdated(_aggregationRoundId, _priceIndex);
    }
}
