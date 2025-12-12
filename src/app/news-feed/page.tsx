"use client";

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DateRange, NewsItem } from '@/types/news';
import { fetchNews } from '@/services/dataService';
import { FilterBar } from '@/components/FilterBar';
import { FeedNewsCard } from '@/components/FeedNewsCard';
import { EmptyState } from '@/components/EmptyState';
import { NewsModal } from '@/components/NewsModal';
import Navbar from '@/components/nav_delta';
import Footer from '@/components/footer_delta';

export default function NewsFeed() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [news, setNews] = useState<NewsItem[]>([]);

    useEffect(() => {
        fetchNews().then(setNews);
    }, []);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTags, setSelectedTags] = useState(["All"]);
    const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });

    useEffect(() => {
        if (selectedId) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [selectedId]);

    // Extract all unique tags
    const allTags = useMemo(() => ["All", ...new Set(news.map(d => d.tag))], [news]);

    // Filtering Logic
    const filteredNews = useMemo(() => {
        return news.filter(item => {
            // 1. Fuzzy Search
            const searchContent = (item.title + item.summary + item.source).toLowerCase();
            const matchesSearch = searchContent.includes(searchQuery.toLowerCase());

            // 2. Multi-Tag Filter
            const matchesTag = selectedTags.includes("All") || selectedTags.includes(item.tag);

            // 3. Date Filter
            let matchesDate = true;
            if (dateRange.start || dateRange.end) {
                const d = new Date(item.date);
                d.setHours(0, 0, 0, 0);
                const itemTime = d.getTime();

                let startTime = -Infinity;
                if (dateRange.start) {
                    const [sy, sm, sd] = dateRange.start.split('-').map(Number);
                    const sDate = new Date(sy, sm - 1, sd);
                    sDate.setHours(0, 0, 0, 0);
                    startTime = sDate.getTime();
                }

                let endTime = Infinity;
                if (dateRange.end) {
                    const [ey, em, ed] = dateRange.end.split('-').map(Number);
                    const eDate = new Date(ey, em - 1, ed);
                    eDate.setHours(23, 59, 59, 999);
                    endTime = eDate.getTime();
                }

                matchesDate = itemTime >= startTime && itemTime <= endTime;
            }

            return matchesSearch && matchesTag && matchesDate;
        });
    }, [searchQuery, selectedTags, dateRange, news]);

    const selectedNews = news.find(n => n.id === selectedId) || null;

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedTags(["All"]);
        setDateRange({ start: "", end: "" });
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-zinc-900 flex flex-col">
            <Navbar />

            <div className="px-2 py-0 pt-24 pb-12">
                <div className="bg-[#FFFFFF] rounded-3xl text-zinc-900 font-sans p-6 md:p-4 relative overflow-hidden">
                    <FilterBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedTags={selectedTags}
                        setSelectedTags={setSelectedTags}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        allTags={allTags}
                        clearFilters={clearFilters}
                    />

                    {filteredNews.length > 0 ? (
                        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode='popLayout'>
                                {filteredNews.map((news) => (
                                    <FeedNewsCard
                                        key={news.id}
                                        data={news}
                                        onClick={() => setSelectedId(news.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <EmptyState onClearFilters={clearFilters} />
                    )}

                    {selectedId && (
                        <NewsModal
                            news={selectedNews}
                            onClose={() => setSelectedId(null)}
                        />
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
