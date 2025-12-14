"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/nav_delta";
import PromptCard from "@/components/PromptCard";
import Footer from '@/components/footer_delta';
import { fetchPrompts } from "@/services/dataService";



export default function NewsPage() {
    const [newsContent, setNewsContent] = useState<any[]>([]);

    useEffect(() => {
        fetchPrompts().then(setNewsContent);
    }, []);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-zinc-900">
            <div className="flex flex-col">
                <Navbar />

                <div className="px-6 py-6 pt-28">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-12">
                            <p className="text-lg text-slate-400">
                                複製Prompt模板，填入客製化參數，高效產生內容。
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {newsContent.map((item, index) => (
                                <PromptCard
                                    key={index}
                                    title={item.title}
                                    description={item.description}
                                    promptContent={item.promptContent}
                                    type={item.type}
                                    secondaryType={item.secondaryType}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
}
