"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/nav_delta";
import Footer from "@/components/footer_delta";
import { PortfolioCard } from "@/components/PortfolioCard";
import { PortfolioModal } from "@/components/PortfolioModal";
import { PortfolioTemplate } from "@/data/portfolioData";
import { fetchPortfolios } from "@/services/dataService";

export default function ProjectsPage() {
    const [selectedTemplate, setSelectedTemplate] = useState<PortfolioTemplate | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        fetchPortfolios().then(setTemplates);
    }, []);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-zinc-900">
            <div className="flex flex-col">
                <Navbar />

                <div className="px-6 py-8 pt-28">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-12">
                            <h1 className="text-4xl font-bold mb-4">Skills Templates</h1>
                            <p className="text-lg text-zinc-600">
                                Skills templates to showcase your work beautifully
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {templates.map((template) => (
                                <PortfolioCard
                                    key={template.id}
                                    template={template}
                                    onClick={() => setSelectedTemplate(template)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <Footer />
            </div>

            {/* Modal */}
            <PortfolioModal
                template={selectedTemplate}
                onClose={() => setSelectedTemplate(null)}
            />
        </div>
    );
}
