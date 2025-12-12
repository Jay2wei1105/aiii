import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Globe, X, User } from 'lucide-react';
import { NewsItem } from '../types/news';
import { Badge } from './Badge';

interface NewsModalProps {
    news: NewsItem | null;
    onClose: () => void;
}

export const NewsModal: React.FC<NewsModalProps> = ({ news, onClose }) => {
    if (!news) return null;

    return (
        <AnimatePresence>
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                />

                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4 md:p-8">
                    <motion.div
                        layoutId={`card-container-${news.id}`}
                        className="w-full max-w-5xl bg-[#ECFDF5] rounded-[3rem] overflow-hidden shadow-2xl pointer-events-auto flex flex-col md:flex-row max-h-[80vh]"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="absolute top-6 right-6 z-10 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
                        >
                            <X size={24} className="text-zinc-800" />
                        </button>

                        <div className="md:w-1/3 p-6 md:p-8 flex flex-col gap-6 shrink-0 bg-[#E0F2F1]/50 md:bg-transparent">
                            <motion.div
                                layoutId={`card-image-${news.id}`}
                                className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-md bg-white shrink-0"
                            >
                                {news.image ? (
                                    <img src={news.image} alt="" className="w-full h-full object-contain bg-zinc-50" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center">
                                        <Globe className="text-white/50 w-16 h-16" />
                                    </div>
                                )}
                            </motion.div>

                            <div className="flex flex-col items-start gap-3">
                                <motion.div layoutId={`card-tag-region-${news.id}`}>
                                    <Badge text={news.region} variant="dark" className="text-sm py-1.5 px-4" />
                                </motion.div>
                                <motion.div layoutId={`card-tag-main-${news.id}`}>
                                    <Badge text={news.tag} variant={news.tagVariant} className="text-sm py-1.5 px-4" />
                                </motion.div>
                            </div>

                            <div className="mt-auto space-y-4 hidden md:block">
                                <div className="h-px w-full bg-teal-900/10" />
                                <div className="flex flex-col gap-2 text-zinc-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <User size={16} />
                                        <span>Verified by Jay</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>{news.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe size={16} />
                                        <span>{news.source}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:w-2/3 p-6 md:p-8 md:pl-0 flex flex-col overflow-hidden">
                            <motion.h2
                                layoutId={`card-title-${news.id}`}
                                className="text-3xl md:text-4xl font-black text-zinc-900 leading-[1.1] mb-6 tracking-tight shrink-0"
                            >
                                {news.title}
                            </motion.h2>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-[#D1FAFF] rounded-[2rem] p-6 md:p-8 flex-grow overflow-y-auto border border-cyan-200/50"
                            >
                                <div className="flex items-center gap-2 mb-6 text-cyan-800 font-bold tracking-wider uppercase text-sm">
                                    <Sparkles size={16} />
                                    <span>全文</span>
                                </div>
                                <div
                                    className="prose prose-lg prose-zinc max-w-none prose-headings:font-bold prose-p:text-zinc-800 prose-li:text-zinc-800 text-sm font-medium"
                                    dangerouslySetInnerHTML={{ __html: news.fullContent }}
                                />
                            </motion.div>

                            <div className="mt-4 flex md:hidden justify-between text-zinc-500 text-sm font-bold uppercase">
                                <span>{news.source}</span>
                                <span>{news.date}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </>
        </AnimatePresence>
    );
};
