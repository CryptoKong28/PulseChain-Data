"use client";

import { useState, useEffect } from "react";
import { Download, Search, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VolumeAPI } from "@/lib/volume-api";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import { ethers } from "ethers";
import DOMPurify from "dompurify";

const CHART_COLORS = [
  "#F59E0B", "#D97706", "#B45309", "#92400E", "#78350F",
  "#FB923C", "#EA580C", "#C2410C", "#9A3412", "#7C2D12"
];

export default function VolumePage() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(10);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const isValidEthereumAddress = (address: string) => {
    try {
      return ethers.getAddress(address.toLowerCase()) === address.toLowerCase();
    } catch {
      return false;
    }
  };

  const handlePTGCSearch = () => {
    setTokenName(DOMPurify.sanitize("PTGC"));
    setTokenAddress(DOMPurify.sanitize("0x94534EeEe131840b1c0F61847c572228bdfDDE93"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isValidEthereumAddress(tokenAddress)) {
        throw new Error("Invalid Ethereum address format");
      }

      const burnAddresses = process.env.NEXT_PUBLIC_BURN_ADDRESSES?.split(',') || [];
      if (burnAddresses.includes(tokenAddress.toLowerCase())) {
        throw new Error("Cannot scan burn address");
      }

      const cleanTokenName = DOMPurify.sanitize(tokenName).substring(0, 30);
      const cleanTokenAddress = tokenAddress.toLowerCase();

      const api = VolumeAPI.getInstance();
      const data = await api.getVolumeData(cleanTokenAddress);
      
      if (!data || 
          !data.pairs || 
          !Array.isArray(data.pairs) || 
          typeof data.totalVolume !== 'number' ||
          typeof data.dexCount !== 'number') {
        throw new Error("Invalid API response structure");
      }

      setResults(data);
      setTokenName(cleanTokenName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    
    const csvContent = [
      ["DEX", "Pair Address", "Base Token", "Quote Token", "24h Volume", "Percentage"],
      ...results.pairs.map((pair: any) => [
        pair.dexId,
        pair.pairAddress,
        pair.baseToken.symbol,
        pair.quoteToken.symbol,
        pair.volume,
        pair.percentage
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tokenName.toLowerCase()}-volume.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const prepareChartData = () => {
    if (!results) return [];

    // Group by DEX and calculate total volume
    const dexVolumes = results.pairs.reduce((acc: any, pair: any) => {
      const dex = pair.dexId;
      acc[dex] = (acc[dex] || 0) + pair.volume;
      return acc;
    }, {});

    // Convert to array and calculate percentages
    let chartData = Object.entries(dexVolumes)
      .map(([name, value]) => ({
        name,
        value: value as number,
        percentage: ((value as number) / results.totalVolume) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Group small percentages into "Others"
    const THRESHOLD = 1; // Only show DEXs with more than 1% share
    const mainDexes = chartData.filter(item => item.percentage >= THRESHOLD);
    const others = chartData.filter(item => item.percentage < THRESHOLD);

    if (others.length > 0) {
      const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
      const othersPercentage = (othersTotal / results.totalVolume) * 100;
      
      chartData = [
        ...mainDexes,
        {
          name: 'Others',
          value: othersTotal,
          percentage: othersPercentage
        }
      ];
    }

    return chartData;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index }: any) => {
    // Increase radius for labels
    const radius = outerRadius * 1.2;
    
    // Calculate position
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is significant
    if (percent < 0.01) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${name} (${(percent * 100).toFixed(1)}%)`}
      </text>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600 mb-4 animate-pulse">
            Token Volume Scanner
          </h1>
          <div className="flex items-center justify-center gap-2">
            <BarChart2 className="w-6 h-6 text-amber-500 animate-bounce" />
            <p className="text-gray-300 text-xl">Analyze 24h trading volume distribution</p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto bg-black/50 border border-amber-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-amber-300">
              Scan Token Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handlePTGCSearch}
              className="w-full mb-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Quick Search for pTGC
            </Button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Token Name (e.g., HEX)"
                  className="bg-gray-900/50 border-amber-500/30 text-amber-100"
                  value={tokenName}
                  onChange={(e) => setTokenName(DOMPurify.sanitize(e.target.value))}
                  disabled={loading || cooldown > 0}
                />
                <Input
                  placeholder="Token Address (required)"
                  className="bg-gray-900/50 border-amber-500/30 text-amber-100"
                  value={tokenAddress}
                  onChange={(e) => {
                    const cleanAddress = DOMPurify.sanitize(e.target.value);
                    setTokenAddress(cleanAddress)
                  }}
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
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                disabled={loading || cooldown > 0}
              >
                {loading ? (
                  <div className="animate-spin mr-2">⚡</div>
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {loading ? "Scanning..." : cooldown > 0 ? `Wait ${cooldown}s` : "Scan Volume"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card className="max-w-4xl mx-auto mt-8 bg-black/50 border border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-amber-300">
                Volume Distribution for {tokenName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-900/30 p-4 rounded-lg">
                    <p className="text-sm text-amber-300">Total 24h Volume</p>
                    <p className="text-2xl font-bold">${results.totalVolume.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-900/30 p-4 rounded-lg">
                    <p className="text-sm text-orange-300">Active DEXs</p>
                    <p className="text-2xl font-bold">{results.dexCount}</p>
                  </div>
                </div>

                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareChartData()}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {prepareChartData().map((entry, index) => (
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

                <div className="mt-8 overflow-hidden rounded-lg border border-amber-500/30">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-amber-900/30">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">DEX</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Pair</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-amber-300 uppercase tracking-wider">24h Volume</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-amber-300 uppercase tracking-wider">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-500/10">
                        {results.pairs
                          .sort((a: any, b: any) => b.volume - a.volume)
                          .map((pair: any, index: number) => (
                            <tr key={index} className="hover:bg-amber-900/20">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-900/40 text-amber-300">
                                  {DOMPurify.sanitize(pair.dexId.toString())}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm">
                                  <span className="font-medium text-amber-300">{pair.baseToken.symbol}</span>
                                  <span className="text-gray-400"> / </span>
                                  <span className="font-medium text-amber-300">{pair.quoteToken.symbol}</span>
                                </div>
                                <div className="text-xs text-gray-400 font-mono truncate">
                                  {pair.pairAddress}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <span className="text-sm font-medium">
                                  ${Number(pair.volume).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <span className="text-sm font-medium">
                                  {pair.percentage}%
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
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
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