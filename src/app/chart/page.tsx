"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import Navbar from "@/components/nav_delta";
import Footer from '@/components/footer_delta';
import ChartAnalysis from "@/components/ChartAnalysis";
import ChillerReplacementCalculator from "@/components/ChillerReplacementCalculator";
import { useLanguage } from "@/context/LanguageContext";

const ContractCapacityOptimizer = dynamic(() => import('@/components/ContractCapacityOptimizer'), { ssr: false });

export default function ChartPage() {
    const { t } = useLanguage();
    // Default to 'advanced' since 'simple' is removed
    const [activeTab, setActiveTab] = useState<'advanced' | 'calculator' | 'contract'>('advanced');

    const tabs = [
        { id: 'advanced', label: t('chart.advanced') },
        { id: 'calculator', label: t('chart.calculator') },
        { id: 'contract', label: t('chart.contract_optimization') }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pt-24 pb-12">
            <div className="flex flex-col bg-[#FFFFFF]">
                <Navbar />

                <div className="px-6 py-4">
                    <div className="w-full mx-auto">
                        <div className="mb-12">
                            {/* Tab Navigation */}
                            <div className="flex space-x-8 border-b border-slate-200 mb-8">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`py-4 px-2 font-medium text-sm transition-all relative ${activeTab === tab.id ? 'text-[#0085CA] font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setActiveTab(tab.id as any)}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0085CA]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div>
                            {activeTab === 'advanced' && <ChartAnalysis />}
                            {activeTab === 'calculator' && <ChillerReplacementCalculator />}
                            {activeTab === 'contract' && <ContractCapacityOptimizer />}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </div >
    );
}
