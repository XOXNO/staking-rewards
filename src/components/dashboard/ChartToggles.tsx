import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChartIcon, LineChartIcon, TrendingUpIcon, CalendarIcon, CoinsIcon, WalletIcon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// Types
export type ChartType = 'bar' | 'line';
export type DisplayMode = 'daily' | 'cumulative';
export type ViewMode = 'rewards' | 'staked';

interface ChartTogglesProps {
    viewMode: ViewMode;
    displayMode: DisplayMode;
    chartType: ChartType;
    onViewModeChange: (value: ViewMode) => void;
    onDisplayModeChange: (value: DisplayMode) => void;
    onChartTypeChange: (value: ChartType) => void;
}

export const ChartToggles: React.FC<ChartTogglesProps> = ({
    viewMode,
    displayMode,
    chartType,
    onViewModeChange,
    onDisplayModeChange,
    onChartTypeChange,
}) => {
    return (
        <div className="flex gap-2">
            {/* View Mode Toggle */}
            <ToggleGroup
                type="single"
                variant="outline"
                value={viewMode}
                onValueChange={(value: ViewMode) => { if (value) onViewModeChange(value); }}
                size="sm"
                aria-label="View Mode"
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <ToggleGroupItem 
                            value="rewards" 
                            aria-label="Show rewards"
                        >
                            <CoinsIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent side="top">Show rewards per epoch</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <ToggleGroupItem 
                            value="staked" 
                            aria-label="Show staked amount"
                        >
                            <WalletIcon className="h-4 w-4" />
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
                        onValueChange={(value: DisplayMode) => { if (value) onDisplayModeChange(value); }}
                        size="sm"
                        aria-label="Display Mode"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <ToggleGroupItem 
                                    value="daily" 
                                    aria-label="Daily rewards"
                                >
                                    <CalendarIcon className="h-4 w-4" />
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent side="top">Show daily values</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <ToggleGroupItem 
                                    value="cumulative" 
                                    aria-label="Cumulative rewards"
                                >
                                    <TrendingUpIcon className="h-4 w-4" />
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent side="top">Show cumulative values</TooltipContent>
                        </Tooltip>
                    </ToggleGroup>
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={chartType}
                        onValueChange={(value: ChartType) => { if (value) onChartTypeChange(value); }}
                        size="sm"
                        aria-label="Chart Type"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <ToggleGroupItem 
                                    value="bar" 
                                    aria-label="Bar chart"
                                >
                                    <BarChartIcon className="h-4 w-4" />
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent side="top">Bar chart</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <ToggleGroupItem 
                                    value="line" 
                                    aria-label="Line chart"
                                >
                                    <LineChartIcon className="h-4 w-4" />
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent side="top">Line chart</TooltipContent>
                        </Tooltip>
                    </ToggleGroup>
                </>
            )}
        </div>
    );
}; 