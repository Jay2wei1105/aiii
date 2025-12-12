"use client";

import { PortfolioTemplate } from "@/data/portfolioData";
import Image from "next/image";

interface PortfolioCardProps {
    template: PortfolioTemplate;
    onClick: () => void;
}

const gradients = [
    "from-purple-600 via-pink-600 to-blue-600",
    "from-cyan-500 via-blue-500 to-indigo-600",
    "from-orange-500 via-red-500 to-pink-600",
    "from-emerald-500 via-teal-500 to-cyan-600",
    "from-violet-600 via-purple-600 to-fuchsia-600",
    "from-amber-500 via-orange-500 to-red-500"
];

export function PortfolioCard({ template, onClick }: PortfolioCardProps) {
    const gradientIndex = parseInt(template.id.charCodeAt(0).toString()) % gradients.length;

    return (
        <article
            onClick={onClick}
            className="group cursor-pointer space-y-4 transition-all duration-300 hover:-translate-y-2"
        >
            {/* Preview Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-900 shadow-lg">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradients[gradientIndex]} opacity-90`} />
                {/* Placeholder content */}
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center p-8">
                        <div className="text-3xl font-bold mb-2">{template.title.split(' ')[0]}</div>
                        <div className="text-sm opacity-70">{template.subtitle}</div>
                    </div>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
                    <div className="text-white font-semibold">View Details</div>
                </div>
            </div>

            {/* Card Info */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
                        {template.title}
                    </h3>
                    <span className={`text-sm font-medium ${template.price === "Free"
                            ? "text-green-600"
                            : "text-zinc-900"
                        }`}>
                        {template.price}
                    </span>
                </div>
                <p className="text-sm text-zinc-500">{template.subtitle}</p>
            </div>
        </article>
    );
}
