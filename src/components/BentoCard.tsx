import React from 'react';
import { cn } from '@/lib/utils';

interface BentoCardProps {
    title: string;
    description?: string;
    graphic?: React.ReactNode;
    className?: string;
    colSpan?: 1 | 2 | 3 | 4;
    rowSpan?: 1 | 2;
    dark?: boolean;
}

export function BentoCard({
    title,
    description,
    graphic,
    className,
    colSpan = 1,
    rowSpan = 1,
    dark = false,
}: BentoCardProps) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                dark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900",
                colSpan === 2 && "md:col-span-2",
                colSpan === 3 && "md:col-span-3",
                colSpan === 4 && "md:col-span-4",
                rowSpan === 2 && "row-span-2",
                className
            )}
        >
            <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="mb-4">
                    {graphic}
                </div>
                <div>
                    <h3 className={cn("text-2xl font-bold mb-2", dark ? "text-white" : "text-zinc-900")}>
                        {title}
                    </h3>
                    {description && (
                        <p className={cn("text-lg font-medium", dark ? "text-zinc-400" : "text-zinc-500")}>
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {/* Background Gradient/Overlay */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                dark ? "bg-gradient-to-br from-white/5 to-transparent" : "bg-gradient-to-br from-black/5 to-transparent"
            )} />
        </div>
    );
}
