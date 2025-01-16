"use client";

import { useState } from "react";
import { Download, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoldersAPI } from "@/lib/holders-api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function HoldersPage() {
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
      const api = HoldersAPI.getInstance();
      const data = await api.getTokenHolders(tokenAddress);
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
      ["Address", "Balance", "Percentage"],
      ...results.holders.map((holder: any) => [
        holder.address,
        holder.balance,
        holder.percentage
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tokenName.toLowerCase()}-holders.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const prepareChartData = () => {
    if (!results) return [];
    return results.holders
      .slice(0, 50)
      .map((holder: any, index: number) => ({
        address: `#${index + 1}`,
        balance: Number(holder.percentage).toFixed(2),
        tooltipAddress: holder.address,
      }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600 mb-4 animate-pulse">
            Token Holders Scanner
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-emerald-500 animate-bounce" />
            <p className="text-gray-300 text-xl">Analyze token holder distribution</p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto bg-black/50 border border-emerald-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-emerald-300">
              Scan Token Holders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Token Name (e.g., HEX)"
                  className="bg-gray-900/50 border-emerald-500/30 text-emerald-100"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  disabled={loading}
                />
                <Input
                  placeholder="Token Address (required)"
                  className="bg-gray-900/50 border-emerald-500/30 text-emerald-100"
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
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin mr-2">⚡</div>
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {loading ? "Scanning..." : "Scan Holders"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card className="max-w-4xl mx-auto mt-8 bg-black/50 border border-emerald-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-emerald-300">
                Holder Distribution for {tokenName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-900/30 p-4 rounded-lg">
                    <p className="text-sm text-emerald-300">Total Holders</p>
                    <p className="text-2xl font-bold">{results.totalHolders.toLocaleString()}</p>
                  </div>
                  <div className="bg-teal-900/30 p-4 rounded-lg">
                    <p className="text-sm text-teal-300">Top 10 Holders</p>
                    <p className="text-2xl font-bold">{results.top10Percentage.toFixed(2)}%</p>
                  </div>
                  <div className="bg-cyan-900/30 p-4 rounded-lg">
                    <p className="text-sm text-cyan-300">Total Supply</p>
                    <p className="text-2xl font-bold">{Number(results.totalSupply).toLocaleString()}</p>
                  </div>
                </div>

                <div className="h-[400px] w-full bg-black/20 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareChartData()}>
                      <XAxis dataKey="address" />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-black/90 p-2 rounded border border-emerald-500/30">
                                <p className="text-emerald-300">
                                  Address: {payload[0].payload.tooltipAddress}
                                </p>
                                <p className="text-white">
                                  Percentage: {payload[0].value}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="balance"
                        fill="#059669"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Button 
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
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