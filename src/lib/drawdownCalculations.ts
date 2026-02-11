import type { Trade } from './types';
import { calculateDailyPnL } from './mockData';

export interface DrawdownPoint {
  date: string;
  value: number;
  peak: number;
  trough: number;
  isPeak: boolean;
  isTrough: boolean;
}

export interface DrawdownStats {
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  avgRecoveryDays: number;
  pnlToDrawdownRatio: number;
  recoveryPeriods: {start: string, end: string, days: number}[];
}

/**
 * Calculate drawdown series from daily PnL data
 */
export function calculateDrawdownSeries(dailyPnL: {date: string, pnl: number}[]): {
  drawdowns: DrawdownPoint[];
  maxDrawdown: number;
  peakToTroughPoints: {peak: {date: string, value: number}, trough: {date: string, value: number}}[];
} {
  if (dailyPnL.length < 2) {
    return { drawdowns: [], maxDrawdown: 0, peakToTroughPoints: [] };
  }

  const drawdowns: DrawdownPoint[] = [];
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let currentPeak = { date: '', value: 0 };
  let currentTrough = { date: '', value: 0 };
  const peakToTroughPoints: {peak: {date: string, value: number}, trough: {date: string, value: number}}[] = [];

  dailyPnL.forEach((day, index) => {
    equity += day.pnl;
    
    // Track peak
    if (equity > peak) {
      if (currentPeak.value > 0 && currentTrough.value < currentPeak.value) {
        peakToTroughPoints.push({
          peak: { ...currentPeak },
          trough: { ...currentTrough }
        });
      }
      peak = equity;
      currentPeak = { date: day.date, value: equity };
    }
    
    // Calculate drawdown
    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
    
    // Track trough
    if (drawdown > 0) {
      currentTrough = { date: day.date, value: equity };
    }
    
    drawdowns.push({
      date: day.date,
      value: drawdown,
      peak,
      trough: equity,
      isPeak: equity === peak && index > 0,
      isTrough: drawdown > 0 && (index === dailyPnL.length - 1 || dailyPnL[index + 1]?.pnl > 0)
    });
  });

  return { drawdowns, maxDrawdown, peakToTroughPoints };
}

/**
 * Calculate comprehensive drawdown statistics
 */
export function calculateDrawdownStats(trades: Trade[]): DrawdownStats {
  if (trades.length < 2) {
    return {
      maxDrawdown: 0,
      maxDrawdownPercentage: 0,
      avgRecoveryDays: 0,
      pnlToDrawdownRatio: 0,
      recoveryPeriods: []
    };
  }

  const dailyPnL = calculateDailyPnL(trades);
  const { drawdowns, maxDrawdown, peakToTroughPoints } = calculateDrawdownSeries(dailyPnL);
  
  // Calculate total PnL
  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  
  // Calculate max drawdown percentage
  let peakValue = 0;
  let currentEquity = 0;
  dailyPnL.forEach((day, index) => {
    currentEquity += day.pnl;
    peakValue = Math.max(peakValue, currentEquity);
  });
  const maxDrawdownPercentage = peakValue > 0 ? (maxDrawdown / peakValue) * 100 : 0;
  
  // Calculate recovery periods
  const recoveryPeriods: {start: string, end: string, days: number}[] = [];
  let inDrawdown = false;
  let drawdownStart = '';
  
  dailyPnL.forEach((day, index) => {
    const equity = dailyPnL.slice(0, index + 1).reduce((sum, d) => sum + d.pnl, 0);
    let peakSoFar = 0;
    let tempEquity = 0;
    dailyPnL.slice(0, index + 1).forEach(d => {
      tempEquity += d.pnl;
      peakSoFar = Math.max(peakSoFar, tempEquity);
    });
    const currentDrawdown = peakSoFar - equity;
    
    if (currentDrawdown > 0 && !inDrawdown) {
      inDrawdown = true;
      drawdownStart = day.date;
    } else if (currentDrawdown === 0 && inDrawdown) {
      inDrawdown = false;
      const startIndex = dailyPnL.findIndex(d => d.date === drawdownStart);
      const recoveryDays = index - startIndex;
      recoveryPeriods.push({
        start: drawdownStart,
        end: day.date,
        days: recoveryDays
      });
    }
  });
  
  // Calculate average recovery days
  const avgRecoveryDays = recoveryPeriods.length > 0 
    ? recoveryPeriods.reduce((sum, period) => sum + period.days, 0) / recoveryPeriods.length 
    : 0;
  
  // Calculate PnL to Drawdown ratio
  const pnlToDrawdownRatio = maxDrawdown > 0 ? totalPnL / maxDrawdown : 0;

  return {
    maxDrawdown,
    maxDrawdownPercentage,
    avgRecoveryDays,
    pnlToDrawdownRatio,
    recoveryPeriods
  };
}

/**
 * Calculate Profit-to-Drawdown ratio
 */
export function calculateProfitToDrawdownRatio(totalPnL: number, maxDrawdown: number): number {
  return maxDrawdown > 0 ? totalPnL / maxDrawdown : 0;
}
