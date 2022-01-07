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

    // Mapping of itemId => quantity used for priceIndex calculation
    mapping(uint32 => uint32) public basket;

    // Mapping of itemId => price derived from submissions
    mapping(uint32 => uint32) private prices;

    uint32 private lastUpdated;

    // Calculated price index as of lastUpdated
    uint32 private priceIndex = 0;

    // Currency used for all price submissions in this contract
    string private currency;

    mapping(uint32 => mapping(uint32 => address[])) public submissions;

    constructor(string memory _currency) {
        owner = msg.sender;
        currency = _currency;
        console.log("Deploying Stable protocol");
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
        for (uint32 i = 0; i < _prices.length; i++) {
            submissions[_prices[i].itemId][_prices[i].price].push(msg.sender);
        }
    }
}
