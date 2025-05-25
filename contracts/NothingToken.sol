// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NothingToken
 * @dev ERC20 Token for The Nothing App
 */
contract NothingToken is ERC20, Ownable {
    // Token price in AVAX (wei)
    uint256 public currentPrice;
    
    // Track user registration
    mapping(address => bool) public registeredUsers;
    
    // Track tokens burned by each user
    mapping(address => uint256) public tokensBurnedByUser;
    
    // Track last activity timestamp
    mapping(address => uint256) public lastActivity;
    
    // Total user count
    uint256 public totalUsers;
    
    // Initial token allocation for new users
    uint256 public constant INITIAL_TOKEN_AMOUNT = 100 * 10**18; // 100 tokens with 18 decimals
    
    // Events
    event UserRegistered(address indexed user);
    event TokensBought(address indexed user, uint256 avaxAmount, uint256 tokenAmount);
    event TokensSold(address indexed user, uint256 tokenAmount, uint256 avaxAmount);
    event TokensBurned(address indexed user, uint256 amount);
    
    constructor() ERC20("Nothing Token", "NTH") Ownable(msg.sender) {
        // Initial price: 0.05 AVAX per token
        currentPrice = 5 * 10**16; // 0.05 AVAX in wei
    }
    
    /**
     * @dev Register a new user and mint initial tokens
     * @return success Whether the registration was successful
     */
    function registerUser() external returns (bool) {
        require(!registeredUsers[msg.sender], "User already registered");
        
        // Register user
        registeredUsers[msg.sender] = true;
        totalUsers++;
        
        // Mint initial tokens to the user
        _mint(msg.sender, INITIAL_TOKEN_AMOUNT);
        
        // Update last activity
        lastActivity[msg.sender] = block.timestamp;
        
        emit UserRegistered(msg.sender);
        return true;
    }
    
    /**
     * @dev Check if a user is registered
     * @param user Address to check
     * @return isRegistered Whether the user is registered
     */
    function isRegistered(address user) external view returns (bool) {
        return registeredUsers[user];
    }
    
    /**
     * @dev Buy tokens with AVAX
     * @return tokenAmount The amount of tokens bought
     */
    function buy() external payable returns (uint256) {
        require(msg.value > 0, "Must send AVAX to buy tokens");
        
        // Calculate token amount based on current price
        uint256 tokenAmount = (msg.value * 10**18) / currentPrice;
        
        // Mint tokens to the buyer
        _mint(msg.sender, tokenAmount);
        
        // Register user if not registered
        if (!registeredUsers[msg.sender]) {
            registeredUsers[msg.sender] = true;
            totalUsers++;
            emit UserRegistered(msg.sender);
        }
        
        // Update last activity
        lastActivity[msg.sender] = block.timestamp;
        
        emit TokensBought(msg.sender, msg.value, tokenAmount);
        return tokenAmount;
    }
    
    /**
     * @dev Sell tokens for AVAX
     * @param tokenAmount The amount of tokens to sell
     * @return avaxAmount The amount of AVAX received
     */
    function sell(uint256 tokenAmount) external returns (uint256) {
        require(tokenAmount > 0, "Amount must be greater than zero");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        // Calculate AVAX amount based on current price
        uint256 avaxAmount = (tokenAmount * currentPrice) / 10**18;
        
        // Ensure contract has enough AVAX
        require(address(this).balance >= avaxAmount, "Insufficient AVAX in contract");
        
        // Burn tokens from seller
        _burn(msg.sender, tokenAmount);
        
        // Send AVAX to seller
        (bool sent, ) = payable(msg.sender).call{value: avaxAmount}("");
        require(sent, "Failed to send AVAX");
        
        // Update last activity
        lastActivity[msg.sender] = block.timestamp;
        
        emit TokensSold(msg.sender, tokenAmount, avaxAmount);
        return avaxAmount;
    }
    
    /**
     * @dev Burn tokens
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient token balance");
        
        // Burn tokens
        _burn(msg.sender, amount);
        
        // Update tokens burned by user
        tokensBurnedByUser[msg.sender] += amount;
        
        // Update last activity
        lastActivity[msg.sender] = block.timestamp;
        
        // Adjust token price after burn (simplified mechanism)
        // In a real implementation, this would be more sophisticated
        uint256 totalSupply = totalSupply();
        if (totalSupply > 0) {
            // Small price increase based on burn amount and total supply
            uint256 priceIncreaseFactor = (amount * 10**18) / totalSupply;
            if (priceIncreaseFactor > 0) {
                currentPrice += (currentPrice * priceIncreaseFactor) / 10**18;
            }
        }
        
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Get tokens burned by a user
     * @param user The user address
     * @return amount The amount of tokens burned
     */
    function getTokensBurned(address user) external view returns (uint256) {
        return tokensBurnedByUser[user];
    }
    
    /**
     * @dev Get total user count
     * @return count The total number of users
     */
    function getTotalUsers() external view returns (uint256) {
        return totalUsers;
    }
    
    /**
     * @dev Get last activity timestamp for a user
     * @param user The user address
     * @return timestamp The last activity timestamp
     */
    function getLastActivity(address user) external view returns (uint256) {
        return lastActivity[user];
    }
    
    /**
     * @dev Get current token price in AVAX (wei)
     * @return price The current token price
     */
    function getCurrentPrice() external view returns (uint256) {
        return currentPrice;
    }
    
    /**
     * @dev Receive function to accept AVAX
     */
    receive() external payable {}
}