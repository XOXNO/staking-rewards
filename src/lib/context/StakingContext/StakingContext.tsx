/**
 * @file StakingContext.tsx
 * @description Provides staking data state management via React Context.
 * @module lib/context/StakingContext
 */

"use client";

import React, {
  createContext,
  useReducer,
  useContext,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { XoxnoRewardsService } from "@/api/services/XoxnoRewardsService";
import type {
  IStakingState,
  StakingAction,
  IStakingContextProps,
} from "./StakingContext.type";
import type { XoxnoApiError } from "@/api/services/XoxnoRewardsService";
import { useWalletColors } from "@/lib/hooks/useWalletColors";

const initialState: IStakingState = {
  addedAddresses: [],
  selectedAddresses: [],
  selectedProviderAddress: null,
  rewardsData: {},
  isLoading: {},
  error: {},
  walletColorMap: {},
};

// Create the context with a default value (can be undefined or initial state)
// Throwing an error if used outside provider is a common pattern.
const StakingContext = createContext<IStakingContextProps | undefined>(
  undefined
);

// Helper to remove properties from an object immutably
const removeProperty = <T, K extends keyof T>(key: K, obj: T): Omit<T, K> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: _, ...rest } = obj;
  return rest;
};

// Reducer function to handle state updates
const stakingReducer = (
  state: IStakingState,
  action: StakingAction
): IStakingState => {
  switch (action.type) {
    case "ADD_ADDRESS":
      const addressToAdd = action.payload.address;
      if (state.addedAddresses.includes(addressToAdd)) {
        return state; // Already added
      }
      return {
        ...state,
        addedAddresses: [...state.addedAddresses, addressToAdd],
        // Automatically select newly added address
        selectedAddresses: [
          ...state.selectedAddresses.filter((a) => a !== addressToAdd),
          addressToAdd,
        ],
        selectedProviderAddress: null, // Reset provider selection when adding a new wallet
      };

    case "REMOVE_ADDRESS":
      const addressToRemove = action.payload.address;
      return {
        ...state,
        addedAddresses: state.addedAddresses.filter(
          (a) => a !== addressToRemove
        ),
        selectedAddresses: state.selectedAddresses.filter(
          (a) => a !== addressToRemove
        ),
        rewardsData: removeProperty(addressToRemove, state.rewardsData),
        isLoading: removeProperty(addressToRemove, state.isLoading),
        error: removeProperty(addressToRemove, state.error),
        walletColorMap: removeProperty(addressToRemove, state.walletColorMap),
      };

    case "TOGGLE_SELECTED_ADDRESS":
      const addressToToggle = action.payload.address;
      const isSelected = state.selectedAddresses.includes(addressToToggle);
      return {
        ...state,
        selectedAddresses: isSelected
          ? state.selectedAddresses.filter((a) => a !== addressToToggle)
          : [...state.selectedAddresses, addressToToggle],
      };

    case "SET_SELECTED_ADDRESSES":
      return {
        ...state,
        selectedAddresses: action.payload.addresses,
      };

    case "SET_WALLET_COLOR":
      return {
        ...state,
        walletColorMap: {
          ...state.walletColorMap,
          [action.payload.address]: action.payload.color,
        },
      };

    case "FETCH_REWARDS_START":
      return {
        ...state,
        isLoading: {
          ...state.isLoading,
          [action.payload.address]: true,
        },
        error: {
          ...state.error,
          [action.payload.address]: null, // Clear previous error for this address
        },
      };

    case "FETCH_REWARDS_SUCCESS":
      return {
        ...state,
        isLoading: {
          ...state.isLoading,
          [action.payload.address]: false,
        },
        rewardsData: {
          ...state.rewardsData,
          [action.payload.address]: action.payload.data,
        },
      };

    case "FETCH_REWARDS_FAILURE":
      return {
        ...state,
        isLoading: {
          ...state.isLoading,
          [action.payload.address]: false,
        },
        error: {
          ...state.error,
          [action.payload.address]: action.payload.error,
        },
      };

    case "SELECT_PROVIDER":
      return {
        ...state,
        selectedProviderAddress: action.payload.providerAddress,
      };

    case "CLEAR_ADDRESS_ERROR":
      return {
        ...state,
        error: {
          ...state.error,
          [action.payload.address]: null,
        },
      };

    case "UPDATE_WALLET_COLORS":
      return {
        ...state,
        walletColorMap: action.payload.colorMap,
      };

    default:
      return state;
  }
};

