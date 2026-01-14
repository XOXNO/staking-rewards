import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChartIcon, LineChartIcon, TrendingUpIcon, CalendarIcon, CoinsIcon, WalletIcon, DollarSignIcon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';
import { useIsMobile } from '@/hooks/use-mobile';

// Types
export type ChartType = 'bar' | 'line';
export type DisplayMode = 'daily' | 'cumulative';
export type ViewMode = 'rewards' | 'staked';
export type CurrencyMode = 'egld' | 'usd';
export type GranularityMode = '1' | '7' | '14' | '30';

interface ChartTogglesProps {
    viewMode: ViewMode;
    displayMode: DisplayMode;
    chartType: ChartType;
    currencyMode: CurrencyMode;
    granularity: GranularityMode;
    onViewModeChange: (value: ViewMode) => void;
    onDisplayModeChange: (value: DisplayMode) => void;
    onChartTypeChange: (value: ChartType) => void;
    onCurrencyModeChange: (value: CurrencyMode) => void;
    onGranularityChange: (value: GranularityMode) => void;
}

export const ChartToggles: React.FC<ChartTogglesProps> = ({
    viewMode,
    displayMode,
    chartType,
    currencyMode,
    granularity,
    onViewModeChange,
    onDisplayModeChange,
    onChartTypeChange,
    onCurrencyModeChange,
    onGranularityChange,
}) => {
    const isMobile = useIsMobile();

    const handleDisplayModeChange = (value: DisplayMode) => {
        if (value && value !== displayMode) {
            onDisplayModeChange(value);
        }
    };

    const handleGranularityChange = (value: GranularityMode) => {
        if (value && value !== granularity) {
            onGranularityChange(value);
        }
    };

    return (
        <div className={cn(
            "flex flex-wrap gap-2", 
            isMobile && "fixed bottom-4 left-0 right-0 justify-center z-30 px-4"
        )}>
            {/* Container with backdrop shadow for mobile */}
            <div className={cn(
                "flex flex-wrap gap-2",
                isMobile && "bg-background/90 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-border/50"
            )}>
                {/* View Mode Toggle */}
                <ToggleGroup
                    type="single"
                    variant="outline"
                    value={viewMode}
                    onValueChange={(value: ViewMode) => { if (value) onViewModeChange(value); }}
                    size={isMobile ? "default" : "sm"}
                    aria-label="View Mode"
                    className={cn(isMobile && "shadow-sm")}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem 
                                value="rewards" 
                                aria-label="Show rewards"
                                className={cn(isMobile && "h-10 w-10")}
                            >
                                <CoinsIcon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent side="top">Show rewards per epoch</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem 
                                value="staked" 
                                aria-label="Show staked amount"
                                className={cn(isMobile && "h-10 w-10")}
                            >
                                <WalletIcon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent side="top">Show staked amount per epoch</TooltipContent>
                    </Tooltip>
                </ToggleGroup>

                {/* Only show these toggles for rewards view */}
                {viewMode === 'rewards' && (
                    <>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={displayMode}
                            onValueChange={handleDisplayModeChange}
                            size={isMobile ? "default" : "sm"}
                            aria-label="Display Mode"
                            className={cn(isMobile && "shadow-sm")}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem 
                                        value="daily" 
                                        aria-label="Daily rewards"
                                        className={cn(isMobile && "h-10 w-10")}
                                    >
                                        <CalendarIcon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">Show daily values</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem 
                                        value="cumulative" 
                                        aria-label="Cumulative rewards"
                                        className={cn(isMobile && "h-10 w-10")}
                                    >
                                        <TrendingUpIcon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">Show cumulative values</TooltipContent>
                            </Tooltip>
                        </ToggleGroup>

                        {/* Currency Mode Toggle */}
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={currencyMode}
                            onValueChange={(value: CurrencyMode) => { if (value) onCurrencyModeChange(value); }}
                            size={isMobile ? "default" : "sm"}
                            aria-label="Currency Mode"
                            className={cn(isMobile && "shadow-sm")}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem 
                                        value="egld" 
                                        aria-label="Show in EGLD"
                                        className={cn(isMobile && "h-10 w-10")}
                                    >
                                        <CoinsIcon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">Show values in EGLD</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem 
                                        value="usd" 
                                        aria-label="Show in USD"
                                        className={cn(isMobile && "h-10 w-10")}
                                    >
                                        <DollarSignIcon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">Show values in USD</TooltipContent>
                            </Tooltip>
                        </ToggleGroup>

                        {/* Granularity Toggle */}
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={granularity}
                            onValueChange={handleGranularityChange}
                            size={isMobile ? "default" : "sm"}
                            aria-label="Granularity"
                            className={cn(isMobile && "shadow-sm")}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                        value="1"
                                        aria-label="1 epoch"
                                        className={cn(isMobile && "h-10 px-2")}
                                    >
                                        <span className={cn("text-xs font-medium", isMobile && "text-sm")}>1E</span>
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">1 epoch per bar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                        value="7"
                                        aria-label="7 days"
                                        className={cn(isMobile && "h-10 px-2")}
                                    >
                                        <span className={cn("text-xs font-medium", isMobile && "text-sm")}>7D</span>
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">Aggregate 7 epochs</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                        value="14"
                                        aria-label="14 days"
                                        className={cn(isMobile && "h-10 px-2")}
                                    >
                                        <span className={cn("text-xs font-medium", isMobile && "text-sm")}>14D</span>
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">Aggregate 14 epochs</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                        value="30"
                                        aria-label="30 days"
                                        className={cn(isMobile && "h-10 px-2")}
                                    >
                                        <span className={cn("text-xs font-medium", isMobile && "text-sm")}>30D</span>
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">Aggregate 30 epochs</TooltipContent>
                            </Tooltip>
                        </ToggleGroup>

                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={chartType}
                            onValueChange={(value: ChartType) => { if (value) onChartTypeChange(value); }}
                            size={isMobile ? "default" : "sm"}
                            aria-label="Chart Type"
                            className={cn(isMobile && "shadow-sm")}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                        value="bar"
                                        aria-label="Bar chart"
                                        className={cn(isMobile && "h-10 w-10")}
                                    >
                                        <BarChartIcon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">Bar chart</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                        value="line"
                                        aria-label="Line chart"
                                        className={cn(isMobile && "h-10 w-10")}
                                    >
                                        <LineChartIcon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="top">Line chart</TooltipContent>
                            </Tooltip>
                        </ToggleGroup>
                    </>
                )}
            </div>
        </div>
    );
}; 