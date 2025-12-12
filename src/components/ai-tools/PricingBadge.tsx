import { Unlock, Star, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PricingBadgeProps {
    type: string;
}

export const PricingBadge = ({ type }: PricingBadgeProps) => {
    const styles: Record<string, string> = {
        Free: "bg-green-100 text-green-700 border-green-200",
        Freemium: "bg-blue-100 text-blue-700 border-blue-200",
        Paid: "bg-zinc-100 text-zinc-700 border-zinc-200",
    };
    const Icon = { Free: Unlock, Freemium: Star, Paid: Lock }[type] || Star;

    return (
        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border", styles[type])}>
            <Icon size={10} />
            {type}
        </span>
    );
};
