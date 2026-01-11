
export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface EnrichedTicker extends BinanceTicker {
  baseAsset: string;
  quoteAsset: string;
  spread: number;
  volatility: number; 
  fundingRate?: string;
  openInterest?: string; 
}

export interface Trade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
  source?: string;
}

export interface OrderBookLevel {
  price: string;
  qty: string;
  total?: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface Liquidation {
  symbol: string;
  side: 'BUY' | 'SELL';
  price: string;
  qty: string;
  usdValue: number;
  time: number;
  exchange: string;
}

export interface MarketSummary {
  totalVolume: number;
  topGainer: BinanceTicker | null;
  topLoser: BinanceTicker | null;
  btcDominance?: number;
}

export interface FundingRateData {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

export interface PriceSnapshot {
  symbol: string;
  price: string;
}

/**
 * Interface for candlestick chart data used across terminal modules
 */
export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum SortField {
  SYMBOL = 'symbol',
  PRICE = 'lastPrice',
  CHANGE = 'priceChangePercent',
  VOLUME = 'quoteVolume',
  VOLATILITY = 'volatility',
  FUNDING_RATE = 'fundingRate',
  OPEN_INTEREST = 'openInterest',
  LIQUIDATION = 'liquidation'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export type TimeWindow = '1m' | '3m' | '5m' | '15m';