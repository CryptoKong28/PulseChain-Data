"use client";

import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const api = VolumeAPI.getInstance();
      const data = await api.getVolumeData(tokenAddress);
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
    return results.pairs.map((pair: any) => ({
      name: pair.dexId,
      value: Number(pair.volume),
      percentage: pair.percentage
    }));
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Token Name (e.g., HEX)"
                  className="bg-gray-900/50 border-amber-500/30 text-amber-100"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  disabled={loading}
                />
                <Input
                  placeholder="Token Address (required)"
                  className="bg-gray-900/50 border-amber-500/30 text-amber-100"
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
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin mr-2">⚡</div>
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {loading ? "Scanning..." : "Scan Volume"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card className="max-w-4xl mx-auto mt-8 bg-black/50 border border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-amber-300">
                Volume Distribution for {tokenName}
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

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareChartData()}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={({ name, percent }) => 
                          `${name} (${(percent * 100).toFixed(1)}%)`
                        }
                      >
                        {prepareChartData().map((_, index) => (
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