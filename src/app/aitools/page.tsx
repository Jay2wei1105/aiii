"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/data/aiToolsData';
import { fetchAiTools } from '@/services/dataService';
import { FeaturedCarousel } from '@/components/ai-tools/FeaturedCarousel';
import { ToolCard } from '@/components/ai-tools/ToolCard';
import Navbar from '@/components/nav_delta';
import Footer from '@/components/footer_delta';

export default function AITools() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [tools, setTools] = useState<any[]>([]);

    useEffect(() => {
        const loadTools = async () => {
            const data = await fetchAiTools();
            setTools(data);
        };
        loadTools();
    }, []);

    // Filtering Logic
    const filteredTools = useMemo(() => {
        return tools.filter(tool => {
            const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
            const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery, tools]);

    const featuredTools = tools.filter(t => t.featured);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-zinc-900 flex flex-col">
            <Navbar />

            <div className="px-6 py-4 pt-28">
                <div className="bg-[#FFFFFF] rounded-3xl font-sans selection:bg-indigo-500/30 overflow-hidden">
                    {/* Header & Nav */}
                    <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-xl border-b border-zinc-200/50">
                        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-3">

                                {/* Category Tags */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide flex-1">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                                activeCategory === cat.id
                                                    ? "bg-zinc-900 text-white border-zinc-900 shadow-md transform scale-105"
                                                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-800"
                                            )}
                                        >
                                            <cat.icon size={14} />
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Search Box */}
                                <div className="relative w-full lg:w-80 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Find tools (e.g. 'coding', 'image')..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">

                        {/* Hero Carousel Section (Shows only on 'All' tab & no search) */}
                        <AnimatePresence>
                            {activeCategory === 'All' && !searchQuery && featuredTools.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 48 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="overflow-hidden"
                                >
                                    <FeaturedCarousel featuredTools={featuredTools} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tools Grid Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                {activeCategory === 'All' ? 'Trending Tools' : `${activeCategory} Tools`}
                                <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full">
                                    {filteredTools.length}
                                </span>
                            </h2>
                        </div>

                        {/* Grid System */}
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            <AnimatePresence mode='popLayout'>
                                {filteredTools.map((tool) => (
                                    <ToolCard key={tool.id} tool={tool} />
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {/* Empty State */}
                        {filteredTools.length === 0 && (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="text-zinc-300" size={32} />
                                </div>
                                <h3 className="text-zinc-900 font-bold">No tools found</h3>
                                <p className="text-zinc-500 text-sm mt-1">Try searching for something else.</p>
                            </div>
                        )}

                    </main>
                </div>
            </div>

            <Footer />
        </div>
    );
}
