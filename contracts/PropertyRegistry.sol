// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PropertyRegistry
 * @dev NFT-based property registry for real estate tokenization
 */
contract PropertyRegistry is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    struct Property {
        string title;
        string location;
        uint256 totalValue;
        uint256 totalShares;
        uint256 availableShares;
        address projectManager;
        string documentHash;
        PropertyStatus status;
        uint256 createdAt;
    }
    
    enum PropertyStatus {
        PENDING,
        ACTIVE,
        FUNDED,
        COMPLETED,
        CANCELLED
    }
    
    struct ShareOwnership {
        uint256 shares;
        uint256 purchasePrice;
        uint256 purchaseDate;
    }
    
    // Mappings
    mapping(uint256 => Property) public properties;
    mapping(uint256 => mapping(address => ShareOwnership)) public shareOwnership;
    mapping(uint256 => address[]) public propertyInvestors;
    mapping(address => bool) public authorizedManagers;
    
    // Events
    event PropertyCreated(
        uint256 indexed tokenId,
        string title,
        address indexed projectManager,
        uint256 totalValue,
        uint256 totalShares
    );
    
    event SharesPurchased(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 shares,
        uint256 price
    );
    
    event PropertyStatusUpdated(
        uint256 indexed tokenId,
        PropertyStatus oldStatus,
        PropertyStatus newStatus
    );
    
    event DividendsDistributed(
        uint256 indexed tokenId,
        uint256 totalAmount,
        uint256 perShare
    );
    
    modifier onlyAuthorized() {
        require(authorizedManagers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier validProperty(uint256 tokenId) {
        require(_exists(tokenId), "Property does not exist");
        _;
    }
    
    constructor() ERC721("InmoTech Property Registry", "IMPR") {}
    
    /**
     * @dev Create a new property token
     */
    function createProperty(
        string memory title,
        string memory location,
        uint256 totalValue,
        uint256 totalShares,
        address projectManager,
        string memory documentHash,
        string memory tokenURI
    ) external onlyAuthorized returns (uint256) {
        require(totalShares > 0, "Total shares must be greater than 0");
        require(totalValue > 0, "Total value must be greater than 0");
        require(projectManager != address(0), "Invalid project manager");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Mint NFT to project manager
        _mint(projectManager, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Create property record
        properties[newTokenId] = Property({
            title: title,
            location: location,
            totalValue: totalValue,
            totalShares: totalShares,
            availableShares: totalShares,
            projectManager: projectManager,
            documentHash: documentHash,
            status: PropertyStatus.ACTIVE,
            createdAt: block.timestamp
        });
        
        emit PropertyCreated(newTokenId, title, projectManager, totalValue, totalShares);
        
        return newTokenId;
    }
    
    /**
     * @dev Purchase shares in a property
     */
    function purchaseShares(
        uint256 tokenId,
        uint256 shares
    ) external payable validProperty(tokenId) nonReentrant {
        Property storage property = properties[tokenId];
        require(property.status == PropertyStatus.ACTIVE, "Property not available");
        require(shares > 0, "Shares must be greater than 0");
        require(shares <= property.availableShares, "Not enough shares available");
        
        uint256 pricePerShare = property.totalValue / property.totalShares;
        uint256 totalPrice = pricePerShare * shares;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Update share ownership
        if (shareOwnership[tokenId][msg.sender].shares == 0) {
            propertyInvestors[tokenId].push(msg.sender);
        }
        
        shareOwnership[tokenId][msg.sender].shares += shares;
        shareOwnership[tokenId][msg.sender].purchasePrice += totalPrice;
        shareOwnership[tokenId][msg.sender].purchaseDate = block.timestamp;
        
        // Update available shares
        property.availableShares -= shares;
        
        // Transfer payment to project manager
        payable(property.projectManager).transfer(totalPrice);
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        // Check if fully funded
        if (property.availableShares == 0) {
            property.status = PropertyStatus.FUNDED;
            emit PropertyStatusUpdated(tokenId, PropertyStatus.ACTIVE, PropertyStatus.FUNDED);
        }
        
        emit SharesPurchased(tokenId, msg.sender, shares, totalPrice);
    }
    
    /**
     * @dev Distribute dividends to shareholders
     */
    function distributeDividends(uint256 tokenId) external payable validProperty(tokenId) {
        Property storage property = properties[tokenId];
        require(msg.sender == property.projectManager, "Only project manager can distribute");
        require(msg.value > 0, "No dividends to distribute");
        
        uint256 fundedShares = property.totalShares - property.availableShares;
        require(fundedShares > 0, "No funded shares");
        
        uint256 dividendPerShare = msg.value / fundedShares;
        
        // Distribute to all investors
        address[] memory investors = propertyInvestors[tokenId];
        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 investorShares = shareOwnership[tokenId][investor].shares;
            if (investorShares > 0) {
                uint256 dividend = dividendPerShare * investorShares;
                payable(investor).transfer(dividend);
            }
        }
        
        emit DividendsDistributed(tokenId, msg.value, dividendPerShare);
    }
    
    /**
     * @dev Update property status
     */
    function updatePropertyStatus(
        uint256 tokenId,
        PropertyStatus newStatus
    ) external validProperty(tokenId) {
        Property storage property = properties[tokenId];
        require(
            msg.sender == property.projectManager || msg.sender == owner(),
            "Not authorized to update status"
        );
        
        PropertyStatus oldStatus = property.status;
        property.status = newStatus;
        
        emit PropertyStatusUpdated(tokenId, oldStatus, newStatus);
    }
    
    /**
     * @dev Add authorized manager
     */
    function addAuthorizedManager(address manager) external onlyOwner {
        authorizedManagers[manager] = true;
    }
    
    /**
     * @dev Remove authorized manager
     */
    function removeAuthorizedManager(address manager) external onlyOwner {
        authorizedManagers[manager] = false;
    }
    
    /**
     * @dev Get property investors
     */
    function getPropertyInvestors(uint256 tokenId) external view returns (address[] memory) {
        return propertyInvestors[tokenId];
    }
    
    /**
     * @dev Get investor share details
     */
    function getInvestorShares(
        uint256 tokenId,
        address investor
    ) external view returns (uint256 shares, uint256 purchasePrice, uint256 purchaseDate) {
        ShareOwnership memory ownership = shareOwnership[tokenId][investor];
        return (ownership.shares, ownership.purchasePrice, ownership.purchaseDate);
    }
    
    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}