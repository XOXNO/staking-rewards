/**
 * @file page.tsx
 * @description Homepage for the Staking Rewards application, featuring wallet input.
 * @module app
 */

"use client";

import React, { useCallback, useState, useMemo } from "react";
import Link from "next/link";
import {
    Wallet, 
    BarChart3, 
    PieChart, 
    DatabaseZap, 
    CheckCircle, 
    TrendingUp,
    MenuIcon
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useStaking } from '@/lib/context/StakingContext';
import { ProviderSidebar } from '@/components/dashboard/ProviderSidebar';
import { ProviderDetailView } from '@/components/dashboard/ProviderDetailView';
import { GlobalDashboardView } from '@/components/dashboard/GlobalDashboardView';
import { WalletManagementBar } from '@/components/dashboard/WalletManagementBar';
import { shortenAddress } from '@/lib/utils/formatters';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  aggregateAllEpochData,
  calculateGlobalStats,
  aggregateEpochDataByWallet,
  aggregateStakingDataByWallet,
} from "@/lib/utils/calculationUtils";
import {
  IEpochRewardDataExtended,
  IProviderWithIdentity,
  IXoxnoUserRewardsResponse,
} from "@/api/types/xoxno-rewards.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddWalletForm } from "@/components/dashboard/WalletInputForm/WalletInputForm";
import { CHART_COLORS } from "@/lib/constants/chartColors";
import { getWalletColorMap } from "@/lib/utils/chartUtils";
import { FunLoadingMessages } from "@/components/ui/FunLoadingMessages";

