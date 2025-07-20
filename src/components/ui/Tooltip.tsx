'use client';

import { ReactNode, ReactElement, cloneElement } from 'react';
import Tippy, { TippyProps } from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/themes/translucent.css';
import { HelpCircle, Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface TooltipProps extends Omit<TippyProps, 'children'> {
  children: ReactElement;
  content: ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error' | 'help';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  interactive?: boolean;
  delay?: number | [number, number];
  maxWidth?: number;
}

export default function Tooltip({
  children,
  content,
  type = 'info',
  placement = 'top',
  interactive = false,
  delay = [200, 0],
  maxWidth = 300,
  ...props
}: TooltipProps) {
  const getTheme = () => {
    switch (type) {
      case 'warning':
        return 'light';
      case 'error':
        return 'light';
      case 'success':
        return 'light';
      default:
        return 'translucent';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500 mr-2" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500 mr-2" />;
      case 'help':
        return <HelpCircle className="w-4 h-4 text-blue-500 mr-2" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 mr-2" />;
    }
  };

  const tooltipContent = (
    <div className="flex items-start p-2 text-sm">
      {getIcon()}
      <div className="flex-1">{content}</div>
    </div>
  );

  return (
    <Tippy
      content={tooltipContent}
      placement={placement}
      theme={getTheme()}
      interactive={interactive}
      delay={delay}
      maxWidth={maxWidth}
      arrow={true}
      {...props}
    >
      {children}
    </Tippy>
  );
}

// Predefined tooltip components for common use cases
export function InfoTooltip({ children, content, ...props }: Omit<TooltipProps, 'type'>) {
  return (
    <Tooltip type="info" content={content} {...props}>
      {children}
    </Tooltip>
  );
}

export function HelpTooltip({ children, content, ...props }: Omit<TooltipProps, 'type'>) {
  return (
    <Tooltip type="help" content={content} {...props}>
      {children}
    </Tooltip>
  );
}

export function WarningTooltip({ children, content, ...props }: Omit<TooltipProps, 'type'>) {
  return (
    <Tooltip type="warning" content={content} {...props}>
      {children}
    </Tooltip>
  );
}

// Icon with tooltip for self-explanatory UI elements
interface IconWithTooltipProps {
  icon: ReactNode;
  tooltip: ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error' | 'help';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconWithTooltip({
  icon,
  tooltip,
  type = 'info',
  size = 'md',
  className = ''
}: IconWithTooltipProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Tooltip content={tooltip} type={type}>
      <div className={`inline-flex items-center justify-center cursor-help ${sizeClasses[size]} ${className}`}>
        {icon}
      </div>
    </Tooltip>
  );
}

// Common investment-related tooltips
export const InvestmentTooltips = {
  ExpectedReturn: ({ children }: { children: ReactElement }) => (
    <HelpTooltip
      content={
        <div>
          <div className="font-semibold mb-1">Expected Annual Return</div>
          <div>Projected yearly return based on property valuation and rental income. 
          Returns are not guaranteed and actual performance may vary.</div>
        </div>
      }
    >
      {children}
    </HelpTooltip>
  ),

  RiskLevel: ({ children, riskLevel }: { children: ReactElement; riskLevel: string }) => (
    <InfoTooltip
      content={
        <div>
          <div className="font-semibold mb-1">Risk Level: {riskLevel}</div>
          <div>
            {riskLevel === 'Low' && 'Stable properties with established rental income and low volatility.'}
            {riskLevel === 'Medium' && 'Balanced properties with moderate growth potential and manageable risk.'}
            {riskLevel === 'High' && 'Development projects or emerging markets with higher growth potential but increased risk.'}
          </div>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  ),

  MinimumInvestment: ({ children }: { children: ReactElement }) => (
    <InfoTooltip
      content="The smallest amount you can invest in this project. You can invest more than this minimum amount."
    >
      {children}
    </InfoTooltip>
  ),

  EscrowProtection: ({ children }: { children: ReactElement }) => (
    <InfoTooltip
      content={
        <div>
          <div className="font-semibold mb-1">Escrow Protection</div>
          <div>Your funds are held in a secure smart contract escrow until project milestones are completed. 
          This protects your investment and ensures funds are only released when progress is verified.</div>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  ),

  KYCRequired: ({ children }: { children: ReactElement }) => (
    <WarningTooltip
      content={
        <div>
          <div className="font-semibold mb-1">KYC Verification Required</div>
          <div>To invest in this project, you must complete our Know Your Customer (KYC) verification process. 
          This helps us comply with financial regulations and protect all investors.</div>
        </div>
      }
    >
      {children}
    </WarningTooltip>
  ),

  PropertyToken: ({ children }: { children: ReactElement }) => (
    <HelpTooltip
      content={
        <div>
          <div className="font-semibold mb-1">Digital Property Token</div>
          <div>Upon investment completion, you'll receive a blockchain-based property token representing 
          your ownership share. This token serves as a digital deed and can be used for future transactions.</div>
        </div>
      }
    >
      {children}
    </HelpTooltip>
  ),

  DividendDistribution: ({ children }: { children: ReactElement }) => (
    <InfoTooltip
      content={
        <div>
          <div className="font-semibold mb-1">Dividend Distribution</div>
          <div>Rental income and profits are distributed quarterly to token holders proportional to their ownership share. 
          Distributions are automated through smart contracts.</div>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  ),
};

// Form field tooltips
export const FormTooltips = {
  RequiredField: ({ children }: { children: ReactElement }) => (
    <WarningTooltip content="This field is required">
      {children}
    </WarningTooltip>
  ),

  SecureField: ({ children }: { children: ReactElement }) => (
    <InfoTooltip content="This information is encrypted and securely stored">
      {children}
    </InfoTooltip>
  ),

  PasswordStrength: ({ children, strength }: { children: ReactElement; strength: string }) => (
    <InfoTooltip
      content={
        <div>
          <div className="font-semibold mb-1">Password Strength: {strength}</div>
          <div>Use a combination of uppercase, lowercase, numbers, and special characters for better security.</div>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  ),
};