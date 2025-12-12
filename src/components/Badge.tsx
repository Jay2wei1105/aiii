import React from 'react';
import { cn } from '../lib/utils';
import { BadgeVariant } from '../types/news';

interface BadgeProps {
    text: string;
    variant?: BadgeVariant;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ text, variant = "zinc", className }) => {
    const variants: Record<BadgeVariant, string> = {
        blue: "bg-teal-100 text-teal-700 border-teal-200",
        purple: "bg-purple-100 text-purple-700 border-purple-200",
        amber: "bg-amber-100 text-amber-700 border-amber-200",
        zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
        dark: "bg-zinc-800 text-zinc-100 border-zinc-700",
    };

    return (
        <span
            className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
                variants[variant],
                className
            )}
        >
            {text}
        </span>
    );
};
