import { config } from "./config";

export class VolumeAPI {
  private static instance: VolumeAPI;

  private constructor() {}

  public static getInstance(): VolumeAPI {
    if (!VolumeAPI.instance) {
      VolumeAPI.instance = new VolumeAPI();
    }
    return VolumeAPI.instance;
  }

  async getVolumeData(tokenAddress: string) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DEXSCREENER_API}/${tokenAddress}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.pairs || data.pairs.length === 0) {
        throw new Error("No volume data found for this token");
      }

      // Filter and sort pairs by 24h volume
      const pairs = data.pairs
        .filter((pair: any) => pair.volume?.h24 && pair.volume.h24 > 0)
        .sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));

      // Calculate total volume
      const totalVolume = pairs.reduce((sum: number, pair: any) => 
        sum + (pair.volume?.h24 || 0), 0
      );

      // Calculate volume percentages
      const volumeData = pairs.map((pair: any) => ({
        dexId: pair.dexId,
        pairAddress: pair.pairAddress,
        baseToken: pair.baseToken,
        quoteToken: pair.quoteToken,
        volume: pair.volume.h24,
        percentage: ((pair.volume.h24 / totalVolume) * 100).toFixed(2)
      }));

      return {
        pairs: volumeData,
        totalVolume,
        dexCount: volumeData.length
      };
    } catch (error) {
      console.error("Error fetching volume data:", error);
      throw error;
    }
  }
}