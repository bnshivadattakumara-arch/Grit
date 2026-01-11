import React, { useEffect, useState } from 'react';
import { EnrichedTicker, Trade } from '../types';
import { analyzeAssetWithAI } from '../services/geminiService';
import { fetchRecentTrades, fetchPriceHistory } from '../services/binanceService';
import { fetchBybitTrades, fetchBybitKlines } from '../services/bybitService';
import { fetchCoinbaseTrades, fetchCoinbaseKlines } from '../services/coinbaseService';
import { fetchHyperliquidTrades, fetchHyperliquidKlines } from '../services/hyperliquidService';
import { fetchMexcRecentTrades, fetchMexcPriceHistory } from '../services/mexcService';
import { fetchCoindcxTrades, fetchCoindcxKlines } from '../services/coindcxService';
import { fetchCoinswitchTrades, fetchCoinswitchKlines } from '../services/coinswitchService';
import { fetchOkxTrades, fetchOkxKlines } from '../services/okxService';
import { X, Cpu, TrendingUp, TrendingDown, TerminalSquare, RefreshCcw, Activity } from 'lucide-react';
import { Exchange } from '../App';

interface AssetDetailModalProps {
  ticker: EnrichedTicker | null;
  onClose: () => void;
  exchange: Exchange;
  onMonitor?: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ ticker, onClose, exchange, onMonitor }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [loadingTrades, setLoadingTrades] = useState<boolean>(false);

  useEffect(() => {
    if (ticker) {
      // AI Analysis
      setLoadingAI(true);
      setAnalysis('');
      
      let fetchHistory;
      if (exchange === 'BINANCE') fetchHistory = fetchPriceHistory(ticker.symbol);
      else if (exchange === 'BYBIT') fetchHistory = fetchBybitKlines(ticker.symbol);
      else if (exchange === 'OKX') fetchHistory = fetchOkxKlines(ticker.symbol);
      else if (exchange === 'HYPERLIQUID') fetchHistory = fetchHyperliquidKlines(ticker.symbol);
      else if (exchange === 'COINBASE') fetchHistory = fetchCoinbaseKlines(ticker.symbol);
      else if (exchange === 'COINDCX') fetchHistory = fetchCoindcxKlines(ticker.symbol);
      else if (exchange === 'COINSWITCH') fetchHistory = fetchCoinswitchKlines(ticker.symbol);
      else fetchHistory = fetchMexcPriceHistory(ticker.symbol);

      fetchHistory.then(history => {
        analyzeAssetWithAI(ticker, history)
        .then(text => setAnalysis(text))
        .catch(() => setAnalysis("ERR: ANALYSIS_FETCH_FAILED"))
        .finally(() => setLoadingAI(false));
      });

      // Trades
      setLoadingTrades(true);
      let fetchTrades;
      if (exchange === 'BINANCE') fetchTrades = fetchRecentTrades(ticker.symbol);
      else if (exchange === 'BYBIT') fetchTrades = fetchBybitTrades(ticker.symbol);
      else if (exchange === 'OKX') fetchTrades = fetchOkxTrades(ticker.symbol);
      else if (exchange === 'HYPERLIQUID') fetchTrades = fetchHyperliquidTrades(ticker.symbol);
      else if (exchange === 'COINBASE') fetchTrades = fetchCoinbaseTrades(ticker.symbol);
      else if (exchange === 'COINDCX') fetchTrades = fetchCoindcxTrades(ticker.symbol);
      else if (exchange === 'COINSWITCH') fetchTrades = fetchCoinswitchTrades(ticker.symbol);
      else fetchTrades = fetchMexcRecentTrades(ticker.symbol);

      fetchTrades.then(data => {
        setTrades(data); 
      }).finally(() => setLoadingTrades(false));
    }
  }, [ticker, exchange]);

  if (!ticker) return null;

  const isPositive = parseFloat(ticker.priceChangePercent) >= 0;
  
  const getSymbol = () => {
    if (ticker.quoteAsset === 'INR') return '₹';
    if (['USDT', 'USDC', 'USD', 'FDUSD', 'BUSD', 'TUSD', 'DAI'].includes(ticker.quoteAsset)) return '$';
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-black border-2 border-terminal-green w-full max-w-5xl h-[85vh] shadow-[0_0_20px_rgba(74,222,128,0.1)] flex flex-col relative">
        
        <div className="flex justify-between items-center p-3 border-b border-terminal-darkGreen bg-[#050505]">
          <div className="flex items-center gap-2">
            <TerminalSquare size={20} className="text-terminal-green" />
            <h2 className="text-lg font-bold text-terminal-green uppercase">
              {exchange}_TERMINAL :: {ticker.symbol}
            </h2>
            <span className="text-xs bg-terminal-darkGreen text-green-100 px-2 py-0.5 ml-2">
              VOL: {parseFloat(ticker.quoteVolume).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {onMonitor && (
              <button 
                onClick={onMonitor}
                className="bg-terminal-green text-black text-[10px] font-black px-4 py-1.5 uppercase hover:bg-white transition-colors flex items-center gap-2"
              >
                <Activity size={14} /> MONITOR_IN_CONDUIT
              </button>
            )}
            <button onClick={onClose} className="text-terminal-darkGreen hover:text-terminal-green transition-colors hover:bg-green-900/20 p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-terminal-darkGreen scrollbar-thin">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-terminal-darkGreen p-3 bg-green-900/5">
                <div className="text-terminal-dim text-xs mb-1 uppercase">Current_Price</div>
                <div className="text-2xl font-bold text-white tracking-widest">
                  {getSymbol()}{parseFloat(ticker.lastPrice).toFixed(parseFloat(ticker.lastPrice) < 1 ? 6 : 2)}
                </div>
              </div>
              <div className="border border-terminal-darkGreen p-3 bg-green-900/5">
                <div className="text-terminal-dim text-xs mb-1 uppercase">24h_Change</div>
                <div className={`text-2xl font-bold flex items-center gap-2 ${isPositive ? 'text-green-400' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  {ticker.priceChangePercent}%
                </div>
              </div>
              <div className="border border-terminal-darkGreen p-3">
                <div className="text-terminal-dim text-xs mb-1 uppercase">High_24h</div>
                <div className="text-lg text-gray-300">{parseFloat(ticker.highPrice) > 0 ? parseFloat(ticker.highPrice).toFixed(2) : 'N/A'}</div>
              </div>
              <div className="border border-terminal-darkGreen p-3">
                <div className="text-terminal-dim text-xs mb-1 uppercase">Low_24h</div>
                <div className="text-lg text-gray-300">{parseFloat(ticker.lowPrice) > 0 ? parseFloat(ticker.lowPrice).toFixed(2) : 'N/A'}</div>
              </div>
            </div>

            <div className="border border-terminal-green p-4 relative bg-black">
              <div className="absolute top-0 left-0 bg-terminal-green text-black text-xs font-bold px-2 py-0.5">
                AI_KERNEL_OUTPUT
              </div>
              <div className="mt-4 font-mono text-sm leading-6 text-green-400">
                {loadingAI ? (
                  <div className="animate-pulse flex flex-col gap-2">
                    <span className="inline-block w-4 h-4 bg-terminal-green"></span>
                    <span>PROCESSING_MARKET_VECTORS...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{analysis}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-dashed border-terminal-darkGreen">
                <div className="text-xs text-gray-500">SPREAD_PCT</div>
                <div className="text-lg text-terminal-green">{ticker.spread.toFixed(3)}%</div>
              </div>
              <div className="p-3 border border-dashed border-terminal-darkGreen">
                <div className="text-xs text-gray-500">VOLATILITY_IDX</div>
                <div className="text-lg text-terminal-green">{ticker.volatility.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 bg-[#050505] flex flex-col border-t md:border-t-0 md:border-l border-terminal-darkGreen">
            <div className="p-2 border-b border-terminal-darkGreen flex justify-between items-center bg-green-900/10">
              <span className="text-xs font-bold text-terminal-green uppercase">Recent_Trades_Stream</span>
              <RefreshCcw size={12} className={`text-terminal-dim ${loadingTrades ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1 overflow-y-auto p-0 font-mono text-xs">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#050505] text-gray-500 border-b border-gray-800">
                  <tr>
                    <th className="p-2">Price</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {trades.map((trade, idx) => (
                    <tr key={`${trade.id}-${idx}`} className="hover:bg-green-900/10 transition-colors">
                      <td className={`p-2 ${trade.isBuyerMaker ? 'text-red-500' : 'text-green-500'}`}>
                        {parseFloat(trade.price).toFixed(2)}
                      </td>
                      <td className="p-2 text-right text-gray-400">
                        {parseFloat(trade.qty).toFixed(4)}
                      </td>
                      <td className="p-2 text-right text-gray-600">
                        {new Date(trade.time).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                  {trades.length === 0 && !loadingTrades && (
                     <tr><td colSpan={3} className="p-4 text-center text-gray-600">NO_DATA_STREAM</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
