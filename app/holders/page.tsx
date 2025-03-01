"use client";

import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { useCSRFToken, validateCSRFToken } from "@/lib/csrf-token";
import { ethers } from "ethers";

export default function HoldersPage() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
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

  const handleICSASearch = () => {
    setTokenName(DOMPurify.sanitize("ICSA"));
    setTokenAddress(DOMPurify.sanitize("0xfc4913214444aF5c715cc9F7b52655e788A569ed"));
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
    setProgress(0);
    setCooldown(10);

    try {
      const cleanName = DOMPurify.sanitize(tokenName).substring(0, 30);
      const cleanAddress = DOMPurify.sanitize(tokenAddress);

      if (!isValidEthereumAddress(cleanAddress)) {
        throw new Error("Invalid Ethereum address format");
      }

      const api = HoldersAPI.getInstance();
      
      api.onProgress((current, total) => {
        const percentage = (current / total) * 100;
        setProgress(percentage);
      });

      const data = await api.getTokenHolders(cleanAddress);
      if (!data || 
          !data.holders || 
          !Array.isArray(data.holders) ||
          typeof data.totalHolders !== 'number' ||
          isNaN(data.totalHolders) ||
          data.totalHolders < 0 ||
          typeof data.top10Percentage !== 'number' ||
          isNaN(data.top10Percentage) ||
          data.top10Percentage < 0 ||
          data.top10Percentage > 100 ||
          typeof data.totalSupply !== 'string' ||
          isNaN(Number(data.totalSupply))) {
        throw new Error("Invalid API response structure");
      }
      
      // Validate individual holder data
      if (data.holders.some((holder: any) => 
          !holder.address || 
          typeof holder.address !== 'string' ||
          typeof holder.balance !== 'string' ||
          isNaN(Number(holder.balance)) ||
          typeof holder.percentage !== 'number' ||
          isNaN(holder.percentage) ||
          holder.percentage < 0 ||
          holder.percentage > 100)) {
        throw new Error("Invalid holder data in response");
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
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    
    const content = [
      ["Address", "Balance", "Percentage"],
      ...results.holders.map((holder: any) => [
        DOMPurify.sanitize(holder.address),
        DOMPurify.sanitize(holder.balance.toString()),
        DOMPurify.sanitize(holder.percentage.toString())
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${DOMPurify.sanitize(tokenName.toLowerCase())}-holders.txt`;
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
        actualBalance: holder.balance,
      }));
  };

  const handleBarClick = (data: any) => {
    if (data && data.tooltipAddress) {
      navigator.clipboard.writeText(DOMPurify.sanitize(data.tooltipAddress));
      toast.success("Address copied to clipboard!");
    }
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
            <Button 
              onClick={handleICSASearch}
              className="w-full mb-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700"
            >
              Quick Search for ICSA
            </Button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="csrf_token" value={csrfToken} />
              <div className="space-y-2">
                <Input
                  placeholder="Token Name (e.g., HEX)"
                  className="bg-gray-900/50 border-emerald-500/30 text-emerald-100"
                  value={tokenName}
                  onChange={(e) => setTokenName(DOMPurify.sanitize(e.target.value))}
                  disabled={loading || cooldown > 0}
                />
                <Input
                  placeholder="Token Address (required)"
                  className="bg-gray-900/50 border-emerald-500/30 text-emerald-100"
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
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={loading || cooldown > 0}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2">⚡</div>
                    <span>Scanning (This may take a moment)</span>
                  </div>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {cooldown > 0 ? `Wait ${cooldown}s` : "Scan Holders"}
                  </>
                )}
              </Button>
              {loading && (
                <div className="mt-2 text-center text-sm text-emerald-300">
                  Please be patient while we fetch the data...
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card className="max-w-4xl mx-auto mt-8 bg-black/50 border border-emerald-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-emerald-300">
                Holder Distribution for {DOMPurify.sanitize(tokenName)}
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
                                <p className="text-emerald-300 cursor-pointer hover:text-emerald-400" 
                                   onClick={() => handleBarClick(payload[0].payload)}>
                                  {DOMPurify.sanitize(payload[0].payload.tooltipAddress)} (Click to copy)
                                </p>
                                <p className="text-white">
                                  Balance: {payload[0].payload.actualBalance ? DOMPurify.sanitize(payload[0].payload.actualBalance.toLocaleString()) : "0"} tokens
                                </p>
                                <p className="text-white">
                                  Percentage: {payload[0].value ? DOMPurify.sanitize(payload[0].value.toString()) : "0"}%
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
                        cursor="pointer"
                        onClick={(data) => handleBarClick(data)}
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