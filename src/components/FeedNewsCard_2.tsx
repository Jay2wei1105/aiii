import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { NewsItem } from '../types/news';
import { Badge } from './Badge';

interface NewsCardProps {
    data: NewsItem;
}

export const FeedNewsCard_2: React.FC<NewsCardProps> = ({ data }) => {
    const { id, tag, tagVariant, title, sourceName, date, source } = data;

    // Formatting date to be more concise
    const formattedDate = date ? new Date(date).toLocaleDateString('zh-TW') : '';

    return (
        <motion.div
            layoutId={`card-container-${id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "group relative flex flex-col w-full bg-white border border-zinc-200 rounded-2xl p-5",
                "shadow-sm hover:shadow-md transition-shadow duration-200"
            )}
        >
            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 leading-snug mb-4 group-hover:text-[#0076CE] transition-colors">
                {title}
            </h2>

            {/* Bottom Row: Tags/Link (Left) & Date (Right) */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">

                {/* Left: Link & Tags */}
                <div className="flex items-center gap-3">
                    <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#0076CE] transition-colors"
                    >
                        <ExternalLink size={14} />
                        原文連結
                    </a>

                    <div className="h-4 w-[1px] bg-zinc-200 mx-1"></div>

                    <div className="flex items-center gap-2">
                        {/* Simplified Tags */}
                        <Badge text={tag} variant={tagVariant} />
                    </div>
                </div>

                {/* Right: Date */}
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Calendar size={13} />
                    <span>{formattedDate}</span>
                </div>
            </div>
        </motion.div>
    );
};
