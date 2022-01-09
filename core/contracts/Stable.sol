//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Stable {
    event PriceUpdated(uint32 date, uint32 productId, uint32 price, uint32 confirmations);
    event PriceIndexUpdated(uint32 date, uint32 priceIndex);

    address public owner;

    struct PriceData {
        uint32 productId;
        uint32 price;
        // address user;
    }

    uint32 public totalItems;
    string public productDetailsCid;

    // Mapping of productId => quantity used for priceIndex calculation
    mapping(uint32 => uint32) public basket;

    // Mapping of productId => price derived from submissions
    mapping(uint32 => uint32) public prices;

    // Calculated price index as of lastUpdated
    uint32 public priceIndex = 0;

    // Currency used for all price submissions in this contract
    string public currency;

    mapping(uint32 => uint32[]) public submittedPrices;

    mapping(uint32 => mapping(uint32 => address[])) public submittedUsers;

    uint32 public currentDate;

    constructor(string memory _currency, uint32 _startDate, uint32 _totalItems, string memory _productDetailsCid) {
        owner = msg.sender;
        currency = _currency;
        currentDate = _startDate;
        totalItems = _totalItems;
        productDetailsCid = _productDetailsCid;
    }

    function updateProdcuts(uint32 _totalItems, string memory _productDetailsCid) public {
        require(_totalItems >= totalItems, "Cannot remove existing products");

        totalItems = _totalItems;
        productDetailsCid = _productDetailsCid;
    }

    function updateBasket(uint32[] memory quantities) public {
        require(msg.sender == owner, "Unauthorized");
        require(quantities.length == totalItems, "Should specify quantity for all items");

        for (uint32 i = 0; i < totalItems; i++) {
            basket[i] = quantities[i];
        }
    }

    function submitPrices(uint32 date, PriceData[] memory _prices) public {
        require(date == currentDate, "Passed date is not current date");

        for (uint32 i = 0; i < _prices.length; i++) {
            submittedPrices[_prices[i].productId].push(_prices[i].price);
            submittedUsers[_prices[i].productId][_prices[i].price].push(
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
        for (uint32 i = 0; i < totalItems; i++) {
            for (uint32 j = 0; j < submittedPrices[i].length; j++) {
                uint32 price = submittedPrices[i][j];

                priceOccurenses[price]++;

                if (priceOccurenses[price] > maxOccurenceCount) {
                    maxOccurenceCount = priceOccurenses[price];
                    mostCommonPrice = price;
                }

                submittedPrices[i][j] = 0;
            }

            if (mostCommonPrice != 0) {
                prices[i] = mostCommonPrice;
                emit PriceUpdated(currentDate, i, mostCommonPrice, maxOccurenceCount);

                for (uint32 k = 0; k < submittedUsers[i][mostCommonPrice].length; k++) {
                    validSubmitters.push(submittedUsers[i][mostCommonPrice][k]);
                }

                totalValidPrice += mostCommonPrice;
            }
            
            delete submittedPrices[i];
            mostCommonPrice = 0;
            maxOccurenceCount = 0;
        }

        // Calculate price index
        uint32 totalPrice = 0;
        for (uint32 i = 0; i < totalItems; i++) {
            totalPrice += basket[i] * prices[i];
        }
        priceIndex = totalPrice;
        emit PriceIndexUpdated(currentDate, priceIndex);
        
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
