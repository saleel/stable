//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./StableToken.sol";
import "./SZRToken.sol";
import "./Stable.sol";

contract StableFactory is Ownable {
    SZRToken public szrToken;
    StableToken public stableToken;

    string[] public countries;
    mapping(string => address) public childContracts;
    mapping(string => uint8) public countryWeightage;
    uint32 public overCollateralizationRatio;
    string[] public productIds;
    string public priceAggregationMethod;
    uint8 public mininumPriceConfirmations;
    string public productDetailsCid;

    uint256 public aggregationRoundId; // Start date (timestamp) of the aggregation round
    uint32 public aggregationDuration = 1 days; // Hardcoded for now
    uint16 public aggregationRoundOverdueDuration = 3 hours; /// TODO: make it ocnfigurable
    uint16 public aggregationRewardAmount = 2;
    mapping(address => uint32) public aggregatorLockedAmounts;
    mapping(address => uint256) public aggregatorLockDates;
    mapping(address => uint16) public aggregationRoundsClaimed;
    mapping(address => uint32) public aggregatorRewards;
    uint32 public totalLockedAmount;
    address public currentAggregator;

    struct Supplier {
        string name;
        uint256 stablesRedeemable; // Total STABLES that supplier promised to redeem later
        uint256 stablesRedeemed; // Total STABLES that supplier redeemed to customers
        uint16 claimPercent; // Percentage of the SZR claimable
    }
    mapping(address => Supplier) public suppliers;
    uint256 public totalStablesRedeemable; // Current total Stables redeemable by all suppliers

    event AggregationRoundStarted(uint256 aggregationRoundId);
    event AggregationRoundCompleted(uint256 aggregationRoundId);
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
        uint256 _initialSZRSupply,
        uint32 _overCollateralizationRatio,
        string[] memory _productIds,
        string memory _productDetailsCid,
        string memory _priceAggregationMethod,
        uint8 _mininumPriceConfirmations
    ) {
        szrToken = new SZRToken();
        stableToken = new StableToken();
        overCollateralizationRatio = _overCollateralizationRatio;
        productIds = _productIds;
        productDetailsCid = _productDetailsCid;
        priceAggregationMethod = _priceAggregationMethod;
        mininumPriceConfirmations = _mininumPriceConfirmations;

        szrToken.mint(msg.sender, _initialSZRSupply);

        emit ProductDetailsUpdated(productDetailsCid);
        emit AggregationSettingsUpdated(
            priceAggregationMethod,
            mininumPriceConfirmations
        );
    }

    function createStable(
        string memory _country,
        string memory _currency,
        uint8 _countryWeightage,
        string[] memory _productIds,
        uint8[] memory _productWeightages
    ) public onlyOwner {
        Stable _stable = new Stable(
            _country,
            _currency,
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

    function updateOverCollateralizationRatio(uint8 _overCollateralizationRatio)
        public
        onlyOwner
    {
        overCollateralizationRatio = _overCollateralizationRatio;
    }

    // Lockup SZR and become aggregator
    function enrollAggregator(uint32 _amount) public {
        szrToken.transferFrom(msg.sender, address(this), _amount);
        aggregatorLockedAmounts[msg.sender] += _amount;
        aggregatorLockDates[msg.sender] = block.timestamp;
        totalLockedAmount += _amount;
    }

    // Claim aggregation rounds
    function claimNextAggregationRound() public {
        require(
            canClaimNextAggregationRound(msg.sender),
            "Agg. round not claimable"
        );

        for (uint8 i = 0; i < countries.length; i++) {
            Stable(childContracts[countries[i]]).setAggregator(msg.sender);
        }
        currentAggregator = msg.sender;
    }

    function completeAggregation() public {
        require(currentAggregator == msg.sender, "Not the aggregator");

        for (uint8 i = 0; i < countries.length; i++) {
            require(
                Stable(childContracts[countries[i]]).priceUpdatedForAggRound(),
                "All countries not updated"
            );
        }

        aggregationRoundsClaimed[msg.sender]++;
        emit AggregationRoundCompleted(aggregationRoundId);

        aggregationRoundId += aggregationDuration;
        for (uint8 i = 0; i < countries.length; i++) {
            Stable(childContracts[countries[i]]).updateAggregationRound(
                aggregationRoundId,
                aggregationRoundId + aggregationDuration
            );
        }

        emit AggregationRoundStarted(aggregationRoundId);

        aggregatorRewards[msg.sender] += aggregationRewardAmount;
    }

    function claimRewards(uint32 _amount) public {
        require(_amount >= aggregatorRewards[msg.sender], "Not enough balance");

        aggregatorRewards[msg.sender] -= _amount;
        szrToken.transferFrom(address(this), msg.sender, _amount);
    }

    function slashAggregator(address aggregator, uint32 _amount)
        public
        onlyOwner
    {
        aggregatorLockedAmounts[aggregator] -= _amount;
    }

    function isAggregationRoundOverdue() public view returns (bool) {
        if (
            block.timestamp - (aggregationRoundId + aggregationDuration) >
            aggregationRoundOverdueDuration
        ) {
            return true;
        }
        return false;
    }

    function canClaimNextAggregationRound(address aggregator)
        public
        view
        returns (bool)
    {
        // If current agg has not updated in due time, then any agg can claim
        if (
            isAggregationRoundOverdue() &&
            aggregatorLockedAmounts[aggregator] != 0
        ) {
            return true;
        }

        uint32 aggregatatorShare = aggregatorLockedAmounts[aggregator] /
            totalLockedAmount;
        uint32 totalAggregationRoundsSinceLock = uint32(
            aggregationRoundId / aggregationDuration
        );
        uint32 claimedShare = aggregationRoundsClaimed[aggregator] /
            totalAggregationRoundsSinceLock;

        return aggregatatorShare >= claimedShare;
    }

    function addSupplier(
        address _address,
        string memory _name,
        uint256 _stablesRedeemable,
        uint16 _claimPercent
    ) public onlyOwner {
        suppliers[_address] = Supplier({
            name: _name,
            stablesRedeemable: _stablesRedeemable,
            stablesRedeemed: 0,
            claimPercent: _claimPercent
        });
        totalStablesRedeemable += _stablesRedeemable;
    }

    function updateSupplierConfig(
        address _address,
        uint256 _stablesRedeemable,
        uint8 _claimPercent
    ) public onlyOwner {
        suppliers[_address].stablesRedeemable = _stablesRedeemable;
        suppliers[_address].claimPercent = _claimPercent;
    }

    // Exchange SZR for Stable
    function mintStable(uint32 _amount) public {
        // Ensure new minted amount is within mintable limit (backed by suppliers + over collateralizd)
        uint256 currentSupply = stableToken.totalSupply();
        require(
            (mintableStable() + _amount) > currentSupply,
            "No collateral to mint"
        );

        // Calculate required amount of SZR
        // To mint $1 worth of Stable, claim $1 worth of SZR
        uint256 equivalentSZR = (_amount * stablePrice()) / SZRPriceInUSD();

        // Stables minted that is not collaterazlied (redeeambled at supplier) is created out of nowhere,
        // SZR received for that is seigniorage - this should be burned
        uint256 collaterazlationRatio = totalStablesRedeemable / (currentSupply + _amount);
        uint256 szrToBurn = (1 - collaterazlationRatio) * equivalentSZR;

        // Burn and transfer required SZR
        szrToken.transferFrom(
            msg.sender,
            address(this),
            equivalentSZR - szrToBurn
        );
        szrToken.burn(msg.sender, szrToBurn);

        // Mint and transfer Stables
        stableToken.mint(msg.sender, _amount);
    }

    // Exchange Stable for SZR
    function burnStable(uint32 _amount) public {
        uint256 equivalentSZR = (_amount * stablePrice()) / SZRPriceInUSD();

        stableToken.burn(msg.sender, _amount);

        szrToken.mint(msg.sender, equivalentSZR);
    }

    function redeemStable(uint32 _amount, address supplier) public {
        suppliers[supplier].stablesRedeemed += _amount;
        totalStablesRedeemable -= _amount;

        // Burn that much stable from circulation
        // Mint equivalent SZR and add to contract
        burnStable(_amount);
    }

    // Supplier claim SZR
    function claimSZR(uint32 _amount) public {
        require(SZRClaimableBySupplier() >= _amount, "Not enough balance");

        szrToken.transferFrom(address(this), msg.sender, _amount);
    }

    function SZRPriceInUSD() public view returns (uint256) {
        // TODO: This should come from an Oracle (and cached in contract maybe)
        // Mocked for now to simulate price based on supply
        return 10000 / (szrToken.totalSupply() / 2);
    }

    function stablePrice() public view returns (uint256) {
        return 100 / globalPriceIndex();
    }

    // Get amount of SZR claimable by the supplier
    function SZRClaimableBySupplier() public view returns (uint256) {
        uint256 claimableStables = ((suppliers[msg.sender].stablesRedeemable *
            suppliers[msg.sender].claimPercent) / 100);

        return (claimableStables * stablePrice()) / SZRPriceInUSD();
    }

    function mintableStable() public view returns (uint256) {
        return totalStablesRedeemable * (1 + overCollateralizationRatio / 100);
    }

    function globalPriceIndex() public view returns (uint32) {
        uint32 weightedSum = 0;
        for (uint8 i = 0; i < countries.length; i++) {
            weightedSum += Stable(childContracts[countries[i]]).priceIndex();
        }

        return uint32(weightedSum / countries.length);
    }
}
