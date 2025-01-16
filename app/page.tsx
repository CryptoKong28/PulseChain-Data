"use client";

import { useState } from "react";
import { Download, Flame, Search, Code, GitBranch, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenAPI } from "@/lib/api";

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick input for INC token
  const handleINCSearch = () => {
    setTokenName("INC");
    setTokenAddress("0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const api = TokenAPI.getInstance();
      const data = await api.scanBurnedTokens(tokenName, tokenAddress);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    const data = `${results.name.toLowerCase()},${tokenAddress || "PLS"},${results.totalBurned}`;
    const blob = new Blob([data], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${results.name.toLowerCase()}-burned.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6 animate-pulse">
            PulseChain Token Scanner
          </h1>
          <p className="text-gray-300 text-xl mb-8 max-w-3xl mx-auto">
            A modern web interface for RHMax&apos;s PulseChain Downloadable Data tools. Analyze tokens with beautiful visualizations and downloadable data.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <Card className="bg-black/30 border border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <Terminal className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Command Line Tools</h3>
                <p className="text-gray-400 text-sm">
                  Based on RHMax&apos;s Python scripts for PulseChain data analysis
                </p>
              </CardContent>
            </Card>
            <Card className="bg-black/30 border border-pink-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <Code className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-pink-300 mb-2">Modern Interface</h3>
                <p className="text-gray-400 text-sm">
                  Beautiful visualizations and intuitive UI for token analysis
                </p>
              </CardContent>
            </Card>
            <Card className="bg-black/30 border border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <GitBranch className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Open Source</h3>
                <p className="text-gray-400 text-sm">
                  Free and open source, built by the community for the community
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center gap-4 mb-16">
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => window.open("https://github.com/rhmaxdotorg/downloadable-data-pulsechain", "_blank")}
            >
              <GitBranch className="mr-2 h-4 w-4" />
              View Original Tools
            </Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700"
              onClick={() => window.open("https://github.com/your-repo-url", "_blank")}
            >
              <Code className="mr-2 h-4 w-4" />
              View Frontend Code
            </Button>
          </div>
        </div>

        {/* Token Burns Scanner */}
        <Card className="max-w-2xl mx-auto bg-black/50 border border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-purple-300">
              Scan Burned Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleINCSearch}
              className="w-full mb-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              Quick Search for INC
            </Button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Token Name (e.g., PLS)"
                  className="bg-gray-900/50 border-purple-500/30 text-purple-100"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  disabled={loading}
                />
                <Input
                  placeholder="Token Address (optional for PLS)"
                  className="bg-gray-900/50 border-purple-500/30 text-purple-100"
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
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin mr-2">⚡</div>
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {loading ? "Scanning..." : "Scan Token"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card className="max-w-2xl mx-auto mt-8 bg-black/50 border border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-purple-300">
                Results for {results.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-300">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-purple-900/30 p-4 rounded-lg">
                    <p className="text-sm text-purple-300">Total Supply</p>
                    <p className="text-2xl font-bold break-all">{results.totalSupply ? Number(results.totalSupply).toLocaleString() : "N/A"}</p>
                  </div>
                  <div className="bg-pink-900/30 p-4 rounded-lg">
                    <p className="text-sm text-pink-300">Total Burned</p>
                    <p className="text-2xl font-bold break-all">{results.totalBurned}</p>
                  </div>
                </div>
                
                <div className="bg-gray-900/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Burn Details</p>
                  {results.burnDetails.map((detail: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-purple-500/20">
                      <span className="text-sm font-mono">{detail.address}</span>
                      <span className="text-purple-300 break-all ml-4">{detail.amount}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}