/**
 * @file StakingContext.tsx
 * @description Provides staking data state management via React Context.
 * @module lib/context/StakingContext
 */

'use client';

import React, { createContext, useReducer, useContext, useMemo, useCallback } from 'react';
import { XoxnoRewardsService } from '@/api/services/XoxnoRewardsService';
import type { IStakingState, StakingAction, IStakingContextProps } from './StakingContext.type';
import type { XoxnoApiError } from '@/api/services/XoxnoRewardsService';

const initialState: IStakingState = {
  activeAddress: null,
  selectedProviderAddress: null,
  rewardsData: {},
  isLoading: false,
  error: null,
};

// Create the context with a default value (can be undefined or initial state)
// Throwing an error if used outside provider is a common pattern.
const StakingContext = createContext<IStakingContextProps | undefined>(undefined);

// Reducer function to handle state updates
const stakingReducer = (state: IStakingState, action: StakingAction): IStakingState => {
  switch (action.type) {
    case 'FETCH_REWARDS_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        activeAddress: action.payload.address,
        selectedProviderAddress: null,
        rewardsData: {},
      };
    case 'FETCH_REWARDS_SUCCESS':
      const providers = action.payload.data.providersWithIdentityInfo;
      const firstProviderAddress = providers && providers.length > 0 ? providers[0].provider : null;
      return {
        ...state,
        isLoading: false,
        rewardsData: {
          [action.payload.address]: action.payload.data,
        },
        error: null,
        selectedProviderAddress: firstProviderAddress,
      };
    case 'FETCH_REWARDS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
        selectedProviderAddress: null,
        rewardsData: {},
      };
    case 'SET_ACTIVE_ADDRESS':
       return {
         ...state,
         activeAddress: action.payload.address,
         selectedProviderAddress: null,
         error: null,
       };
    case 'SELECT_PROVIDER':
      return {
          ...state,
          selectedProviderAddress: action.payload.providerAddress,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Provider component
export const StakingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(stakingReducer, initialState);

  // Instantiate the service - consider dependency injection for testability if needed
  // const xoxnoService = useMemo(() => new XoxnoRewardsService(), []);

  // Optional: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <StakingContext.Provider value={contextValue}>
      {children}
    </StakingContext.Provider>
  );
};

// Custom hook for easy context consumption
export const useStaking = (): IStakingContextProps & { fetchRewards: (address: string) => Promise<void> } => {
  const context = useContext(StakingContext);
  if (context === undefined) {
    throw new Error('useStaking must be used within a StakingProvider');
  }

  // Instantiate the service again here or lift it higher if needed across hooks
  // For simplicity here, we instantiate again, but this could be optimized.
  const xoxnoService = useMemo(() => new XoxnoRewardsService(), []);
  const { state, dispatch } = context;

  // Create an async action function for convenience
  const fetchRewards = useCallback(async (address: string): Promise<void> => {
    // Check cache first (optional, but good practice)
    // if (state.rewardsData[address]) {
    //   dispatch({ type: 'SET_ACTIVE_ADDRESS', payload: { address } });
    //   return;
    // }
    
    dispatch({ type: 'FETCH_REWARDS_START', payload: { address } });
    try {
      const result = await xoxnoService.getUserRewards(address);
      if (result.success) {
        dispatch({ type: 'FETCH_REWARDS_SUCCESS', payload: { address, data: result.data } });
      } else {
        // Ensure error payload matches expected type
        const errorPayload: XoxnoApiError | string = result.error instanceof Error ? result.error.message : result.error;
        dispatch({ type: 'FETCH_REWARDS_FAILURE', payload: { address, error: errorPayload } });
      }
    } catch (err) {
      console.error('Unhandled error in fetchRewards:', err);
      const errorPayload: string = err instanceof Error ? err.message : 'An unexpected error occurred.';
      dispatch({ type: 'FETCH_REWARDS_FAILURE', payload: { address, error: errorPayload } });
    }
  }, [xoxnoService, dispatch]); // Add state.rewardsData if implementing caching check

  return { state, dispatch, fetchRewards };
}; 