// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title InvestmentEscrow
 * @dev Secure escrow contract for real estate investment funds
 */
contract InvestmentEscrow is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct EscrowDeposit {
        uint256 projectId;
        address investor;
        address projectManager;
        uint256 amount;
        address token; // address(0) for ETH
        EscrowStatus status;
        uint256 createdAt;
        uint256 releaseTime;
        uint256 disputeDeadline;
        string description;
    }
    
    enum EscrowStatus {
        PENDING,
        FUNDED,
        RELEASED,
        REFUNDED,
        DISPUTED,
        RESOLVED
    }
    
    struct Milestone {
        uint256 percentage;
        string description;
        bool completed;
        uint256 completedAt;
        uint256 votesFor;
        uint256 votesAgainst;
        mapping(address => bool) hasVoted;
    }
    
    struct Project {
        address projectManager;
        uint256 totalFunding;
        uint256 releasedFunding;
        uint256 targetAmount;
        uint256 investorCount;
        bool isActive;
        mapping(uint256 => Milestone) milestones;
        uint256 milestoneCount;
        address[] investors;
        mapping(address => uint256) investorBalances;
    }
    
    // Mappings
    mapping(uint256 => EscrowDeposit) public deposits;
    mapping(uint256 => Project) public projects;
    mapping(address => bool) public authorizedReleaser;
    mapping(uint256 => mapping(address => bool)) public isProjectInvestor;
    
    // State variables
    uint256 public nextDepositId = 1;
    uint256 public nextProjectId = 1;
    uint256 public disputeFee = 0.01 ether;
    address public disputeResolver;
    uint256 public constant VOTING_PERIOD = 7 days;
    
    // Events
    event DepositCreated(
        uint256 indexed depositId,
        uint256 indexed projectId,
        address indexed investor,
        uint256 amount,
        address token
    );
    
    event FundsReleased(
        uint256 indexed depositId,
        uint256 indexed projectId,
        address indexed recipient,
        uint256 amount
    );
    
    event FundsRefunded(
        uint256 indexed depositId,
        address indexed investor,
        uint256 amount
    );
    
    event DisputeCreated(
        uint256 indexed depositId,
        address indexed disputer,
        string reason
    );
    
    event MilestoneCompleted(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        uint256 releasedAmount
    );
    
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed projectManager,
        uint256 targetAmount
    );
    
    modifier onlyAuthorized() {
        require(
            authorizedReleaser[msg.sender] || msg.sender == owner(),
            "Not authorized to release funds"
        );
        _;
    }
    
    modifier validDeposit(uint256 depositId) {
        require(depositId < nextDepositId, "Invalid deposit ID");
        _;
    }
    
    modifier validProject(uint256 projectId) {
        require(projectId < nextProjectId, "Invalid project ID");
        require(projects[projectId].isActive, "Project not active");
        _;
    }
    
    constructor(address _disputeResolver) {
        disputeResolver = _disputeResolver;
    }
    
    /**
     * @dev Create a new project
     */
    function createProject(
        address projectManager,
        uint256 targetAmount,
        string[] memory milestoneDescriptions,
        uint256[] memory milestonePercentages
    ) external onlyOwner returns (uint256) {
        require(projectManager != address(0), "Invalid project manager");
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(
            milestoneDescriptions.length == milestonePercentages.length,
            "Mismatched milestone arrays"
        );
        
        uint256 projectId = nextProjectId++;
        Project storage project = projects[projectId];
        
        project.projectManager = projectManager;
        project.targetAmount = targetAmount;
        project.isActive = true;
        project.milestoneCount = milestoneDescriptions.length;
        
        // Set up milestones
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < milestoneDescriptions.length; i++) {
            require(milestonePercentages[i] > 0, "Invalid milestone percentage");
            totalPercentage += milestonePercentages[i];
            
            Milestone storage milestone = project.milestones[i];
            milestone.percentage = milestonePercentages[i];
            milestone.description = milestoneDescriptions[i];
        }
        
        require(totalPercentage == 100, "Milestone percentages must total 100%");
        
        emit ProjectCreated(projectId, projectManager, targetAmount);
        
        return projectId;
    }
    
    /**
     * @dev Create escrow deposit for investment
     */
    function createDeposit(
        uint256 projectId,
        address projectManager,
        uint256 releaseTime,
        string memory description,
        address token
    ) external payable validProject(projectId) nonReentrant whenNotPaused {
        require(projectManager != address(0), "Invalid project manager");
        require(releaseTime > block.timestamp, "Release time must be in future");
        
        uint256 amount;
        if (token == address(0)) {
            // ETH deposit
            require(msg.value > 0, "Must send ETH");
            amount = msg.value;
        } else {
            // ERC20 token deposit
            require(msg.value == 0, "Should not send ETH for token deposit");
            // Amount should be approved before calling this function
            // The actual transfer will happen in fundDeposit()
        }
        
        uint256 depositId = nextDepositId++;
        
        deposits[depositId] = EscrowDeposit({
            projectId: projectId,
            investor: msg.sender,
            projectManager: projectManager,
            amount: amount,
            token: token,
            status: EscrowStatus.PENDING,
            createdAt: block.timestamp,
            releaseTime: releaseTime,
            disputeDeadline: releaseTime + 30 days,
            description: description
        });
        
        // Add to project
        Project storage project = projects[projectId];
        if (!isProjectInvestor[projectId][msg.sender]) {
            project.investors.push(msg.sender);
            project.investorCount++;
            isProjectInvestor[projectId][msg.sender] = true;
        }
        
        emit DepositCreated(depositId, projectId, msg.sender, amount, token);
    }
    
    /**
     * @dev Fund an ERC20 token deposit (separate from creation for security)
     */
    function fundDeposit(uint256 depositId, uint256 amount) 
        external 
        validDeposit(depositId) 
        nonReentrant 
    {
        EscrowDeposit storage deposit = deposits[depositId];
        require(deposit.investor == msg.sender, "Not the investor");
        require(deposit.status == EscrowStatus.PENDING, "Deposit not pending");
        require(deposit.token != address(0), "Use ETH deposit creation instead");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens to escrow
        IERC20(deposit.token).safeTransferFrom(msg.sender, address(this), amount);
        
        deposit.amount = amount;
        deposit.status = EscrowStatus.FUNDED;
        
        // Update project balances
        Project storage project = projects[deposit.projectId];
        project.totalFunding += amount;
        project.investorBalances[msg.sender] += amount;
    }
    
    /**
     * @dev Complete milestone and release funds
     */
    function completeMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external validProject(projectId) onlyAuthorized {
        Project storage project = projects[projectId];
        require(milestoneId < project.milestoneCount, "Invalid milestone");
        
        Milestone storage milestone = project.milestones[milestoneId];
        require(!milestone.completed, "Milestone already completed");
        
        // Check if previous milestones are completed (if any)
        if (milestoneId > 0) {
            require(
                project.milestones[milestoneId - 1].completed,
                "Previous milestone not completed"
            );
        }
        
        milestone.completed = true;
        milestone.completedAt = block.timestamp;
        
        // Calculate release amount
        uint256 releaseAmount = (project.totalFunding * milestone.percentage) / 100;
        project.releasedFunding += releaseAmount;
        
        // Transfer funds to project manager
        if (releaseAmount > 0) {
            payable(project.projectManager).transfer(releaseAmount);
        }
        
        emit MilestoneCompleted(projectId, milestoneId, releaseAmount);
    }
    
    /**
     * @dev Vote on milestone completion (investor governance)
     */
    function voteOnMilestone(
        uint256 projectId,
        uint256 milestoneId,
        bool approve
    ) external validProject(projectId) {
        require(isProjectInvestor[projectId][msg.sender], "Not an investor");
        
        Project storage project = projects[projectId];
        require(milestoneId < project.milestoneCount, "Invalid milestone");
        
        Milestone storage milestone = project.milestones[milestoneId];
        require(!milestone.completed, "Milestone already completed");
        require(!milestone.hasVoted[msg.sender], "Already voted");
        
        milestone.hasVoted[msg.sender] = true;
        
        if (approve) {
            milestone.votesFor++;
        } else {
            milestone.votesAgainst++;
        }
        
        // Check if milestone is approved (simple majority)
        uint256 totalVotes = milestone.votesFor + milestone.votesAgainst;
        if (totalVotes >= (project.investorCount + 1) / 2) { // Majority
            if (milestone.votesFor > milestone.votesAgainst) {
                // Milestone approved - can be completed by authorized releaser
                // This just marks it as approved, actual completion happens in completeMilestone
            }
        }
    }
    
    /**
     * @dev Emergency release funds (only owner)
     */
    function emergencyRelease(uint256 depositId) 
        external 
        onlyOwner 
        validDeposit(depositId) 
        nonReentrant 
    {
        EscrowDeposit storage deposit = deposits[depositId];
        require(
            deposit.status == EscrowStatus.FUNDED || deposit.status == EscrowStatus.DISPUTED,
            "Invalid status for release"
        );
        
        deposit.status = EscrowStatus.RELEASED;
        
        // Release funds
        if (deposit.token == address(0)) {
            payable(deposit.projectManager).transfer(deposit.amount);
        } else {
            IERC20(deposit.token).safeTransfer(deposit.projectManager, deposit.amount);
        }
        
        emit FundsReleased(depositId, deposit.projectId, deposit.projectManager, deposit.amount);
    }
    
    /**
     * @dev Refund investor (before release time or in case of project failure)
     */
    function refundInvestor(uint256 depositId) 
        external 
        validDeposit(depositId) 
        nonReentrant 
    {
        EscrowDeposit storage deposit = deposits[depositId];
        require(
            msg.sender == deposit.investor || msg.sender == owner(),
            "Not authorized to refund"
        );
        require(deposit.status == EscrowStatus.FUNDED, "Invalid status for refund");
        require(
            block.timestamp < deposit.releaseTime || !projects[deposit.projectId].isActive,
            "Cannot refund after release time"
        );
        
        deposit.status = EscrowStatus.REFUNDED;
        
        // Refund funds
        if (deposit.token == address(0)) {
            payable(deposit.investor).transfer(deposit.amount);
        } else {
            IERC20(deposit.token).safeTransfer(deposit.investor, deposit.amount);
        }
        
        // Update project balances
        Project storage project = projects[deposit.projectId];
        project.totalFunding -= deposit.amount;
        project.investorBalances[deposit.investor] -= deposit.amount;
        
        emit FundsRefunded(depositId, deposit.investor, deposit.amount);
    }
    
    /**
     * @dev Create dispute
     */
    function createDispute(uint256 depositId, string memory reason) 
        external 
        payable 
        validDeposit(depositId) 
    {
        EscrowDeposit storage deposit = deposits[depositId];
        require(
            msg.sender == deposit.investor || msg.sender == deposit.projectManager,
            "Not authorized to dispute"
        );
        require(deposit.status == EscrowStatus.FUNDED, "Invalid status for dispute");
        require(block.timestamp <= deposit.disputeDeadline, "Dispute deadline passed");
        require(msg.value >= disputeFee, "Insufficient dispute fee");
        
        deposit.status = EscrowStatus.DISPUTED;
        
        emit DisputeCreated(depositId, msg.sender, reason);
    }
    
    /**
     * @dev Resolve dispute (only dispute resolver)
     */
    function resolveDispute(
        uint256 depositId,
        bool favorInvestor,
        uint256 investorAmount,
        uint256 projectManagerAmount
    ) external validDeposit(depositId) {
        require(msg.sender == disputeResolver, "Not authorized to resolve disputes");
        
        EscrowDeposit storage deposit = deposits[depositId];
        require(deposit.status == EscrowStatus.DISPUTED, "Not in dispute");
        require(
            investorAmount + projectManagerAmount <= deposit.amount,
            "Amounts exceed deposit"
        );
        
        deposit.status = EscrowStatus.RESOLVED;
        
        // Distribute funds based on resolution
        if (investorAmount > 0) {
            if (deposit.token == address(0)) {
                payable(deposit.investor).transfer(investorAmount);
            } else {
                IERC20(deposit.token).safeTransfer(deposit.investor, investorAmount);
            }
        }
        
        if (projectManagerAmount > 0) {
            if (deposit.token == address(0)) {
                payable(deposit.projectManager).transfer(projectManagerAmount);
            } else {
                IERC20(deposit.token).safeTransfer(deposit.projectManager, projectManagerAmount);
            }
        }
    }
    
    /**
     * @dev Add authorized releaser
     */
    function addAuthorizedReleaser(address releaser) external onlyOwner {
        authorizedReleaser[releaser] = true;
    }
    
    /**
     * @dev Remove authorized releaser
     */
    function removeAuthorizedReleaser(address releaser) external onlyOwner {
        authorizedReleaser[releaser] = false;
    }
    
    /**
     * @dev Set dispute fee
     */
    function setDisputeFee(uint256 _disputeFee) external onlyOwner {
        disputeFee = _disputeFee;
    }
    
    /**
     * @dev Get deposit details
     */
    function getDeposit(uint256 depositId) external view returns (
        uint256 projectId,
        address investor,
        address projectManager,
        uint256 amount,
        address token,
        EscrowStatus status,
        uint256 createdAt,
        uint256 releaseTime
    ) {
        EscrowDeposit memory deposit = deposits[depositId];
        return (
            deposit.projectId,
            deposit.investor,
            deposit.projectManager,
            deposit.amount,
            deposit.token,
            deposit.status,
            deposit.createdAt,
            deposit.releaseTime
        );
    }
    
    /**
     * @dev Get project investors
     */
    function getProjectInvestors(uint256 projectId) external view returns (address[] memory) {
        return projects[projectId].investors;
    }
    
    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}