// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title INothingToken
 * @dev Interface for the NothingToken contract
 */
interface INothingToken {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title NothingApp
 * @dev Main contract for The Nothing App
 * Handles user onboarding and token economics
 */
contract NothingApp {
    // Token contract
    INothingToken public nothingToken;
    
    // Constants
    uint256 public constant INITIAL_MINT_AMOUNT = 100 * 10**18; // 100 NTH tokens
    uint256 public constant PRICE_INCREASE_PERCENTAGE = 2; // 2% price increase per mint
    
    // State variables
    uint256 public totalUsers;
    uint256 private currentPrice = 0.01 ether; // Initial token price in AVAX
    
    // Events
    event NewUserMinted(address indexed user, uint256 amount);
    event TokensSold(address indexed user, uint256 tokenAmount, uint256 avaxAmount);
    
    // Mapping to track users who have minted tokens
    mapping(address => bool) private userMinted;
    
    /**
     * @dev Constructor
     * @param tokenAddress_ Address of the NothingToken contract
     */
    constructor(address tokenAddress_) {
        nothingToken = INothingToken(tokenAddress_);
    }
    
    /**
     * @dev Check if a user has already minted tokens
     * @param user User address
     * @return bool True if user has tokens
     */
    function hasTokens(address user) external view returns (bool) {
        return userMinted[user];
    }
    
    /**
     * @dev Get the current token price
     * @return uint256 Current token price in AVAX
     */
    function getCurrentPrice() external view returns (uint256) {
        return currentPrice;
    }
    
    /**
     * @dev Mint tokens for a new user
     * @param user User address
     */
    function mintForNewUser(address user) external {
        require(!userMinted[user], "NothingApp: user already has tokens");
        
        // Mark user as minted
        userMinted[user] = true;
        totalUsers++;
        
        // Mint tokens to user
        nothingToken.mint(user, INITIAL_MINT_AMOUNT);
        
        // Increase token price
        currentPrice = currentPrice * (100 + PRICE_INCREASE_PERCENTAGE) / 100;
        
        emit NewUserMinted(user, INITIAL_MINT_AMOUNT);
    }
    
    /**
     * @dev Sell tokens for AVAX
     * @param tokenAmount Amount of tokens to sell
     */
    function sellTokens(uint256 tokenAmount) external {
        require(tokenAmount > 0, "NothingApp: amount must be greater than 0");
        require(nothingToken.balanceOf(msg.sender) >= tokenAmount, "NothingApp: insufficient token balance");
        
        // Calculate AVAX amount based on current price and token amount
        uint256 avaxAmount = (tokenAmount * currentPrice) / (100 * 10**18);
        require(address(this).balance >= avaxAmount, "NothingApp: insufficient AVAX balance");
        
        // Transfer tokens from user to contract and burn them
        nothingToken.transferFrom(msg.sender, address(this), tokenAmount);
        
        // Decrease price more significantly on sell (3% per sell)
        currentPrice = currentPrice * 97 / 100;
        
        // Send AVAX to user
        (bool success, ) = payable(msg.sender).call{value: avaxAmount}("");
        require(success, "NothingApp: AVAX transfer failed");
        
        emit TokensSold(msg.sender, tokenAmount, avaxAmount);
    }
    
    /**
     * @dev Receive function to accept AVAX
     */
    receive() external payable {}
}
