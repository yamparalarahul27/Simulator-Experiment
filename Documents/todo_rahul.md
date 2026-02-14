# Future Enhancements - Todo List

## Priority 1: Load Cached Trades

### Goal
Show cached trades instantly without fetching from blockchain every time.

### Why This Matters
- **⚡ Performance**: Instant load (no RPC calls needed)
- **💰 Cost Savings**: Reduces expensive RPC calls to Helius/Solana
- **📊 Reliability**: Historical data always available, even if RPC is down
- **🔄 Better UX**: Show cached data immediately, then offer refresh option

### Implementation Approach
1. **Check Database First**
   - When user enters wallet address, query `trades` table first
   - If trades exist, display them immediately
   - Show "Last synced X hours ago" indicator

2. **Add Refresh Button**
   - Replace "Run Lookup" with "Refresh" when cached data exists
   - Re-fetch from blockchain on user request
   - Update `last_synced_at` in `user_wallets` table

3. **Smart Loading**
   ```typescript
   // Pseudocode
   const cachedTrades = await tradeService.getTrades(address);
   if (cachedTrades.length > 0) {
     setDeriverseTrades(cachedTrades);
     setDataSource('cache');
   } else {
     // Fetch from blockchain
   }
   ```
---

## Priority 2: Trade Annotations System

### Goal
Let users add notes, tags, and lessons learned to individual trades.

### Why This Matters
- **📝 Learning**: Document what worked and what didn't
- **🏷️ Organization**: Tag trades by strategy, setup, emotion
- **💡 Improvement**: Review past mistakes and successes
- **🔍 Filtering**: Find trades by tag or note content

### Features to Build
1. **Add Notes to Trades**
   - Text area for each trade
   - Save to database
   - Display in trade details

2. **Tagging System**
   - Predefined tags: "revenge trade", "good setup", "FOMO", "patience"
   - Custom tags
   - Multi-tag support

3. **Lessons Learned**
   - Dedicated field for key takeaways
   - Display in journal view

4. **Filter by Tags**
   - Show all trades with specific tag
   - Analyze performance by tag
   - Example: "How do my 'revenge trades' perform?"

### Database Schema
```sql
CREATE TABLE trade_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id TEXT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  notes TEXT,
  tags TEXT[], -- Array of tags
  lessons_learned TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migration from localStorage
- Current annotations stored in localStorage
- Migrate to database for persistence
- Sync across devices

---


## Additional Ideas (Lower Priority)

### 5. Export Trades to CSV
- Download trades for tax reporting
- Excel-compatible format
- Filter by date range

### 6. Trade Alerts/Notifications
- Alert when PnL crosses threshold
- Daily/weekly summary emails
- Browser notifications

### 7. Strategy Tracking
- Tag trades by strategy
- Compare strategy performance
- Identify best strategies

### 8. Social Features
- Share trade performance (anonymously)
- Leaderboards
- Community insights
