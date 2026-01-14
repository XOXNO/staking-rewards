/**
 * @file GovernanceVotesService.ts
 * @description Service for fetching governance vote distribution data.
 * @module api/services
 */

import type {
  IGovernanceVoteByAddress,
  IGovernanceVotesResponse,
} from "../types/governance-votes.types";

export type GovernanceVotesApiError = {
  kind: "network" | "parsing" | "http";
  message: string;
  statusCode?: number;
  details?: unknown;
};

export type GovernanceVotesResult =
  | { success: true; data: IGovernanceVotesResponse }
  | { success: false; error: GovernanceVotesApiError };

/**
 * Fetches governance voting data from the `/scripts/governance-votes` endpoint.
 */
export class GovernanceVotesService {
  constructor(
    private readonly endpoint: string = "/scripts/governance-votes",
    private readonly baseUrl: string = "https://api.xoxno.com",
  ) {}

  /**
   * Retrieve governance votes data.
   */
  public async getVotes(signal?: AbortSignal): Promise<GovernanceVotesResult> {
    try {
      const url = `${this.baseUrl}${this.endpoint}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      if (!response.ok) {
        let errorDetails: unknown;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }

        return {
          success: false,
          error: {
            kind: "http",
            statusCode: response.status,
            message: `HTTP error ${response.status}: ${response.statusText}`,
            details: errorDetails,
          },
        };
      }

      const data = await response.json();

      if (!this.isValidGovernanceVotesResponse(data)) {
        return {
          success: false,
          error: {
            kind: "parsing",
            message: "Invalid governance votes response structure",
            details: data,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          kind: "network",
          message:
            error instanceof Error ? error.message : "Unknown network error",
          details: error,
        },
      };
    }
  }

  private isValidGovernanceVotesResponse(
    data: unknown,
  ): data is IGovernanceVotesResponse {
    if (!data || typeof data !== "object") {
      return false;
    }

    const response = data as Partial<IGovernanceVotesResponse>;

    const isVoteArray = (votes: unknown): votes is IGovernanceVoteByAddress[] =>
      Array.isArray(votes) &&
      votes.every(
        (vote) =>
          vote &&
          typeof vote === "object" &&
          typeof (vote as IGovernanceVoteByAddress).address === "string" &&
          typeof (vote as IGovernanceVoteByAddress).vote === "string" &&
          typeof (vote as IGovernanceVoteByAddress).voteShort === "number" &&
          typeof (vote as IGovernanceVoteByAddress).share === "number" &&
          typeof (vote as IGovernanceVoteByAddress).shareTotal === "number",
      );

    const isNumericLike = (value: unknown): value is string | number =>
      (typeof value === "string" && value.length > 0) ||
      typeof value === "number";

    return (
      isVoteArray(response.orderedGovernanceVotesByAddressYes) &&
      isVoteArray(response.orderedGovernanceVotesByAddressNo) &&
      isNumericLike(response.totalVotedYes) &&
      isNumericLike(response.totalVotedYesShort) &&
      isNumericLike(response.totalVotedNo) &&
      isNumericLike(response.totalVotedNoShort) &&
      isNumericLike(response.totalVoted) &&
      isNumericLike(response.totalVotedShort)
    );
  }
}