export default function HomePage(): React.ReactElement {
  const { state, dispatch, selectProvider } = useStaking();
  const {
    addedAddresses,
    selectedAddresses,
    rewardsData,
    isLoading,
    error,
    selectedProviderAddress,
  } = state;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSelectProvider = useCallback(
    (providerAddress: string | null) => {
      selectProvider(providerAddress);
      setIsSheetOpen(false);
    },
    [selectProvider]
  );

  const handleSearchAnother = useCallback(() => {
    dispatch({ type: "SET_SELECTED_ADDRESSES", payload: { addresses: [] } });
  }, [dispatch]);

  const combinedProviders = useMemo(() => {
    const providersMap = new Map<string, IProviderWithIdentity>();
    selectedAddresses.forEach((addr) => {
      rewardsData[addr]?.providersWithIdentityInfo?.forEach((p) => {
        if (!providersMap.has(p.provider)) {
          providersMap.set(p.provider, p);
        }
      });
    });
    return Array.from(providersMap.values());
  }, [selectedAddresses, rewardsData]);
  const relevantRewardsData = useMemo(() => {
    return selectedAddresses.reduce((acc, addr) => {
      if (rewardsData[addr]) {
        acc[addr] = rewardsData[addr];
      }
      return acc;
    }, {} as Record<string, IXoxnoUserRewardsResponse | null>);
  }, [selectedAddresses, rewardsData]);

  const relevantLoadingStates = useMemo(() => {
    return selectedAddresses.reduce((acc, addr) => {
      acc[addr] = isLoading[addr] ?? false; // Default to false if undefined
      return acc;
    }, {} as Record<string, boolean>);
  }, [selectedAddresses, isLoading]);
  const {
    globalStats,
    aggregatedEpochData,
    epochWalletData,
    stakingData,
    walletColorMap,
  } = useMemo(() => {
    // Use the refined loading states
    const isLoadingAnySelected = selectedAddresses.some(
      (addr) => relevantLoadingStates[addr]
    );

    // Use the refined rewards data and loading states
    const hasDataForAllSelected = selectedAddresses.every(
      (addr) =>
        relevantRewardsData[addr] !== undefined && !relevantLoadingStates[addr]
    );

    // Wait until loading is complete for all selected addresses
    if (
      selectedAddresses.length === 0 ||
      isLoadingAnySelected ||
      !hasDataForAllSelected
    ) {
      // Return null/empty state while loading or if data isn't ready
      return {
        globalStats: null,
        aggregatedEpochData: [],
        epochWalletData: [],
        stakingData: [],
        walletColorMap: {},
        allProvidersData: {},
        allProviderOwners: {},
      };
    }

    // --- Proceed with calculation only if all data is ready ---
    const allProvidersData: Record<string, IEpochRewardDataExtended[]> = {};
    const allProviderOwners: Record<string, string> = {};
    let providerDataFound = false; // Flag to check if any data was processed

    selectedAddresses.forEach((addr) => {
      const response = relevantRewardsData[addr]; // Use filtered relevant data
      if (response?.providersFullRewardsData) {
        providerDataFound = true;
        Object.entries(response.providersFullRewardsData).forEach(
          ([pAddr, data]) => {
            if (!allProvidersData[pAddr]) allProvidersData[pAddr] = [];
            allProvidersData[pAddr].push(
              ...data.map((epoch) => ({ ...epoch, walletAddress: addr }))
            );
          }
        );
      }
      response?.providersWithIdentityInfo?.forEach((p) => {
        if (!allProviderOwners[p.provider]) {
          allProviderOwners[p.provider] = p.owner;
        }
      });
    });

    if (!providerDataFound) {
      return {
        globalStats: null,
        aggregatedEpochData: [],
        epochWalletData: [],
        stakingData: [],
        walletColorMap: {},
        allProvidersData: {},
        allProviderOwners: {},
      };
    }

    const aggData = aggregateAllEpochData(
      allProvidersData,
      allProviderOwners,
      selectedAddresses
    );
    const epochWalletData = aggregateEpochDataByWallet(
      allProvidersData,
      allProviderOwners,
      selectedAddresses
    );
    const stakingData = aggregateStakingDataByWallet(
      allProvidersData,
      allProviderOwners,
      selectedAddresses
    );
    const walletColorMap = getWalletColorMap(
      selectedAddresses,
      CHART_COLORS.categorical
    );
    const stats = calculateGlobalStats(aggData);

    return {
      globalStats: stats,
      aggregatedEpochData: aggData,
      epochWalletData,
      stakingData,
      walletColorMap,
      allProvidersData,
      allProviderOwners,
    };
  }, [selectedAddresses, relevantRewardsData, relevantLoadingStates]); // Use refined dependencies

  const isAnyLoading = selectedAddresses.some((addr) => isLoading[addr]);
  const anyError = selectedAddresses.find((addr) => error[addr]);

  const totalRewardsPerProvider: Record<string, number> = useMemo(() => {
    const totals: Record<string, number> = {};
    selectedAddresses.forEach((addr) => {
      const rewards = rewardsData[addr]?.totalRewardsPerProvider;
      if (rewards) {
        Object.entries(rewards).forEach(([provider, amount]) => {
          totals[provider] = (totals[provider] || 0) + amount;
        });
      }
    });
    return totals;
  }, [selectedAddresses, rewardsData]);

  let dashboardContent: React.ReactNode = null;

  if (addedAddresses.length > 0) {
    dashboardContent = (
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 hidden md:flex md:flex-col flex-shrink-0 border-r border-border/50">
          <div className="flex-grow overflow-y-auto">
            <ProviderSidebar
              providers={combinedProviders}
              selectedProviderAddress={selectedProviderAddress}
              onSelectProvider={handleSelectProvider}
              totalRewardsPerProvider={totalRewardsPerProvider}
              fullRewardsData={rewardsData}
              currentEpoch={selectedAddresses.reduce(
                (epoch, addr) => rewardsData[addr]?.currentEpoch ?? epoch,
                0
              )}
            />
          </div>
        </aside>
        <div className="flex-1 overflow-y-auto bg-muted/30">
          {selectedAddresses.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select wallets from the bar above to view data.
            </div>
          ) : anyError ? (
            <div className="flex flex-1 items-center justify-center text-destructive p-4 text-center">
              Error fetching data for {shortenAddress(anyError)}:{" "}
              {String(error[anyError])}
            </div>
          ) : selectedProviderAddress === null ? (
            globalStats ? (
              <GlobalDashboardView
                globalStats={globalStats}
                aggregatedEpochData={aggregatedEpochData}
                epochWalletData={epochWalletData}
                stakingData={stakingData}
                walletColorMap={walletColorMap}
                fullRewardsData={rewardsData}
                className="flex-grow"
                isLoading={isAnyLoading}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {isAnyLoading ? (
                  <FunLoadingMessages />
                ) : (
                  "No global data available for selected wallets."
                )}
              </div>
            )
          ) : selectedAddresses.some((addr) => rewardsData[addr]) ? (
            <ProviderDetailView
              selectedAddresses={selectedAddresses}
              fullRewardsData={rewardsData}
              selectedProviderAddress={selectedProviderAddress}
              currentEpoch={selectedAddresses.reduce(
                (epoch, addr) => rewardsData[addr]?.currentEpoch ?? epoch,
                0
              )}
              className="flex-grow"
              isLoading={isAnyLoading}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {isAnyLoading
                ? "Loading provider data..."
                : "No data for this provider and selected wallet(s)."}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Landing Page Content ---
  const landingPageContent = (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
      {/* Hero Section */}
      <section className="text-center mb-16 md:mb-24 pt-8 md:pt-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
          Unified <span className="text-primary">EGLD</span> Staking Rewards
          Dashboard
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Connect multiple wallets, track aggregated rewards across all staking
          providers, and gain clear insights into your EGLD earnings.
        </p>
        {/* Add Wallet Button using the Dialog */}
        <div className="flex justify-center w-full mt-8">
          <AddWalletForm />
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <Card className="text-center transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.025]">
            <CardHeader>
              <Wallet className="h-10 w-10 mx-auto mb-4 text-primary" />
              <CardTitle>Multi-Wallet Aggregation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect all your wallets and view combined statistics and
                rewards history in one unified interface.
              </CardDescription>
            </CardContent>
          </Card>
          {/* Feature 2 */}
          <Card className="text-center transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.025]">
            <CardHeader>
              <BarChart3 className="h-10 w-10 mx-auto mb-4 text-primary" />
              <CardTitle>Detailed Provider Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Drill down into specific staking providers. See epoch-by-epoch
                rewards and performance metrics.
              </CardDescription>
            </CardContent>
          </Card>
          {/* Feature 3 */}
          <Card className="text-center transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.025]">
            <CardHeader>
              <TrendingUp className="h-10 w-10 mx-auto mb-4 text-primary" />
              <CardTitle>Clear Visualizations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Interactive charts help you easily understand reward trends,
                distribution, and performance over time.
              </CardDescription>
            </CardContent>
          </Card>
          {/* Feature 4 */}
          <Card className="text-center transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.025]">
            <CardHeader>
              <DatabaseZap className="h-10 w-10 mx-auto mb-4 text-primary" />
              <CardTitle>Direct Blockchain Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Fetches reward information directly from the MultiversX
                blockchain via trusted API providers.
              </CardDescription>
            </CardContent>
          </Card>
          {/* Feature 5 */}
          <Card className="text-center transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.025]">
            <CardHeader>
              <PieChart className="h-10 w-10 mx-auto mb-4 text-primary" />
              <CardTitle>Global Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get a high-level view of total rewards, average earnings, and
                performance across all connected wallets.
              </CardDescription>
            </CardContent>
          </Card>
          {/* Feature 6 */}
          <Card className="text-center transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.025]">
            <CardHeader>
              <CheckCircle className="h-10 w-10 mx-auto mb-4 text-primary" />
              <CardTitle>Simple & Clean Interface</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Easily navigate your staking data with a modern, intuitive, and
                responsive user interface.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center gap-4">
          {addedAddresses.length > 0 && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Select Provider</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className={`${isMobile ? 'w-full' : 'w-80'} flex flex-col p-0`}>
                <SheetHeader className="p-4 border-b border-border/50 flex-shrink-0">
                  <SheetTitle className="text-lg font-semibold tracking-tight">
                    Providers
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto">
                  <ProviderSidebar
                    providers={combinedProviders}
                    selectedProviderAddress={selectedProviderAddress}
                    onSelectProvider={handleSelectProvider}
                    onItemClick={() => setIsSheetOpen(false)}
                    totalRewardsPerProvider={totalRewardsPerProvider}
                    fullRewardsData={rewardsData}
                    currentEpoch={selectedAddresses.reduce(
                      (epoch, addr) => rewardsData[addr]?.currentEpoch ?? epoch,
                      0
                    )}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}
          <h1 className="hidden text-lg font-semibold md:block">
            <Link
              href="/"
              className="transition-colors hover:text-primary"
            >
              Staking Rewards
            </Link>
          </h1>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link
              href="/governance"
              className="transition-colors hover:text-foreground"
            >
              Governance
            </Link>
          </nav>
        </div>

         <div className="flex items-center gap-2 md:gap-4">
             {selectedAddresses.length > 0 && (
                 <span className="text-sm text-muted-foreground hidden md:inline">
                     {selectedAddresses.length === 1 ? `Wallet: ${shortenAddress(selectedAddresses[0])}` : `Viewing ${selectedAddresses.length} Wallets`}
                 </span>
             )}
             {selectedAddresses.length > 0 && (
                 <ExportButton className="hidden sm:flex" />
             )}
             <ThemeToggle />
             {addedAddresses.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleSearchAnother}>Reset</Button>
             )}
         </div>
       </header>
       
       

      {/* WalletManagementBar is only shown when wallets are added */}
      {addedAddresses.length > 0 && (
        <WalletManagementBar className="sticky top-14 z-20" />
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Conditionally render landing page or dashboard */}
          {addedAddresses.length === 0 ? landingPageContent : dashboardContent}
        </div>
      </main>
    </div>
  );
}
