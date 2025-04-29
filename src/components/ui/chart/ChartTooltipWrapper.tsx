/**
 * @file ChartTooltipWrapper.tsx
 * @description Wrapper pour le tooltip des graphiques qui gère correctement les types Recharts
 */

import React from 'react';
import { TooltipProps } from 'recharts';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { ChartTooltipContent } from './ChartTooltipContent';

interface IChartTooltipWrapperProps {
  walletColorMap: Record<string, string>;
}

export const ChartTooltipWrapper = ({ walletColorMap }: IChartTooltipWrapperProps) => {
  const renderContent = (props: TooltipProps<ValueType, NameType>) => {
    return <ChartTooltipContent {...props} walletColorMap={walletColorMap} />;
  };

  return renderContent;
};

export default ChartTooltipWrapper; 