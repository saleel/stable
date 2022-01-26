//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StableFactory is Ownable {
    string[] public countries;
    mapping(string => address) public childContracts;
    mapping(string => uint8) public countryWeightage;
    string[] public productIds;
    mapping(string => uint8) public productBasket; // Mapping of productId -> quantity(weightage)
    string public priceAggregationMethod;
    uint8 public mininumPriceConfirmations;
    string public productDetailsCid;

    event StableCreated(string country, string currency, address stableAddress);
    event ProductDetailsUpdated(string productDetailsCid);
    event ProductBasketUpdated();
    event AggregationSettingsUpdated(
        string priceAggregationMethod,
        uint8 mininumPriceConfirmations
    );

    constructor(
        string[] memory _productIds,
        uint8[] memory _productWeightages,
        string memory _productDetailsCid,
        string memory _priceAggregationMethod,
        uint8 _mininumPriceConfirmations
    ) {
        productIds = _productIds;
        productDetailsCid = _productDetailsCid;
        priceAggregationMethod = _priceAggregationMethod;
        mininumPriceConfirmations = _mininumPriceConfirmations;

        for (uint16 i = 0; i < _productIds.length; i++) {
            productBasket[_productIds[i]] = _productWeightages[i];
        }

        emit ProductDetailsUpdated(productDetailsCid);
        emit ProductBasketUpdated();
        emit AggregationSettingsUpdated(
            priceAggregationMethod,
            mininumPriceConfirmations
        );
    }

    function createStable(
        string memory _country,
        string memory _currency,
        uint32 _startDate,
        uint8 _countryWeightage
    ) public onlyOwner {
        Stable _stable = new Stable(_currency, _country, _startDate);

        countries.push(_country);
        childContracts[_country] = address(_stable);
        countryWeightage[_country] = _countryWeightage;

        emit StableCreated(_country, _currency, address(_stable));
    }

    function addProduct(
        string memory _productId,
        uint8 _weightage,
        string memory _updatedProductDetailsCid
    ) public onlyOwner {
        productIds.push(_productId);
        productBasket[_productId] = _weightage;
        productDetailsCid = _updatedProductDetailsCid;

        emit ProductDetailsUpdated(productDetailsCid);
        emit ProductBasketUpdated();
    }

    function updateBasket(string memory _productId, uint8 _weightage)
        public
        onlyOwner
    {
        productBasket[_productId] = _weightage;
        emit ProductBasketUpdated();
    }

    function updateAggregationSettings(
        string memory _priceAggregationMethod,
        uint8 _mininumPriceConfirmations
    ) public onlyOwner {
        priceAggregationMethod = _priceAggregationMethod;
        mininumPriceConfirmations = _mininumPriceConfirmations;

        emit AggregationSettingsUpdated(
            priceAggregationMethod,
            mininumPriceConfirmations
        );
    }

    function globalPriceIndex() public view returns (uint32) {
        uint32 weightedSum = 0;
        for (uint8 i = 0; i < countries.length; i++) {
            weightedSum += Stable(childContracts[countries[i]]).priceIndex();
        }

        return uint32(weightedSum / countries.length);
    }
}

contract Stable is Ownable {
    string public currency;
    string public country;
    uint32 public currentDate;
    uint16 public priceIndex;
    mapping(string => uint16) public prices;

    event PricesUpdated(uint32 date, string[] productIds, uint16[] prices);
    event PricesSubmitted(string[] productIds, uint16[] prices, string source);
    event PriceIndexUpdated(uint32 date, uint16 priceIndex);

    constructor(
        string memory _country,
        string memory _currency,
        uint32 _startDate
    ) {
        country = _country;
        currency = _currency;
        currentDate = _startDate;
    }

    function submitPrices(
        uint32 _date,
        string[] memory _productIds,
        uint16[] memory _prices,
        string memory _source
    ) public {
        require(_date == currentDate, "Passed date is not current date");

        emit PricesSubmitted(_productIds, _prices, _source);
    }

    function updatePrices(
        uint32 _date,
        string[] memory _productIds,
        uint16[] memory _prices,
        uint16 _priceIndex
    ) public {
        require(_date == currentDate, "Passed date is not current date");

        for (uint16 i = 0; i < _productIds.length; i++) {
            prices[_productIds[i]] = _prices[i];
        }

        priceIndex = _priceIndex;
        currentDate++;
    }
}
