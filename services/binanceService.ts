
import { BinanceTicker, EnrichedTicker, Trade, FundingRateData, PriceSnapshot, OrderBook, KlineData } from '../types';

const BASE_URL = 'https://api.binance.com/api/v3';
const FAPI_URL = 'https://fapi.binance.com/fapi/v1';

const fetchWithProxy = async (url: string) => {
    const strategies = [
        async (u: string) => {
            const res = await fetch(u);
            if (res.ok) return await res.json();
            throw new Error('DIRECT_FAILED');
        },
        async (u: string) => {
            const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`);
            if (res.ok) return await res.json();
            throw new Error('ALLORIGINS_FAILED');
        },
        async (u: string) => {
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(u)}`);
            if (res.ok) return await res.json();
            throw new Error('CORSPROXY_FAILED');
        }
    ];

    for (const strategy of strategies) {
        try {
            return await strategy(url);
        } catch (e) {}
    }
    throw new Error("BINANCE_NODE_OFFLINE");
};

const processTickers = (data: any[], futuresData: any[] = []): EnrichedTicker[] => {
  const commonQuotes = [
    'USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'USDS', 
    'BTC', 'ETH', 'BNB', 'DAI', 'PAX', 'VAI', 'AEUR',
    'TRY', 'EUR', 'RUB', 'BRL', 'GBP', 'AUD', 'UAH', 'NGN', 'ZAR', 'PLN', 'RON', 'CZK', 'ARS', 'MXN', 'COP', 'IDRT', 'BIDR'
  ];

  const futuresMap = new Map(futuresData.map(f => [f.symbol, f]));

  return data.map(ticker => {
    let quoteAsset = 'OTHER';
    let baseAsset = ticker.symbol;
    const sortedQuotes = [...commonQuotes].sort((a, b) => b.length - a.length);

    for (const quote of sortedQuotes) {
      if (ticker.symbol.endsWith(quote)) {
        const base = ticker.symbol.slice(0, ticker.symbol.length - quote.length);
        if (base.length > 0) {
          quoteAsset = quote;
          baseAsset = base;
          break;
        }
      }
    }

    const high = parseFloat(ticker.highPrice);
    const low = parseFloat(ticker.lowPrice);
    const ask = parseFloat(ticker.askPrice || '0');
    const bid = parseFloat(ticker.bidPrice || '0');
    
    const volatility = low > 0 ? ((high - low) / low) * 100 : 0;
    const spread = ask > 0 ? ((ask - bid) / ask) * 100 : 0;

    // Merge Futures Data (Funding / OI)
    const fData = futuresMap.get(ticker.symbol);

    return {
      ...ticker,
      baseAsset,
      quoteAsset,
      volatility,
      spread,
      priceChangePercent: ticker.priceChangePercent || '0',
      quoteVolume: ticker.quoteVolume || '0',
      fundingRate: fData?.lastFundingRate,
      openInterest: fData?.openInterest
    };
  }).filter(t => parseFloat(t.lastPrice) > 0);
};

export const fetch24hTicker = async (): Promise<EnrichedTicker[]> => {
  try {
    const [spotData, futuresRates] = await Promise.allSettled([
      fetchWithProxy(`${BASE_URL}/ticker/24hr`),
      fetchWithProxy(`${FAPI_URL}/premiumIndex`)
    ]);

    const spot = spotData.status === 'fulfilled' ? spotData.value : [];
    const futures = futuresRates.status === 'fulfilled' ? futuresRates.value : [];

    return processTickers(Array.isArray(spot) ? spot : [], Array.isArray(futures) ? futures : []);
  } catch (error) {
    return [];
  }
};

export const fetchAllPrices = async (): Promise<PriceSnapshot[]> => {
  try {
    const data = await fetchWithProxy(`${BASE_URL}/ticker/price`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

export const fetchRecentTrades = async (symbol: string, limit: number = 50): Promise<Trade[]> => {
  try {
    const data = await fetchWithProxy(`${BASE_URL}/trades?symbol=${symbol}&limit=${limit}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

export const fetchOrderBook = async (symbol: string, limit: number = 20): Promise<OrderBook> => {
  try {
    const data = await fetchWithProxy(`${BASE_URL}/depth?symbol=${symbol}&limit=${limit}`);
    if (!data.bids || !data.asks) throw new Error("INVALID_DEPTH_DATA");
    return {
      bids: data.bids.map(([p, q]: any) => ({ price: p, qty: q })),
      asks: data.asks.map(([p, q]: any) => ({ price: p, qty: q }))
    };
  } catch (error) {
    console.error(`OrderBook fetch failed for ${symbol}`, error);
    return { bids: [], asks: [] };
  }
};

export const fetchRecentPerpTrades = async (symbol: string, limit: number = 50): Promise<Trade[]> => {
    try {
      const data = await fetchWithProxy(`${FAPI_URL}/trades?symbol=${symbol}&limit=${limit}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
};

export const fetchPriceHistory = async (symbol: string): Promise<number[]> => {
  try {
    const data = await fetchWithProxy(`${BASE_URL}/klines?symbol=${symbol}&interval=1h&limit=24`);
    return Array.isArray(data) ? data.map((d: any) => parseFloat(d[4])) : [];
  } catch (error) {
    return [];
  }
};

// Removed redundant local KlineData interface - now imported from ../types

export const fetchKlines = async (symbol: string, interval: string = '1m', limit: number = 100): Promise<KlineData[]> => {
  try {
    const data = await fetchWithProxy(`${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    return Array.isArray(data) ? data.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5])
    })) : [];
  } catch (error) {
    return [];
  }
};

export const fetchFundingRates = async (): Promise<FundingRateData[]> => {
  try {
    const url = `${FAPI_URL}/premiumIndex`;
    const data = await fetchWithProxy(url);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};