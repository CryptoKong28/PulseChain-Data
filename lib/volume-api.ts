import { config } from "./config";

export class VolumeAPI {
  private static instance: VolumeAPI;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  private constructor() {}

  public static getInstance(): VolumeAPI {
    if (!VolumeAPI.instance) {
      VolumeAPI.instance = new VolumeAPI();
    }
    return VolumeAPI.instance;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(url: string, attempt = 1): Promise<any> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.pairs || !Array.isArray(data.pairs)) {
        throw new Error("Invalid response format");
      }

      return data;
    } catch (error) {
      if (attempt < this.MAX_RETRIES) {
        console.log(`Attempt ${attempt} failed, retrying...`);
        await this.delay(this.RETRY_DELAY);
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }

  async getVolumeData(tokenAddress: string) {
    try {
      const data = await this.fetchWithRetry(`${config.dex.api}/${tokenAddress}`);
      
      // Filter and sort pairs by 24h volume
      const pairs = data.pairs
        .filter((pair: any) => 
          pair.volume?.h24 && 
          pair.volume.h24 > 0 &&
          pair.dexId && 
          pair.pairAddress
        )
        .sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));

      if (pairs.length === 0) {
        throw new Error("No active trading pairs found for this token");
      }

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