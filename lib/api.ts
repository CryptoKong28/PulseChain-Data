import { Web3 } from "web3";
import { config, ERC20_ABI } from "./config";

export class TokenAPI {
  private web3: Web3;
  private static instance: TokenAPI;
  private queryTimeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  private constructor() {
    this.web3 = new Web3(config.rpc.endpoint);
    this.queryTimeout = config.query.timeout;
    this.retryAttempts = config.query.retry.attempts;
    this.retryDelay = config.query.retry.delay;
  }

  public static getInstance(): TokenAPI {
    if (!TokenAPI.instance) {
      TokenAPI.instance = new TokenAPI();
    }
    return TokenAPI.instance;
  }

  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        return await Promise.race([
          fn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Query timeout")), this.queryTimeout)
          ),
        ]) as T;
      } catch (error) {
        lastError = error as Error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    throw lastError!;
  }

  async scanBurnedTokens(name: string, tokenAddress?: string) {
    try {
      const isNativeToken = name.toLowerCase() === config.token.native.symbol.toLowerCase();
      let tokenInfo: any = {};

      if (isNativeToken) {
        const balance = await this.retry(() => this.web3.eth.getBalance(this.web3.utils.toChecksumAddress(config.burnAddresses[0])));
        tokenInfo = {
          name: config.token.native.name,
          symbol: config.token.native.symbol,
          decimals: config.token.native.decimals,
          totalSupply: balance ? balance.toString() : "0",
        };
      } else {
        if (!tokenAddress) {
          throw new Error("Token address is required for non-PLS tokens");
        }
        const contract = new this.web3.eth.Contract(
          ERC20_ABI,
          this.web3.utils.toChecksumAddress(tokenAddress)
        );
        
        try {
          const [name, symbol, decimals, totalSupply] = await Promise.all([
            this.retry(() => contract.methods.name().call()).catch(() => "Unknown"),
            this.retry(() => contract.methods.symbol().call()).catch(() => "Unknown"),
            this.retry(() => contract.methods.decimals().call()).catch(() => "18"),
            this.retry(() => contract.methods.totalSupply().call()),
          ]);
          
          tokenInfo = {
            name: name || "Unknown",
            symbol: symbol || "Unknown",
            decimals: Number(decimals || 18),
            totalSupply: totalSupply ? totalSupply.toString() : "0",
          };
        } catch (error) {
          console.error("Error fetching token info:", error);
          tokenInfo = {
            name: name || "Unknown",
            symbol: "Unknown",
            decimals: 18,
            totalSupply: "0",
          };
        }
      }

      const burnDetails = await Promise.all(
        config.burnAddresses.map(async (address) => {
          let balance: string;
          try {
            if (isNativeToken) {
              const result = await this.retry(() => this.web3.eth.getBalance(address));
              balance = result ? result.toString() : "0";
            } else {
              const contract = new this.web3.eth.Contract(
                ERC20_ABI,
                this.web3.utils.toChecksumAddress(tokenAddress!)
              );
              const result = await this.retry(() => contract.methods.balanceOf(address).call());
              balance = result ? result.toString() : "0";
            }
          } catch (error) {
            console.error(`Error fetching balance for ${address}:`, error);
            balance = "0";
          }
          
          // Safely convert balance to a number format
          let formattedBalance: string;
          let rawAmount: number = 0;
          
          try {
            // First get the raw number value for validation
            const rawNumber = Number(this.web3.utils.fromWei(balance, "ether"));
            // Store raw number for calculations
            rawAmount = !isNaN(rawNumber) ? rawNumber : 0;
            
            // Format it for display
            formattedBalance = rawNumber.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          } catch (error) {
            console.error("Error formatting balance:", error);
            formattedBalance = "0.00";
            rawAmount = 0;
          }
          
          return {
            address,
            amount: formattedBalance,
            // Use the directly calculated raw amount instead of parsing the formatted string
            rawAmount: rawAmount
          };
        })
      );

      // Safely calculate total burned
      let totalBurned = 0;
      try {
        totalBurned = burnDetails.reduce(
          (acc, curr) => {
            // Use the rawAmount which is already a number
            return isNaN(curr.rawAmount) ? acc : acc + curr.rawAmount;
          },
          0
        );
      } catch (error) {
        console.error("Error calculating total burned:", error);
      }

      // Safely calculate burn percentage
      let burnPercentage = "0.00";
      try {
        if (tokenInfo.totalSupply && tokenInfo.totalSupply !== "0") {
          const totalSupplyNumber = Number(this.web3.utils.fromWei(tokenInfo.totalSupply, "ether"));
          if (!isNaN(totalSupplyNumber) && totalSupplyNumber > 0) {
            burnPercentage = ((totalBurned / totalSupplyNumber) * 100).toFixed(2);
          }
        }
      } catch (error) {
        console.error("Error calculating burn percentage:", error);
      }

      return {
        ...tokenInfo,
        totalBurned: totalBurned.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        burnPercentage,
        burnDetails,
      };
    } catch (error) {
      console.error("Error scanning burned tokens:", error);
      throw error;
    }
  }
}