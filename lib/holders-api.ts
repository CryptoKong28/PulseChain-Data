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
    try {
      const contract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);
      const [decimals, totalSupply] = await Promise.all([
        contract.methods.decimals().call().catch(() => "18"), // Default to 18 if decimals call fails
        contract.methods.totalSupply().call(),
      ]);
      
      if (!totalSupply) {
        throw new Error("Failed to retrieve total supply");
      }
      
      return { 
        decimals: Number(decimals || 18), // Ensure we have a fallback
        totalSupply: totalSupply.toString() 
      };
    } catch (error) {
      console.error("Error retrieving token info:", error);
      throw new Error("Failed to retrieve token information");
    }
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

      // Ensure totalSupply is not NaN when converted to Number
      if (isNaN(Number(totalSupplyAdjusted))) {
        throw new Error("Invalid total supply value");
      }

      do {
        try {
          // Construct URL with pagination parameters
          const url = nextPageParams
            ? `${config.scan.api}/tokens/${tokenAddress}/holders?${new URLSearchParams(nextPageParams)}`
            : `${config.scan.api}/tokens/${tokenAddress}/holders`;

          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch holders data');
          
          const data = await response.json();
          
          // Validate response data
          if (!data || !data.items || !Array.isArray(data.items)) {
            throw new Error("Invalid holders data format");
          }
          
          // Process current batch
          for (const item of data.items) {
            try {
              if (!item || !item.address || !item.address.hash || !item.value) {
                console.warn("Skipping invalid holder item:", item);
                continue;
              }
              
              const balanceRaw = BigInt(item.value);
              const balanceAdjusted = balanceRaw / divisor;
              const balanceStr = balanceAdjusted.toString();
              
              // Calculate percentage safely
              let percentage = 0;
              try {
                percentage = (Number(balanceAdjusted) / Number(totalSupplyAdjusted)) * 100;
                // Ensure percentage is a valid number and within bounds
                if (isNaN(percentage) || percentage < 0) percentage = 0;
                if (percentage > 100) percentage = 100;
              } catch (err) {
                console.error("Error calculating percentage:", err);
              }
              
              holders.push({
                address: item.address.hash,
                balance: balanceStr,
                percentage: parseFloat(percentage.toFixed(2))
              });

              processedHolders++;
              if (this.progressCallback) {
                this.progressCallback(processedHolders, Math.min(TARGET_HOLDERS, data.total_count || TARGET_HOLDERS));
              }

              if (processedHolders >= TARGET_HOLDERS) {
                break;
              }
            } catch (itemError) {
              console.error("Error processing holder item:", itemError);
              // Continue with next item
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
        } catch (batchError) {
          console.error("Error fetching holder batch:", batchError);
          // Try to continue with next batch if possible
          if (nextPageParams) {
            await this.delay(this.DELAY_BETWEEN_BATCHES * 2); // Longer delay after error
          } else {
            break; // No more batches to process
          }
        }
      } while (nextPageParams);

      if (holders.length === 0) {
        throw new Error("No holder data found for this token");
      }

      // Calculate top 10 percentage safely
      let top10Total = 0;
      try {
        top10Total = holders
          .slice(0, Math.min(10, holders.length))
          .reduce((acc, holder) => acc + holder.percentage, 0);
          
        // Ensure top10Total is a valid number
        if (isNaN(top10Total) || top10Total < 0) top10Total = 0;
        if (top10Total > 100) top10Total = 100;
      } catch (error) {
        console.error("Error calculating top 10 percentage:", error);
      }

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