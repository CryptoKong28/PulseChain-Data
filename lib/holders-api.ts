import { config } from "./config";

export class HoldersAPI {
  private static instance: HoldersAPI;
  private queryTimeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  private constructor() {
    this.queryTimeout = config.query.timeout;
    this.retryAttempts = config.query.retry.attempts;
    this.retryDelay = config.query.retry.delay;
  }

  public static getInstance(): HoldersAPI {
    if (!HoldersAPI.instance) {
      HoldersAPI.instance = new HoldersAPI();
    }
    return HoldersAPI.instance;
  }

  private async fetchWithRetry(url: string): Promise<any> {
    let lastError: Error;
    
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.queryTimeout);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    throw lastError!;
  }

  async getTokenHolders(tokenAddress: string) {
    try {
      const baseUrl = `${config.scan.api}/tokens/${tokenAddress}/holders`;
      const holders: any[] = [];
      let nextPageParams: any = null;
      
      do {
        const url = nextPageParams 
          ? `${baseUrl}?${new URLSearchParams(nextPageParams).toString()}`
          : baseUrl;
        
        const data = await this.fetchWithRetry(url);
        
        if (!data.items || data.items.length === 0) break;
        
        holders.push(...data.items.map((item: any) => ({
          address: item.address.hash,
          balance: item.value,
          percentage: item.percentage,
        })));
        
        nextPageParams = data.next_page_params;
      } while (nextPageParams && holders.length < config.query.limit);

      const totalHolders = holders.length;
      const totalSupply = holders.reduce((sum, holder) => sum + Number(holder.balance), 0);
      
      // Sort holders by balance in descending order
      const sortedHolders = holders.sort((a, b) => Number(b.balance) - Number(a.balance));
      
      // Calculate distribution metrics
      const top10Holders = sortedHolders.slice(0, 10);
      const top10Percentage = top10Holders.reduce((sum, holder) => 
        sum + Number(holder.percentage), 0
      );
      
      return {
        totalHolders,
        totalSupply,
        top10Percentage,
        holders: sortedHolders,
      };
    } catch (error) {
      console.error("Error fetching holders data:", error);
      throw error;
    }
  }
}