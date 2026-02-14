'use client';

import React from 'react';
import { FilterType } from '../../lib/tradeFilters';
import InfoTooltip from '../ui/InfoTooltip';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

interface TopBarProps {
    activeFilter: FilterType | undefined;
    onFilterChange: (filter: FilterType) => void;
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
    availablePairs: string[];
    selectedPairs: string[];
    onSelectedPairsChange: (pairs: string[]) => void;
    onApply: () => void;
}

const FILTERS: FilterType[] = ['All', 'Today', 'Yesterday', 'This Week', 'This Month', 'This Year'];
const FILTER_LABELS: Record<FilterType, string> = {
    All: 'All',
    Today: 'Today',
    Yesterday: 'Yesterday',
    'This Week': '1W',
    'This Month': '1M',
    'This Year': '1Y',
};

 export default function TopBar({
     activeFilter,
     onFilterChange,
     dateRange,
     onDateRangeChange,
     availablePairs,
     selectedPairs,
     onSelectedPairsChange,
     onApply,
 }: TopBarProps) {
     const allSelected = selectedPairs.length > 0 && selectedPairs.length === availablePairs.length;
     const selectedCount = selectedPairs.length;

     const togglePair = (pair: string) => {
         if (selectedPairs.includes(pair)) {
             onSelectedPairsChange(selectedPairs.filter((p) => p !== pair));
         } else {
             onSelectedPairsChange([...selectedPairs, pair]);
         }
     };

     const selectAllPairs = () => {
         onSelectedPairsChange([...availablePairs]);
     };

     const clearPairs = () => {
         onSelectedPairsChange([]);
     };

    return (
        <div className="w-full flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-6">
            <Field className="w-full lg:flex-1 min-w-0">
                <div className="flex items-center">
                    <FieldLabel>Filters</FieldLabel>
                    <InfoTooltip infoKey="timeFilters" />
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => onFilterChange(filter)}
                            className={`px-4 py-2 rounded-none text-sm font-mono transition-all duration-200 border-b-2 ${activeFilter === filter
                                ? 'bg-purple-500/20 border-purple-500 text-white/100'
                                : 'bg-white/5 border-x border-t border-white/10 border-b-transparent text-white/60 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            {FILTER_LABELS[filter]}
                        </button>
                    ))}
                </div>
            </Field>

            <Field className="w-full sm:w-[324px]" suppressHydrationWarning>
                <FieldLabel htmlFor="date-picker-range">Date Range</FieldLabel>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id="date-picker-range"
                            className="w-full justify-between px-2.5 font-normal rounded-none"
                            suppressHydrationWarning
                        >
                            <span className="inline-flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                                        </>
                                    ) : (
                                        format(dateRange.from, 'LLL dd, y')
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </span>
                            <ChevronDown className="h-4 w-4 text-white/60" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={onDateRangeChange}
                            numberOfMonths={2}
                            className="custom-calendar"
                            formatters={{
                                formatWeekdayName: (date) => format(date, 'EEEEE'),
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </Field>

            <Field className="w-full sm:w-[180px]">
                <FieldLabel>Pairs</FieldLabel>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-between px-2.5 font-normal rounded-none"
                        >
                            <span className="text-white/80">
                                {selectedCount === 0
                                    ? 'All pairs'
                                    : allSelected
                                        ? `All pairs (${selectedCount})`
                                        : `${selectedCount} selected`}
                            </span>
                            <ChevronDown className="h-4 w-4 text-white/60" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-3" align="end">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-white/60 text-xs font-mono uppercase tracking-wider">Select Pairs</span>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={selectAllPairs}>
                                    All
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearPairs}>
                                    Clear
                                </Button>
                            </div>
                        </div>

                        <div className="max-h-[260px] overflow-auto space-y-2 pr-1">
                            {availablePairs.map((pair) => (
                                <div
                                    key={pair}
                                    onClick={() => togglePair(pair)}
                                    className="w-full flex items-center justify-between gap-3 px-2 py-2 rounded-none border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedPairs.includes(pair)}
                                            onCheckedChange={() => togglePair(pair)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-white/80 text-sm font-mono">{pair}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </Field>

            <div className="w-full sm:w-[140px]">
                <Button
                    variant="default"
                    className="w-full rounded-none"
                    onClick={onApply}
                >
                    Apply
                </Button>
            </div>
        </div>
    );
}
