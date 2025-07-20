// Escrow service integration with smart contracts

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EscrowTransactionData {
  investmentId: string;
  amount: number;
  currency: string;
  paymentTransactionId: string;
}

interface EscrowResult {
  success: boolean;
  transactionId: string;
  blockchainTxHash?: string;
  error?: string;
}

class EscrowService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private escrowContract: ethers.Contract;
  private contractAddress: string;

  constructor() {
    // Initialize blockchain connection
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-key';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const privateKey = process.env.ESCROW_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ESCROW_PRIVATE_KEY not configured');
    }
    
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.contractAddress = process.env.ESCROW_CONTRACT_ADDRESS!;
    
    // ABI for the escrow contract (simplified)
    const escrowABI = [
      "function createDeposit(uint256 projectId, address projectManager, uint256 releaseTime, string description, address token) external payable returns (uint256)",
      "function fundDeposit(uint256 depositId, uint256 amount) external",
      "function completeMilestone(uint256 projectId, uint256 milestoneId) external",
      "function getDeposit(uint256 depositId) external view returns (uint256, address, address, uint256, address, uint8, uint256, uint256)",
      "event DepositCreated(uint256 indexed depositId, uint256 indexed projectId, address indexed investor, uint256 amount, address token)",
      "event MilestoneCompleted(uint256 indexed projectId, uint256 indexed milestoneId, uint256 releasedAmount)"
    ];
    
    this.escrowContract = new ethers.Contract(
      this.contractAddress,
      escrowABI,
      this.signer
    );
  }

  async createEscrowTransaction(data: EscrowTransactionData): Promise<EscrowResult> {
    try {
      // Get investment details
      const investment = await prisma.investment.findUnique({
        where: { id: data.investmentId },
        include: { project: true }
      });

      if (!investment || !investment.project) {
        throw new Error('Investment or project not found');
      }

      // Convert amount to Wei (assuming 18 decimals)
      const amountWei = ethers.parseEther(data.amount.toString());
      
      // Set release time (30 days from now as default)
      const releaseTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      
      // Create escrow deposit on blockchain
      const tx = await this.escrowContract.createDeposit(
        investment.project.id,
        investment.project.createdBy, // project manager address
        releaseTime,
        `Investment ${data.investmentId}`,
        ethers.ZeroAddress, // ETH deposit
        { 
          value: amountWei,
          gasLimit: 500000 
        }
      );

      const receipt = await tx.wait();
      
      // Extract deposit ID from event logs
      const depositCreatedEvent = receipt.logs.find(
        (log: any) => log.topics[0] === this.escrowContract.interface.getEvent('DepositCreated')?.topicHash
      );

      if (!depositCreatedEvent) {
        throw new Error('Failed to find deposit creation event');
      }

      const parsedLog = this.escrowContract.interface.parseLog(depositCreatedEvent);
      const depositId = parsedLog?.args[0];

      // Save escrow transaction record
      await prisma.escrowTransaction.create({
        data: {
          investmentId: data.investmentId,
          depositId: depositId.toString(),
          amount: data.amount,
          currency: data.currency,
          status: 'CREATED',
          blockchainTxHash: receipt.hash,
          releaseTime: new Date(releaseTime * 1000),
        }
      });

      return {
        success: true,
        transactionId: depositId.toString(),
        blockchainTxHash: receipt.hash,
      };

    } catch (error) {
      console.error('Escrow creation error:', error);
      return {
        success: false,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Escrow creation failed',
      };
    }
  }

  async releaseFunds(projectId: string, milestoneId: number): Promise<EscrowResult> {
    try {
      // Complete milestone on blockchain
      const tx = await this.escrowContract.completeMilestone(
        projectId,
        milestoneId,
        { gasLimit: 300000 }
      );

      const receipt = await tx.wait();

      // Update escrow transactions
      await prisma.escrowTransaction.updateMany({
        where: {
          investment: {
            projectId: projectId
          },
          status: 'CREATED'
        },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        }
      });

      return {
        success: true,
        transactionId: receipt.hash,
        blockchainTxHash: receipt.hash,
      };

    } catch (error) {
      console.error('Funds release error:', error);
      return {
        success: false,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Funds release failed',
      };
    }
  }

  async refundInvestor(depositId: string): Promise<EscrowResult> {
    try {
      // This would call the refund function on the smart contract
      const tx = await this.escrowContract.refundInvestor(depositId, {
        gasLimit: 200000
      });

      const receipt = await tx.wait();

      // Update database
      await prisma.escrowTransaction.updateMany({
        where: { depositId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        }
      });

      return {
        success: true,
        transactionId: receipt.hash,
        blockchainTxHash: receipt.hash,
      };

    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Refund failed',
      };
    }
  }

  async getEscrowStatus(depositId: string): Promise<{
    status: string;
    amount: string;
    releaseTime: Date;
    canRefund: boolean;
  }> {
    try {
      const depositInfo = await this.escrowContract.getDeposit(depositId);
      
      return {
        status: this.mapStatus(depositInfo[5]), // status enum
        amount: ethers.formatEther(depositInfo[3]), // amount
        releaseTime: new Date(Number(depositInfo[7]) * 1000), // releaseTime
        canRefund: Date.now() < (Number(depositInfo[7]) * 1000),
      };

    } catch (error) {
      console.error('Escrow status error:', error);
      throw new Error('Failed to get escrow status');
    }
  }

  private mapStatus(statusCode: number): string {
    const statuses = ['PENDING', 'FUNDED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'RESOLVED'];
    return statuses[statusCode] || 'UNKNOWN';
  }

  // Monitor blockchain events for escrow transactions
  async startEventMonitoring(): Promise<void> {
    this.escrowContract.on('DepositCreated', async (depositId, projectId, investor, amount, token, event) => {
      console.log('Escrow deposit created:', {
        depositId: depositId.toString(),
        projectId: projectId.toString(),
        investor,
        amount: ethers.formatEther(amount),
        blockHash: event.blockHash,
      });

      // Update database with event data
      await this.updateEscrowFromEvent(depositId.toString(), 'FUNDED');
    });

    this.escrowContract.on('MilestoneCompleted', async (projectId, milestoneId, releasedAmount, event) => {
      console.log('Milestone completed:', {
        projectId: projectId.toString(),
        milestoneId: milestoneId.toString(),
        releasedAmount: ethers.formatEther(releasedAmount),
      });

      // Update project milestones in database
      await this.updateProjectMilestone(projectId.toString(), milestoneId);
    });
  }

  private async updateEscrowFromEvent(depositId: string, status: string): Promise<void> {
    try {
      await prisma.escrowTransaction.updateMany({
        where: { depositId },
        data: { status }
      });
    } catch (error) {
      console.error('Failed to update escrow from event:', error);
    }
  }

  private async updateProjectMilestone(projectId: string, milestoneId: bigint): Promise<void> {
    try {
      // Update project milestone in database
      // This would depend on your project milestone schema
      console.log(`Updating milestone ${milestoneId} for project ${projectId}`);
    } catch (error) {
      console.error('Failed to update project milestone:', error);
    }
  }
}

export async function createEscrowTransaction(data: EscrowTransactionData): Promise<EscrowResult> {
  const escrowService = new EscrowService();
  return await escrowService.createEscrowTransaction(data);
}

export async function releaseEscrowFunds(projectId: string, milestoneId: number): Promise<EscrowResult> {
  const escrowService = new EscrowService();
  return await escrowService.releaseFunds(projectId, milestoneId);
}

export async function refundEscrowDeposit(depositId: string): Promise<EscrowResult> {
  const escrowService = new EscrowService();
  return await escrowService.refundInvestor(depositId);
}