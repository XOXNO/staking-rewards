/**
 * @file xoxno-rewards.types.ts
 * @description Type definitions for the XOXNO user rewards API response.
 * @module api/types
 */

/**
 * Represents the reward data for a single epoch for a specific provider.
 */
export interface IEpochRewardData {
  epoch: number;
  totalStaked: number; // Assuming this is a number based on context, could be string if very large
  epochUserRewards: number;
  ownerRewards: number;
}

export interface IEpochRewardDataExtended extends IEpochRewardData {
  walletAddress: string;
}
/**
 * Represents the detailed identity information for a staking provider.
 */
export interface IProviderIdentityInfo {
  identity: string;
  locked: string; // Large number, keep as string
  distribution: Record<string, number>;
  avatar?: string; // Optional property
  description?: string; // Optional property
  name?: string; // Optional property
  website?: string; // Optional property
  twitter?: string; // Optional property
  location?: string; // Optional property
  score: number;
  validators: number;
  stake: string; // Large number, keep as string
  topUp: string; // Large number, keep as string
  providers: string[];
  stakePercent: number;
  apr: number; // Annual Percentage Rate
  rank: number;
}

/**
 * Represents detailed information about a staking provider, including identity.
 */
export interface IProviderWithIdentity {
  numNodes: number;
  stake: string; // Large number, keep as string
  topUp: string; // Large number, keep as string
  locked: string; // Large number, keep as string
  provider: string; // Provider's address (e.g., erd1...)
  owner: string; // Owner's address
  featured: boolean;
  serviceFee: number;
  delegationCap: string; // Often "0" or large number
  apr: number; // Annual Percentage Rate
  numUsers: number;
  cumulatedRewards: string; // Large number, keep as string
  identity: string; // Identity name (e.g., "xoxno")
  automaticActivation: boolean;
  checkCapOnRedelegate: boolean;
  githubProfileValidated: boolean;
  githubKeysValidated: boolean;
  identityInfo?: IProviderIdentityInfo; // Optional identity details
}

/**
 * Represents the main response structure from the XOXNO user rewards API.
 */
export interface IXoxnoUserRewardsResponse {
  /**
   * The current epoch number on the network at the time of the API call.
   */
  currentEpoch: number;

  /**
   * A record where keys are provider addresses (erd1...) and values are arrays
   * of epoch reward data for that provider associated with the queried user address.
   */
  providersFullRewardsData: Record<string, IEpochRewardData[]>;

  /**
   * Total rewards aggregated across all providers for the queried user address.
   */
  totalRewards: number;

  /**
   * A record where keys are provider addresses (erd1...) and values are the
   * total rewards for that specific provider associated with the queried user address.
   */
  totalRewardsPerProvider: Record<string, number>;

  /**
   * An array containing detailed information about each provider associated
   * with the queried user address, including identity information.
   */
  providersWithIdentityInfo: IProviderWithIdentity[];
} 