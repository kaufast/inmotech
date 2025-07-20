/**
 * Escrow Management Service
 * Handles project funding, escrow release, and refund logic
 */

import prisma from '@/lib/prisma';
import { type PSPProvider } from '@/lib/payment/payment-service';
import { processRefund } from '@/lib/payment/payment-service';
import { sendProjectFundedEmail, sendRefundNotificationEmail } from '@/lib/sesClient';

export interface EscrowReleaseCondition {
  type: 'funding_target' | 'milestone' | 'date' | 'manual';
  value?: number | string | Date;
  description: string;
  isMet: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface EscrowReleaseRequest {
  projectId: string;
  amount: number;
  reason: string;
  requestedBy: string;
  conditions: EscrowReleaseCondition[];
  releaseType: 'partial' | 'full';
}

export interface ProjectFundingStatus {
  projectId: string;
  targetFunding: number;
  currentFunding: number;
  fundingProgress: number;
  totalInvestors: number;
  escrowBalance: number;
  status: 'open' | 'funded' | 'released' | 'refunding';
  daysRemaining: number;
  canRelease: boolean;
  releaseConditions: EscrowReleaseCondition[];
}

// ==================== ESCROW SERVICE CLASS ====================

export class EscrowService {
  
  // ==================== PROJECT FUNDING MANAGEMENT ====================

  async checkProjectFundingStatus(projectId: string): Promise<ProjectFundingStatus> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        investments: {
          where: { status: 'CONFIRMED' },
          select: {
            amount: true,
            userId: true
          }
        },
        escrowAccounts: {
          select: {
            balance: true,
            currency: true,
            status: true
          }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const confirmedInvestments = project.investments;
    const totalInvestors = new Set(confirmedInvestments.map(inv => inv.userId)).size;
    const currentFunding = confirmedInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const targetFunding = Number(project.targetFunding);
    const fundingProgress = (currentFunding / targetFunding) * 100;
    
    const escrowBalance = project.escrowAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    
    const daysRemaining = Math.max(0, Math.ceil((project.fundingDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    
    // Check release conditions
    const releaseConditions = await this.checkReleaseConditions(project);
    const canRelease = releaseConditions.every(condition => condition.isMet);

    let status: 'open' | 'funded' | 'released' | 'refunding' = 'open';
    if (project.status === 'FUNDING_COMPLETE') {
      status = 'funded';
    } else if (project.status === 'IN_PROGRESS') {
      status = 'released';
    } else if (project.status === 'CANCELLED' || project.status === 'FAILED') {
      status = 'refunding';
    }

    return {
      projectId,
      targetFunding,
      currentFunding,
      fundingProgress: Math.min(100, fundingProgress),
      totalInvestors,
      escrowBalance,
      status,
      daysRemaining,
      canRelease,
      releaseConditions
    };
  }

  async processProjectFundingCompletion(projectId: string): Promise<void> {
    const fundingStatus = await this.checkProjectFundingStatus(projectId);
    
    if (fundingStatus.fundingProgress < 100) {
      throw new Error('Project funding target not reached');
    }

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'FUNDING_COMPLETE',
        updatedAt: new Date()
      }
    });

    // Notify project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (project?.owner) {
      await sendProjectFundedEmail(
        project.owner.email,
        project.owner.firstName || 'Developer',
        project.title,
        fundingStatus.currentFunding
      );
    }

    // Log funding completion
    await prisma.auditLog.create({
      data: {
        action: 'PROJECT_FUNDING_COMPLETED',
        resource: 'PROJECT',
        resourceId: projectId,
        details: JSON.stringify({
          targetFunding: fundingStatus.targetFunding,
          actualFunding: fundingStatus.currentFunding,
          totalInvestors: fundingStatus.totalInvestors,
          escrowBalance: fundingStatus.escrowBalance
        }),
        severity: 'INFO'
      }
    });

    // Schedule escrow release evaluation
    await this.scheduleEscrowReleaseEvaluation(projectId);
  }

  // ==================== ESCROW RELEASE LOGIC ====================

