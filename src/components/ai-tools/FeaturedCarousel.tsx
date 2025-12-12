import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FeaturedCarouselProps {
    featuredTools: any[];
}

export const FeaturedCarousel = ({ featuredTools }: FeaturedCarouselProps) => {
    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-play
    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % featuredTools.length);
        }, 5000); // 5 seconds per slide
        return () => clearInterval(timer);
    }, [featuredTools.length, isPaused]);

    if (!featuredTools || featuredTools.length === 0) {
        return null; // Or return a loading state / empty state
    }

    const tool = featuredTools[index];

    return (
        <div
            className="relative w-full overflow-hidden rounded-[2.5rem] bg-zinc-900 text-white mb-12 shadow-2xl shadow-zinc-900/20 group/carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="relative p-8 md:p-12 min-h-[400px] md:min-h-[320px] flex items-center">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-full flex flex-col md:flex-row items-center justify-between gap-8 z-10"
                    >
                        {/* Text Content */}
                        <div className="max-w-xl flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">
                                <Sparkles size={14} className="animate-pulse" />
                                <span>Featured Spotlight</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
                                {tool.name}
                            </h2>
                            <p className="text-zinc-400 text-lg mb-8 leading-relaxed line-clamp-2 md:line-clamp-none">
                                {tool.description}
                            </p>
                            <a
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-3.5 bg-white text-zinc-900 rounded-full font-bold hover:bg-zinc-200 transition-colors inline-flex items-center gap-2 group/btn"
                            >
                                Explore Tool
                                <ExternalLink size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                            </a>
                        </div>

                        {/* Icon Visual */}
                        <div className="relative shrink-0">
                            {/* Glowing Background Blob */}
                            <div className={cn(
                                "absolute inset-0 blur-[60px] opacity-40 rounded-full bg-gradient-to-br",
                                tool.color
                            )} />
                            <div className={cn(
                                "relative w-40 h-40 md:w-56 md:h-56 rounded-3xl flex items-center justify-center text-white/90 shadow-2xl rotate-3 overflow-hidden",
                                "bg-gradient-to-br border border-white/10 backdrop-blur-sm",
                                !tool.logoUrl && tool.color,
                                tool.logoUrl && "bg-white/5"
                            )}>
                                {tool.logoUrl ? (
                                    <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" />
                                ) : (
                                    <tool.icon size={96} />
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Background Ambient Gradient */}
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={`bg-${tool.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className={cn(
                            "absolute -top-[50%] -right-[20%] w-[800px] h-[800px] bg-gradient-to-br blur-[120px] rounded-full pointer-events-none",
                            tool.color
                        )}
                    />
                </AnimatePresence>
            </div>

            {/* Progress / Navigation */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                {featuredTools.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-500",
                            i === index ? "w-8 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};
