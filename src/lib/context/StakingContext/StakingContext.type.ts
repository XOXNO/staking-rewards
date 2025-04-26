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
  /** The wallet address whose data is currently loaded */
  activeAddress: string | null;
  /** The provider address currently selected for detailed view */
  selectedProviderAddress: string | null;
  /** 
   * A map storing rewards data keyed by wallet address.
   * Allows caching data for multiple addresses.
   */
  rewardsData: Record<string, IXoxnoUserRewardsResponse>;
  /** Loading state, true when fetching data for the activeAddress */
  isLoading: boolean;
  /** Error state, storing the last encountered error */
  error: XoxnoApiError | string | null;
}

/**
 * Defines the actions that can be dispatched to the Staking Context reducer.
 */
export type StakingAction = 
  | { type: 'FETCH_REWARDS_START'; payload: { address: string } }
  | { type: 'FETCH_REWARDS_SUCCESS'; payload: { address: string; data: IXoxnoUserRewardsResponse } }
  | { type: 'FETCH_REWARDS_FAILURE'; payload: { address: string; error: XoxnoApiError | string } }
  | { type: 'SET_ACTIVE_ADDRESS'; payload: { address: string | null } }
  | { type: 'SELECT_PROVIDER'; payload: { providerAddress: string | null } }
  | { type: 'CLEAR_ERROR' };

/**
 * Describes the shape of the Staking Context, including state and dispatch function.
 */
export interface IStakingContextProps {
  state: IStakingState;
  dispatch: React.Dispatch<StakingAction>;
  // We can add specific action functions later for easier use, e.g.:
  // fetchRewards: (address: string) => Promise<void>;
} 