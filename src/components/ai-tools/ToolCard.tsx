import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PricingBadge } from './PricingBadge';

interface ToolCardProps {
    tool: any;
}

export const ToolCard = forwardRef<HTMLDivElement, ToolCardProps>(({ tool }, ref) => {
    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
                layout: { duration: 0.3, type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            }}
            className="h-full"
        >
            <div
                // Changed: duration-300 -> duration-200, added ease-out
                className="group relative h-full rounded-2xl transition-all duration-200 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-zinc-500/10"
            >
                {/* Structure for ultra-thin border */}
                <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none z-0">
                    {/* Static Rim */}
                    <div className="absolute inset-0 bg-zinc-200/80" />

                    {/* Spinning Beam (Black/Silver Luster) */}
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_60deg,#a1a1aa_90deg,#ffffff_110deg,#27272a_125deg,transparent_180deg)] animate-[spin_3s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Card Content */}
                <div className="relative z-10 flex flex-col h-full bg-white rounded-[15px] p-5">

                    <div className="flex justify-between items-start mb-4">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 overflow-hidden",
                            !tool.logoUrl && "bg-gradient-to-br",
                            !tool.logoUrl && tool.color
                        )}>
                            {tool.logoUrl ? (
                                <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" />
                            ) : (
                                <tool.icon size={24} />
                            )}
                        </div>
                        <PricingBadge type={tool.pricing} />
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-zinc-900 group-hover:to-zinc-500 transition-all">
                        {tool.name}
                    </h3>

                    <p className="text-sm text-zinc-500 leading-relaxed mb-6 flex-grow">
                        {tool.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            {tool.category}
                        </span>

                        <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-semibold text-zinc-900 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                        >
                            Launch
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
