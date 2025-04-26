/**
 * @file page.tsx
 * @description Homepage for the Staking Rewards application, featuring wallet input.
 * @module app
 */

'use client';

import React, { useCallback, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { WalletInputForm } from '@/components/dashboard/WalletInputForm';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useStaking } from '@/lib/context/StakingContext';
import { ProviderSidebar } from '@/components/dashboard/ProviderSidebar';
import { ProviderDetailView } from '@/components/dashboard/ProviderDetailView';
import { GlobalDashboardView } from '@/components/dashboard/GlobalDashboardView';
import { shortenAddress } from '@/lib/utils/formatters';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from 'lucide-react';
import { aggregateAllEpochData, calculateGlobalStats } from '@/lib/utils/calculationUtils';

// Dynamically import LoadingAnimation with ssr: false
const LoadingAnimation = dynamic(
  () => import('@/components/ui/LoadingAnimation').then(mod => mod.LoadingAnimation),
  { ssr: false }
);

export default function HomePage(): React.ReactElement {
  const { state, fetchRewards, dispatch } = useStaking();
  const { activeAddress, rewardsData, isLoading, error, selectedProviderAddress } = state;
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAddressSubmit = useCallback(async (address: string): Promise<void> => {
    await fetchRewards(address);
    dispatch({ type: 'SELECT_PROVIDER', payload: { providerAddress: null } });
  }, [fetchRewards, dispatch]);

  const handleSelectProvider = useCallback((providerAddress: string | null) => {
    dispatch({ type: 'SELECT_PROVIDER', payload: { providerAddress } });
    setIsSheetOpen(false);
  }, [dispatch]);

  const handleSearchAnother = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_ADDRESS', payload: { address: null } });
    dispatch({ type: 'SELECT_PROVIDER', payload: { providerAddress: null } });
  }, [dispatch]);

  const currentRewardsResponse = activeAddress ? rewardsData[activeAddress] : null;
  const providers = currentRewardsResponse?.providersWithIdentityInfo;

  const { globalStats, aggregatedEpochData } = useMemo(() => {
    if (!activeAddress || !currentRewardsResponse?.providersFullRewardsData || !providers) {
      return { globalStats: null, aggregatedEpochData: [] };
    }

    const providerOwners: Record<string, string> = (providers ?? []).reduce((acc, p) => {
      acc[p.provider] = p.owner;
      return acc;
    }, {} as Record<string, string>);

    const aggData = aggregateAllEpochData(
      currentRewardsResponse.providersFullRewardsData,
      providerOwners,
      activeAddress
    );
    const stats = calculateGlobalStats(aggData);

    return { globalStats: stats, aggregatedEpochData: aggData };

  }, [activeAddress, currentRewardsResponse, providers]);

  let mainContent: React.ReactNode;
  if (!activeAddress || error) {
    mainContent = (
        <div className="flex flex-1 flex-col items-center justify-center p-4">
           {error && !isLoading && (
               <div className="mb-8 text-center text-destructive z-10">
                  <p className="text-lg mb-2">Error: {typeof error === 'string' ? error : error?.message || 'An unknown error occurred.'}</p>
               </div>
            )}
           <div className="w-full max-w-lg text-center mb-12 z-10">
               <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-primary">
                   View Your Rewards
               </h2>
               <p className="text-lg text-muted-foreground">
                   Enter your wallet address below to see a unified view of your staking history.
               </p>
           </div>
            <WalletInputForm onSubmit={handleAddressSubmit} className="mb-8 z-10" />
            {isLoading && (
               <LoadingAnimation 
                   message="Fetching rewards data..."
                   className="mt-8 z-10"
               />
            )}
        </div>
    );
  } else if (isLoading) {
      mainContent = (
          <div className="flex flex-1 items-center justify-center">
            <LoadingAnimation 
                message={`Fetching rewards data for ${shortenAddress(activeAddress)}...`}
            />
          </div>
      );
  } else if (currentRewardsResponse) {
      mainContent = (
           <div className="flex flex-1 overflow-hidden">
               <aside className="w-64 hidden md:block flex-shrink-0 border-r border-border/50 overflow-y-auto">
                   <ProviderSidebar
                       providers={providers}
                       selectedProviderAddress={selectedProviderAddress}
                       onSelectProvider={handleSelectProvider}
                   />
               </aside>
               <div className="flex-1 overflow-y-auto bg-muted/30">
                   {selectedProviderAddress === null ? (
                       globalStats ? (
                           <GlobalDashboardView
                               globalStats={globalStats}
                               aggregatedEpochData={aggregatedEpochData}
                           />
                       ) : (
                           <div className="flex items-center justify-center h-full text-muted-foreground">
                               Calculating global overview...
                           </div>
                       )
                   ) : (
                       <ProviderDetailView
                           rewardsResponse={currentRewardsResponse}
                           selectedProviderAddress={selectedProviderAddress}
                           activeAddress={activeAddress}
                       />
                   )}
               </div>
           </div>
      );
  } else {
      mainContent = (
           <div className="flex flex-1 items-center justify-center text-muted-foreground">No data available.</div>
      );
  }

  return (
    <div className="flex flex-col h-screen">
       <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
         <div className="flex items-center gap-2">
             {activeAddress && currentRewardsResponse && (
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}> 
                      <SheetTrigger asChild className="md:hidden">
                          <Button variant="outline" size="icon">
                              <MenuIcon className="h-5 w-5" />
                              <span className="sr-only">Select Provider</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-72 flex flex-col p-0">
                           <SheetHeader className="p-4 border-b border-border/50 flex-shrink-0">
                              <SheetTitle className="text-lg font-semibold tracking-tight">
                                  Providers
                              </SheetTitle>
                           </SheetHeader>
                           <div className="flex-grow overflow-y-auto">
                               <ProviderSidebar
                                  providers={providers}
                                  selectedProviderAddress={selectedProviderAddress}
                                  onSelectProvider={handleSelectProvider} 
                                  onItemClick={() => setIsSheetOpen(false)}
                               />
                           </div>
                      </SheetContent>
                  </Sheet>
             )}
             <h1 className="text-lg font-semibold hidden md:block">Staking Rewards</h1>
         </div>

         <div className="flex items-center gap-2 md:gap-4">
             {activeAddress && (
                 <span className="text-sm text-muted-foreground hidden md:inline">
                     Wallet: {shortenAddress(activeAddress)}
                 </span>
             )}
             <ThemeToggle />
             {activeAddress && (
                  <Button variant="outline" size="sm" onClick={handleSearchAnother}>Search Another</Button>
             )}
         </div>
       </header>
       
       <main className="flex flex-1 overflow-hidden">
           {mainContent}
       </main>
    </div>
  );
}
