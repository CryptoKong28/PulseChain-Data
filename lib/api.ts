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
        
        tokenInfo = {
          name: await this.retry(() => contract.methods.name().call()),
          symbol: await this.retry(() => contract.methods.symbol().call()),
          decimals: await this.retry(() => contract.methods.decimals().call()),
          totalSupply: await this.retry(() => contract.methods.totalSupply().call()),
        };
      }

      const burnDetails = await Promise.all(
        config.burnAddresses.map(async (address) => {
          let balance: string;
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
          return {
            address,
            amount: Number(this.web3.utils.fromWei(balance, "ether")).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
          };
        })
      );

      const totalBurned = burnDetails.reduce(
        (acc, curr) => acc + Number(curr.amount.replace(/,/g, '')),
        0
      );

      return {
        ...tokenInfo,
        totalBurned: totalBurned.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        burnPercentage: tokenInfo.totalSupply
          ? ((totalBurned / Number(this.web3.utils.fromWei(tokenInfo.totalSupply, "ether"))) * 100).toFixed(2)
          : "N/A",
        burnDetails,
      };
    } catch (error) {
      console.error("Error scanning burned tokens:", error);
      throw error;
    }
  }
}