// Provider component
export const StakingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(stakingReducer, initialState);

  // Utilise le hook de couleurs avec les adresses du state
  const { walletColorMap, setWalletColor: setColor } = useWalletColors(state.addedAddresses);

  // Synchronise les couleurs du hook avec le state du contexte
  useEffect(() => {
    dispatch({
      type: "UPDATE_WALLET_COLORS",
      payload: { colorMap: walletColorMap },
    });
  }, [walletColorMap]);

  // Optional: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    const value = {
      state: { ...state, walletColorMap: state.walletColorMap },
      dispatch,
      setWalletColor: (address: string, color: string) => {
        setColor(address, color);
      },
    };
    return value;
  }, [state, dispatch, setColor]);

  return (
    <StakingContext.Provider value={contextValue}>
      {children}
    </StakingContext.Provider>
  );
};

// Custom hook exposing state, dispatch, and convenient action functions
export const useStaking = () => {
  const context = useContext(StakingContext);
  if (context === undefined) {
    throw new Error("useStaking must be used within a StakingProvider");
  }

  const { state, dispatch } = context;
  const xoxnoService = useMemo(() => new XoxnoRewardsService(), []);

  // --- Action Functions ---

  const fetchRewards = useCallback(
    async (address: string): Promise<void> => {
      dispatch({ type: "FETCH_REWARDS_START", payload: { address } });
      try {
        const result = await xoxnoService.getUserRewards(address);
        if (result.success) {
          dispatch({
            type: "FETCH_REWARDS_SUCCESS",
            payload: { address, data: result.data },
          });
        } else {
          const errorPayload: XoxnoApiError | string =
            result.error instanceof Error ? result.error.message : result.error;
          dispatch({
            type: "FETCH_REWARDS_FAILURE",
            payload: { address, error: errorPayload },
          });
        }
      } catch (err) {
        console.error(`Unhandled error fetching rewards for ${address}:`, err);
        const errorPayload: string =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        dispatch({
          type: "FETCH_REWARDS_FAILURE",
          payload: { address, error: errorPayload },
        });
      }
    },
    [xoxnoService, dispatch]
  );

  const addAddress = useCallback(
    async (address: string): Promise<void> => {
      // Check if already added or currently loading to prevent duplicates/race conditions
      if (state.addedAddresses.includes(address) || state.isLoading[address]) {
        // Optionally re-select it if already added but not selected
        if (!state.selectedAddresses.includes(address)) {
          dispatch({ type: "TOGGLE_SELECTED_ADDRESS", payload: { address } });
        }
        return;
      }

      dispatch({ type: "ADD_ADDRESS", payload: { address } });
      await fetchRewards(address); // Fetch data after adding
    },
    [
      state.addedAddresses,
      state.isLoading,
      state.selectedAddresses,
      dispatch,
      fetchRewards,
    ]
  );

  const removeAddress = useCallback(
    (address: string): void => {
      dispatch({ type: "REMOVE_ADDRESS", payload: { address } });
    },
    [dispatch]
  );

  const toggleSelectedAddress = useCallback(
    (address: string): void => {
      // Ensure the address is actually one that has been added
      if (state.addedAddresses.includes(address)) {
        dispatch({ type: "TOGGLE_SELECTED_ADDRESS", payload: { address } });
      }
    },
    [state.addedAddresses, dispatch]
  );

  const selectProvider = useCallback(
    (providerAddress: string | null): void => {
      dispatch({ type: "SELECT_PROVIDER", payload: { providerAddress } });
    },
    [dispatch]
  );

  const clearAddressError = useCallback(
    (address: string): void => {
      dispatch({ type: "CLEAR_ADDRESS_ERROR", payload: { address } });
    },
    [dispatch]
  );

  // --- End Action Functions ---

  return {
    state,
    dispatch,
    // Expose action functions
    addAddress,
    removeAddress,
    toggleSelectedAddress,
    selectProvider,
    clearAddressError,
    setWalletColor: context.setWalletColor,
  };
};
