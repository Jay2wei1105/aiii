"use client";

import { PortfolioTemplate } from "@/data/portfolioData";
import { X, Check, ExternalLink } from "lucide-react";
import { useEffect } from "react";

interface PortfolioModalProps {
    template: PortfolioTemplate | null;
    onClose: () => void;
}

const gradients = [
    "from-purple-600 via-pink-600 to-blue-600",
    "from-cyan-500 via-blue-500 to-indigo-600",
    "from-orange-500 via-red-500 to-pink-600",
    "from-emerald-500 via-teal-500 to-cyan-600",
    "from-violet-600 via-purple-600 to-fuchsia-600",
    "from-amber-500 via-orange-500 to-red-500"
];

export function PortfolioModal({ template, onClose }: PortfolioModalProps) {
    useEffect(() => {
        if (template) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [template]);

    if (!template) return null;

    const gradientIndex = parseInt(template.id.charCodeAt(0).toString()) % gradients.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-3xl shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 z-20 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
                    {/* Left: Preview */}
                    <div className="space-y-6">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-800 shadow-2xl">
                            {/* Gradient placeholder */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradients[gradientIndex]}`} />
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <div className="text-center p-12">
                                    <div className="text-5xl font-bold mb-4">{template.title.split(' ')[0]}</div>
                                    <div className="text-xl opacity-80">{template.subtitle}</div>
                                </div>
                            </div>
                        </div>

                        {/* Pagination dots */}
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className={`h-2 w-2 rounded-full transition-all ${i === 1 ? "bg-white w-8" : "bg-white/30"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="flex flex-col justify-between space-y-6">
                        <div className="space-y-6">
                            {/* Header */}
                            <div>
                                <div className="mb-2 inline-block rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                                    {template.price}
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    {template.title}
                                </h2>
                                <p className="text-zinc-400">{template.subtitle}</p>
                            </div>

                            {/* Description */}
                            <p className="text-lg leading-relaxed text-zinc-300">
                                {template.description}
                            </p>

                            {/* Features */}
                            <div className="space-y-3">
                                {template.features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                                            <Check className="h-3 w-3 text-green-400" />
                                        </div>
                                        <span className="text-zinc-300">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {template.livePreviewUrl && (
                                <a
                                    href={template.livePreviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-4 font-semibold text-white transition-all hover:bg-white/10"
                                >
                                    <ExternalLink className="h-5 w-5" />
                                    Preview
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
