/**
 * @file StakingContext.type.ts
 * @description Type definitions for the Staking Context.
 * @module lib/context/StakingContext
 */

import { XoxnoApiError } from '@/api/services/XoxnoRewardsService';
import type { IXoxnoUserRewardsResponse } from '@/api/types/xoxno-rewards.types';

/**
 * Represents the state managed by the Staking Context.
 */
export interface IStakingState {
  /** List of all wallet addresses added by the user */
  addedAddresses: string[];
  /** List of wallet addresses currently selected for viewing/aggregation */
  selectedAddresses: string[];
  /** The provider address currently selected for detailed view */
  selectedProviderAddress: string | null;
  /** 
   * A map storing rewards data keyed by wallet address.
   */
  rewardsData: Record<string, IXoxnoUserRewardsResponse>;
  /** Loading state keyed by wallet address */
  isLoading: Record<string, boolean>;
  /** Error state keyed by wallet address */
  error: Record<string, XoxnoApiError | string | null>;
  walletColorMap: Record<string, string>;
}

/**
 * Defines the actions that can be dispatched to the Staking Context reducer.
 */
export type StakingAction = 
  | { type: 'ADD_ADDRESS'; payload: { address: string } }
  | { type: 'REMOVE_ADDRESS'; payload: { address: string } }
  | { type: 'TOGGLE_SELECTED_ADDRESS'; payload: { address: string } }
  | { type: 'SET_SELECTED_ADDRESSES'; payload: { addresses: string[] } } // Optional: For select all/none
  | { type: 'FETCH_REWARDS_START'; payload: { address: string } }
  | { type: 'FETCH_REWARDS_SUCCESS'; payload: { address: string; data: IXoxnoUserRewardsResponse } }
  | { type: 'FETCH_REWARDS_FAILURE'; payload: { address: string; error: XoxnoApiError | string } }
  | { type: 'SELECT_PROVIDER'; payload: { providerAddress: string | null } }
  | { type: 'CLEAR_ADDRESS_ERROR'; payload: { address: string } }
  | { type: 'SET_WALLET_COLOR'; payload: { address: string; color: string } }
  | { type: 'UPDATE_WALLET_COLORS'; payload: { colorMap: Record<string, string> } };

/**
 * Describes the shape of the Staking Context, including state and dispatch function.
 */
export interface IStakingContextProps {
  state: IStakingState;
  dispatch: React.Dispatch<StakingAction>;
  setWalletColor: (address: string, color: string) => void;
  // Action functions will be added in the useStaking hook
} 