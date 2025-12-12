import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { DateRange } from '../types/news';

interface FilterBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedTags: string[];
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
    dateRange: DateRange;
    setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
    allTags: string[];
    clearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    searchQuery,
    setSearchQuery,
    selectedTags,
    setSelectedTags,
    dateRange,
    setDateRange,
    allTags,
    clearFilters
}) => {
    const toggleTag = (tag: string) => {
        setSelectedTags(prev => {
            if (tag === "All") return ["All"];

            const newTags = prev.includes("All") ? [] : [...prev];

            if (newTags.includes(tag)) {
                const filtered = newTags.filter(t => t !== tag);
                return filtered.length === 0 ? ["All"] : filtered;
            } else {
                return [...newTags, tag];
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto mb-10 space-y-4">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-200 flex flex-col lg:flex-row gap-4 lg:items-center">

                {/* 1. Search Input */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search topics, summaries..."
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="h-8 w-px bg-zinc-200 hidden lg:block" />

                {/* 2. Date Pickers */}
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] font-bold uppercase tracking-wider pointer-events-none">From</span>
                        <input
                            type="date"
                            className="pl-12 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 focus:outline-none focus:border-teal-500 transition-all uppercase"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <span className="text-zinc-300">-</span>
                    <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] font-bold uppercase tracking-wider pointer-events-none">To</span>
                        <input
                            type="date"
                            className="pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 focus:outline-none focus:border-teal-500 transition-all uppercase"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="h-8 w-px bg-zinc-200 hidden lg:block" />

                {/* 3. Reset Button */}
                {(searchQuery || !selectedTags.includes("All") || dateRange.start || dateRange.end) && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors whitespace-nowrap"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                )}
            </div>

            {/* 4. Tags (Multi-select Pills) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Filter size={16} className="text-zinc-400 shrink-0 mr-1" />
                {allTags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                isSelected
                                    ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/20 transform scale-105"
                                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-700"
                            )}
                        >
                            {tag}
                            {isSelected && tag !== "All" && (
                                <span className="ml-1.5 inline-block text-[9px] align-middle">✕</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
