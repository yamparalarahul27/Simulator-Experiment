import React from 'react';
import { format } from 'date-fns';
import InfoTooltip from './InfoTooltip';

interface SyncStatusProps {
  lastSyncedAt: Date | string | null;
  dataSource: 'cache' | 'fresh' | 'mock';
  isLoading: boolean;
  context?: 'tradeHistory' | 'home';
  error?: string | null;
  hasWallet?: boolean; // For home context - whether a wallet is connected
}

/**
 * Reusable component for displaying data synchronization status
 * Used in both TradeHistory (cached data) and Home (ingestion time) contexts
 */
export default function SyncStatus({
  lastSyncedAt,
  dataSource,
  isLoading,
  context = 'home',
  error,
  hasWallet = false
}: SyncStatusProps) {
  const formatSyncTime = (time: Date | string | null): string => {
    if (!time) return context === 'tradeHistory' ? 'Never synced' : 'No data ingested yet';
    const date = typeof time === 'string' ? new Date(time) : time;
    return context === 'tradeHistory'
      ? getTimeSinceSync(date)
      : format(date, 'MMM d, yyyy h:mm a');
  };

  const getTimeSinceSync = (date: Date): string => {
    const now = new Date();
    const minutesSinceSync = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (minutesSinceSync < 1) return 'Just now';
    if (minutesSinceSync < 60) return `${minutesSinceSync} minute${minutesSinceSync > 1 ? 's' : ''} ago`;

    const hoursSinceSync = Math.floor(minutesSinceSync / 60);
    if (hoursSinceSync < 24) return `${hoursSinceSync} hour${hoursSinceSync > 1 ? 's' : ''} ago`;

    const daysSinceSync = Math.floor(hoursSinceSync / 24);
    return `${daysSinceSync} day${daysSinceSync > 1 ? 's' : ''} ago`;
  };

  const getDisplayText = (): string => {
    if (error) return error;
    if (isLoading) return context === 'tradeHistory' ? 'Loading trades...' : 'Checking ingestion...';
    if (dataSource === 'mock') return 'Mock data (no ingestion)';

    if (context === 'tradeHistory') {
      if (dataSource === 'cache') {
        const timeText = formatSyncTime(lastSyncedAt);
        return `Showing cached data from ${timeText} • Click Refresh to update`;
      }
      return 'Fetching latest data...';
    }

    // Home context
    if (dataSource === 'fresh') {
      if (!hasWallet) return 'Connect wallet to ingest trades';
      return formatSyncTime(lastSyncedAt);
    }
    return 'No wallet connected';
  };

  return (
    <div className="flex items-center">
      {context === 'home' && <InfoTooltip infoKey="lastIngestion" />}
      <span className="text-white/60 text-sm font-mono ml-2 mr-2">
        {context === 'tradeHistory' ? 'Data status:' : 'Last ingestion:'}
      </span>
      <span className="text-sm font-mono text-white/70">
        {getDisplayText()}
      </span>
    </div>
  );
}
