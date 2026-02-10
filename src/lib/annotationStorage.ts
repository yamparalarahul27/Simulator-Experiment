/**
 * Annotation Storage System
 * 
 * Manages trade annotations in markdown format for LLM analysis.
 * Stores annotations in browser localStorage and provides export to .md file.
 */

const ANNOTATION_STORAGE_KEY = 'deriverse-journal-annotations';

export interface TradeAnnotation {
    tradeId: string;
    note: string;
    timestamp: number; // Unix timestamp in milliseconds
    lastEdited?: number;
}

/**
 * Load all annotations from localStorage
 */
export function loadAnnotations(): Record<string, TradeAnnotation> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(ANNOTATION_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        console.error('Failed to load annotations:', error);
        return {};
    }
}

/**
 * Save annotation for a specific trade
 */
export function saveAnnotation(tradeId: string, note: string): void {
    if (typeof window === 'undefined') return;

    const annotations = loadAnnotations();
    const now = Date.now();

    if (note.trim()) {
        annotations[tradeId] = {
            tradeId,
            note: note.trim(),
            timestamp: annotations[tradeId]?.timestamp || now,
            lastEdited: now,
        };
    } else {
        delete annotations[tradeId];
    }

    try {
        localStorage.setItem(ANNOTATION_STORAGE_KEY, JSON.stringify(annotations));
    } catch (error) {
        console.error('Failed to save annotation:', error);
    }
}

/**
 * Delete annotation for a specific trade
 */
export function deleteAnnotation(tradeId: string): void {
    if (typeof window === 'undefined') return;

    const annotations = loadAnnotations();
    delete annotations[tradeId];

    try {
        localStorage.setItem(ANNOTATION_STORAGE_KEY, JSON.stringify(annotations));
    } catch (error) {
        console.error('Failed to delete annotation:', error);
    }
}

/**
 * Get annotation for a specific trade
 */
export function getAnnotation(tradeId: string): TradeAnnotation | null {
    const annotations = loadAnnotations();
    return annotations[tradeId] || null;
}

/**
 * Export all annotations as markdown file
 * Format optimized for LLM analysis
 */
export function exportAnnotationsAsMarkdown(trades: any[]): string {
    const annotations = loadAnnotations();
    const tradeMap = new Map(trades.map(t => [t.id, t]));

    let markdown = '# Trade Journal Annotations\n\n';
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    markdown += '---\n\n';

    const annotatedTrades = Object.values(annotations).sort((a, b) => b.timestamp - a.timestamp);

    if (annotatedTrades.length === 0) {
        markdown += '*No annotations yet*\n';
        return markdown;
    }

    annotatedTrades.forEach((annotation, index) => {
        const trade = tradeMap.get(annotation.tradeId);
        if (!trade) return;

        markdown += `## Trade ${index + 1}: ${trade.symbol}\n\n`;
        markdown += `- **Date**: ${new Date(trade.closedAt).toLocaleString()}\n`;
        markdown += `- **Side**: ${trade.side}\n`;
        markdown += `- **PnL**: $${trade.pnl.toFixed(2)}\n`;
        markdown += `- **Result**: ${trade.isWin ? 'Win ✓' : 'Loss ✗'}\n`;
        markdown += `- **Annotated**: ${new Date(annotation.timestamp).toLocaleString()}\n`;
        if (annotation.lastEdited && annotation.lastEdited !== annotation.timestamp) {
            markdown += `- **Last Edited**: ${new Date(annotation.lastEdited).toLocaleString()}\n`;
        }
        markdown += '\n### Note:\n\n';
        markdown += `${annotation.note}\n\n`;
        markdown += '---\n\n';
    });

    return markdown;
}

/**
 * Download annotations as .md file
 */
export function downloadAnnotations(trades: any[]): void {
    const markdown = exportAnnotationsAsMarkdown(trades);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-annotations-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
