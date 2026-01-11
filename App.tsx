import React, { useEffect, useState, useMemo, useRef } from 'react';
import { fetch24hTicker, fetchFundingRates, fetchAllPrices } from './services/binanceService.ts';
import { fetchBybitSpotTickers, fetchBybitFundingRates, fetchBybitPrices } from './services/bybitService.ts';
import { fetchCoinbaseSpotTickers, fetchCoinbaseFundingRates, fetchCoinbasePrices } from './services/coinbaseService.ts';
import { fetchHyperliquidTickers, fetchHyperliquidFunding, fetchHyperliquidPrices } from './services/hyperliquidService.ts';
import { fetchMexc24hTicker, fetchMexcAllPrices } from './services/mexcService.ts';
import { fetchCoindcxTickers, fetchCoindcxPrices } from './services/coindcxService.ts';
import { fetchCoinswitchTickers, fetchCoinswitchPrices } from './services/coinswitchService.ts';
import { fetchOkxSpotTickers, fetchOkxFundingRates, fetchOkxPrices } from './services/okxService.ts';
import { liquidationAggregator } from './services/liquidationService.ts';
import { EnrichedTicker, SortField, SortDirection, FundingRateData, Liquidation } from './types.ts';
import { StatsCard } from './components/StatsCard.tsx';
import { AssetDetailModal } from './components/AssetDetailModal.tsx';
import { LiveTerminal, LogEntry } from './components/LiveTerminal.tsx';
import { MarketHeatmap } from './components/MarketHeatmap.tsx';
import { FundingHeatmap } from './components/FundingHeatmap.tsx';
import { LiveTradeFeed } from './components/LiveTradeFeed.tsx';
import { CarnageDashboard } from './components/CarnageDashboard.tsx';
import { TransactionVisualizer } from './components/TransactionVisualizer.tsx';
import { GlobalCommandHub } from './components/GlobalCommandHub.tsx';
import { WorldMapTerminal } from './components/WorldMapTerminal.tsx';
import { CountryDetailView } from './components/CountryDetailView.tsx';
import { CommoditiesHub } from './components/CommoditiesHub.tsx';
import { ForexHub } from './components/ForexHub.tsx';
import { BondsHub } from './components/BondsHub.tsx';
import { MacroHub } from './components/MacroHub.tsx';
import { TradeHub } from './components/TradeHub.tsx';
import { BettingHub } from './components/BettingHub.tsx';
import { ThemeScrollWheel } from './components/ThemeScrollWheel.tsx';
import { useTheme } from './contexts/ThemeContext.tsx';
import { 
  RefreshCw, BarChart2, Activity, Terminal, 
  Zap, Timer, LayoutGrid, Globe, 
  ArrowRightLeft, Cpu, Skull, Box,
  Home, Briefcase, Search, Building2, ChevronDown, TrendingUp,
  Droplets, Banknote, Landmark, LineChart, Wallet2, Trophy,
  BrainCircuit, ShieldAlert, TrendingDown, Info
} from 'lucide-react';

export type ViewMode = 'MARKET' | 'FUNDING' | 'MOMENTUM' | 'HEATMAP';
export type MainHub = 'HUB' | 'CRYPTO' | 'STOCKS' | 'COMMODITIES' | 'FOREX' | 'BONDS' | 'MACRO' | 'TRADE' | 'BETTING';
export type CryptoSubTab = 'TERMINAL' | 'CONDUIT' | 'CARNAGE' | 'VISUALIZER';
export type Exchange = 'BINANCE' | 'BYBIT' | 'OKX' | 'HYPERLIQUID' | 'COINBASE' | 'MEXC' | 'COINDCX' | 'COINSWITCH';

const SaturnLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-terminal-green">
    <path 
      d="M2.5 12C2.5 10.3431 6.7533 9 12 9C17.2467 9 21.5 10.3431 21.5 12" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round"
      transform="rotate(-15 12 12)"
    />
    <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.9" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="0.5" />
    <path d="M10 9.5C10 9.5 11 8.5 12.5 8.5" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
    <path 
      d="M2.5 12C2.5 13.6569 6.7533 15 12 15C17.2467 15 21.5 13.6569 21.5 12" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      transform="rotate(-15 12 12)"
    />
  </svg>
);

function App() {
  const [activeHub, setActiveHub] = useState<MainHub>('HUB');
  const [cryptoTab, setCryptoTab] = useState<CryptoSubTab>('TERMINAL');
  const [exchange, setExchange] = useState<Exchange>('BINANCE');
  const [viewMode, setViewMode] = useState<ViewMode>('MARKET');
  const [conduitAsset, setConduitAsset] = useState<string>('BTC');
  
  const { theme } = useTheme();
  
  const [stocksView, setStocksView] = useState<'MAP' | 'DETAIL'>('MAP');
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  const [tickers, setTickers] = useState<EnrichedTicker[]>([]);
  const [fundingRates, setFundingRates] = useState<FundingRateData[]>([]);
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [sessionStats, setSessionStats] = useState({ totalUsd: 0, count: 0 });
  const [terminalLogs, setTerminalLogs] = useState<LogEntry[]>([]);
  
  const baseTickersRef = useRef<EnrichedTicker[]>([]); 
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>(SortField.VOLUME);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.DESC);
  const [selectedAsset, setSelectedAsset] = useState<EnrichedTicker | null>(null);
  const [quoteFilter, setQuoteFilter] = useState<string>('USDT');
  const [visibleCount, setVisibleCount] = useState<number>(50);

  const addLog = (log: LogEntry) => {
    setTerminalLogs(prev => [...prev.slice(-49), log]);
  };

  useEffect(() => {
    liquidationAggregator.start((liq) => {
      setLiquidations(prev => [liq, ...prev].slice(0, 500));
      setSessionStats(prev => ({
        totalUsd: prev.totalUsd + liq.usdValue,
        count: prev.count + 1
      }));
    });
    return () => liquidationAggregator.stop();
  }, []);

  const refreshBaseData = async () => {
    setLoading(true);
    try {
      let data: EnrichedTicker[] = [];
      if (exchange === 'BINANCE') data = await fetch24hTicker();
      else if (exchange === 'BYBIT') data = await fetchBybitSpotTickers();
      else if (exchange === 'OKX') data = await fetchOkxSpotTickers();
      else if (exchange === 'HYPERLIQUID') data = await fetchHyperliquidTickers();
      else if (exchange === 'COINBASE') data = await fetchCoinbaseSpotTickers();
      else if (exchange === 'MEXC') data = await fetchMexc24hTicker();
      else if (exchange === 'COINDCX') data = await fetchCoindcxTickers();
      else if (exchange === 'COINSWITCH') data = await fetchCoinswitchTickers();
        
      if (data && data.length > 0) {
        baseTickersRef.current = data;
        setTickers(data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || `${exchange}_OFFLINE`);
    } finally {
      setLoading(false);
    }
  };

  const refreshFunding = async () => {
     if (['COINBASE', 'MEXC', 'COINDCX', 'COINSWITCH'].includes(exchange)) return; 
     setLoading(true);
     try {
        let data: FundingRateData[] = [];
        if (exchange === 'BINANCE') data = await fetchFundingRates();
        else if (exchange === 'BYBIT') data = await fetchBybitFundingRates();
        else if (exchange === 'OKX') data = await fetchOkxFundingRates();
        else if (exchange === 'HYPERLIQUID') data = await fetchHyperliquidFunding();
        setFundingRates(data.sort((a, b) => Math.abs(parseFloat(b.lastFundingRate)) - Math.abs(parseFloat(a.lastFundingRate))));
     } catch (err) {
        setError("FUNDING_ERROR");
     } finally {
        setLoading(false);
     }
  };

  useEffect(() => {
    if (activeHub === 'CRYPTO') {
       if (viewMode === 'FUNDING') refreshFunding();
       else refreshBaseData();
    }
  }, [exchange, activeHub, cryptoTab, viewMode]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC);
    } else {
      setSortField(field);
      setSortDirection(SortDirection.DESC);
    }
  };

  const filteredTickers = useMemo(() => {
    return tickers
      .filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()))
      .filter(t => quoteFilter === 'ALL' || t.quoteAsset === quoteFilter)
      .sort((a, b) => {
        let valA: any, valB: any;
        switch (sortField) {
          case SortField.SYMBOL: valA = a.symbol; valB = b.symbol; break;
          case SortField.PRICE: valA = parseFloat(a.lastPrice); valB = parseFloat(b.lastPrice); break;
          case SortField.CHANGE: valA = parseFloat(a.priceChangePercent); valB = parseFloat(b.priceChangePercent); break;
          case SortField.VOLUME: valA = parseFloat(a.quoteVolume); valB = parseFloat(b.quoteVolume); break;
          case SortField.VOLATILITY: valA = a.volatility; valB = b.volatility; break;
          case SortField.SPREAD: valA = a.spread; valB = b.spread; break;
          case SortField.TRADES: valA = a.count; valB = b.count; break;
          case SortField.FUNDING_RATE: valA = parseFloat(a.fundingRate || '0'); valB = parseFloat(b.fundingRate || '0'); break;
          case SortField.OPEN_INTEREST: valA = parseFloat(a.openInterest || '0'); valB = parseFloat(b.openInterest || '0'); break;
          default: valA = parseFloat(a.quoteVolume); valB = parseFloat(b.quoteVolume);
        }
        return sortDirection === SortDirection.ASC ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
      });
  }, [tickers, search, sortField, sortDirection, quoteFilter]);

  const handleCountryClick = (id: string) => {
    setSelectedCountryId(id);
    setStocksView('DETAIL');
  };

  return (
    <div className={`min-h-screen pb-20 bg-terminal-black font-mono text-terminal-green`}>
      <header className="sticky top-0 z-[60] bg-terminal-black/95 border-b border-terminal-darkGreen px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="border border-terminal-green p-1.5 shadow-[0_0_15px_rgba(74,222,128,0.15)] bg-black">
            <SaturnLogo />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-terminal-contrast uppercase flex items-center gap-2">
              GRIT TERMINAL
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold border-l-2 border-terminal-green pl-2 bg-terminal-darkGreen/10">world's 1st traders ecosystem</p>
          </div>
        </div>

        <div className="flex bg-terminal-black border border-terminal-darkGreen p-1 rounded-sm gap-1 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveHub('HUB')} className={`px-5 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap ${activeHub === 'HUB' ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Home size={14} /> CENTRAL_HUB</button>
          <button onClick={() => setActiveHub('TRADE')} className={`px-5 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap ${activeHub === 'TRADE' ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Wallet2 size={14} /> TRADE_STATION</button>
          <button onClick={() => setActiveHub('BETTING')} className={`px-5 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap ${activeHub === 'BETTING' ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Trophy size={14} /> BETTING_MARKET</button>
          <button onClick={() => setActiveHub('CRYPTO')} className={`px-5 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap ${activeHub === 'CRYPTO' ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Cpu size={14} /> CRYPTO_HUB</button>
          <button onClick={() => setActiveHub('STOCKS')} className={`px-5 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap ${activeHub === 'STOCKS' ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Briefcase size={14} /> STOCK_HUB</button>
          <button onClick={() => setActiveHub('COMMODITIES')} className={`px-5 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap ${activeHub === 'COMMODITIES' ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Droplets size={14} /> COMMODITIES</button>
          <button onClick={() => setActiveHub('FOREX')} className={`px-5 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap ${activeHub === 'FOREX' ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Banknote size={14} /> FOREX</button>
          <button onClick={() => setActiveHub('BONDS')} className={`px-5 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap ${activeHub === 'BONDS' ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Landmark size={14} /> BONDS</button>
          <button onClick={() => setActiveHub('MACRO')} className={`px-5 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap ${activeHub === 'MACRO' ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><LineChart size={14} /> MACRO_INTEL</button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <ThemeScrollWheel />
          {activeHub === 'CRYPTO' && cryptoTab === 'TERMINAL' && (
            <div className="flex-1 md:flex-none bg-terminal-black border border-terminal-darkGreen px-4 py-2 flex items-center focus-within:border-terminal-green transition-all shadow-inner">
              <span className="text-terminal-green mr-2 font-bold animate-pulse">>>></span>
              <input type="text" placeholder="SEARCH_NODE..." className="bg-transparent border-none outline-none text-sm text-terminal-contrast w-full md:w-32 focus:md:w-48 transition-all placeholder-gray-800 uppercase font-bold" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <button onClick={() => { if(activeHub === 'CRYPTO' && viewMode === 'FUNDING') refreshFunding(); else if(activeHub === 'CRYPTO') refreshBaseData(); }} className="p-2.5 border border-terminal-darkGreen hover:bg-terminal-green hover:text-terminal-black transition-all text-terminal-green">
            <RefreshCw size={20} className={loading && activeHub === 'CRYPTO' ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {activeHub === 'HUB' ? (
           <GlobalCommandHub tickers={tickers} exchange={exchange} onAssetSelect={(t) => setSelectedAsset(t)} />
        ) : activeHub === 'TRADE' ? (
          <TradeHub cryptoTickers={tickers} />
        ) : activeHub === 'BETTING' ? (
          <BettingHub />
        ) : activeHub === 'CRYPTO' ? (
          <>
            <div className="flex bg-terminal-black/50 border border-terminal-darkGreen p-1 mb-6 rounded-sm w-fit mx-auto md:mx-0">
               <button onClick={() => setCryptoTab('TERMINAL')} className={`px-4 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${cryptoTab === 'TERMINAL' ? 'bg-terminal-dim text-terminal-black border-terminal-dim' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><BarChart2 size={12}/> TERMINAL</button>
               <button onClick={() => setCryptoTab('CONDUIT')} className={`px-4 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${cryptoTab === 'CONDUIT' ? 'bg-terminal-dim text-terminal-black border-terminal-dim' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><ArrowRightLeft size={12}/> CONDUIT</button>
               <button onClick={() => setCryptoTab('CARNAGE')} className={`px-4 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${cryptoTab === 'CARNAGE' ? 'bg-terminal-dim text-terminal-black border-terminal-dim' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Skull size={12}/> CARNAGE</button>
               <button onClick={() => setCryptoTab('VISUALIZER')} className={`px-4 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${cryptoTab === 'VISUALIZER' ? 'bg-terminal-dim text-terminal-black border-terminal-dim' : 'text-gray-500 border-transparent hover:text-terminal-contrast'}`}><Box size={12}/> VISUALIZER</button>
            </div>

            {cryptoTab === 'TERMINAL' && (
              <>
                <LiveTerminal logs={terminalLogs} tickers={tickers} exchange={exchange} onAddLog={addLog} />
                <div className="flex items-center gap-1.5 bg-terminal-black/50 border border-terminal-darkGreen p-1 mb-8 rounded-sm overflow-x-auto no-scrollbar">
                  {['BINANCE', 'BYBIT', 'OKX', 'HYPERLIQUID', 'COINBASE', 'MEXC', 'COINDCX', 'COINSWITCH'].map((ex) => (
                    <button key={ex} onClick={() => setExchange(ex as Exchange)} className={`px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase transition-all border ${exchange === ex ? 'bg-terminal-green text-terminal-black border-terminal-green' : 'text-gray-500 border-transparent hover:text-terminal-contrast hover:border-terminal-darkGreen'}`}>{ex}</button>
                  ))}
                </div>

                <div className="flex border-b border-terminal-darkGreen/20 mb-6 gap-2">
                   {[
                     { id: 'MARKET', icon: <BarChart2 size={14}/>, label: 'MARKET_ANALYSIS' },
                     { id: 'MOMENTUM', icon: <Timer size={14}/>, label: 'VOLATILITY_SURGE' },
                     { id: 'HEATMAP', icon: <LayoutGrid size={14}/>, label: 'VISUALIZER' },
                     { id: 'FUNDING', icon: <Zap size={14}/>, label: 'DERIVATIVES' }
                   ].map(btn => (
                       (btn.id !== 'FUNDING' || !['COINBASE', 'MEXC', 'COINDCX', 'COINSWITCH'].includes(exchange)) && (
                         <button key={btn.id} onClick={() => setViewMode(btn.id as ViewMode)} className={`px-5 py-2 text-[10px] font-black uppercase transition-all border-t border-x ${viewMode === btn.id ? 'bg-terminal-green text-black border-terminal-green' : 'bg-terminal-black text-gray-500 border-terminal-darkGreen hover:text-terminal-contrast hover:border-terminal-green'}`}>
                           {btn.icon} {btn.label}
                         </button>
                       )
                   ))}
                </div>

                <div className="bg-terminal-black border-2 border-terminal-darkGreen overflow-hidden shadow-2xl min-h-[400px]">
                  {viewMode === 'HEATMAP' ? (
                     <MarketHeatmap tickers={filteredTickers.slice(0, 500)} onAssetClick={setSelectedAsset} />
                  ) : viewMode === 'FUNDING' ? (
                     <FundingHeatmap fundingRates={fundingRates} />
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-terminal-black/50 text-gray-500 text-[8px] font-black uppercase tracking-[0.15em] border-b border-terminal-darkGreen shadow-sm">
                                <th className="p-4 cursor-pointer" onClick={() => handleSort(SortField.SYMBOL)}>NODE</th>
                                <th className="p-4 text-right cursor-pointer" onClick={() => handleSort(SortField.PRICE)}>INDEX_PX</th>
                                <th className="p-4 text-right cursor-pointer" onClick={() => handleSort(SortField.CHANGE)}>24H_CHG</th>
                                <th className="p-4 text-right cursor-pointer" onClick={() => handleSort(SortField.VOLUME)}>VOL_24H</th>
                                <th className="p-4 text-center cursor-pointer hidden md:table-cell">SENTIMENT</th>
                                <th className="p-4 text-right cursor-pointer hidden lg:table-cell" title="High / Low">24H_RANGE</th>
                                <th className="p-4 text-right cursor-pointer hidden xl:table-cell" onClick={() => handleSort(SortField.SPREAD)}>SPREAD_%</th>
                                <th className="p-4 text-right cursor-pointer hidden xl:table-cell" onClick={() => handleSort(SortField.TRADES)}>OPS_24H</th>
                                <th className="p-4 text-center">CMD</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-terminal-darkGreen/30 font-mono text-xs font-bold">
                            {loading ? (
                              <tr><td colSpan={10} className="p-24 text-center text-terminal-green animate-pulse tracking-widest font-black uppercase">SYNCHRONIZING_MARKET_VECTORS...</td></tr>
                            ) : filteredTickers.slice(0, visibleCount).map((ticker) => {
                              const isPositive = parseFloat(ticker.priceChangePercent) >= 0;
                              return (
                              <tr key={ticker.symbol} className="hover:bg-terminal-green/5 transition-all cursor-pointer group border-l-2 border-transparent hover:border-terminal-green" onClick={() => setSelectedAsset(ticker)}>
                                <td className="p-4">
                                  <div className="flex flex-col">
                                    <span className="font-black text-terminal-contrast text-sm">{ticker.baseAsset}</span>
                                    <span className="text-[8px] text-gray-600 font-black tracking-widest">{ticker.quoteAsset}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right text-gray-200 tabular-nums font-black">${parseFloat(ticker.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
                                <td className={`p-4 text-right font-black ${isPositive ? 'text-green-400' : 'text-red-500'}`}>{ticker.priceChangePercent}%</td>
                                <td className="p-4 text-right text-gray-500 tabular-nums">${(parseFloat(ticker.quoteVolume) / 1000000).toFixed(2)}M</td>
                                <td className="p-4 text-center hidden md:table-cell">
                                  {isPositive ? (
                                    <div className="flex items-center justify-center gap-1 text-green-500 bg-green-500/10 border border-green-500/30 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter">
                                      <TrendingUp size={10} /> BULLISH_ALPHA
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1 text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter">
                                      <TrendingDown size={10} /> BEARISH_BETA
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-right text-gray-600 tabular-nums hidden lg:table-cell text-[10px]">
                                  <div className="flex flex-col">
                                    <span className="text-green-900/60 font-bold tracking-tighter">H: {parseFloat(ticker.highPrice).toFixed(2)}</span>
                                    <span className="text-red-900/60 font-bold tracking-tighter">L: {parseFloat(ticker.lowPrice).toFixed(2)}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right text-terminal-dim tabular-nums hidden xl:table-cell text-[10px] font-black">
                                  {ticker.spread.toFixed(4)}%
                                </td>
                                <td className="p-4 text-right text-gray-500 tabular-nums hidden xl:table-cell text-[10px]">
                                  {ticker.count.toLocaleString()}
                                </td>
                                <td className="p-4 text-center"><button className="text-terminal-green p-1.5 border border-terminal-darkGreen group-hover:border-terminal-green transition-all"><Terminal size={12} /></button></td>
                              </tr>
                            )})}
                        </tbody>
                        </table>
                    </div>
                  )}
                  {!loading && visibleCount < filteredTickers.length && (
                    <button onClick={() => setVisibleCount(v => v + 50)} className="w-full py-5 text-center text-xs text-terminal-green border-t border-terminal-darkGreen/10 uppercase tracking-[0.4em] font-black flex items-center justify-center gap-2 group transition-all">
                      [ LOAD_NEXT_ASSET_BATCH ] <ChevronDown size={16} />
                    </button>
                  )}
                </div>
              </>
            )}

            {cryptoTab === 'CONDUIT' && <div className="h-[700px] border border-terminal-darkGreen"><LiveTradeFeed initialAsset={conduitAsset} /></div>}
            {cryptoTab === 'CARNAGE' && <div className="h-[700px] border border-terminal-darkGreen"><CarnageDashboard liquidations={liquidations} sessionTotalUsd={sessionStats.totalUsd} sessionCount={sessionStats.count} /></div>}
            {cryptoTab === 'VISUALIZER' && <div className="h-[700px] border border-terminal-darkGreen"><TransactionVisualizer /></div>}
          </>
        ) : activeHub === 'STOCKS' ? (
          <div className="bg-terminal-black border-2 border-terminal-darkGreen shadow-[0_0_40px_rgba(var(--terminal-green-rgb),0.1)] overflow-hidden min-h-[600px] relative">
            {stocksView === 'MAP' ? (
              <WorldMapTerminal onCountryClick={handleCountryClick} />
            ) : (
              <CountryDetailView countryId={selectedCountryId} onBack={() => setStocksView('MAP')} />
            )}
          </div>
        ) : activeHub === 'COMMODITIES' ? (
          <CommoditiesHub />
        ) : activeHub === 'FOREX' ? (
          <ForexHub />
        ) : activeHub === 'BONDS' ? (
          <BondsHub />
        ) : (
          <MacroHub />
        )}
      </main>
      
      {selectedAsset && (
        <AssetDetailModal ticker={selectedAsset} exchange={exchange} onClose={() => setSelectedAsset(null)} />
      )}
    </div>
  );
}

export default App;