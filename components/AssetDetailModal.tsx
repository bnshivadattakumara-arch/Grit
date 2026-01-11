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
import { X, Cpu, TrendingUp, TrendingDown, TerminalSquare, RefreshCcw, Activity, Table, Hash, Info } from 'lucide-react';
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

  const TechStat = ({ label, value, unit }: { label: string, value: string | number, unit?: string }) => (
    <div className="flex flex-col p-3 border border-terminal-darkGreen bg-black/40">
      <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">{label}</span>
      <div className="text-xs font-bold text-terminal-green tabular-nums">
        {value} <span className="text-[8px] opacity-40 uppercase">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-black border-2 border-terminal-green w-full max-w-6xl h-[90vh] shadow-[0_0_40px_rgba(74,222,128,0.2)] flex flex-col relative">
        
        <div className="flex justify-between items-center p-3 border-b border-terminal-darkGreen bg-[#050505]">
          <div className="flex items-center gap-2">
            <TerminalSquare size={20} className="text-terminal-green" />
            <h2 className="text-lg font-bold text-terminal-green uppercase tracking-tighter">
              {exchange}_TERMINAL :: {ticker.symbol}
            </h2>
            <div className="flex items-center gap-2 ml-4 px-2 py-0.5 bg-terminal-darkGreen/20 border border-terminal-green/30 text-[9px] font-black text-terminal-green uppercase">
               <Activity size={12} /> SECURE_LINK_ACTIVE
            </div>
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

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-terminal-darkGreen scrollbar-thin bg-[#010101]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-terminal-darkGreen p-3 bg-green-900/5 col-span-2">
                <div className="text-terminal-dim text-[8px] mb-1 uppercase tracking-widest font-black">Current_Market_Index</div>
                <div className="text-3xl font-black text-white tracking-widest tabular-nums">
                  {getSymbol()}{parseFloat(ticker.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
              </div>
              <div className="border border-terminal-darkGreen p-3 bg-green-900/5">
                <div className="text-terminal-dim text-[8px] mb-1 uppercase tracking-widest font-black">24h_Delta</div>
                <div className={`text-xl font-black flex items-center gap-2 tabular-nums ${isPositive ? 'text-green-400' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  {ticker.priceChangePercent}%
                </div>
              </div>
              <div className="border border-terminal-darkGreen p-3">
                <div className="text-terminal-dim text-[8px] mb-1 uppercase tracking-widest font-black">24h_Vol_M</div>
                <div className="text-xl font-black text-gray-200 tabular-nums">${(parseFloat(ticker.quoteVolume)/1000000).toFixed(2)}M</div>
              </div>
            </div>

            {/* FULL ANALYSIS GRID */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-white font-black uppercase tracking-[0.2em] border-b border-terminal-darkGreen/20 pb-2">
                <Table size={14} className="text-terminal-green" /> NODE_TECHNICAL_PROPERTIES
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 <TechStat label="W_Avg_Price" value={parseFloat(ticker.weightedAvgPrice).toFixed(4)} unit={ticker.quoteAsset} />
                 <TechStat label="Spread_Delta" value={ticker.spread.toFixed(5)} unit="%" />
                 <TechStat label="Trade_Count" value={ticker.count.toLocaleString()} unit="OPS" />
                 <TechStat label="Last_Qty" value={parseFloat(ticker.lastQty).toFixed(4)} unit={ticker.baseAsset} />
                 <TechStat label="Best_Bid" value={parseFloat(ticker.bidPrice).toFixed(4)} unit={ticker.quoteAsset} />
                 <TechStat label="Bid_Depth" value={parseFloat(ticker.bidQty).toFixed(2)} unit={ticker.baseAsset} />
                 <TechStat label="Best_Ask" value={parseFloat(ticker.askPrice).toFixed(4)} unit={ticker.quoteAsset} />
                 <TechStat label="Ask_Depth" value={parseFloat(ticker.askQty).toFixed(2)} unit={ticker.baseAsset} />
              </div>
            </div>

            <div className="border border-terminal-green p-5 relative bg-black shadow-[inset_0_0_20px_rgba(74,222,128,0.05)]">
              <div className="absolute top-0 left-0 bg-terminal-green text-black text-[9px] font-black px-2 py-0.5 tracking-widest uppercase">
                NEURAL_SENTINEL_ANALYTICS
              </div>
              <div className="mt-4 font-mono text-sm leading-6 text-green-400">
                {loadingAI ? (
                  <div className="animate-pulse flex flex-col gap-2">
                    <div className="h-1 bg-terminal-green w-full mb-2"></div>
                    <span className="text-[10px] uppercase font-black tracking-widest">Processing Market Vectors...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap font-bold text-[13px]">{analysis}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border border-dashed border-terminal-darkGreen/50 bg-black/20">
                <div className="text-[8px] text-gray-600 font-black uppercase mb-1">Volat_Index</div>
                <div className="text-lg text-terminal-green font-black tabular-nums">{ticker.volatility.toFixed(3)}%</div>
              </div>
              <div className="p-3 border border-dashed border-terminal-darkGreen/50 bg-black/20">
                <div className="text-[8px] text-gray-600 font-black uppercase mb-1">Open_Px</div>
                <div className="text-lg text-white font-black tabular-nums">{parseFloat(ticker.openPrice).toFixed(2)}</div>
              </div>
              <div className="p-3 border border-dashed border-terminal-darkGreen/50 bg-black/20">
                <div className="text-[8px] text-gray-600 font-black uppercase mb-1">Prev_Close</div>
                <div className="text-lg text-white font-black tabular-nums">{parseFloat(ticker.prevClosePrice).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96 bg-[#050505] flex flex-col border-t lg:border-t-0 lg:border-l border-terminal-darkGreen">
            <div className="p-3 border-b border-terminal-darkGreen flex justify-between items-center bg-green-900/10">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-terminal-green" />
                <span className="text-[10px] font-black text-terminal-green uppercase tracking-widest">Real_Time_Deal_Stream</span>
              </div>
              <RefreshCcw size={12} className={`text-terminal-dim ${loadingTrades ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1 overflow-y-auto p-0 font-mono text-xs custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#050505] text-[8px] text-gray-600 font-black uppercase border-b border-terminal-darkGreen/20 z-10 shadow-lg">
                  <tr>
                    <th className="p-3">PRICE_IDX</th>
                    <th className="p-3 text-right">SIZE_UNIT</th>
                    <th className="p-3 text-right pr-4">UTC_TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/50">
                  {trades.map((trade, idx) => (
                    <tr key={`${trade.id}-${idx}`} className="hover:bg-terminal-green/5 transition-colors group">
                      <td className={`p-3 font-black tabular-nums ${trade.isBuyerMaker ? 'text-red-500' : 'text-green-500'}`}>
                        {parseFloat(trade.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </td>
                      <td className="p-3 text-right text-gray-400 font-bold tabular-nums">
                        {parseFloat(trade.qty).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </td>
                      <td className="p-3 text-right pr-4 text-gray-700 tabular-nums text-[10px] font-medium">
                        {new Date(trade.time).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                  {trades.length === 0 && !loadingTrades && (
                     <tr><td colSpan={3} className="p-20 text-center text-gray-800 uppercase italic font-black animate-pulse tracking-widest">Awaiting_Data_Stream...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="h-10 border-t border-terminal-darkGreen bg-black px-4 flex items-center justify-between text-[8px] text-gray-700 font-black uppercase tracking-[0.4em] shrink-0">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5"><Info size={12} /> PROTOCOL_V3</span>
              <span className="text-terminal-darkGreen">ASSET_ID: {ticker.firstId} - {ticker.lastId}</span>
           </div>
           <div className="flex items-center gap-2 text-terminal-green">
              <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-ping"></div>
              <span>KERNEL_SYNC: ESTABLISHED</span>
           </div>
        </div>
      </div>
    </div>
  );
};