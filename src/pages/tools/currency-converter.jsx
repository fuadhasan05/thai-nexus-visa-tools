
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, RefreshCw, TrendingUp } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import SEOHead from '../../components/SEOHead';

export default function CurrencyConverter() {
  const [thbAmount, setThbAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(35);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const fetchExchangeRate = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const rate = data.rates.THB;
      setExchangeRate(rate);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // call fetch in an async initializer to avoid synchronous setState warnings
    const init = async () => {
      await fetchExchangeRate();
    };
    init();
  }, []);

  const handleThbChange = (value) => {
    setThbAmount(value);
    if (value && !isNaN(value)) {
      const usd = (parseFloat(value) / exchangeRate).toFixed(2);
      setUsdAmount(usd);
    } else {
      setUsdAmount('');
    }
  };

  const handleUsdChange = (value) => {
    setUsdAmount(value);
    if (value && !isNaN(value)) {
      const thb = (parseFloat(value) * exchangeRate).toFixed(2);
      setThbAmount(thb);
    } else {
      setThbAmount('');
    }
  };

  const commonAmounts = [
    { thb: 1900, label: 'Visa Extension' },
    { thb: 10000, label: 'Agent Fee (Low)' },
    { thb: 15000, label: 'Agent Fee (Mid)' },
    { thb: 500000, label: 'DTV Requirement' },
    { thb: 800000, label: 'Retirement Requirement' },
  ];

  return (
    <>
      <SEOHead page="CurrencyConverter" />
      <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
  <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#272262] via-[#3d3680] to-[#272262] p-10 text-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
            <DollarSign className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">Real-Time Exchange Rates</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Thailand Currency Converter</h1>
          <p className="text-white/90 text-lg">Convert Thai Baht to US Dollars for visa costs and financial planning</p>
        </div>
      </div>

      {/* Exchange Rate Card */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-[#BF1E2E]" />
              <span className="text-sm text-[#454545] font-medium">Current Exchange Rate</span>
            </div>
            <div className="text-3xl font-bold text-[#272262]">
              1 USD = {exchangeRate.toFixed(2)} THB
            </div>
            <div className="text-xs text-[#454545] mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
          <Button
            onClick={fetchExchangeRate}
            disabled={loading}
            variant="outline"
            className="border border-[#272262] text-[#272262] bg-white hover:bg-[#F8F9FA]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {/* Converter */}
      <GlassCard className="p-8">
        <h2 className="text-2xl font-bold text-[#272262] mb-6">Currency Converter</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-[#272262] mb-3 block font-semibold text-lg">Thai Baht (THB)</Label>
            <div className="relative text-[#454545]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#454545] text-lg font-medium">฿</span>
              <Input
                type="number"
                value={thbAmount}
                onChange={(e) => handleThbChange(e.target.value)}
                placeholder="0.00"
                className="pl-10 h-14 text-lg border border-[#d5d5d5]"
              />
            </div>
          </div>

          <div>
            <Label className="text-[#272262] mb-3 block font-semibold text-lg">US Dollars (USD)</Label>
            <div className="relative text-[#454545]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#454545] text-lg font-medium">$</span>
              <Input
                type="number"
                value={usdAmount}
                onChange={(e) => handleUsdChange(e.target.value)}
                placeholder="0.00"
                className="pl-10 h-14 text-lg border border-[#d5d5d5]"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Common Amounts */}
      <GlassCard className="p-8">
        <h2 className="text-2xl font-bold text-[#272262] mb-6">Common Visa Amounts</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {commonAmounts.map((amount, index) => (
            <button
              key={index}
              onClick={() => handleThbChange(amount.thb.toString())}
              className="p-5 rounded-xl border border-[#E7E7E7] hover:border-[#272262] hover:bg-[#F8F9FA] transition-all text-left"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-[#454545] mb-2 font-medium">{amount.label}</div>
                  <div className="text-2xl font-bold text-[#272262]">
                    ฿{amount.thb.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#454545] mb-1">≈</div>
                  <div className="text-xl font-bold text-[#BF1E2E]">
                    ${(amount.thb / exchangeRate).toFixed(2)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-[#454545]">
            <strong className="text-[#272262]">Note:</strong> Exchange rates update automatically from exchangerate-api.com. 
            For official transactions, please verify rates with your bank or Thai Immigration.
          </p>
        </div>
      </GlassCard>
      </div>
    </>
  );
}
