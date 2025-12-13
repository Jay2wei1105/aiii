import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { NewsItem } from '../types/news';
import { Badge } from './Badge';

interface NewsCardProps {
    data: NewsItem;
    onClick: () => void;
}

export const FeedNewsCard: React.FC<NewsCardProps> = ({ data, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { id, image, region, tag, tagVariant, title, summary, sourceName, date } = data;

    return (
        <motion.div
            layoutId={`card-container-${id}`}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "group relative flex flex-col w-full h-[600px] rounded-[2.5rem] overflow-hidden bg-white border border-zinc-200",
                "cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-300"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 1. Image Section */}
            <motion.div
                layoutId={`card-image-${id}`}
                className="relative h-36 w-full overflow-hidden bg-zinc-100 shrink-0"
            >
                {image ? (
                    <motion.img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover"
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                        transition={{ duration: 0.5 }}
                    />
                ) : (
                    <div className={cn(
                        "h-full w-full flex items-center justify-center",
                        tagVariant === 'purple' ? "bg-purple-100" : "bg-teal-100"
                    )}>
                        <Globe className="text-zinc-400 w-10 h-10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>

            {/* 2. Content Body */}
            <div className="p-6 flex flex-col flex-grow h-full overflow-hidden">

                {/* Tags (Shrink-0 prevents crushing) */}
                <div className="flex items-center gap-2 mb-3 shrink-0">
                    <motion.div layoutId={`card-tag-region-${id}`}>
                        <Badge text={region} variant="zinc" />
                    </motion.div>
                    <motion.div layoutId={`card-tag-main-${id}`}>
                        <Badge text={tag} variant={tagVariant} />
                    </motion.div>
                </div>

                {/* Title (Shrink-0 prevents text from being pushed off/hidden) */}
                <motion.h2
                    layoutId={`card-title-${id}`}
                    className="text-2xl font-black tracking-tight text-zinc-900 leading-[1.1] mb-4 line-clamp-2 group-hover:text-teal-600 transition-colors shrink-0"
                >
                    {title}
                </motion.h2>

                {/* 3. AI Summary Section (Scrollable) */}
                <div className="relative flex-grow rounded-2xl bg-[#FEFCE8] border border-yellow-100 p-4 group-hover:bg-[#FEF9C3] transition-colors duration-300 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-2 text-yellow-700 font-bold text-[10px] tracking-wider uppercase shrink-0">
                        <Sparkles size={12} className="animate-pulse" />
                        <span>AI 摘要</span>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar pr-2">
                        <p className="text-sm leading-relaxed text-zinc-700 font-medium">
                            {summary}
                        </p>
                    </div>
                </div>

                {/* 4. Footer */}
                <div className="pt-4 flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                    <span>{sourceName}</span>
                    <span>{date}</span>
                </div>
            </div>
        </motion.div>
    );
};
