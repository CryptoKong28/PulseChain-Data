"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Download, Search, Droplets } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiquidityAPI } from "@/lib/liquidity-api";
import DOMPurify from "dompurify";
import { useCSRFToken, validateCSRFToken } from "@/lib/csrf-token";
import { ethers } from "ethers";

const CHART_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
  "#D4A5A5", "#9B6B6B", "#E9D985", "#556270", "#6C5B7B"
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const radius = outerRadius * 1.4; // Increase this value to push labels further out
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs"
    >
      {`${name} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

export default function LiquidityPage() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(10);
  const csrfToken = useCSRFToken();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleHEXSearch = () => {
    setTokenName(DOMPurify.sanitize("HEX"));
    setTokenAddress(DOMPurify.sanitize("0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39"));
  };

  const isValidEthereumAddress = (address: string) => {
    try {
      ethers.getAddress(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || loading) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const submittedToken = formData.get('csrf_token') as string;
    
    if (!submittedToken || !validateCSRFToken(submittedToken)) {
      setError("Security validation failed. Please refresh the page and try again.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setCooldown(10);

    try {
      const cleanName = DOMPurify.sanitize(tokenName).substring(0, 30);
      const cleanAddress = DOMPurify.sanitize(tokenAddress);

      if (!isValidEthereumAddress(cleanAddress)) {
        throw new Error("Invalid Ethereum address format");
      }

      const api = LiquidityAPI.getInstance();
      const data = await api.getPairsData(cleanAddress);
      
      if (!data || 
          !data.pairs || 
          !Array.isArray(data.pairs)) {
        throw new Error("Invalid API response structure");
      }
      
      if (data.pairs.some((pair: any) => 
          !pair.dexId || 
          !pair.pairAddress || 
          !pair.baseToken || 
          !pair.baseToken.symbol || 
          !pair.quoteToken || 
          !pair.quoteToken.symbol || 
          !pair.liquidity || 
          typeof pair.liquidity.usd !== 'number' || 
          isNaN(pair.liquidity.usd) || 
          pair.liquidity.usd < 0)) {
        throw new Error("Invalid pair data in response");
      }

      setResults(data);
    } catch (err) {
      console.error("API Error:", err);
      setError("An unexpected error occurred. Please try again later.");
      
      if (err instanceof Error) {
        if (err.message.includes("Invalid Ethereum address")) {
          setError("Please enter a valid Ethereum address.");
        } else if (err.message.includes("API response")) {
          setError("Unable to process data. Please try again later.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    
    const content = [
      ["DEX", "Pair Address", "Base Token", "Quote Token", "Liquidity (USD)"],
      ...results.pairs.map((pair: any) => [
        DOMPurify.sanitize(pair.dexId.toString()),
        DOMPurify.sanitize(pair.pairAddress),
        DOMPurify.sanitize(pair.baseToken.symbol),
        DOMPurify.sanitize(pair.quoteToken.symbol),
        DOMPurify.sanitize(pair.liquidity.usd.toString())
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${DOMPurify.sanitize(tokenName.toLowerCase())}-liquidity.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const prepareChartData = () => {
    if (!results) return [];

    const dexLiquidity = results.pairs.reduce((acc: any, pair: any) => {
      const dex = pair.dexId;
      acc[dex] = (acc[dex] || 0) + pair.liquidity.usd;
      return acc;
    }, {});

    return Object.entries(dexLiquidity)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 10);
  };

  const chartData = prepareChartData();
  const totalLiquidity = chartData.reduce((sum, item) => sum + (item.value as number), 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4 animate-pulse">
            Token Liquidity Scanner
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Droplets className="w-6 h-6 text-cyan-500 animate-bounce" />
            <p className="text-gray-300 text-xl">Analyze DEX liquidity distribution</p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto bg-black/50 border border-cyan-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-cyan-300">
              Scan Token Liquidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleHEXSearch}
              className="w-full mb-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              Quick Search for HEX
            </Button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="csrf_token" value={csrfToken} />
              <div className="space-y-2">
                <Input
                  placeholder="Token Name (e.g., HEX)"
                  className="bg-gray-900/50 border-cyan-500/30 text-cyan-100"
                  value={tokenName}
                  onChange={(e) => setTokenName(DOMPurify.sanitize(e.target.value))}
                  disabled={loading || cooldown > 0}
                />
                <Input
                  placeholder="Token Address (required)"
                  className="bg-gray-900/50 border-cyan-500/30 text-cyan-100"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(DOMPurify.sanitize(e.target.value))}
                  disabled={loading || cooldown > 0}
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded">
                  {DOMPurify.sanitize(error)}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                disabled={loading || cooldown > 0}
              >
                {loading ? (
                  <div className="animate-spin mr-2">⚡</div>
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {loading ? "Scanning..." : cooldown > 0 ? `Wait ${cooldown}s` : "Scan Liquidity"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card className="max-w-4xl mx-auto mt-8 bg-black/50 border border-cyan-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-cyan-300">
                Liquidity Distribution for {DOMPurify.sanitize(tokenName)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-cyan-900/30 p-4 rounded-lg">
                    <p className="text-sm text-cyan-300">Total Liquidity</p>
                    <p className="text-2xl font-bold">${totalLiquidity.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-900/30 p-4 rounded-lg">
                    <p className="text-sm text-blue-300">Number of DEXs</p>
                    <p className="text-2xl font-bold">{chartData.length}</p>
                  </div>
                </div>

                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        labelLine={true}
                        label={renderCustomizedLabel}
                      >
                        {chartData.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => 
                          `$${Number(value).toLocaleString()}`
                        } 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 overflow-hidden rounded-lg border border-cyan-500/30">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-cyan-900/30">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">DEX</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Pair</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-cyan-300 uppercase tracking-wider">Liquidity</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-cyan-300 uppercase tracking-wider">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-500/10">
                        {results.pairs
                          .sort((a: any, b: any) => b.liquidity.usd - a.liquidity.usd)
                          .map((pair: any, index: number) => (
                            <tr key={index} className="hover:bg-cyan-900/20">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-900/40 text-cyan-300">
                                  {DOMPurify.sanitize(pair.dexId.toString())}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm">
                                  <span className="font-medium text-cyan-300">{DOMPurify.sanitize(pair.baseToken.symbol)}</span>
                                  <span className="text-gray-400"> / </span>
                                  <span className="font-medium text-cyan-300">{DOMPurify.sanitize(pair.quoteToken.symbol)}</span>
                                </div>
                                <div className="text-xs text-gray-400 font-mono truncate">
                                  {DOMPurify.sanitize(pair.pairAddress)}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <span className="text-sm font-medium">
                                  ${Number(DOMPurify.sanitize(pair.liquidity.usd.toString())).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <span className="text-sm font-medium">
                                  {((Number(DOMPurify.sanitize(pair.liquidity.usd.toString())) / totalLiquidity) * 100).toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Button 
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}