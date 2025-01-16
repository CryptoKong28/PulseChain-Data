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
      
      if (!data.pairs || data.pairs.length === 0) {
        throw new Error("No liquidity pairs found for this token");
      }

      return {
        pairs: data.pairs.filter((pair: any) => 
          pair.liquidity?.usd && pair.liquidity.usd > 0
        ).sort((a: any, b: any) => 
          (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        )
      };
    } catch (error) {
      console.error("Error fetching pairs data:", error);
      throw error;
    }
  }
}