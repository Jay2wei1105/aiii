"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/context/LanguageContext';

// Dynamically import Plotly (client-side only)
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Declare html2pdf for TypeScript awareness (since we installed but might not have types)
// If @types/html2pdf.js is installed it might work, otherwise we use 'any'
declare const html2pdf: any;

interface Chiller {
    id: number;
    name: string;
    tons: number;
    currentEfficiency: number;
    operatingHours: number;
    loadFactor: number;
    newEfficiency: number;
}

interface CalculationResult {
    details: any[];
    totalTons: number;
    totalCurrentCost: number;
    totalNewCost: number;
    annualSaving: number;
    totalInvestment: number;
    paybackYears: number;
    totalCurrentPower: number;
    totalNewPower: number;
}

export default function ChillerReplacementCalculator() {
    // State
    const [chillers, setChillers] = useState<Chiller[]>([]);
    const [electricityPrice, setElectricityPrice] = useState(3.95);
    const [engineeringCost, setEngineeringCost] = useState(40000);
    const [annualHours, setAnnualHours] = useState(7000);
    const [useCommonHours, setUseCommonHours] = useState(true);
    const [result, setResult] = useState<CalculationResult | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    // Initial Chiller
    useEffect(() => {
        // Import html2pdf dynamically if needed or rely on global script
        if (typeof window !== 'undefined') {
            import('html2pdf.js').then((module) => {
                // Module loaded
            }).catch(err => console.log("html2pdf dynamic import error/not needed if global", err));
        }
    }, []);

    const addChiller = () => {
        const newChiller: Chiller = {
            id: Date.now(),
            name: `Chiller #${chillers.length + 1}`,
            tons: 100,
            currentEfficiency: 0.78,
            operatingHours: annualHours,
            loadFactor: 60,
            newEfficiency: 0.576
        };
        setChillers([...chillers, newChiller]);
    };

    const removeChiller = (id: number) => {
        setChillers(chillers.filter(c => c.id !== id));
    };

    const clearAllChillers = () => {
        if (confirm('Are you sure you want to clear all chillers?')) {
            setChillers([]);
            setResult(null);
        }
    };

    const updateChiller = (id: number, field: keyof Chiller, value: number) => {
        setChillers(chillers.map(c => {
            if (c.id === id) {
                return { ...c, [field]: value };
            }
            return c;
        }));
    };

    // Update common hours effect
    useEffect(() => {
        if (useCommonHours) {
            setChillers(prev => prev.map(c => ({ ...c, operatingHours: annualHours })));
        }
    }, [useCommonHours, annualHours]);

    const calculate = () => {
        if (chillers.length === 0) {
            alert('Please add at least one chiller.');
            return;
        }

        let totalCurrentCost = 0;
        let totalNewCost = 0;
        let totalTons = 0;
        let totalInvestment = 0;
        let details: any[] = [];

        chillers.forEach(chiller => {
            const hours = useCommonHours ? annualHours : chiller.operatingHours;
            const loadFactor = chiller.loadFactor / 100;

            const currentPower = chiller.tons * hours * loadFactor * chiller.currentEfficiency;
            const currentCost = currentPower * electricityPrice;

            const newPower = chiller.tons * hours * loadFactor * chiller.newEfficiency;
            const newCost = newPower * electricityPrice;

            const yearSaving = currentCost - newCost;
            const investment = chiller.tons * engineeringCost;

            totalCurrentCost += currentCost;
            totalNewCost += newCost;
            totalTons += chiller.tons;
            totalInvestment += investment;

            details.push({
                name: chiller.name,
                currentCost,
                newCost,
                yearSaving,
                investment
            });
        });

        const annualSaving = totalCurrentCost - totalNewCost;
        const paybackYears = totalInvestment > 0 ? totalInvestment / annualSaving : 0;

        setResult({
            details,
            totalTons,
            totalCurrentCost,
            totalNewCost,
            annualSaving,
            totalInvestment,
            paybackYears,
            totalCurrentPower: totalCurrentCost / electricityPrice,
            totalNewPower: totalNewCost / electricityPrice
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    // PDF Export
    const exportToPDF = async () => {
        if (!reportRef.current) return;

        // We need to temporarily force the background color for PDF or ensure styles are applied
        const element = reportRef.current;
        const opt: any = {
            margin: 10,
            filename: 'Chiller_Evaluation_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };

        try {
            const html2pdfModule = (await import('html2pdf.js')).default;
            html2pdfModule().set(opt).from(element).save();
        } catch (e) {
            console.error("PDF export failed", e);
            alert("PDF export failed. Please check console.");
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto p-4 space-y-8" ref={reportRef}>
            <div className="bg-gradient-to-r from-[#2180a0] to-[#1a6680] text-white p-8 rounded-xl shadow-lg mb-8">
                <h1 className="text-3xl font-bold mb-2">❄️ 冰水主機更換效益評估計算器</h1>
                <p className="opacity-90">快速評估冰水主機更換投資回收年限與節能效益</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-[#2180a0] border-b-2 border-[#2180a0] pb-2 mb-6">🔧 系統參數設定</h2>

                        <h3 className="text-sm font-semibold text-slate-700 mb-3">共同運轉參數</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">電費單價 (元/kWh)</label>
                                <input type="number"
                                    value={electricityPrice}
                                    onChange={(e) => setElectricityPrice(parseFloat(e.target.value))}
                                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#2180a0] focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">預估工程費用 (元/RT)</label>
                                <input type="number"
                                    value={engineeringCost}
                                    onChange={(e) => setEngineeringCost(parseFloat(e.target.value))}
                                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#2180a0] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-200 my-4"></div>

                        <h3 className="text-sm font-semibold text-slate-700 mb-3">運轉時數設定</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <label className="flex items-center space-x-2 mb-3 cursor-pointer">
                                <input type="checkbox"
                                    checked={useCommonHours}
                                    onChange={(e) => setUseCommonHours(e.target.checked)}
                                    className="rounded text-[#2180a0] focus:ring-[#2180a0]"
                                />
                                <span className="text-sm font-medium text-slate-700">所有冰機使用相同運轉時數</span>
                            </label>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">全年運轉時數 (小時)</label>
                                <input type="number"
                                    value={annualHours}
                                    onChange={(e) => setAnnualHours(parseFloat(e.target.value))}
                                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#2180a0] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-200 my-4"></div>

                        <h3 className="text-sm font-semibold text-slate-700 mb-3">現有冰機資訊</h3>
                        <div className="space-y-4 mb-6">
                            {chillers.length === 0 ? (
                                <p className="text-sm text-slate-400">目前沒有新增冰機</p>
                            ) : (
                                chillers.map((chiller) => (
                                    <div key={chiller.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 relative group">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-[#2180a0]">{chiller.name}</h4>
                                            <button onClick={() => removeChiller(chiller.id)} className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors">移除</button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">冷凍噸數 (RT)</label>
                                                <input type="number" value={chiller.tons} onChange={(e) => updateChiller(chiller.id, 'tons', parseFloat(e.target.value))} className="w-full p-2 text-sm border rounded" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">現況效率 (kW/RT)</label>
                                                <input type="number" value={chiller.currentEfficiency} step="0.01" onChange={(e) => updateChiller(chiller.id, 'currentEfficiency', parseFloat(e.target.value))} className="w-full p-2 text-sm border rounded" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">
                                                    年運轉時數
                                                    {!useCommonHours && <span className="text-[10px] ml-1 text-blue-500">(自訂)</span>}
                                                </label>
                                                <input type="number"
                                                    value={chiller.operatingHours}
                                                    disabled={useCommonHours}
                                                    onChange={(e) => updateChiller(chiller.id, 'operatingHours', parseFloat(e.target.value))}
                                                    className={`w-full p-2 text-sm border rounded ${useCommonHours ? 'bg-slate-100 text-slate-400' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">平均負載率 (%)</label>
                                                <input type="number" value={chiller.loadFactor} onChange={(e) => updateChiller(chiller.id, 'loadFactor', parseFloat(e.target.value))} className="w-full p-2 text-sm border rounded" />
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-dashed border-slate-300">
                                            <label className="block text-xs font-bold text-slate-600 mb-1">改善後效率 (kW/RT)</label>
                                            <input type="number" value={chiller.newEfficiency} step="0.001" onChange={(e) => updateChiller(chiller.id, 'newEfficiency', parseFloat(e.target.value))} className="w-full p-2 text-sm border border-green-200 bg-green-50 rounded focus:ring-green-500" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex space-x-3 mb-6">
                            <button onClick={addChiller} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow transition-colors font-medium text-sm flex items-center">
                                + 新增冰機
                            </button>
                            <button onClick={clearAllChillers} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded transition-colors font-medium text-sm">
                                清除全部
                            </button>
                        </div>

                        <button onClick={calculate} className="w-full bg-[#2180a0] hover:bg-[#1a6680] text-white py-3 rounded-lg shadow-md font-bold text-lg transition-all transform hover:-translate-y-0.5">
                            📊 計算效益
                        </button>

                    </div>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {result ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-[#2180a0] border-b-2 border-[#2180a0] pb-2 mb-6">📈 效益分析結果</h2>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1">現況年耗電</div>
                                    <div className="text-xl font-bold text-[#2180a0]">
                                        {(result.totalCurrentPower > 10000 ? (result.totalCurrentPower / 10000).toFixed(1) : (result.totalCurrentPower / 1000).toFixed(0))}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {result.totalCurrentPower > 10000 ? '萬度' : '千度'}
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1">改善後年耗電</div>
                                    <div className="text-xl font-bold text-green-600">
                                        {(result.totalNewPower > 10000 ? (result.totalNewPower / 10000).toFixed(1) : (result.totalNewPower / 1000).toFixed(0))}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {result.totalNewPower > 10000 ? '萬度' : '千度'}
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1">年度節省電費</div>
                                    <div className="text-xl font-bold text-green-600">{formatCurrency(result.annualSaving)}</div>
                                    <div className="text-xs text-slate-400">元</div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1">投資成本</div>
                                    <div className="text-xl font-bold text-slate-700">{formatCurrency(result.totalInvestment)}</div>
                                    <div className="text-xs text-slate-400">元</div>
                                </div>
                            </div>

                            <div className={`p-6 rounded-xl border-2 mb-6 ${result.paybackYears <= 5 ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                                <div className="flex justify-between items-center py-2 border-b border-black/5">
                                    <span className="text-sm text-slate-600">現況年電費成本</span>
                                    <span className="font-semibold">{formatCurrency(result.totalCurrentCost)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-black/5">
                                    <span className="text-sm text-slate-600">改善後年電費成本</span>
                                    <span className="font-semibold">{formatCurrency(result.totalNewCost)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-black/5">
                                    <span className="text-sm text-slate-600">年度節省電費</span>
                                    <span className="font-semibold text-green-600">-{formatCurrency(result.annualSaving)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-black/5">
                                    <span className="text-sm text-slate-600">預估工程投資</span>
                                    <span className="font-semibold">{formatCurrency(result.totalInvestment)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 mt-1">
                                    <span className="text-base font-bold text-slate-800">⭐ 投資回收年限</span>
                                    <span className={`text-2xl font-bold ${result.paybackYears <= 5 ? 'text-green-600' : 'text-red-500'}`}>
                                        {result.paybackYears.toFixed(2)} 年
                                    </span>
                                </div>
                            </div>

                            {result.paybackYears <= 5 ? (
                                <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-3 rounded text-sm mb-6">
                                    ✅ 回收年限不超過5年，投資效益良好
                                </div>
                            ) : (
                                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-3 rounded text-sm mb-6">
                                    ⚠️ 回收年限超過5年，建議重新評估方案
                                </div>
                            )}

                            {/* Charts */}
                            <div className="space-y-6">
                                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                                    <Plot
                                        data={[
                                            {
                                                x: result.details.map(d => d.name),
                                                y: result.details.map(d => d.currentCost),
                                                name: '改造前年電費',
                                                type: 'bar',
                                                marker: { color: '#ef4444' }
                                            },
                                            {
                                                x: result.details.map(d => d.name),
                                                y: result.details.map(d => d.newCost),
                                                name: '改造後年電費',
                                                type: 'bar',
                                                marker: { color: '#22c55e' }
                                            }
                                        ]}
                                        layout={{
                                            title: { text: '各冰機改造前後年度電費對比' },
                                            barmode: 'group',
                                            autosize: true,
                                            margin: { b: 50, l: 50, r: 20, t: 50 },
                                            legend: { orientation: 'h', y: -0.2 }
                                        }}
                                        style={{ width: '100%', height: '350px' }}
                                        config={{ responsive: true }}
                                    />
                                </div>

                                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                                    {/* Payback Curve */}
                                    <Plot
                                        data={[
                                            {
                                                x: Array.from({ length: Math.ceil(result.paybackYears) + 4 }, (_, i) => i),
                                                y: Array.from({ length: Math.ceil(result.paybackYears) + 4 }, (_, i) => i * result.annualSaving),
                                                name: '累計節省電費',
                                                type: 'scatter',
                                                fill: 'tozeroy',
                                                line: { color: '#22c55e' }
                                            },
                                            {
                                                x: Array.from({ length: Math.ceil(result.paybackYears) + 4 }, (_, i) => i),
                                                y: Array(Math.ceil(result.paybackYears) + 4).fill(result.totalInvestment),
                                                name: '投資成本',
                                                type: 'scatter',
                                                line: { color: '#ef4444', dash: 'dash' }
                                            }
                                        ]}
                                        layout={{
                                            title: { text: '投資回收曲線' },
                                            autosize: true,
                                            margin: { b: 50, l: 50, r: 20, t: 50 },
                                            legend: { orientation: 'h', y: -0.2 },
                                            annotations: [{
                                                x: result.paybackYears,
                                                y: result.totalInvestment,
                                                text: `回收點: ${result.paybackYears.toFixed(2)}年`,
                                                showarrow: true,
                                                arrowhead: 2,
                                                ax: 0,
                                                ay: -40
                                            }]
                                        }}
                                        style={{ width: '100%', height: '350px' }}
                                        config={{ responsive: true }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center mt-8">
                                <button onClick={exportToPDF} className="bg-[#2180a0] hover:bg-[#1a6680] text-white px-6 py-2 rounded-lg shadow font-medium flex items-center gap-2">
                                    📄 下載 PDF 報告
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400 h-full flex flex-col justify-center items-center min-h-[400px]">
                            <p className="text-xl font-semibold mb-2">尚未計算</p>
                            <p>設定左側參數並點擊「計算效益」查看結果</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
