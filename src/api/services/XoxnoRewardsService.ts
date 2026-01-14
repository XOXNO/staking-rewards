/**
 * @file XoxnoRewardsService.ts
 * @description Service for fetching user staking rewards from the XOXNO API.
 * @module api/services
 */

import type { IXoxnoUserRewardsResponse } from "../types/xoxno-rewards.types";

// Define potential error types for this service
export type XoxnoApiError = {
  kind: "network" | "parsing" | "http";
  message: string;
  statusCode?: number;
  details?: unknown;
};

// Define a result type for better error handling
export type XoxnoRewardsResult =
  | { success: true; data: IXoxnoUserRewardsResponse }
  | { success: false; error: XoxnoApiError };

export class XoxnoRewardsService {
  private baseUrl = "https://api.xoxno.com"; // Use HTTPS

  /**
   * Fetches the staking rewards data for a given user address.
   *
   * @param address - The user's wallet address (e.g., erd1...).
   * @returns A Promise resolving to a XoxnoRewardsResult containing either the data or an error.
   */
  public async getUserRewards(address: string): Promise<XoxnoRewardsResult> {
    const url = `${this.baseUrl}/user/rewards/${address}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          // Add any other required headers here, like API keys if needed
        },
        // Consider adding a timeout mechanism if fetch doesn't support it directly
        // or using a library like axios that does.
      });

      if (!response.ok) {
        let errorDetails: unknown;
        try {
          errorDetails = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (parseError) {
          errorDetails = await response.text(); // Fallback to text if JSON parsing fails
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

      // Try to parse the JSON response
      const data = await response.json();

      // Basic validation (can be enhanced with a library like Zod)
      if (!this.isValidRewardsResponse(data)) {
        return {
          success: false,
          error: {
            kind: "parsing",
            message: "Invalid API response structure",
            details: data, // Include received data for debugging
          },
        };
      }

      return {
        success: true,
        // Type assertion after validation ensures data matches the interface
        data: data as IXoxnoUserRewardsResponse,
      };
    } catch (error) {
      // Handle network errors or other fetch-related issues
      return {
        success: false,
        error: {
          kind: "network",
          message:
            error instanceof Error
              ? error.message
              : "An unknown network error occurred",
          details: error,
        },
      };
    }
  }

  /**
   * Basic validation function to check the structure of the API response.
   * Replace with more robust validation (e.g., Zod) if needed.
   *
   * @param data - The data received from the API.
   * @returns True if the data structure seems valid, false otherwise.
   */
  private isValidRewardsResponse(
    data: unknown,
  ): data is IXoxnoUserRewardsResponse {
    if (typeof data !== "object" || data === null) return false;
    const response = data as Partial<IXoxnoUserRewardsResponse>; // Use Partial for safer checking
    return (
      typeof response.providersFullRewardsData === "object" &&
      response.providersFullRewardsData !== null &&
      typeof response.totalRewards === "number" &&
      typeof response.totalRewardsPerProvider === "object" &&
      response.totalRewardsPerProvider !== null &&
      Array.isArray(response.providersWithIdentityInfo)
      // Add more checks here if needed, e.g., check array elements
    );
  }
}

// Optional: Export an instance for easy use
// export const xoxnoRewardsService = new XoxnoRewardsService();
