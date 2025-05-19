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
   * Creates an Excel file with rewards data in both EGLD and USD
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

    // Function to create sheets for a specific currency mode
    const createCurrencySheets = (currencyMode: 'egld' | 'usd') => {
      // ------ SHEET: REWARDS PER EPOCH ------
      type RecordWithEpoch = Record<string, any> & { epoch: number, wallet: string };
      const epochWalletMap = new Map<string, RecordWithEpoch>();
      
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
          const userReward = currencyMode === 'usd' ? (item.epochUserRewardsUsd || 0) : item.epochUserRewards;
          const ownerReward = currencyMode === 'usd' ? (item.epochOwnerRewardsUsd || 0) : item.ownerRewards;
          const totalReward = userReward + (isOwner ? ownerReward : 0);
          record[provider] = (record[provider] || 0) + totalReward;
        });
      });
      
      // Create headers
      const detailedHeaders = ["Epoch", "Wallet", ...providersList.map(p => shortenAddress(p))];
      const detailedRows: (string | number)[][] = [detailedHeaders];
      
      // Sort and add data rows
      const epochData = Array.from(epochWalletMap.values())
        .sort((a, b) => {
          if (a.epoch !== b.epoch) return a.epoch - b.epoch;
          return a.wallet.localeCompare(b.wallet);
        });
      
      epochData.forEach(record => {
        const row: (string | number)[] = [
          record.epoch,
          record.wallet,
          ...providersList.map(provider => record[provider] || 0)
        ];
        detailedRows.push(row);
      });
      
      // Create and add the rewards per epoch sheet
      const rewardsSheet = XLSX.utils.aoa_to_sheet(detailedRows);
      XLSX.utils.book_append_sheet(
        workbook, 
        rewardsSheet, 
        `Rewards per epoch (${currencyMode.toUpperCase()})`
      );
      
      // ------ SHEET: SUMMARY ------
      const walletProviderTotals: Record<string, Record<string, number>> = {};
      
      // Initialize totals structure
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
            const userReward = currencyMode === 'usd' ? (item.epochUserRewardsUsd || 0) : item.epochUserRewards;
            const ownerReward = currencyMode === 'usd' ? (item.epochOwnerRewardsUsd || 0) : item.ownerRewards;
            const totalReward = userReward + (isOwner ? ownerReward : 0);
            walletProviderTotals[item.walletAddress][provider] += totalReward;
          }
        });
      });
      
      // Create summary rows
      const summaryHeaders = ["Wallet", ...providersList.map(p => shortenAddress(p)), "Total"];
      const summaryRows: (string | number)[][] = [summaryHeaders];
      
      wallets.forEach(wallet => {
        const row: (string | number)[] = [
          wallet,
          ...providersList.map(provider => walletProviderTotals[wallet][provider]),
          Object.values(walletProviderTotals[wallet]).reduce((a, b) => a + b, 0)
        ];
        summaryRows.push(row);
      });
      
      // Create and add the summary sheet
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(
        workbook, 
        summarySheet, 
        `Summary (${currencyMode.toUpperCase()})`
      );
    };

    // Create sheets for both EGLD and USD
    createCurrencySheets('egld');
    createCurrencySheets('usd');
    
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