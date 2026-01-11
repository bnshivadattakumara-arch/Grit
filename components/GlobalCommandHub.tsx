import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Cpu, Globe, ArrowRight, Sparkles, HeartPulse, Search, BarChart3, TrendingUp, 
  Newspaper, Calculator, ShieldAlert, Scale, Zap, Info, Activity, Gauge, Droplets, 
  Flame, Hash, Repeat, Users, BarChart, Leaf, Coins, Zap as ZapIcon, Info as InfoIcon, 
  BookOpen, ShieldCheck as ShieldIcon, Landmark, LayoutGrid, Monitor
} from 'lucide-react';
import { EnrichedTicker } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Exchange } from '../App';
import { fetchStockQuote, GLOBAL_INDEX_MAP, MACRO_TICKERS, CURRENCY_SYMBOLS, COMMODITY_TICKERS, FOREX_TICKERS, BOND_TICKERS } from '../services/stockService';
import { MacroTerminal } from './MacroTerminal';

interface GlobalCommandHubProps {
  tickers: EnrichedTicker[];
  exchange: Exchange;
  onAssetSelect: (ticker: EnrichedTicker) => void;
}

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export const GlobalCommandHub: React.FC<GlobalCommandHubProps> = ({ tickers, exchange, onAssetSelect }) => {
  const [hubMode, setHubMode] = useState<'CLI' | 'MACRO_TERMINAL'>('CLI');
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<{ type: 'USER' | 'SYSTEM' | 'AI'; content: React.ReactNode; timestamp: number }[]>([
    { type: 'SYSTEM', content: 'GRIT_OS_v3.6_PRO_KERNEL :: FULL_STATION_LINK_ACTIVE', timestamp: Date.now() },
    { type: 'SYSTEM', content: 'STOCK_CONDUIT_INTERFACED: /stock, /indices, /macro ACTIVE', timestamp: Date.now() + 50 },
    { type: 'SYSTEM', content: 'TRADER_SENTINEL_LOADED: /traders AVAILABLE (CRYPTO + FOREX)', timestamp: Date.now() + 100 },
    { type: 'SYSTEM', content: 'MACRO_TERMINAL_LOADED: PRESS [MACRO_VIEW] TO INITIALIZE', timestamp: Date.now() + 150 }
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type: 'USER' | 'SYSTEM' | 'AI', content: React.ReactNode) => {
    setMessages(prev => [...prev, { type, content, timestamp: Date.now() }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = historyIndex + 1;
      if (nextIndex < history.length) {
        setHistoryIndex(nextIndex);
        setInput(history[history.length - 1 - nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInput(history[history.length - 1 - nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const processQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userQuery = input.trim();
    addMessage('USER', userQuery);
    setHistory(prev => [...prev, userQuery].slice(-50));
    setHistoryIndex(-1);
    setInput('');
    setIsProcessing(true);

    const args = userQuery.split(' ');
    const cmd = args[0].toLowerCase();

    try {
      if (cmd === '/help') {
        addMessage('SYSTEM', (
          <div className="space-y-8 py-4 border-y border-terminal-darkGreen/30 my-4 font-mono text-[10px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-terminal-green font-black tracking-[0.4em] border-b border-terminal-darkGreen/40 pb-3 flex justify-between items-center bg-terminal-darkGreen/5 px-2">
              <span className="flex items-center gap-2"><BookOpen size={14}/> [ SYSTEM_MANUAL_v3.6_STABLE ]</span>
              <span className="text-gray-500">AUTH: TERMINAL_ROOT</span>
            </div>

            <section className="bg-terminal-darkGreen/5 p-3 border-l-2 border-terminal-green">
              <div className="text-white font-black uppercase mb-2 flex items-center gap-2 tracking-widest underline decoration-terminal-green/30">
                <Cpu size={12}/> CORE_ARCHITECTURE // HOW_IT_WORKS
              </div>
              <div className="text-gray-400 leading-relaxed space-y-1">
                <p>{" > "} <span className="text-terminal-green font-bold">MULTIVECTOR_FEED:</span> Ingests L1/L2 data from Binance, Bybit, OKX, and Yahoo Global for cross-asset correlation.</p>
                <p>{" > "} <span className="text-terminal-green font-bold">NEURAL_SENTINEL:</span> Leverages Gemini 3.1 Pro for contextual sentiment extraction and technical regime detection.</p>
                <p>{" > "} <span className="text-terminal-green font-bold">STRESS_RESOLVER:</span> Real-time monitoring of Bonds, Forex, and Commodities to track institutional liquidity rotation.</p>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <section className="space-y-3">
                <div className="text-white font-black border-l-2 border-terminal-green pl-2 uppercase tracking-widest bg-terminal-green/5">Market_Intel_CMDS</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-terminal-green">/stock [SYM]</div>
                    <div className="text-gray-500 italic ml-2">Fetches L1 price for equities. Usage: /stock TSLA</div>
                  </div>
                  <div>
                    <div className="text-terminal-green">/indices</div>
                    <div className="text-gray-500 italic ml-2">Poll world market health across 15+ major global indices.</div>
                  </div>
                  <div>
                    <div className="text-terminal-green">/macro</div>
                    <div className="text-gray-500 italic ml-2">Monitor ETF/Bond liquidity nodes and credit flow.</div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-white font-black border-l-2 border-orange-500 pl-2 uppercase tracking-widest bg-orange-500/5">System_Utilities</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-terminal-green">/pulse</div>
                    <div className="text-gray-500 italic ml-2">AI market mood summary based on current alpha.</div>
                  </div>
                  <div>
                    <div className="text-terminal-green">/open [SYM]</div>
                    <div className="text-gray-500 italic ml-2">Jump to detailed node analysis for an asset.</div>
                  </div>
                  <div>
                    <div className="text-terminal-green">/clear</div>
                    <div className="text-gray-500 italic ml-2">Wipe history and reset UI nodes.</div>
                  </div>
                </div>
              </section>
            </div>

            <div className="text-gray-700 text-center pt-6 border-t border-terminal-darkGreen/10 uppercase font-black tracking-widest flex items-center justify-center gap-4">
              <div className="h-[1px] bg-terminal-darkGreen/20 flex-1"></div>
              <span>Terminal_Kernel_v3.6_PRO_ACTIVE</span>
              <div className="h-[1px] bg-terminal-darkGreen/20 flex-1"></div>
            </div>
          </div>
        ));
      } else if (cmd === '/bonds') {
        addMessage('SYSTEM', (
          <div className="space-y-3 p-3 bg-black border border-terminal-darkGreen/30 my-2 text-[10px]">
            <div className="flex items-center gap-2 text-terminal-green font-black uppercase mb-2">
              <Landmark size={12}/> CORE_DEBT_NODES
            </div>
            {(Object.entries(BOND_TICKERS) as [string, { symbol: string; name: string }[]][]).map(([cat, list]) => (
              <div key={cat} className="space-y-1">
                <div className="text-gray-500 font-bold border-b border-terminal-darkGreen/10 pb-0.5">{cat}</div>
                <div className="grid grid-cols-1 gap-1">
                  {list.map(item => (
                    <div key={item.symbol} className="flex justify-between hover:bg-white/5 px-1">
                      <span className="text-white">{item.name}</span>
                      <span className="text-terminal-dim font-bold">{item.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ));
      } else if (cmd === '/stock') {
        const sym = args[1]?.toUpperCase();
        if (!sym) { addMessage('SYSTEM', 'SYNTAX: /stock [TICKER] (e.g. AAPL, TSLA)'); setIsProcessing(false); return; }
        const data = await fetchStockQuote(sym);
        if (data) {
          addMessage('SYSTEM', (
            <div className="p-3 border border-terminal-green/30 bg-terminal-green/5 my-1 text-[10px]">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span className="text-gray-500 font-black uppercase">EQUITY_NODE_SCAN</span>
                  <span className="text-xl font-black text-white">{data.symbol}</span>
                </div>
                <div className={`text-right ${data.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <div className="text-lg font-black">{CURRENCY_SYMBOLS[data.currency] || '$'}{data.price.toLocaleString()}</div>
                  <div className="font-bold">{data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          ));
        } else { addMessage('SYSTEM', `ERROR: FAILED_TO_FETCH_STOCK_${sym}`); }
      } else if (cmd === '/clear') {
        setMessages([{ type: 'SYSTEM', content: 'KERNEL_BUFFER_PURGED', timestamp: Date.now() }]);
      } else if (cmd === '/open') {
        const symbol = args[1]?.toUpperCase();
        const ticker = tickers.find(t => t.baseAsset === symbol || t.symbol === symbol);
        if (ticker) { onAssetSelect(ticker); addMessage('SYSTEM', `JUMPING_TO_${symbol}_NODE`); }
        else { addMessage('SYSTEM', 'ERROR: TARGET_NOT_FOUND'); }
      } else {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `SYSTEM: Grit Quant Terminal. QUERY: "${userQuery}". INSTRUCTIONS: Professional, technical, brief (30 words). No markdown.`,
        });
        addMessage('AI', response.text);
      }
    } catch (error) {
      addMessage('SYSTEM', 'CRITICAL_KERNEL_ERROR: SEQUENCE_INTERRUPTED');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[550px] bg-black border-2 border-terminal-darkGreen shadow-[0_0_40px_rgba(20,83,45,0.3)] overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-40 bg-[length:100%_4px,3px_100%]"></div>
      
      <div className="bg-[#050505] border-b border-terminal-darkGreen p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-terminal-green" />
          <div>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">GRIT_OS_v3.6_CLI</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[7px] text-terminal-green font-bold bg-terminal-darkGreen/30 px-1 border border-terminal-green/20">KERN_READY</span>
              <span className="text-[7px] text-gray-600 font-bold uppercase tracking-widest">GATEWAY: {exchange}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black border border-terminal-darkGreen/40 p-1">
           <button 
             onClick={() => setHubMode('CLI')}
             className={`px-4 py-1 text-[9px] font-black uppercase transition-all flex items-center gap-2 border ${hubMode === 'CLI' ? 'bg-terminal-green text-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-white'}`}
           >
             <Monitor size={12} /> CLI_VIEW
           </button>
           <button 
             onClick={() => setHubMode('MACRO_TERMINAL')}
             className={`px-4 py-1 text-[9px] font-black uppercase transition-all flex items-center gap-2 border ${hubMode === 'MACRO_TERMINAL' ? 'bg-terminal-green text-black border-terminal-green shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'text-gray-500 border-transparent hover:text-white'}`}
           >
             <LayoutGrid size={12} /> MACRO_VIEW
           </button>
        </div>

        <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-widest text-gray-600 hidden sm:flex">
           <div className="flex items-center gap-1.5"><Globe size={12} className="text-terminal-darkGreen" /> NET_STABLE</div>
           <HeartPulse size={12} className="text-terminal-green animate-pulse" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {hubMode === 'CLI' ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#010101] font-mono text-sm">
              {messages.map((msg, i) => (
                <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-100">
                  <span className={`text-[8px] mt-1 shrink-0 font-black px-1 border h-fit ${
                    msg.type === 'USER' ? 'text-white border-white/20 bg-white/5' : 
                    msg.type === 'AI' ? 'text-terminal-green border-terminal-green/30 bg-terminal-green/5' : 
                    'text-terminal-darkGreen border-terminal-darkGreen/20 bg-terminal-darkGreen/5'
                  }`}>
                    {msg.type}
                  </span>
                  <div className={`leading-relaxed break-words flex-1 ${msg.type === 'USER' ? 'text-white/60 italic' : 'text-terminal-green'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-2 text-terminal-green animate-pulse ml-16">
                  <div className="w-1 h-1 bg-terminal-green rounded-full animate-bounce"></div>
                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">SYNCING_KERNEL...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <div className="px-5 py-2 bg-[#050505] border-t border-terminal-darkGreen/20 flex items-center gap-3 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[7px] text-gray-700 font-black uppercase tracking-widest">MACROS:</span>
              {['/help', '/stock', '/indices', '/bonds', '/ta', '/risk', '/pulse', '/gas', '/clear'].map(macro => (
                <button 
                  key={macro} 
                  onClick={() => setInput(macro)}
                  className="text-[8px] font-bold text-gray-600 hover:text-terminal-green transition-colors px-1.5 py-0.5 border border-terminal-darkGreen/10 hover:border-terminal-green/30"
                >
                  {macro.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="p-3 bg-black border-t border-terminal-darkGreen">
              <form onSubmit={processQuery} className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-green font-black text-xs opacity-40">{" > "}</div>
                <input 
                  type="text" 
                  autoFocus
                  onKeyDown={handleKeyDown}
                  placeholder="INPUT COMMAND OR QUERY... (TYPE /HELP)"
                  className="w-full bg-black border border-terminal-darkGreen/50 p-2.5 pl-8 pr-12 text-terminal-green outline-none focus:border-terminal-green transition-all font-mono font-bold uppercase placeholder-gray-900 text-[11px]"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-green hover:text-white transition-all">
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <MacroTerminal tickers={tickers} onAssetSelect={onAssetSelect} />
        )}
      </div>
    </div>
  );
};