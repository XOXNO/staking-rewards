/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file ExportButton.tsx
 * @description Component for exporting epoch rewards data to Excel format
 * @module components/dashboard/ExportButton
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { useStaking } from '@/lib/context/StakingContext';
import { IEpochRewardData } from '@/api/types/xoxno-rewards.types';
import { shortenAddress } from '@/lib/utils/formatters';
import * as XLSX from 'xlsx';

interface IExportButtonProps {
  className?: string;
}

// Reuse the EpochRewardDataWithWallet type for data processing
interface EpochRewardDataWithWallet extends IEpochRewardData {
  walletAddress: string;
}

export const ExportButton: React.FC<IExportButtonProps> = ({ className }) => {
  const { state } = useStaking();
  const { selectedAddresses, rewardsData } = state;

  const exportToExcel = () => {
    // If no wallet selected, show an alert
    if (selectedAddresses.length === 0) {
      alert('Please select at least one wallet to export data');
      return;
    }

    // Prepare data for export
    const allProvidersData: Record<string, EpochRewardDataWithWallet[]> = {};
    const allProviderOwners: Record<string, string> = {};
    const providers: Set<string> = new Set();
    
    selectedAddresses.forEach(addr => {
      const response = rewardsData[addr];
      if (response?.providersFullRewardsData) {
        Object.entries(response.providersFullRewardsData).forEach(([pAddr, data]) => {
          providers.add(pAddr);
          if (!allProvidersData[pAddr]) allProvidersData[pAddr] = [];
          allProvidersData[pAddr].push(...data.map(epoch => ({ ...epoch, walletAddress: addr })));
        });
      }
      response?.providersWithIdentityInfo?.forEach(p => {
        if (!allProviderOwners[p.provider]) {
          allProviderOwners[p.provider] = p.owner;
        }
      });
    });

    // If no data found
    if (Object.keys(allProvidersData).length === 0) {
      alert('No data available for the selected wallets');
      return;
    }

    // Get the list of providers
    const providersList = Array.from(providers);
    
    // Create and download the Excel file
    createExcelExport(allProvidersData, providersList, selectedAddresses, allProviderOwners);
  };

  /**
   * Creates an Excel file with two sheets: rewards per epoch and summary by wallet/provider
   */
  const createExcelExport = (
    allProvidersData: Record<string, EpochRewardDataWithWallet[]>,
    providersList: string[],
    wallets: string[],
    allProviderOwners: Record<string, string>
  ) => {
    // Get current date for the filename
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // ------ SHEET 1: REWARDS PER EPOCH ------
    // Map to aggregate detailed data by epoch/wallet
    type RecordWithEpoch = Record<string, any> & { epoch: number, wallet: string };
    const epochWalletMap = new Map<string, RecordWithEpoch>();
    
    // Function to create a unique key for each epoch/wallet combination
    const getKey = (epoch: number, wallet: string) => `${epoch}-${wallet}`;
    
    // Group data by epoch/wallet and provider
    providersList.forEach(provider => {
      const data = allProvidersData[provider] || [];
      data.forEach(item => {
        const key = getKey(item.epoch, item.walletAddress);
        
        if (!epochWalletMap.has(key)) {
          epochWalletMap.set(key, {
            epoch: item.epoch,
            wallet: item.walletAddress,
          });
        }
        
        const record = epochWalletMap.get(key)!;
        // Add the total for this provider (user rewards + owner if applicable)
        const isOwner = item.walletAddress === allProviderOwners[provider];
        const totalReward = item.epochUserRewards + (isOwner ? item.ownerRewards : 0);
        record[provider] = (record[provider] || 0) + totalReward;
      });
    });
    
    // Create header for the detailed section with provider addresses shortened
    const detailedHeaders = ["Epoch", "Wallet", ...providersList.map(p => shortenAddress(p))];
    
    // Convert detailed data to Excel rows
    const detailedRows: (string | number)[][] = [];
    
    // Add header row
    detailedRows.push(detailedHeaders);
    
    // Get all epoch/wallet data
    const epochData = Array.from(epochWalletMap.values());
    
    // Sort by epoch and wallet
    epochData.sort((a, b) => {
      // Sort first by epoch
      if (a.epoch !== b.epoch) return a.epoch - b.epoch;
      
      // Then by wallet
      return a.wallet.localeCompare(b.wallet);
    });
    
    // Add data rows
    epochData.forEach(record => {
      const row: (string | number)[] = [
        record.epoch,
        record.wallet
      ];
      
      // Add rewards for each provider
      providersList.forEach(provider => {
        row.push(record[provider] || 0);
      });
      
      detailedRows.push(row);
    });
    
    // Create the worksheet for rewards per epoch
    const rewardsSheet = XLSX.utils.aoa_to_sheet(detailedRows);
    
    // Add sheet to workbook
    XLSX.utils.book_append_sheet(workbook, rewardsSheet, "Reward per epoch");
    
    // ------ SHEET 2: SUMMARY ------
    // Map to store totals by wallet and provider
    const walletProviderTotals: Record<string, Record<string, number>> = {};
    
    // Initialize the structure
    wallets.forEach(wallet => {
      walletProviderTotals[wallet] = {};
      providersList.forEach(provider => {
        walletProviderTotals[wallet][provider] = 0;
      });
    });
    
    // Calculate totals
    providersList.forEach(provider => {
      const data = allProvidersData[provider] || [];
      data.forEach(item => {
        if (wallets.includes(item.walletAddress)) {
          const isOwner = item.walletAddress === allProviderOwners[provider];
          const totalReward = item.epochUserRewards + (isOwner ? item.ownerRewards : 0);
          walletProviderTotals[item.walletAddress][provider] += totalReward;
        }
      });
    });
    
    // Create header for the summary
    const summaryHeaders = ["Wallet", ...providersList.map(p => shortenAddress(p)), "Total"];
    
    // Convert summary data to Excel rows
    const summaryRows: (string | number)[][] = [];
    
    // Add header row
    summaryRows.push(summaryHeaders);
    
    // Add data rows
    wallets.forEach(wallet => {
      const row: (string | number)[] = [wallet];
      
      // Calculate total for this wallet
      let walletTotal = 0;
      
      // Add rewards for each provider
      providersList.forEach(provider => {
        const value = walletProviderTotals[wallet][provider];
        row.push(value);
        walletTotal += value;
      });
      
      // Add the total
      row.push(walletTotal);
      
      summaryRows.push(row);
    });
    
    // Create the worksheet for summary
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    
    // Add sheet to workbook
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `staking-rewards-export-${formattedDate}.xlsx`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={exportToExcel}
      title="Export staking rewards data to Excel"
    >
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Export Excel
    </Button>
  );
};

export default ExportButton; 