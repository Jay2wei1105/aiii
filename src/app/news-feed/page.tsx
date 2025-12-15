"use client";

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DateRange, NewsItem } from '@/types/news';
import { fetchNews } from '@/services/dataService';
import { FilterBar } from '@/components/FilterBar';
import { FeedNewsCard_2 } from '@/components/FeedNewsCard_2';
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (selectedId) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [selectedId]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedTags, dateRange]);

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

    // Pagination Logic
    const paginatedNews = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredNews.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredNews, currentPage]);

    const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                        <>
                            <div className="max-w-5xl mx-auto flex flex-col gap-6 mb-8">
                                <AnimatePresence mode='popLayout'>
                                    {paginatedNews.map((news) => (
                                        <FeedNewsCard_2
                                            key={news.id}
                                            data={news}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 pb-8">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === page
                                                        ? 'bg-zinc-900 text-white'
                                                        : 'text-zinc-600 hover:bg-zinc-100'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
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
