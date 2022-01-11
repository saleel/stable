//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Stable {
    event ProductDetailsUpdated(string productDetailsCid);
    event ProductAdded(string productId, uint32 weightage);
    event PriceUpdated(uint32 date, string productId, uint32 price, uint32 confirmations);
    event PriceIndexUpdated(uint32 date, uint32 priceIndex);

    address public owner;

    string[] public productIds;
    string public productDetailsCid;

    // Mapping of productId => weightage used for priceIndex calculation
    mapping(string => uint32) public productWeightage;

    // Mapping of productId => price derived from submissions
    mapping(string => uint32) public prices;

    // Calculated price index as of lastUpdated
    uint32 public priceIndex = 0;

    // Currency used for all price submissions in this contract
    string public currency;

    mapping(string => uint32[]) public submittedPrices;

    mapping(string => mapping(uint32 => address[])) public submittedUsers;

    uint32 public currentDate;

    constructor(string memory _currency, uint32 _startDate, string[] memory _productIds, uint32[] memory _weightage, string memory _productDetailsCid) {
        owner = msg.sender;
        currency = _currency;
        currentDate = _startDate;
        productIds = _productIds;
        productDetailsCid = _productDetailsCid;

        require(_weightage.length == _productIds.length, "Should specify weightage for all given products");
        for (uint32 i = 0; i < _productIds.length; i++) {
            productWeightage[_productIds[i]] = _weightage[i];
        }

        emit ProductDetailsUpdated(productDetailsCid);
    }

    function addProduct(string memory _productId, uint32 _weightage, string memory _updatedProductDetailsCid) public {
        require(msg.sender == owner, "Unauthorized");

        productIds.push(_productId);
        productDetailsCid = _updatedProductDetailsCid;
        productWeightage[_productId] = _weightage;

        emit ProductAdded(_productId, _weightage);
        emit ProductDetailsUpdated(productDetailsCid);
    }

    function updateWeightage(string[] memory _productIds, uint32[] memory _weightage) public {
        require(msg.sender == owner, "Unauthorized");
        require(_weightage.length == _productIds.length, "Should specify weightage for all given products");

        for (uint32 i = 0; i < _productIds.length; i++) {
            productWeightage[_productIds[i]] = _weightage[i];
        }
    }

    function submitPrices(uint32 date, string[] memory _productIds, uint32[] memory _prices) public {
        require(date == currentDate, "Passed date is not current date");

        for (uint32 i = 0; i < _productIds.length; i++) {
            submittedPrices[_productIds[i]].push(_prices[i]);
            submittedUsers[_productIds[i]][_prices[i]].push(
                msg.sender
            );
        }
    }

    mapping(uint32 => uint32) private priceOccurenses;
    uint32 private mostCommonPrice = 0;
    uint32 private maxOccurenceCount = 0;
    address[] public validSubmitters;
    uint32 private totalValidPrice = 0;

    function calculate() public {
        for (uint32 i = 0; i < productIds.length; i++) {
            string memory productId = productIds[i];

            for (uint32 j = 0; j < submittedPrices[productId].length; j++) {
                uint32 price = submittedPrices[productId][j];

                priceOccurenses[price]++;

                if (priceOccurenses[price] > maxOccurenceCount) {
                    maxOccurenceCount = priceOccurenses[price];
                    mostCommonPrice = price;
                }
            }

            if (mostCommonPrice != 0) {
                if (mostCommonPrice != prices[productId]) {
                    prices[productId] = mostCommonPrice;
                    emit PriceUpdated(currentDate, productId, mostCommonPrice, maxOccurenceCount);
                }

                for (uint32 k = 0; k < submittedUsers[productId][mostCommonPrice].length; k++) {
                    validSubmitters.push(submittedUsers[productId][mostCommonPrice][k]);
                }

                totalValidPrice += mostCommonPrice;
            }
            
            mostCommonPrice = 0;
            maxOccurenceCount = 0;

            // Cleanup
            for (uint32 k = 0; k < submittedPrices[productId].length; k++) {
                delete submittedUsers[productId][submittedPrices[productId][k]];
                delete submittedPrices[productId][k];
                delete priceOccurenses[submittedPrices[productId][k]];
            }
        }

        // Calculate price index
        uint32 totalWeightedPrice = 0;
        uint32 totalWeightage = 0;
        for (uint32 i = 0; i < productIds.length; i++) {
            if (prices[productIds[i]] != 0) {
                totalWeightedPrice += productWeightage[productIds[i]] * prices[productIds[i]];
                totalWeightage += productWeightage[productIds[i]];
            }
        }
        uint32 _priceIndex = totalWeightedPrice / totalWeightage;

        if (_priceIndex != priceIndex) {
            priceIndex = _priceIndex;
            emit PriceIndexUpdated(currentDate, priceIndex);
        }
        
        // Increment date
        currentDate++;

        // Pick a random submitter as winner
        address winner;
        if (validSubmitters.length > 0) {
          winner = validSubmitters[totalValidPrice % validSubmitters.length];
        }

        // Reset temp variables
        totalValidPrice = 0;
    }
}