  async requestEscrowRelease(request: EscrowReleaseRequest): Promise<{success: boolean, releaseId?: string, error?: string}> {
    try {
      // Validate release conditions
      const unmetConditions = request.conditions.filter(condition => !condition.isMet);
      if (unmetConditions.length > 0) {
        return {
          success: false,
          error: `Release conditions not met: ${unmetConditions.map(c => c.description).join(', ')}`
        };
      }

      // Get project and escrow details
      const project = await prisma.project.findUnique({
        where: { id: request.projectId },
        include: {
          escrowAccounts: true,
          owner: true
        }
      });

      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      const totalEscrowBalance = project.escrowAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
      
      if (request.amount > totalEscrowBalance) {
        return { success: false, error: 'Insufficient escrow balance' };
      }

      // Create escrow release record
      const releaseRecord = await prisma.auditLog.create({
        data: {
          userId: request.requestedBy,
          action: 'ESCROW_RELEASE_REQUESTED',
          resource: 'PROJECT',
          resourceId: request.projectId,
          details: JSON.stringify({
            amount: request.amount,
            reason: request.reason,
            releaseType: request.releaseType,
            conditions: request.conditions,
            escrowBalance: totalEscrowBalance
          }),
          severity: 'INFO'
        }
      });

      // Execute the release based on PSP provider
      const releaseResult = await this.executeEscrowRelease(project, request.amount, request.reason);
      
      if (!releaseResult.success) {
        return { success: false, error: releaseResult.error };
      }

      // Update escrow balances
      await this.updateEscrowBalances(project.escrowAccounts, request.amount);

      // Update project status if full release
      if (request.releaseType === 'full') {
        await prisma.project.update({
          where: { id: request.projectId },
          data: {
            status: 'IN_PROGRESS',
            updatedAt: new Date()
          }
        });
      }

      // Log successful release
      await prisma.auditLog.create({
        data: {
          userId: request.requestedBy,
          action: 'ESCROW_RELEASED',
          resource: 'PROJECT',
          resourceId: request.projectId,
          details: JSON.stringify({
            amount: request.amount,
            releaseId: releaseResult.releaseId,
            pspProvider: releaseResult.provider,
            remainingBalance: totalEscrowBalance - request.amount
          }),
          severity: 'INFO'
        }
      });

      return {
        success: true,
        releaseId: releaseResult.releaseId
      };

    } catch (error) {
      console.error('Escrow release failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeEscrowRelease(project: any, amount: number, reason: string): Promise<{
    success: boolean;
    releaseId?: string;
    provider?: PSPProvider;
    error?: string;
  }> {
    const escrowAccount = project.escrowAccounts[0]; // Assuming primary account
    
    if (!escrowAccount) {
      return { success: false, error: 'No escrow account found' };
    }

    // Implementation would depend on PSP provider
    switch (escrowAccount.pspProvider) {
      case 'LEMONWAY':
        return await this.releaseLemonwayEscrow(escrowAccount, project.owner, amount, reason);
      case 'OPENPAY':
        return await this.releaseOpenPayEscrow(escrowAccount, project.owner, amount, reason);
      default:
        // Mock release for development
        return {
          success: true,
          releaseId: `mock_release_${Date.now()}`,
          provider: 'MOCK'
        };
    }
  }

  private async releaseLemonwayEscrow(escrowAccount: any, projectOwner: any, amount: number, reason: string) {
    // Lemonway MoneyOut implementation
    const lemonwayConfig = {
      apiLogin: process.env.LEMONWAY_API_LOGIN!,
      apiPassword: process.env.LEMONWAY_API_PASSWORD!,
      environment: process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox'
    };

    const baseUrl = lemonwayConfig.environment === 'prod'
      ? 'https://ws.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx'
      : 'https://sandbox-api.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx';

    try {
      const response = await fetch(`${baseUrl}/MoneyOut`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${lemonwayConfig.apiLogin}:${lemonwayConfig.apiPassword}`).toString('base64')}`
        },
        body: JSON.stringify({
          wallet: escrowAccount.accountNumber,
          amountTot: amount.toString(),
          message: reason,
          ibanId: projectOwner.bankAccount || 'default' // Would need bank account setup
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          releaseId: result.d.TRANS.ID,
          provider: 'LEMONWAY' as PSPProvider
        };
      } else {
        return {
          success: false,
          error: result.message || 'Lemonway release failed'
        };
      }

    } catch (error) {
      console.error('Lemonway escrow release failed:', error);
      return {
        success: false,
        error: 'Failed to process Lemonway release'
      };
    }
  }

  private async releaseOpenPayEscrow(escrowAccount: any, projectOwner: any, amount: number, reason: string) {
    // OpenPay payout implementation
    const openPayConfig = {
      merchantId: process.env.OPENPAY_MERCHANT_ID!,
      privateKey: process.env.OPENPAY_PRIVATE_KEY!,
      sandbox: process.env.NODE_ENV !== 'production'
    };

    const baseUrl = openPayConfig.sandbox 
      ? 'https://sandbox-api.openpay.mx/v1'
      : 'https://api.openpay.mx/v1';

    try {
      const response = await fetch(`${baseUrl}/${openPayConfig.merchantId}/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${openPayConfig.privateKey}:`).toString('base64')}`
        },
        body: JSON.stringify({
          method: 'bank_account',
          amount: amount,
          description: reason,
          order_id: `escrow_release_${Date.now()}`,
          bank_account: projectOwner.bankAccount || {} // Would need bank account setup
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          releaseId: result.id,
          provider: 'OPENPAY' as PSPProvider
        };
      } else {
        return {
          success: false,
          error: result.description || 'OpenPay release failed'
        };
      }

    } catch (error) {
      console.error('OpenPay escrow release failed:', error);
      return {
        success: false,
        error: 'Failed to process OpenPay release'
      };
    }
  }

  // ==================== REFUND PROCESSING ====================

  async processProjectRefunds(projectId: string, reason: string): Promise<{success: boolean, refundResults: Array<{investmentId: string, success: boolean, error?: string}>}> {
    // Get all confirmed investments for the project
    const investments = await prisma.investment.findMany({
      where: {
        projectId,
        status: 'CONFIRMED'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        payments: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 1
        }
      }
    });

    const refundResults = [];

    for (const investment of investments) {
      try {
        const payment = investment.payments[0];
        if (!payment) {
          refundResults.push({
            investmentId: investment.id,
            success: false,
            error: 'No completed payment found'
          });
          continue;
        }

        // Process refund through PSP
        const refundResult = await processRefund(
          payment.pspTransactionId || '',
          Number(investment.amount),
          reason
        );

        if (refundResult.success) {
          // Update investment status
          await prisma.investment.update({
            where: { id: investment.id },
            data: {
              status: 'REFUNDED',
              refundedAt: new Date()
            }
          });

          // Create refund record
          await prisma.refund.create({
            data: {
              paymentId: payment.id,
              amount: investment.amount,
              reason,
              status: 'COMPLETED',
              pspRefundId: refundResult.refundId,
              processedAt: new Date()
            }
          });

          // Send refund notification
          await sendRefundNotificationEmail(
            investment.user.email,
            investment.user.firstName || 'Investor',
            Number(investment.amount),
            reason
          );

          refundResults.push({
            investmentId: investment.id,
            success: true
          });

        } else {
          refundResults.push({
            investmentId: investment.id,
            success: false,
            error: refundResult.error
          });
        }

      } catch (error) {
        console.error(`Failed to process refund for investment ${investment.id}:`, error);
        refundResults.push({
          investmentId: investment.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    // Log refund processing
    await prisma.auditLog.create({
      data: {
        action: 'PROJECT_REFUNDS_PROCESSED',
        resource: 'PROJECT',
        resourceId: projectId,
        details: JSON.stringify({
          reason,
          totalInvestments: investments.length,
          successfulRefunds: refundResults.filter(r => r.success).length,
          failedRefunds: refundResults.filter(r => !r.success).length
        }),
        severity: 'WARN'
      }
    });

    const allSuccessful = refundResults.every(result => result.success);

    return {
      success: allSuccessful,
      refundResults
    };
  }

  // ==================== RELEASE CONDITIONS ====================

  private async checkReleaseConditions(project: any): Promise<EscrowReleaseCondition[]> {
    const conditions: EscrowReleaseCondition[] = [];

    // Funding target condition
    const fundingProgress = (Number(project.currentFunding) / Number(project.targetFunding)) * 100;
    conditions.push({
      type: 'funding_target',
      value: 100,
      description: 'Project funding target must be reached',
      isMet: fundingProgress >= 100,
      verifiedAt: fundingProgress >= 100 ? new Date() : undefined
    });

    // Funding deadline condition
    const isDeadlinePassed = project.fundingDeadline < new Date();
    conditions.push({
      type: 'date',
      value: project.fundingDeadline,
      description: 'Funding deadline must be reached',
      isMet: isDeadlinePassed,
      verifiedAt: isDeadlinePassed ? project.fundingDeadline : undefined
    });

    // Regulatory approval condition (if required)
    if (project.regulatoryApproval !== null) {
      conditions.push({
        type: 'manual',
        description: 'Regulatory approval must be obtained',
        isMet: project.regulatoryApproval === true,
        verifiedAt: project.regulatoryApproval ? new Date() : undefined
      });
    }

    return conditions;
  }

  private async scheduleEscrowReleaseEvaluation(projectId: string): Promise<void> {
    // This would typically integrate with a job queue system
    // For now, just log the scheduling
    
    await prisma.auditLog.create({
      data: {
        action: 'ESCROW_RELEASE_SCHEDULED',
        resource: 'PROJECT',
        resourceId: projectId,
        details: JSON.stringify({
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          reason: 'Automatic evaluation after funding completion'
        }),
        severity: 'INFO'
      }
    });

    // TODO: Integrate with job queue (Bull, Agenda, etc.)
    // TODO: Schedule automatic release evaluation
  }

  private async updateEscrowBalances(escrowAccounts: any[], releasedAmount: number): Promise<void> {
    let remainingAmount = releasedAmount;

    for (const account of escrowAccounts) {
      if (remainingAmount <= 0) break;

      const accountBalance = Number(account.balance);
      const deductAmount = Math.min(accountBalance, remainingAmount);

      await prisma.escrowAccount.update({
        where: { id: account.id },
        data: {
          balance: accountBalance - deductAmount
        }
      });

      // Create escrow entry for the release
      await prisma.escrowEntry.create({
        data: {
          escrowAccountId: account.id,
          paymentId: '', // Would link to payout record
          entryType: 'RELEASE',
          amount: deductAmount,
          description: `Escrow release: ${deductAmount}`,
          processingDate: new Date()
        }
      });

      remainingAmount -= deductAmount;
    }
  }
}

// ==================== SINGLETON INSTANCE ====================

export const escrowService = new EscrowService();