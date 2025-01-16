import { Web3 } from "web3";
import { config, ERC20_ABI } from "./config";

export class HoldersAPI {
  private web3: Web3;
  private static instance: HoldersAPI;
  private progressCallback?: (current: number, total: number) => void;
  private readonly BATCH_SIZE = 50; // Fetch 50 holders at a time
  private readonly DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

  private constructor() {
    this.web3 = new Web3(config.rpc.endpoint);
  }

  public static getInstance(): HoldersAPI {
    if (!HoldersAPI.instance) {
      HoldersAPI.instance = new HoldersAPI();
    }
    return HoldersAPI.instance;
  }

  public onProgress(callback: (current: number, total: number) => void) {
    this.progressCallback = callback;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getTokenInfo(tokenAddress: string) {
    const contract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);
    const [decimals, totalSupply] = await Promise.all([
      contract.methods.decimals().call(),
      contract.methods.totalSupply().call(),
    ]);
    return { decimals: Number(decimals), totalSupply: totalSupply.toString() };
  }

  async getTokenHolders(tokenAddress: string) {
    try {
      const holders = [];
      let nextPageParams = null;
      let processedHolders = 0;
      const TARGET_HOLDERS = 200;

      const { decimals, totalSupply } = await this.getTokenInfo(tokenAddress);
      const divisor = BigInt(10 ** decimals);
      const totalSupplyAdjusted = (BigInt(totalSupply) / divisor).toString();

      do {
        // Construct URL with pagination parameters
        const url = nextPageParams
          ? `${config.scan.api}/tokens/${tokenAddress}/holders?${new URLSearchParams(nextPageParams)}`
          : `${config.scan.api}/tokens/${tokenAddress}/holders`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch holders data');
        
        const data = await response.json();
        
        // Process current batch
        for (const item of data.items) {
          const balanceRaw = BigInt(item.value);
          const balanceAdjusted = balanceRaw / divisor;
          
          holders.push({
            address: item.address.hash,
            balance: balanceAdjusted.toString(),
            percentage: ((Number(balanceAdjusted) / Number(totalSupplyAdjusted)) * 100).toFixed(2),
          });

          processedHolders++;
          if (this.progressCallback) {
            this.progressCallback(processedHolders, Math.min(TARGET_HOLDERS, data.total_count));
          }

          if (processedHolders >= TARGET_HOLDERS) {
            break;
          }
        }

        // Get next page parameters
        nextPageParams = data.next_page_params;

        // Break if we've reached our target
        if (processedHolders >= TARGET_HOLDERS) {
          break;
        }

        // Add delay before next batch
        await this.delay(this.DELAY_BETWEEN_BATCHES);

      } while (nextPageParams);

      const top10Total = holders
        .slice(0, 10)
        .reduce((acc, holder) => acc + Number(holder.percentage), 0);

      return {
        holders,
        totalHolders: processedHolders,
        totalSupply: totalSupplyAdjusted,
        top10Percentage: top10Total,
      };
    } catch (error) {
      console.error("Error fetching holders:", error);
      throw error;
    }
  }
}