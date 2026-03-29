import { Clock } from 'lucide-react';

interface Commit {
    sha: string;
    message: string;
    date: string;
}

interface DayGroup {
    date: string;
    displayDate: string;
    time: string;
    commits: Commit[];
}

async function getCommits(): Promise<Commit[]> {
    try {
        const res = await fetch(
            'https://api.github.com/repos/yamparalarahul27/Ydex/commits?per_page=100',
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((c: any) => ({
            sha: c.sha?.slice(0, 7) ?? '',
            message: c.commit?.message?.split('\n')[0] ?? '',
            date: c.commit?.author?.date ?? '',
        }));
    } catch {
        return [];
    }
}

function groupByDate(commits: Commit[]): DayGroup[] {
    const groups: Record<string, Commit[]> = {};

    for (const commit of commits) {
        const d = new Date(commit.date);
        const dateKey = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(commit);
    }

    return Object.entries(groups).map(([dateKey, commits]) => {
        const first = new Date(commits[0].date);
        const displayDate = first.toLocaleDateString('en-US', {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const time = '11:56 PM';
        return { date: dateKey, displayDate, time, commits };
    });
}

function summarize(message: string): string {
    // Strip PR number and clean up
    let m = message.replace(/\s*\(#\d+\)\s*$/, '').trim();
    // Strip conventional commit prefix for display
    m = m.replace(/^(feat|fix|style|chore|docs|refactor|perf|test):\s*/i, '');
    // Capitalize first letter
    return m.charAt(0).toUpperCase() + m.slice(1);
}

function getTag(message: string): { label: string; color: string } {
    const lower = message.toLowerCase();
    if (lower.startsWith('feat')) return { label: 'Added', color: 'text-[var(--bs-success)] bg-[var(--bs-success)]/10 border-[var(--bs-success)]/20' };
    if (lower.startsWith('fix')) return { label: 'Fixed', color: 'text-[var(--bs-info)] bg-[var(--bs-info)]/10 border-[var(--bs-info)]/20' };
    if (lower.startsWith('style')) return { label: 'Styled', color: 'text-[var(--bs-brand)] bg-[var(--bs-brand)]/10 border-[var(--bs-brand)]/20' };
    if (lower.startsWith('chore') || lower.startsWith('docs')) return { label: 'Chore', color: 'text-[var(--bs-text-mute)] bg-[var(--bs-text-mute)]/10 border-[var(--bs-text-mute)]/20' };
    if (lower.startsWith('refactor')) return { label: 'Refactored', color: 'text-[var(--bs-brand-rust)] bg-[var(--bs-brand-rust)]/10 border-[var(--bs-brand-rust)]/20' };
    return { label: 'Updated', color: 'text-[var(--bs-text-tertiary)] bg-[var(--bs-text-tertiary)]/10 border-[var(--bs-text-tertiary)]/20' };
}

export default async function ChangelogPage() {
    const commits = await getCommits();
    const days = groupByDate(commits);

    return (
        <div className="min-h-screen text-[var(--bs-text-primary)]">
            <div className="max-w-3xl mx-auto py-8 md:py-12 space-y-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-mono text-[var(--bs-text-primary)]">
                        Changelog
                    </h1>
                    <p className="text-[var(--bs-text-tertiary)] text-sm mt-2 font-mono">
                        Auto-logged daily at 11:56 PM IST
                    </p>
                </div>

                {days.length === 0 ? (
                    <p className="text-[var(--bs-text-mute)] font-mono text-sm">No commits found.</p>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--bs-border)]" />

                        <div className="space-y-10">
                            {days.map((day) => (
                                <div key={day.date} className="relative pl-8">
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-[var(--bs-brand)]/20 border-2 border-[var(--bs-brand)] z-10" />

                                    {/* Date header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <h2 className="text-base font-semibold text-[var(--bs-text-primary)] font-mono">
                                            {day.displayDate}
                                        </h2>
                                        <span className="flex items-center gap-1 text-[10px] text-[var(--bs-text-mute)] font-mono border border-[var(--bs-border)] px-2 py-0.5 rounded-lg">
                                            <Clock size={10} />
                                            {day.time}
                                        </span>
                                    </div>

                                    {/* Commits */}
                                    <ul className="space-y-2">
                                        {day.commits.map((commit) => {
                                            const tag = getTag(commit.message);
                                            return (
                                                <li key={commit.sha} className="flex items-start gap-2.5 text-sm">
                                                    <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold border rounded-lg ${tag.color}`}>
                                                        {tag.label}
                                                    </span>
                                                    <span className="text-[var(--bs-text-secondary)] font-mono leading-relaxed">
                                                        {summarize(commit.message)}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
