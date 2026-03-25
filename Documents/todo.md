# TODO

## Performance

- [ ] Add code splitting for tab-level pages in `TabNavigation.tsx` — currently all 9 tab pages (Home, TradeHistory, Journal, Market, ExchangeManager, Web3Hub, ProfileSettings, HelpScreen, RoadmapScreen, AboutScreen) are eagerly imported. Convert to `next/dynamic` with loading skeletons to reduce initial bundle size. (Current code splitting: ~12.5%)
