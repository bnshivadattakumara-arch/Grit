
import React, { useEffect, useRef, useState } from 'react';
import { Terminal, AlertTriangle, Zap, Activity, Command, ChevronRight } from 'lucide-react';
import { EnrichedTicker } from '../types';
import { analyzeAssetWithAI, askAI } from '../services/geminiService';
import { fetchPriceHistory } from '../services/binanceService';
import { fetchBybitKlines } from '../services/bybitService';
import { fetchCoinbaseKlines } from '../services/coinbaseService';
import { fetchHyperliquidKlines } from '../services/hyperliquidService';
import { fetchMexcPriceHistory } from '../services/mexcService';
import { fetchCoindcxKlines } from '../services/coindcxService';
import { fetchCoinswitchKlines } from '../services/coinswitchService';
import { fetchOkxKlines } from '../services/okxService';
import { Exchange } from '../App';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'SPIKE' | 'DUMP' | 'FUNDING' | 'INFO' | 'CMD' | 'AI' | 'ERROR';
  message: string | React.ReactNode;
}

interface LiveTerminalProps {
  logs: LogEntry[];
  tickers: EnrichedTicker[];
  exchange: Exchange;
  onAddLog: (log: LogEntry) => void;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ logs, tickers, exchange, onAddLog }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const rawCmd = input.trim();
    const args = rawCmd.split(' ');
    const cmd = args[0].toLowerCase();
    const param1 = args[1]?.toUpperCase();

    onAddLog({
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: 'CMD',
      message: `> ${rawCmd}`
    });

    setInput('');
    setIsProcessing(true);

    try {
      switch (cmd) {
        case '/help':
        case 'help':
          onAddLog({
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: 'INFO',
            message: 'CMDS: /price [asset] | /analyze [asset] | /clear'
          });
          break;

        case '/price':
        case 'price':
          if (!param1) throw new Error('Usage: /price [ASSET]');
          const ticker = tickers.find(t => t.baseAsset === param1 || t.symbol === param1 || t.symbol === `${param1}USDT` || t.symbol === `${param1}-USDT`);
          if (ticker) {
            const symbol = ticker.quoteAsset === 'INR' ? '₹' : (['USDT', 'USDC', 'USD'].includes(ticker.quoteAsset) ? '$' : '');
            const isPos = parseFloat(ticker.priceChangePercent) >= 0;
            onAddLog({
              id: Date.now().toString(),
              timestamp: Date.now(),
              type: 'INFO',
              message: (
                <div className="flex items-center gap-2">
                  <span className="text-white">[{exchange}] {ticker.symbol}:</span>
                  <span className="font-black text-terminal-green">{symbol}{parseFloat(ticker.lastPrice).toLocaleString()}</span>
                  <span className="text-gray-600">|</span>
                  <span className={`font-black ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{ticker.priceChangePercent}%
                  </span>
                </div>
              )
            });
          } else {
            throw new Error(`Asset ${param1} not found in ${exchange} buffer.`);
          }
          break;

        case '/analyze':
        case 'analyze':
          if (!param1) throw new Error('Usage: /analyze [ASSET]');
          const target = tickers.find(t => t.baseAsset === param1 || t.symbol === param1 || t.symbol === `${param1}USDT` || t.symbol === `${param1}-USDT`);
          if (!target) throw new Error(`Asset ${param1} unavailable.`);
          
          onAddLog({ id: Date.now().toString(), timestamp: Date.now(), type: 'INFO', message: `INIT NEURAL SCAN FOR ${target.symbol}...` });
          
          let fetchFn;
          if (exchange === 'BINANCE') fetchFn = fetchPriceHistory;
          else if (exchange === 'BYBIT') fetchFn = fetchBybitKlines;
          else if (exchange === 'OKX') fetchFn = fetchOkxKlines;
          else if (exchange === 'HYPERLIQUID') fetchFn = fetchHyperliquidKlines;
          else if (exchange === 'COINBASE') fetchFn = fetchCoinbaseKlines;
          else if (exchange === 'COINDCX') fetchFn = fetchCoindcxKlines;
          else if (exchange === 'COINSWITCH') fetchFn = fetchCoinswitchKlines;
          else fetchFn = fetchMexcPriceHistory;

          const history = await fetchFn(target.symbol);
          const analysis = await analyzeAssetWithAI(target, history);
          
          onAddLog({
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: 'AI',
            message: `[AI_KERNEL]: ${analysis}` 
          });
          break;
        
        case '/clear':
            window.location.reload();
            break;

        default:
          throw new Error(`Unknown command: ${cmd}. Type /help.`);
      }
    } catch (err: any) {
       onAddLog({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: 'ERROR',
        message: err.message || 'COMMAND_FAILED'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-[#050505] border border-terminal-darkGreen font-mono text-xs md:text-sm mb-6 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-terminal-darkGreen bg-black">
        <div className="flex items-center gap-2">
           <div className="animate-pulse w-2 h-2 bg-terminal-alert rounded-full"></div>
           <span className="font-bold text-terminal-green tracking-wider uppercase">Live_CLI_Terminal_v3.5</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-500 uppercase">
           <span className="hidden sm:inline">Context: {exchange} | {tickers.length} NODES</span>
           <Terminal size={14} />
        </div>
      </div>

      <div className="h-48 overflow-y-auto p-4 space-y-1.5 scrollbar-thin bg-black/50" onClick={() => document.getElementById('term-input')?.focus()}>
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 hover:bg-white/5 p-0.5 transition-colors">
            <span className="text-gray-700 min-w-[60px] text-[10px] mt-0.5 select-none">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <span className="shrink-0 mt-0.5">
               {log.type === 'SPIKE' && <Activity size={12} className="text-green-400" />}
               {log.type === 'DUMP' && <AlertTriangle size={12} className="text-red-500" />}
               {log.type === 'CMD' && <ChevronRight size={12} className="text-terminal-green" />}
               {log.type === 'AI' && <Zap size={12} className="text-purple-400" />}
               {log.type === 'ERROR' && <AlertTriangle size={12} className="text-red-600" />}
            </span>
            <span className={`tracking-wide break-all flex-1 ${
              log.type === 'SPIKE' ? 'text-green-400' :
              log.type === 'DUMP' ? 'text-red-500' :
              log.type === 'CMD' ? 'text-white font-bold' :
              log.type === 'AI' ? 'text-purple-300' :
              log.type === 'ERROR' ? 'text-red-500' : 'text-gray-400'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
        {isProcessing && <div className="ml-20 text-terminal-green animate-pulse text-xs font-black">EXECUTING_PROTOCOL...</div>}
        <div ref={endRef} />
      </div>

      <div className="border-t border-terminal-darkGreen bg-black p-2 flex items-center gap-2">
         <span className="text-terminal-green font-bold select-none">{'>_'}</span>
         <form onSubmit={handleCommand} className="flex-1">
            <input 
              id="term-input"
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-terminal-green font-mono placeholder-gray-800 font-bold uppercase text-xs"
              placeholder="Enter protocol command (e.g. /price BTC)..."
              autoComplete="off"
            />
         </form>
      </div>
    </div>
  );
};
