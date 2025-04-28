/**
 * @file StakingContext.type.ts
 * @description Type definitions for the Staking Context.
 * @module lib/context/StakingContext
 */

import { XoxnoApiError } from "@/api/services/XoxnoRewardsService";
import type { IXoxnoUserRewardsResponse } from "@/api/types/xoxno-rewards.types";

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
  rewardsData: Record<string, IXoxnoUserRewardsResponse | null>; // Allow null for addresses with fetch errors
  /** Loading state keyed by wallet address */
  isLoading: Record<string, boolean>;
  /** Error state keyed by wallet address */
  error: Record<string, XoxnoApiError | string | null>;
}

/**
 * Enum defining the types of actions that can be dispatched to the Staking Context.
 */
export enum StakingActionEnum {
  ADD_ADDRESS = "ADD_ADDRESS",
  REMOVE_ADDRESS = "REMOVE_ADDRESS",
  TOGGLE_SELECTED_ADDRESS = "TOGGLE_SELECTED_ADDRESS",
  SET_SELECTED_ADDRESSES = "SET_SELECTED_ADDRESSES",
  FETCH_REWARDS_START = "FETCH_REWARDS_START",
  FETCH_REWARDS_SUCCESS = "FETCH_REWARDS_SUCCESS",
  FETCH_REWARDS_FAILURE = "FETCH_REWARDS_FAILURE",
  SELECT_PROVIDER = "SELECT_PROVIDER",
  CLEAR_ADDRESS_ERROR = "CLEAR_ADDRESS_ERROR",
}

/**
 * Defines the actions that can be dispatched to the Staking Context reducer.
 */
export type StakingAction =
  | { type: StakingActionEnum.ADD_ADDRESS; payload: { address: string } }
  | { type: StakingActionEnum.REMOVE_ADDRESS; payload: { address: string } }
  | {
      type: StakingActionEnum.TOGGLE_SELECTED_ADDRESS;
      payload: { address: string };
    }
  | {
      type: StakingActionEnum.SET_SELECTED_ADDRESSES;
      payload: { addresses: string[] };
    } // Optional: For select all/none
  | {
      type: StakingActionEnum.FETCH_REWARDS_START;
      payload: { address: string };
    }
  | {
      type: StakingActionEnum.FETCH_REWARDS_SUCCESS;
      payload: { address: string; data: IXoxnoUserRewardsResponse };
    }
  | {
      type: StakingActionEnum.FETCH_REWARDS_FAILURE;
      payload: { address: string; error: XoxnoApiError | string };
    }
  | {
      type: StakingActionEnum.SELECT_PROVIDER;
      payload: { providerAddress: string | null };
    }
  | {
      type: StakingActionEnum.CLEAR_ADDRESS_ERROR;
      payload: { address: string };
    };

/**
 * Describes the shape of the Staking Context, including state and dispatch function.
 */
export interface IStakingContextProps {
  state: IStakingState;
  dispatch: React.Dispatch<StakingAction>;
  // Action functions will be added in the useStaking hook
}
