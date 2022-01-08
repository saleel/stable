//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Stable {
    address public owner;

    struct PriceData {
        uint32 itemId;
        uint32 price;
        // address user;
    }

    uint32 public totalItems;
    string public itemDetailsCid;

    // Mapping of itemId => quantity used for priceIndex calculation
    mapping(uint32 => uint32) public basket;

    // Mapping of itemId => price derived from submissions
    mapping(uint32 => uint32) public prices;

    uint32 private lastUpdated;

    // Calculated price index as of lastUpdated
    uint32 private priceIndex = 0;

    // Currency used for all price submissions in this contract
    string private currency;

    mapping(uint32 => uint32[]) public submittedPrices;

    mapping(uint32 => mapping(uint32 => address[])) public submittedUsers;

    uint32 public currentDate;

    constructor(string memory _currency, uint32 _currentDate, uint32 _totalItems, string memory _itemsCid) {
        owner = msg.sender;
        currency = _currency;
        currentDate = _currentDate;
        totalItems = _totalItems;
        itemDetailsCid = _itemsCid;
    }

    function setQuantities(uint32[] memory quantities) public {
        for (uint32 i = 0; i < quantities.length; i++) {
            basket[i] = quantities[i];
        }
    }

    function getBasketQuantity(uint32 itemId) public view returns (uint32) {
        return basket[itemId];
    }

    function submitPrices(uint32 date, PriceData[] memory _prices) public {
        require(date == currentDate, "Passed date is not current date");

        for (uint32 i = 0; i < _prices.length; i++) {
            submittedPrices[_prices[i].itemId].push(_prices[i].price);
            submittedUsers[_prices[i].itemId][_prices[i].price].push(
                msg.sender
            );
        }
    }

    mapping(uint32 => uint32) private priceOccurenses;
    uint32 private mostCommonPrice = 0;
    uint32 private maxOccurenceCount = 0;
    address[] public validSubmitters;
    uint32 private totalValidPrice = 0;

    function calculate() public returns (address) {
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

                for (uint32 k = 0; k < submittedUsers[i][mostCommonPrice].length; k++) {
                    validSubmitters.push(submittedUsers[i][mostCommonPrice][k]);
                }

                totalValidPrice += mostCommonPrice;
            }
            
            delete submittedPrices[i];
            mostCommonPrice = 0;
            maxOccurenceCount = 0;
        }

        address winner;
        
        if (validSubmitters.length > 0) {
          winner = validSubmitters[totalValidPrice % validSubmitters.length];
        }
        totalValidPrice = 0;

        return winner;
    }
}
