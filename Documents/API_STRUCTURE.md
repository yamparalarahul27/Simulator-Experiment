# API Structure Documentation

## Overview

This document outlines the API architecture and communication patterns used in the Deriverse trading analytics platform.

## Current API Layer

### 1. Mock Data Service
**Location**: `src/lib/mockData.ts`

**Purpose**: Generates deterministic trading data for development and testing

**Key Functions**:
```typescript
// Generate mock trade data
generateMockTrades(): Trade[]

// Calculate daily PnL
calculateDailyPnL(trades: Trade[]): DailyPnL[]

// Calculate session performance
calculateSessionPerformance(trades: Trade[]): SessionBucket[]

// Calculate fee breakdown
calculateFeeBreakdown(trades: Trade[]): FeeComposition[]
```

**Data Flow**:
```
Mock Data Generation → Trade Processing → Component Props → UI Display
```

### 2. Annotation Storage Service
**Location**: `src/lib/annotationStorage.ts`

**Purpose**: Manages client-side trade annotations using localStorage

**Key Functions**:
```typescript
// Load all annotations
loadAnnotations(): Record<string, any>

// Save single annotation
saveAnnotation(tradeId: string, annotation: any): void

// Get specific annotation
getAnnotation(tradeId: string): any

// Export annotations as markdown
downloadAnnotations(annotations: Record<string, any>): void
```

**Data Flow**:
```
User Input → Local Storage → Markdown Export → File Download
```

## Planned API Services

### 1. Helius Service
**Location**: `src/services/HeliusService.ts`

**Purpose**: Fetches Solana blockchain data via Helius API

**API Endpoints**:
```typescript
// Get transaction history for wallet
async getTransactions(address: string, limit?: number): Promise<TransactionLog[]>

// Get account activity
async getAccountActivity(address: string): Promise<AccountActivity[]>

// Get token transfers
async getTokenTransfers(address: string): Promise<TokenTransfer[]>
```

**Data Structure**:
```typescript
interface TransactionLog {
  signature: string;
  timestamp: number;
  type: string;
  status: 'success' | 'error';
  fee: number;
  instructions: Instruction[];
}

interface AccountActivity {
  slot: number;
  blockTime: number;
  transaction: TransactionLog;
}
```

**Error Handling**:
```typescript
class HeliusService {
  private apiKey: string;
  private baseUrl: string;

  async getTransactions(address: string): Promise<TransactionLog[]> {
    try {
      const response = await fetch(`${this.baseUrl}/addresses/${address}/transactions`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  }
}
```

### 2. Deriverse Trade Service
**Location**: `src/services/DeriverseTradeService.ts`

**Purpose**: Processes and analyzes trading data from Deriverse protocol

**API Methods**:
```typescript
// Fetch trades for wallet
async fetchTradesForWallet(connection: any, address: string): Promise<Trade[]>

// Calculate PnL for trades
calculatePnL(trades: Trade[]): PnLAnalysis

// Get trading statistics
getTradingStats(trades: Trade[]): TradingStats

// Analyze trading patterns
analyzePatterns(trades: Trade[]): PatternAnalysis
```

**Data Processing**:
```typescript
interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell' | 'long' | 'short';
  quantity: number;
  price: number;
  pnl: number;
  fee: number;
  openedAt: Date;
  closedAt: Date;
  isWin: boolean;
  leverage?: number;
}

interface PnLAnalysis {
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
}
```

## API Communication Patterns

### 1. Service Layer Pattern
```typescript
// Service interface
interface TradeDataService {
  getTrades(address: string): Promise<Trade[]>;
  getAnalytics(trades: Trade[]): Promise<Analytics>;
}

// Implementation
class HeliusTradeService implements TradeDataService {
  async getTrades(address: string): Promise<Trade[]> {
    // API call implementation
  }
}
```

### 2. Error Handling Pattern
```typescript
// Standardized error response
interface APIError {
  code: string;
  message: string;
  details?: any;
}

// Error handling wrapper
async function handleAPICall<T>(
  apiCall: () => Promise<T>
): Promise<T | APIError> {
  try {
    return await apiCall();
  } catch (error) {
    return {
      code: 'API_ERROR',
      message: error.message,
      details: error
    };
  }
}
```

### 3. Data Transformation Pattern
```typescript
// Transform API data to internal format
function transformHeliusData(rawData: HeliusResponse): Trade[] {
  return rawData.transactions.map(tx => ({
    id: tx.signature,
    symbol: extractSymbol(tx),
    side: determineSide(tx),
    // ... other transformations
  }));
}
```

## Rate Limiting & Caching

### Current Approach
- No rate limiting (mock data)
- Client-side caching via React state

### Planned Implementation
```typescript
// Rate limiting wrapper
class RateLimitedAPI {
  private requests: Map<string, number[]> = new Map();
  private readonly LIMITS = {
    helius: { requests: 100, window: 60000 }, // 100 req/min
    deriverse: { requests: 1000, window: 60000 } // 1000 req/min
  };

  async makeRequest(service: string, endpoint: string): Promise<any> {
    const now = Date.now();
    const limit = this.LIMITS[service];
    
    if (this.isRateLimited(service, now, limit)) {
      throw new Error(`Rate limit exceeded for ${service}`);
    }
    
    // Make request and update tracking
  }
}
```

### Caching Strategy
```typescript
// Response caching
class APICache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

## Security Considerations

### API Key Management
```typescript
// Environment-based API keys
const API_CONFIG = {
  helius: process.env.HELIUS_API_KEY,
  deriverse: process.env.DERIVERSE_API_KEY
};

// Validation
if (!API_CONFIG.helius) {
  throw new Error('Helius API key not configured');
}
```

### Request Validation
```typescript
// Input sanitization
function validateAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// Request validation
function validateTradeRequest(params: TradeRequest): boolean {
  return validateAddress(params.address) && 
         params.limit <= 1000 && 
         params.fromDate < params.toDate;
}
```

## Testing Strategy

### Mock API Testing
```typescript
// Mock service for testing
class MockHeliusService implements HeliusService {
  async getTransactions(address: string): Promise<TransactionLog[]> {
    return mockTransactionData;
  }
}

// Test usage
describe('TradeHistory Component', () => {
  it('displays transactions correctly', async () => {
    const mockService = new MockHeliusService();
    // Test implementation
  });
});
```

### Integration Testing
```typescript
// API integration tests
describe('Helius Service Integration', () => {
  it('fetches real transaction data', async () => {
    const service = new HeliusService();
    const transactions = await service.getTransactions(testAddress);
    expect(transactions).toBeDefined();
    expect(transactions.length).toBeGreaterThan(0);
  });
});
```

## Monitoring & Logging

### API Call Tracking
```typescript
// Request logging
class APILogger {
  logRequest(service: string, endpoint: string, duration: number): void {
    console.log(`API Call: ${service}.${endpoint} - ${duration}ms`);
  }
  
  logError(service: string, error: Error): void {
    console.error(`API Error: ${service} - ${error.message}`);
  }
}
```

### Performance Monitoring
```typescript
// Performance metrics
interface APIMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
}
```

This API structure provides a solid foundation for scaling from mock data to real blockchain integration while maintaining clean architecture and error handling.
