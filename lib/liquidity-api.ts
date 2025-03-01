import { config } from "./config";

export class LiquidityAPI {
  private static instance: LiquidityAPI;

  private constructor() {}

  public static getInstance(): LiquidityAPI {
    if (!LiquidityAPI.instance) {
      LiquidityAPI.instance = new LiquidityAPI();
    }
    return LiquidityAPI.instance;
  }

  async getPairsData(tokenAddress: string) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DEXSCREENER_API}/${tokenAddress}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate basic API structure
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid API response format");
      }
      
      if (!data.pairs || !Array.isArray(data.pairs)) {
        throw new Error("No liquidity pairs found for this token");
      }

      // Filter valid pairs and validate each one
      const validPairs = data.pairs.filter((pair: any) => {
        if (!pair || typeof pair !== 'object') return false;
        if (!pair.dexId || !pair.pairAddress) return false;
        if (!pair.baseToken || !pair.baseToken.symbol) return false;
        if (!pair.quoteToken || !pair.quoteToken.symbol) return false;
        if (!pair.liquidity || typeof pair.liquidity !== 'object') return false;
        if (typeof pair.liquidity.usd !== 'number' || isNaN(pair.liquidity.usd) || pair.liquidity.usd <= 0) return false;
        
        return true;
      }).sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

      if (validPairs.length === 0) {
        throw new Error("No valid liquidity pairs found for this token");
      }

      return {
        pairs: validPairs
      };
    } catch (error) {
      console.error("Error fetching pairs data:", error);
      throw error;
    }
  }
}