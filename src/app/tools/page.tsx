"use client";

import Navbar from "@/components/nav_delta";
import Card from "@/components/ProjectCard";
import Footer from '@/components/footer_delta';

const toolsContent = [
    {
        title: "Formula Calculator",
        description: "Advanced scientific calculator with formula library for mathematics, physics, and chemistry calculations.",
        tag: "Calculator",
    },
    {
        title: "Essay Analyzer",
        description: "AI-powered writing assistant that provides feedback on grammar, structure, and argumentation quality.",
        tag: "Writing",
    },
    {
        title: "Flashcard Creator",
        description: "Smart flashcard generator with spaced repetition algorithm for efficient memorization and recall.",
        tag: "Memory",
    },
    {
        title: "Citation Generator",
        description: "Automatic bibliography and citation formatter supporting multiple academic styles and formats.",
        tag: "Research",
    },
    {
        title: "Mind Map Builder",
        description: "Visual thinking tool for organizing ideas, concepts, and study materials in interactive diagrams.",
        tag: "Organization",
    },
    {
        title: "Timer & Pomodoro",
        description: "Customizable study timer with break reminders and productivity tracking features.",
        tag: "Time Management",
    },
];

export default function ToolsPage() {
    return (
        <div className="min-h-screen bg-[#FFFFFF] text-zinc-900">
            <div className="flex flex-col">
                <Navbar />

                <div className="px-6 py-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-12">
                            <h1 className="text-4xl font-bold mb-4">Study Tools</h1>
                            <p className="text-lg text-slate-400">
                                Powerful tools to enhance your learning experience and productivity
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {toolsContent.map((item, index) => (
                                <Card
                                    key={index}
                                    title={item.title}
                                    description={item.description}
                                    tag={item.tag}
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
