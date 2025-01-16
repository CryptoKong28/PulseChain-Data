"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Download, Search, Droplets } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiquidityAPI } from "@/lib/liquidity-api";

const CHART_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
  "#D4A5A5", "#9B6B6B", "#E9D985", "#556270", "#6C5B7B"
];

export default function LiquidityPage() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const api = LiquidityAPI.getInstance();
      const data = await api.getPairsData(tokenAddress);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    
    const csvContent = [
      ["DEX", "Pair Address", "Base Token", "Quote Token", "Liquidity (USD)"],
      ...results.pairs.map((pair: any) => [
        pair.dexId,
        pair.pairAddress,
        pair.baseToken.symbol,
        pair.quoteToken.symbol,
        pair.liquidity.usd
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tokenName.toLowerCase()}-liquidity.csv`;
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Token Name (e.g., HEX)"
                  className="bg-gray-900/50 border-cyan-500/30 text-cyan-100"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  disabled={loading}
                />
                <Input
                  placeholder="Token Address (required)"
                  className="bg-gray-900/50 border-cyan-500/30 text-cyan-100"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin mr-2">⚡</div>
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {loading ? "Scanning..." : "Scan Liquidity"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card className="max-w-4xl mx-auto mt-8 bg-black/50 border border-cyan-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-cyan-300">
                Liquidity Distribution for {results.pairs[0]?.baseToken.symbol || tokenName}
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

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={({ name, percent }) => 
                          `${name} (${(percent * 100).toFixed(1)}%)`
                        }
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
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
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