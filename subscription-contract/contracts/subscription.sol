// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/*
  Decentralized Subscription Contract (production-ready MVP)

  Key design:
  - Supports native token subscriptions (payable subscribe) and ERC20 token subscriptions.
  - Users must approve this contract to pull ERC20 tokens (approve(contractAddress, amount)).
  - Relayer service calls renewFor(user, planId) to attempt auto-renewals.
  - Owner can set treasury (where funds go) and the relayer address.
  - Uses SafeERC20 for token safety and ReentrancyGuard for protections.
*/

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Subscriptions is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // -- Structs
    struct Plan {
        address token;      // token address; address(0) == native (ETH/MATIC)
        uint256 price;      // price in smallest token unit (wei for native)
        uint256 duration;   // duration in seconds
        bool active;
    }

    struct SubscriptionInfo {
        uint256 expiry;     // timestamp when subscription expires
        bool active;
    }

    // -- Storage
    mapping(uint256 => Plan) public plans;
    uint256 public nextPlanId;

    // user => planId => SubscriptionInfo
    mapping(address => mapping(uint256 => SubscriptionInfo)) public subscriptions;

    address public treasury;   // where payments are forwarded (should be multisig)
    address public relayer;    // authorized relayer address for renewals

    // -- Events
    event PlanCreated(uint256 indexed planId, address indexed token, uint256 price, uint256 duration);
    event PlanUpdated(uint256 indexed planId, address indexed token, uint256 price, uint256 duration, bool active);
    event PlanToggled(uint256 indexed planId, bool active);

    event Subscribed(address indexed user, uint256 indexed planId, uint256 expiry, uint256 txValue);
    event Renewed(address indexed user, uint256 indexed planId, uint256 newExpiry, uint256 txValue);
    event Cancelled(address indexed user, uint256 indexed planId);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    // -- Modifiers
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer");
        _;
    }

    // -- Constructor
    constructor(address _treasury, address _relayer) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        relayer = _relayer;
    }

    // -----------------------
    // Admin functions
    // -----------------------
    function createPlan(address token, uint256 price, uint256 duration) external onlyOwner returns (uint256) {
        require(duration > 0, "Duration>0");
        plans[nextPlanId] = Plan({
            token: token,
            price: price,
            duration: duration,
            active: true
        });

        emit PlanCreated(nextPlanId, token, price, duration);
        nextPlanId++;
        return nextPlanId - 1;
    }

    function updatePlan(uint256 planId, address token, uint256 price, uint256 duration, bool active) external onlyOwner {
        require(planExists(planId), "Plan not exists");
        require(duration > 0, "Duration>0");
        Plan storage p = plans[planId];
        p.token = token;
        p.price = price;
        p.duration = duration;
        p.active = active;
        emit PlanUpdated(planId, token, price, duration, active);
    }

    function togglePlan(uint256 planId, bool active) external onlyOwner {
        require(planExists(planId), "Plan not exists");
        plans[planId].active = active;
        emit PlanToggled(planId, active);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        address old = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(old, _treasury);
    }

    function setRelayer(address _relayer) external onlyOwner {
        address old = relayer;
        relayer = _relayer;
        emit RelayerUpdated(old, _relayer);
    }

    // -----------------------
    // User functions
    // -----------------------

    /**
     * @notice Subscribe to a plan using native token (ETH/MATIC) when plan.token == address(0).
     * For ERC20 plans, use the ERC20 flow (approve contract then call subscribeERC20).
     */
    function subscribeNative(uint256 planId) external payable nonReentrant {
        require(planExists(planId), "Plan not exists");
        Plan storage p = plans[planId];
        require(p.active, "Plan not active");
        require(p.token == address(0), "Not native plan");
        require(msg.value == p.price, "Incorrect value");

        // forward funds immediately to treasury
        (bool sent, ) = treasury.call{value: msg.value}("");
        require(sent, "Transfer to treasury failed");

        _applySubscription(msg.sender, planId, p.duration);

        emit Subscribed(msg.sender, planId, subscriptions[msg.sender][planId].expiry, msg.value);
    }

    /**
     * @notice Subscribe to an ERC20 plan. User must approve this contract for `price` tokens prior to calling.
     */
    function subscribeERC20(uint256 planId) external nonReentrant {
        require(planExists(planId), "Plan not exists");
        Plan storage p = plans[planId];
        require(p.active, "Plan not active");
        require(p.token != address(0), "Not ERC20 plan");

        // pull tokens from caller to treasury
        IERC20 token = IERC20(p.token);
        uint256 amount = p.price;
        token.safeTransferFrom(msg.sender, treasury, amount);

        _applySubscription(msg.sender, planId, p.duration);

        emit Subscribed(msg.sender, planId, subscriptions[msg.sender][planId].expiry, amount);
    }

    /**
     * @notice Cancel user's subscription for a plan. Doesn't refund; only disables future renew checks.
     */
    function cancelSubscription(uint256 planId) external {
        SubscriptionInfo storage s = subscriptions[msg.sender][planId];
        require(s.active, "No active subscription");
        s.active = false;
        emit Cancelled(msg.sender, planId);
    }

    // -----------------------
    // Relayer functions (auto-renew)
    // -----------------------

    /**
     * @notice Renew subscription for `user` on behalf of relayer. 
     * Caller must be the authorized relayer. 
     * The contract will call transferFrom(user, treasury, price) - therefore user must have approved this contract.
     *
     * Note: For native plans (token == address(0)), auto renew isn't possible with this design.
     */
    function renewFor(address user, uint256 planId) external nonReentrant onlyRelayer {
        require(planExists(planId), "Plan not exists");
        Plan storage p = plans[planId];
        require(p.active, "Plan not active");
        require(p.token != address(0), "Cannot auto-renew native plan");

        // Attempt to pull tokens from user
        IERC20 token = IERC20(p.token);
        uint256 amount = p.price;
        token.safeTransferFrom(user, treasury, amount);

        _applySubscription(user, planId, p.duration);

        emit Renewed(user, planId, subscriptions[user][planId].expiry, amount);
    }

    // -----------------------
    // Views
    // -----------------------

    function subscriptionExpiry(address user, uint256 planId) external view returns (uint256) {
        return subscriptions[user][planId].expiry;
    }

    function isActive(address user, uint256 planId) external view returns (bool) {
        SubscriptionInfo memory s = subscriptions[user][planId];
        return s.active && s.expiry > block.timestamp;
    }

    function planExists(uint256 planId) public view returns (bool) {
        return planId < nextPlanId;
    }

    // -----------------------
    // Internal helpers
    // -----------------------
    function _applySubscription(address user, uint256 planId, uint256 duration) internal {
        SubscriptionInfo storage s = subscriptions[user][planId];
        uint256 newExpiry;
        if (s.active && s.expiry > block.timestamp) {
            // extend from existing expiry
            newExpiry = s.expiry + duration;
        } else {
            // start from now
            newExpiry = block.timestamp + duration;
            s.active = true;
        }
        s.expiry = newExpiry;
    }

    // -----------------------
    // Rescue functions (owner)
    // -----------------------

    /**
     * @notice Rescue ERC20 tokens stuck in contract (not expected in normal flow).
     */
    function rescueERC20(address tokenAddress, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid to");
        IERC20(tokenAddress).safeTransfer(to, amount);
    }

    /**
     * @notice Rescue native ETH/MATIC stuck in contract.
     */
    function rescueNative(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid to");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Transfer failed");
    }

    // -----------------------
    // Fallback
    // -----------------------
    // Reject plain transfers to contract to avoid locked funds (except subscribeNative which uses payable)
    receive() external payable {
        revert("Use subscribeNative");
    }

    fallback() external payable {
        revert("Use subscribeNative");
    }
}
