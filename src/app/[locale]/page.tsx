/**
 * @file page.tsx
 * @description Homepage for the Staking Rewards application with modern design.
 * @module app/[locale]
 */

"use client";

import React, { useCallback, useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Wallet,
  BarChart3,
  PieChart,
  DatabaseZap,
  CheckCircle,
  TrendingUp,
  MenuIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useStaking } from "@/lib/context/StakingContext";
import { ProviderSidebar } from "@/components/dashboard/ProviderSidebar";
import { ProviderDetailView } from "@/components/dashboard/ProviderDetailView";
import { GlobalDashboardView } from "@/components/dashboard/GlobalDashboardView";
import { WalletManagementBar } from "@/components/dashboard/WalletManagementBar";
import { shortenAddress } from "@/lib/utils/formatters";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { AddWalletForm } from "@/components/dashboard/WalletInputForm/WalletInputForm";
import { CHART_COLORS } from "@/lib/constants/chartColors";
import { getWalletColorMap } from "@/lib/utils/chartUtils";
import { FunLoadingMessages } from "@/components/ui/FunLoadingMessages";
import { GradientBackground } from "@/components/ui/gradient-background";
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { AnimatedPage, FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { MobileNav } from "@/components/ui/mobile-nav";

const features = [
  {
    icon: Wallet,
    titleKey: "multiWallet",
  },
  {
    icon: BarChart3,
    titleKey: "providerInsights",
  },
  {
    icon: TrendingUp,
    titleKey: "visualizations",
  },
  {
    icon: DatabaseZap,
    titleKey: "blockchainData",
  },
  {
    icon: PieChart,
    titleKey: "globalOverview",
  },
  {
    icon: CheckCircle,
    titleKey: "cleanInterface",
  },
];

export default function HomePage(): React.ReactElement {
  const t = useTranslations();
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
    return selectedAddresses.reduce(
      (acc, addr) => {
        if (rewardsData[addr]) {
          acc[addr] = rewardsData[addr];
        }
        return acc;
      },
      {} as Record<string, IXoxnoUserRewardsResponse | null>
    );
  }, [selectedAddresses, rewardsData]);

  const relevantLoadingStates = useMemo(() => {
    return selectedAddresses.reduce(
      (acc, addr) => {
        acc[addr] = isLoading[addr] ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    );
  }, [selectedAddresses, isLoading]);

  const {
    globalStats,
    aggregatedEpochData,
    epochWalletData,
    stakingData,
    walletColorMap,
  } = useMemo(() => {
    const isLoadingAnySelected = selectedAddresses.some(
      (addr) => relevantLoadingStates[addr]
    );

    const hasDataForAllSelected = selectedAddresses.every(
      (addr) =>
        relevantRewardsData[addr] !== undefined && !relevantLoadingStates[addr]
    );

    if (
      selectedAddresses.length === 0 ||
      isLoadingAnySelected ||
      !hasDataForAllSelected
    ) {
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

    const allProvidersData: Record<string, IEpochRewardDataExtended[]> = {};
    const allProviderOwners: Record<string, string> = {};
    let providerDataFound = false;

    selectedAddresses.forEach((addr) => {
      const response = relevantRewardsData[addr];
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
  }, [selectedAddresses, relevantRewardsData, relevantLoadingStates]);

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
      <AnimatedPage className="flex flex-1 overflow-hidden">
        <aside className="w-80 hidden md:flex md:flex-col flex-shrink-0 border-r border-border/50">
          <div className="flex-grow overflow-y-auto scrollbar-thin">
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
        <div className="flex-1 overflow-y-auto bg-muted/30 scrollbar-thin">
          {selectedAddresses.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t("dashboard.selectWallets")}
            </div>
          ) : anyError ? (
            <div className="flex flex-1 items-center justify-center text-destructive p-4 text-center">
              {t("common.error")} {shortenAddress(anyError)}:{" "}
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
                  t("dashboard.noData")
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
                ? t("dashboard.loadingProvider")
                : t("dashboard.noProviderData")}
            </div>
          )}
        </div>
      </AnimatedPage>
    );
  }

  // --- Landing Page Content ---
  const landingPageContent = (
    <AnimatedPage className="flex-1 overflow-y-auto scrollbar-thin relative">
      <GradientBackground intensity="subtle" />

      <div className="relative z-10 px-6 py-8 md:px-8 md:py-12 lg:px-12 lg:py-16">
        {/* Hero Section */}
        <section className="text-center mb-16 md:mb-24 pt-8 md:pt-16">
          <FadeIn>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              Unified <span className="gradient-text">EGLD</span> Staking Rewards Dashboard
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              {t("landing.hero.description", { currency: "EGLD" })}
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="flex justify-center w-full mt-8">
              <AddWalletForm />
            </div>
          </FadeIn>
        </section>

        {/* Features Section */}
        <section>
          <FadeIn>
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("landing.features.title")}
            </h2>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={feature.titleKey}>
                  <GlassCard className="text-center h-full" solid>
                    <GlassCardHeader className="items-center">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center mb-4">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <GlassCardTitle className="text-lg">
                        {t(`landing.features.${feature.titleKey}.title`)}
                      </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <GlassCardDescription className="text-sm">
                        {t(`landing.features.${feature.titleKey}.description`)}
                      </GlassCardDescription>
                    </GlassCardContent>
                  </GlassCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>
      </div>
    </AnimatedPage>
  );

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
        <div className="flex items-center gap-4">
          {addedAddresses.length > 0 && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">{t("nav.selectProvider")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className={`${isMobile ? "w-full" : "w-80"} flex flex-col p-0`}
              >
                <SheetHeader className="p-4 border-b border-border/50 flex-shrink-0">
                  <SheetTitle className="text-lg font-semibold tracking-tight">
                    {t("common.providers")}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto scrollbar-thin">
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
            <Link href="/" className="transition-colors hover:text-primary">
              {t("nav.stakingRewards")}
            </Link>
          </h1>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link
              href="/governance"
              className="transition-colors hover:text-foreground"
            >
              {t("nav.governance")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {selectedAddresses.length > 0 && (
            <span className="text-sm text-muted-foreground hidden md:inline">
              {selectedAddresses.length === 1
                ? t("common.wallet", {
                    address: shortenAddress(selectedAddresses[0]),
                  })
                : t("common.viewingWallets", {
                    count: selectedAddresses.length,
                  })}
            </span>
          )}
          {selectedAddresses.length > 0 && (
            <ExportButton className="hidden sm:flex" />
          )}
          <ThemeToggle />
          {addedAddresses.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleSearchAnother}>
              {t("common.reset")}
            </Button>
          )}
        </div>
      </header>

      {addedAddresses.length > 0 && (
        <WalletManagementBar className="sticky top-14 z-20" />
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {addedAddresses.length === 0 ? landingPageContent : dashboardContent}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
