//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StableFactory is Ownable {
    string[] public countries;
    mapping(string => address) public childContracts;
    mapping(string => uint8) public countryWeightage;
    string[] public productIds;
    string public priceAggregationMethod;
    uint8 public mininumPriceConfirmations;
    string public productDetailsCid;

    event StableCreated(
        string country,
        string currency,
        address stableAddress,
        string[] productIds,
        uint8[] weightages
    );
    event ProductDetailsUpdated(string productDetailsCid);
    event AggregationSettingsUpdated(
        string priceAggregationMethod,
        uint8 mininumPriceConfirmations
    );

    constructor(
        string[] memory _productIds,
        string memory _productDetailsCid,
        string memory _priceAggregationMethod,
        uint8 _mininumPriceConfirmations
    ) {
        productIds = _productIds;
        productDetailsCid = _productDetailsCid;
        priceAggregationMethod = _priceAggregationMethod;
        mininumPriceConfirmations = _mininumPriceConfirmations;

        emit ProductDetailsUpdated(productDetailsCid);
        emit AggregationSettingsUpdated(
            priceAggregationMethod,
            mininumPriceConfirmations
        );
    }

    function createStable(
        string memory _country,
        string memory _currency,
        uint32 _initialAggregationRoundId,
        uint8 _countryWeightage,
        string[] memory _productIds,
        uint8[] memory _productWeightages
    ) public onlyOwner {
        Stable _stable = new Stable(
            owner(),
            _country,
            _currency,
            _initialAggregationRoundId,
            _productIds,
            _productWeightages
        );

        countries.push(_country);
        childContracts[_country] = address(_stable);
        countryWeightage[_country] = _countryWeightage;

        emit StableCreated(
            _country,
            _currency,
            address(_stable),
            _productIds,
            _productWeightages
        );
    }

    function addProduct(
        string memory _productId,
        string memory _updatedProductDetailsCid
    ) public onlyOwner {
        productIds.push(_productId);
        productDetailsCid = _updatedProductDetailsCid;

        emit ProductDetailsUpdated(productDetailsCid);
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
    uint16 public priceIndex;
    mapping(string => uint8) public productBasket; // Mapping of productId -> weightage
    mapping(string => uint16) public prices;
    uint32 public aggregationRoundId; // Start date (timestamp) of the aggregation round
    uint32 public previousAggregationRoundId;
    uint32 public aggregationDuration = 1 days; // Hardcoded for now

    event ProductBasketUpdated(string[] productIds, uint8[] weightages);
    event PricesSubmitted(uint32 aggregationRoundId, string[] productIds, uint16[] prices, string source);
    event PricesUpdated(
        uint32 aggregationRoundId,
        string[] productIds,
        uint16[] prices
    );
    event PriceIndexUpdated(uint32 aggregationRoundId, uint16 priceIndex);
    event AggregationRoundStarted(uint32 aggregationRoundId);
    event AggregationRoundCompleted(uint32 aggregationRoundId);

    constructor(
        address owner,
        string memory _country,
        string memory _currency,
        uint32 _initialAggregationRoundId,
        string[] memory _productIds,
        uint8[] memory _productWeightages
    ) {
        country = _country;
        currency = _currency;
        aggregationRoundId = _initialAggregationRoundId;
        previousAggregationRoundId = _initialAggregationRoundId;

        for (uint16 i = 0; i < _productIds.length; i++) {
            productBasket[_productIds[i]] = _productWeightages[i];
        }

        emit AggregationRoundStarted(_initialAggregationRoundId);
        _transferOwnership(owner);
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

    function submitPrices(
        string[] memory _productIds,
        uint16[] memory _prices,
        string memory _source
    ) public {
        emit PricesSubmitted(aggregationRoundId, _productIds, _prices, _source);
    }

    function updateAggregationRound() public {
        if (block.timestamp > (aggregationRoundId + aggregationDuration)) {
            previousAggregationRoundId = aggregationRoundId;
            aggregationRoundId += aggregationDuration; // aggregationRoundId is the timestamp when round start

            emit AggregationRoundCompleted(previousAggregationRoundId);
            emit AggregationRoundStarted(aggregationRoundId);
        }
    }

    function updatePrices(
        uint32 _aggregationRoundId,
        string[] memory _productIds,
        uint16[] memory _prices,
        uint16 _priceIndex
    ) public {
        require(
            _aggregationRoundId == previousAggregationRoundId,
            "Invalid aggregation round or already updated"
        );
        require(
            _productIds.length == _prices.length,
            "Should have price for all passed products"
        );

        for (uint16 i = 0; i < _productIds.length; i++) {
            // TODO: Optionally verify min confirmations
            prices[_productIds[i]] = _prices[i];
        }

        priceIndex = _priceIndex;
        previousAggregationRoundId = 0; // Unset this variable so no further update can be done for this aggregation round

        emit PricesUpdated(_aggregationRoundId, _productIds, _prices);
        emit PriceIndexUpdated(_aggregationRoundId, _priceIndex);
    }
}
