/**
 * @file governance-votes.types.ts
 * @description Type definitions for the governance votes dashboard data.
 * @module api/types
 */

/**
 * Represents the voting metrics for a single address.
 */
export interface IGovernanceVoteByAddress {
  /**
   * Wallet address of the voter.
   */
  address: string;
  /**
   * Optional herotag or human readable identifier.
   */
  herotag?: string | null;
  /**
   * Full vote power amount, usually represented as a denormalized string.
   */
  vote: string;
  /**
   * Shortened vote power amount (already denominated for display).
   */
  voteShort: number;
  /**
   * The share of the vote power for the bucket (yes/no) as a decimal (0-1).
   */
  share: number;
  /**
   * The share of the vote power relative to the overall total as a decimal (0-1).
   */
  shareTotal: number;
}

/**
 * Aggregated governance vote metrics grouped by voting preference.
 */
export interface IGovernanceVotesResponse {
  orderedGovernanceVotesByAddressYes: IGovernanceVoteByAddress[];
  orderedGovernanceVotesByAddressNo: IGovernanceVoteByAddress[];
  totalVotedYes: string | number;
  totalVotedYesShort: string | number;
  totalVotedNo: string | number;
  totalVotedNoShort: string | number;
  totalVoted: string | number;
  totalVotedShort: string | number;
}
