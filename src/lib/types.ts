/**
 * Shared type definitions for trading data
 */

export type OrderType = 'limit' | 'market' | 'stop_limit' | 'stop_market';

export interface Trade {
    id: string;
    symbol: string;
    quoteCurrency: string;
    side: 'buy' | 'sell' | 'long' | 'short';
    orderType: OrderType;
    quantity: number;
    price: number;
    notional: number;
    pnl: number;
    fee: number;
    feeCurrency: string;
    openedAt: Date;
    closedAt: Date;
    durationSeconds: number;
    isWin: boolean;
    txSignature: string;

    // Fee breakdown
    feeBreakdown?: FeeComposition[];
    isMaker?: boolean;

    // Leverage fields (for perpetuals)
    leverage?: number;
    liquidationPrice?: number;
    marginUsed?: number;
}

/**
 * Annotation data for a single trade
 */
export interface TradeAnnotation {
    id?: string;
    tradeId: string;
    notes: string;
    tags: string[];
    lessonsLearned: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Fee composition breakdown
 */
export interface FeeComposition {
    type: string;
    amount: number;
    percent: number;
}

/**
 * Analytics summary with fee data
 */
export interface AnalyticsSummary {
    feeComposition: FeeComposition[];
    cumulativeFees: number;
}

/**
 * Daily PnL data point
 */
export interface DailyPnL {
    date: string;
    pnl: number;
    trades: number;
    wins: number;
    losses: number;
}

/**
 * Session performance bucket (morning, afternoon, evening, night)
 */
export interface SessionBucket {
    session: 'morning' | 'afternoon' | 'evening' | 'night';
    pnl: number;
    trades: number;
    winRate: number;
}

/**
 * Time of day performance bucket (hourly)
 */
export interface TimeOfDayBucket {
    hour: number;
    pnl: number;
    trades: number;
    winRate: number;
}

// ============================================
// Learning Module Types
// ============================================

export interface SimulatorPreset {
    orderType?: string;
    pair?: string;
    side?: 'buy' | 'sell';
}

export interface LessonConfig {
    lessonSlug: string;
    title: string;
    description: string;
    simulatorPreset?: SimulatorPreset;
}

export interface LearningModule {
    moduleSlug: string;
    title: string;
    description: string;
    icon: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    simulatorKind?: 'spot' | 'futures';
    lessons: LessonConfig[];
    comingSoon: boolean;
    walletRequired: boolean;
}

// ============================================
// Content Types (Supabase-backed)
// ============================================

export type ChangelogCategory = 'product' | 'design' | 'dev';

export interface ChangelogTag {
    label: string;
    color: string;
}

export interface ChangelogEntry {
    id?: number;
    category?: ChangelogCategory;
    date: string;
    tag: ChangelogTag;
    title: string;
    description?: string;
    credit?: string;
    source?: string;
    testHref?: string;
    testLabel?: string;
}

export type RoadmapStatus = 'done' | 'next' | 'future';

export interface RoadmapPhase {
    id?: number;
    title: string;
    status: RoadmapStatus;
    subtitle: string;
    items: string[];
}

export interface FAQItem {
    id?: number;
    value: string;
    title: string;
    body: string;
}

export interface SupportPath {
    id?: number;
    title: string;
    description: string;
}

export interface OrderTypeDetail {
    emoji: string;
    whenToUse: string;
    risk: string;
    example: string;
}

export interface OrderBookDetail {
    emoji: string;
    sections: { heading: string; body: string }[];
}
