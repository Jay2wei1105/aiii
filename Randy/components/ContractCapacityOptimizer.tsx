"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Zap, Save, RefreshCw, AlertCircle, BarChart2, TrendingDown, Activity } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart
} from 'recharts';

// --- 型別定義 ---
type DemandData = {
    peak: number;
    semi: number;
    satSemi: number;
    off: number;
};

type RateConfig = {
    summer: number;
    nonSummer: number;
};

type Rates = {
    peak: RateConfig;
    semi: RateConfig;
    satSemi: RateConfig;
    off: RateConfig;
};

type ContractConfig = {
    peak: number;
    semi: number;
    satSemi: number;
    off: number;
};

type MonthlyResult = {
    month: number;
    basicCost: number;
    excessCost: number;
    totalCost: number;
    excessKW: ContractConfig; // 紀錄各時段超約量
};

// --- 預設數據 (參考 Excel 截圖) ---
const DEFAULT_RATES: Rates = {
    peak: { summer: 223.6, nonSummer: 166.9 },
    semi: { summer: 166.9, nonSummer: 166.9 },
    satSemi: { summer: 44.7, nonSummer: 33.3 },
    off: { summer: 44.7, nonSummer: 33.3 },
};

// 產生預設需量數據 (模擬 Excel 截圖中的數據)
const generateDefaultDemands = (): DemandData[] => {
    const data = Array(12).fill(null).map(() => ({ peak: 0, semi: 0, satSemi: 0, off: 0 }));
    // 填入部分範例數據 (月份 0 = 1月)
    data[4] = { peak: 361, semi: 401, satSemi: 329, off: 395 }; // 5月
    data[5] = { peak: 418, semi: 591, satSemi: 360, off: 604 }; // 6月
    data[6] = { peak: 406, semi: 434, satSemi: 349, off: 417 }; // 7月
    data[7] = { peak: 412, semi: 611, satSemi: 389, off: 584 }; // 8月
    data[8] = { peak: 527, semi: 623, satSemi: 366, off: 602 }; // 9月
    data[9] = { peak: 434, semi: 519, satSemi: 349, off: 527 }; // 10月
    data[10] = { peak: 0, semi: 469, satSemi: 313, off: 441 }; // 11月
    data[11] = { peak: 0, semi: 348, satSemi: 296, off: 342 }; // 12月
    // 1-4月
    data[0] = { peak: 0, semi: 325, satSemi: 326, off: 342 };
    data[1] = { peak: 0, semi: 353, satSemi: 310, off: 349 };
    data[2] = { peak: 0, semi: 359, satSemi: 318, off: 363 };
    data[3] = { peak: 0, semi: 403, satSemi: 346, off: 400 };
    return data;
};

const DEFAULT_CURRENT_CONTRACT: ContractConfig = {
    peak: 600,
    semi: 0,
    satSemi: 0,
    off: 0,
};

// --- 核心運算邏輯 (移植自 VBA) ---

// 1. 取得當月費率 (含過渡月邏輯)
const getMonthlyRates = (monthIndex: number, rates: Rates): ContractConfig => {
    const month = monthIndex + 1; // 1-based month
    const getRate = (r: RateConfig) => {
        if (month >= 6 && month <= 9) return r.summer;
        if (month === 5 || month === 10) return (r.summer + r.nonSummer) / 2;
        return r.nonSummer;
    };

    return {
        peak: getRate(rates.peak),
        semi: getRate(rates.semi),
        satSemi: getRate(rates.satSemi),
        off: getRate(rates.off),
    };
};

// 2. 計算單月成本 (基本費 + 超約費)
const calculateMonthlyCost = (
    monthIndex: number,
    contract: ContractConfig,
    demand: DemandData,
    rates: Rates
): MonthlyResult => {
    const monthlyRates = getMonthlyRates(monthIndex, rates);

    // 基本電費
    const basicCost =
        contract.peak * monthlyRates.peak +
        contract.semi * monthlyRates.semi +
        contract.satSemi * monthlyRates.satSemi +
        contract.off * monthlyRates.off;

    // 超約量計算 (累進扣抵邏輯)
    const excessKW: ContractConfig = { peak: 0, semi: 0, satSemi: 0, off: 0 };

    // 經常契約超約
    excessKW.peak = Math.max(0, demand.peak - contract.peak);

    // 半尖峰超約 (需扣除經常契約與前段超約)
    const cumContract2 = contract.peak + contract.semi;
    excessKW.semi = Math.max(0, demand.semi - cumContract2 - excessKW.peak);

    // 週六半尖峰超約
    const cumContract3 = cumContract2 + contract.satSemi;
    const maxPrevExcess2 = Math.max(excessKW.peak, excessKW.semi);
    excessKW.satSemi = Math.max(0, demand.satSemi - cumContract3 - maxPrevExcess2);

    // 離峰超約
    const cumContract4 = cumContract3 + contract.off;
    const maxPrevExcess3 = Math.max(excessKW.peak, excessKW.semi, excessKW.satSemi);
    excessKW.off = Math.max(0, demand.off - cumContract4 - maxPrevExcess3);

    // 超約罰款計算 (2倍/3倍邏輯)
    let excessCost = 0;
    const types: (keyof ContractConfig)[] = ['peak', 'semi', 'satSemi', 'off'];

    types.forEach((type) => {
        if (excessKW[type] > 0) {
            // 10% 寬限值 (僅針對經常契約容量計算)
            // 注意：Excel VBA 邏輯中，寬限值是用 contracts(1) * 0.1，也就是經常契約的 10%
            const allowance = contract.peak > 0 ? contract.peak * 0.1 : 0;

            let penaltyRate = 0;
            if (type === 'peak') penaltyRate = monthlyRates.peak;
            else if (type === 'semi' || type === 'satSemi') penaltyRate = monthlyRates.semi;
            else if (type === 'off') penaltyRate = monthlyRates.satSemi; // 注意：VBA 中離峰超約是用 rates(3) 即週六半尖峰費率

            const withinAllowance = Math.min(excessKW[type], allowance);
            const overAllowance = excessKW[type] - withinAllowance;

            excessCost += (withinAllowance * penaltyRate * 2) + (overAllowance * penaltyRate * 3);
        }
    });

    return {
        month: monthIndex + 1,
        basicCost,
        excessCost,
        totalCost: basicCost + excessCost,
        excessKW
    };
};

// 3. 計算年度總成本
const calculateAnnualTotal = (
    contract: ContractConfig,
    demands: DemandData[],
    rates: Rates
): number => {
    let total = 0;
    for (let i = 0; i < 12; i++) {
        const result = calculateMonthlyCost(i, contract, demands[i], rates);
        total += result.totalCost;
    }
    return total;
};

// 4. 單點優化 (座標下降法)
const optimizeFromPoint = (
    startConfig: ContractConfig,
    demands: DemandData[],
    rates: Rates
): { config: ContractConfig; cost: number } => {
    let currentConfig = { ...startConfig };
    let minCost = calculateAnnualTotal(currentConfig, demands, rates);

    const maxIterations = 10;
    const stepSize = 5; // 可調整精度
    const searchRange = 800; // 搜尋範圍

    let lastCost = minCost;
    const types: (keyof ContractConfig)[] = ['peak', 'semi', 'satSemi', 'off'];

    for (let iter = 0; iter < maxIterations; iter++) {
        for (const type of types) {
            let bestVal = currentConfig[type];
            let localMinCost = minCost;

            // 簡易掃描 (實務上可用二分搜或黃金分割優化，但此外數據量小直接掃描即可)
            for (let val = 0; val <= searchRange; val += stepSize) {
                const tempConfig = { ...currentConfig, [type]: val };
                const cost = calculateAnnualTotal(tempConfig, demands, rates);
                if (cost < localMinCost) {
                    localMinCost = cost;
                    bestVal = val;
                }
            }
            currentConfig[type] = bestVal;
            minCost = localMinCost;
        }

        // 收斂判斷
        if (Math.abs(minCost - lastCost) < 1) break;
        lastCost = minCost;
    }

    return { config: currentConfig, cost: minCost };
};

// 5. 多起點優化主程式
const runMultiStartOptimization = (
    currentUserInput: ContractConfig,
    demands: DemandData[],
    rates: Rates
): { config: ContractConfig; cost: number } => {
    // 產生起點
    const startPoints: ContractConfig[] = [
        currentUserInput,
        { peak: 434, semi: 41, satSemi: 0, off: 0 }, // 經驗值
        // Max Demand Config
        {
            peak: Math.max(...demands.map(d => d.peak)),
            semi: Math.max(...demands.map(d => d.semi)),
            satSemi: Math.max(...demands.map(d => d.satSemi)),
            off: Math.max(...demands.map(d => d.off))
        },
        // Avg Demand Config
        {
            peak: demands.reduce((acc, d) => acc + d.peak, 0) / 12,
            semi: demands.reduce((acc, d) => acc + d.semi, 0) / 12,
            satSemi: demands.reduce((acc, d) => acc + d.satSemi, 0) / 12,
            off: demands.reduce((acc, d) => acc + d.off, 0) / 12
        }
    ];

    let overallBestCost = Infinity;
    let overallBestConfig = startPoints[0];

    startPoints.forEach(startPoint => {
        const result = optimizeFromPoint(startPoint, demands, rates);
        if (result.cost < overallBestCost) {
            overallBestCost = result.cost;
            overallBestConfig = result.config;
        }
    });

    return { config: overallBestConfig, cost: overallBestCost };
};


export default function ContractCapacityOptimizer() {
    const [activeTab, setActiveTab] = useState<'input' | 'result'>('input');
    const [demands, setDemands] = useState<DemandData[]>(generateDefaultDemands());
    const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
    const [currentContract, setCurrentContract] = useState<ContractConfig>(DEFAULT_CURRENT_CONTRACT);

    const [optimizedResult, setOptimizedResult] = useState<{
        config: ContractConfig;
        cost: number;
        savings: number;
    } | null>(null);

    const [isOptimizing, setIsOptimizing] = useState(false);
    const [chartType, setChartType] = useState<keyof ContractConfig>('peak'); // 用於控制顯示哪種需量圖表

    // 處理需量數據變更
    const handleDemandChange = (monthIdx: number, field: keyof DemandData, value: string) => {
        const newDemands = [...demands];
        newDemands[monthIdx] = {
            ...newDemands[monthIdx],
            [field]: parseFloat(value) || 0
        };
        setDemands(newDemands);
    };

    // 執行最佳化
    const handleOptimize = () => {
        setIsOptimizing(true);
        // 使用 setTimeout 讓 UI 有機會渲染 Loading 狀態
        setTimeout(() => {
            const currentCost = calculateAnnualTotal(currentContract, demands, rates);
            const result = runMultiStartOptimization(currentContract, demands, rates);

            setOptimizedResult({
                config: result.config,
                cost: result.cost,
                savings: currentCost - result.cost
            });
            setIsOptimizing(false);
            setActiveTab('result');
        }, 100);
    };

    const formatCurrency = (val: number) => Math.round(val).toLocaleString();

    // 準備圖表數據
    const chartData = useMemo(() => {
        if (!optimizedResult) return [];

        return demands.map((demand, i) => {
            const originalRes = calculateMonthlyCost(i, currentContract, demand, rates);
            const optimizedRes = calculateMonthlyCost(i, optimizedResult.config, demand, rates);

            return {
                month: `${i + 1}月`,
                monthIndex: i + 1,
                // 費用數據
                originalBasic: originalRes.basicCost,
                originalExcess: originalRes.excessCost,
                originalTotal: originalRes.totalCost,
                optimizedBasic: optimizedRes.basicCost,
                optimizedExcess: optimizedRes.excessCost,
                optimizedTotal: optimizedRes.totalCost,
                // 需量數據
                demandPeak: demand.peak,
                demandSemi: demand.semi,
                demandSatSemi: demand.satSemi,
                demandOff: demand.off,
            };
        });
    }, [demands, currentContract, optimizedResult, rates]);

    // 計算年度比較數據 (Stacked Bar)
    const annualComparisonData = useMemo(() => {
        if (!optimizedResult) return [];

        const originalTotalBasic = chartData.reduce((acc, cur) => acc + cur.originalBasic, 0);
        const originalTotalExcess = chartData.reduce((acc, cur) => acc + cur.originalExcess, 0);

        const optimizedTotalBasic = chartData.reduce((acc, cur) => acc + cur.optimizedBasic, 0);
        const optimizedTotalExcess = chartData.reduce((acc, cur) => acc + cur.optimizedExcess, 0);

        return [
            { name: '原始方案', basic: originalTotalBasic, excess: originalTotalExcess, total: originalTotalBasic + originalTotalExcess },
            { name: '最佳化方案', basic: optimizedTotalBasic, excess: optimizedTotalExcess, total: optimizedTotalBasic + optimizedTotalExcess },
        ];
    }, [chartData, optimizedResult]);


    return (
        <div className="w-full max-w-[1600px] mx-auto p-4 space-y-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8 rounded-xl shadow-lg mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Zap className="text-yellow-300" />
                    電力契約容量最佳化分析工具
                </h1>
                <p className="opacity-90">針對台電高壓供電（二段/三段式）費率計算，含過渡月邏輯</p>
            </div>

            <div className="max-w-6xl mx-auto">

                {/* Header Control */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('input')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'input' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                        >
                            數據輸入
                        </button>
                        <button
                            onClick={() => setActiveTab('result')}
                            disabled={!optimizedResult}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'result' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50'}`}
                        >
                            最佳化報告
                        </button>
                    </div>
                </header>

                {activeTab === 'input' && (
                    <div className="space-y-6 animate-fade-in">

                        {/* Control Panel Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Current Contract Settings */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                                    <Save className="w-5 h-5 text-blue-500" />
                                    目前契約設定 (用於比較)
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {(Object.keys(currentContract) as Array<keyof ContractConfig>).map(key => (
                                        <div key={key}>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                                                {key === 'peak' ? '經常契約 (kW)' :
                                                    key === 'semi' ? '半尖峰契約 (kW)' :
                                                        key === 'satSemi' ? '週六半尖峰 (kW)' : '離峰契約 (kW)'}
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                value={currentContract[key]}
                                                onChange={(e) => setCurrentContract({ ...currentContract, [key]: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rate Settings */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                                    <Calculator className="w-5 h-5 text-green-500" />
                                    電價表設定 (元/kW)
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2 font-medium text-gray-500">分類</th>
                                                <th className="text-right py-2 font-medium text-red-500">夏月</th>
                                                <th className="text-right py-2 font-medium text-blue-500">非夏月</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(Object.keys(rates) as Array<keyof Rates>).map(key => (
                                                <tr key={key} className="border-b last:border-0">
                                                    <td className="py-2 text-gray-700">
                                                        {key === 'peak' ? '經常契約' :
                                                            key === 'semi' ? '半尖峰' :
                                                                key === 'satSemi' ? '週六半尖峰' : '離峰'}
                                                    </td>
                                                    <td className="text-right">
                                                        <input
                                                            type="number"
                                                            className="w-20 text-right bg-gray-50 border rounded px-1 py-1 focus:bg-white"
                                                            value={rates[key].summer}
                                                            onChange={(e) => setRates({ ...rates, [key]: { ...rates[key], summer: parseFloat(e.target.value) || 0 } })}
                                                        />
                                                    </td>
                                                    <td className="text-right">
                                                        <input
                                                            type="number"
                                                            className="w-20 text-right bg-gray-50 border rounded px-1 py-1 focus:bg-white"
                                                            value={rates[key].nonSummer}
                                                            onChange={(e) => setRates({ ...rates, [key]: { ...rates[key], nonSummer: parseFloat(e.target.value) || 0 } })}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Demand Input */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                                    <RefreshCw className="w-5 h-5 text-purple-500" />
                                    每月最高需量紀錄 (kW)
                                </h2>
                                <div className="text-xs text-gray-400 flex gap-2">
                                    <span className="flex items-center"><span className="w-3 h-3 bg-red-50 rounded-full mr-1"></span> 夏月 (6-9)</span>
                                    <span className="flex items-center"><span className="w-3 h-3 bg-orange-50 rounded-full mr-1"></span> 過渡 (5,10)</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="p-3 text-left font-medium text-gray-500">月份</th>
                                            <th className="p-3 text-right font-medium text-gray-700">尖峰需量</th>
                                            <th className="p-3 text-right font-medium text-gray-700">半尖峰需量</th>
                                            <th className="p-3 text-right font-medium text-gray-700">週六半尖峰</th>
                                            <th className="p-3 text-right font-medium text-gray-700">離峰需量</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {demands.map((d, idx) => {
                                            const month = idx + 1;
                                            // 背景色判斷
                                            let bgClass = "hover:bg-gray-50";
                                            if (month >= 6 && month <= 9) bgClass = "bg-red-50/50 hover:bg-red-50";
                                            else if (month === 5 || month === 10) bgClass = "bg-orange-50/50 hover:bg-orange-50";

                                            return (
                                                <tr key={idx} className={`border-b last:border-0 transition-colors ${bgClass}`}>
                                                    <td className="p-3 font-medium text-gray-600">{month}月</td>
                                                    {(['peak', 'semi', 'satSemi', 'off'] as const).map(key => (
                                                        <td key={key} className="p-1">
                                                            <input
                                                                type="number"
                                                                className="w-full text-right p-2 rounded border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-transparent"
                                                                value={d[key] === 0 ? '' : d[key]}
                                                                placeholder="0"
                                                                onChange={(e) => handleDemandChange(idx, key, e.target.value)}
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-center py-4">
                            <button
                                onClick={handleOptimize}
                                disabled={isOptimizing}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-full shadow-lg shadow-blue-200 transition-all transform hover:scale-105 disabled:opacity-70 flex items-center gap-2"
                            >
                                {isOptimizing ? (
                                    <>
                                        <RefreshCw className="animate-spin" /> 計算中...
                                    </>
                                ) : (
                                    <>
                                        <Zap /> 開始最佳化計算
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'result' && optimizedResult && (
                    <div className="space-y-6 animate-fade-in">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-gray-400">
                                <h3 className="text-gray-500 text-sm font-medium uppercase">原始方案年度費用</h3>
                                <div className="text-2xl font-bold mt-2 text-gray-700">
                                    ${formatCurrency(calculateAnnualTotal(currentContract, demands, rates))}
                                </div>
                                <div className="mt-2 text-xs text-gray-400">基於目前的契約設定</div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                                <h3 className="text-green-600 text-sm font-medium uppercase">最佳化後年度費用</h3>
                                <div className="text-3xl font-bold mt-2 text-gray-900">
                                    ${formatCurrency(optimizedResult.cost)}
                                </div>
                                <div className="mt-2 text-xs text-green-600 font-medium">包含基本費與超約罰款</div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                                <h3 className="text-yellow-600 text-sm font-medium uppercase">預估每年可節省</h3>
                                <div className="text-3xl font-bold mt-2 text-yellow-600">
                                    ${formatCurrency(optimizedResult.savings)}
                                </div>
                                <div className="mt-2 text-xs text-gray-400">
                                    節費率: {((optimizedResult.savings / calculateAnnualTotal(currentContract, demands, rates)) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        {/* Optimal Config */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">建議最佳契約容量配置</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: '經常契約', val: optimizedResult.config.peak, color: 'text-red-600', bg: 'bg-red-50' },
                                    { label: '半尖峰契約', val: optimizedResult.config.semi, color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { label: '週六半尖峰', val: optimizedResult.config.satSemi, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: '離峰契約', val: optimizedResult.config.off, color: 'text-gray-600', bg: 'bg-gray-100' },
                                ].map((item, i) => (
                                    <div key={i} className={`p-4 rounded-lg text-center ${item.bg}`}>
                                        <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                                        <div className={`text-2xl font-bold ${item.color}`}>{item.val} <span className="text-sm font-normal text-gray-400">kW</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* 1. Demand Analysis Chart (Engineer Focus) */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-blue-500" />
                                            需量與契約容量分析
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            觀察實際需量(藍色區域)與契約容量(虛線)的關係，超出虛線部分即為超約。
                                        </p>
                                    </div>
                                    <div className="mt-4 sm:mt-0 flex bg-gray-100 p-1 rounded-lg">
                                        {(['peak', 'semi', 'satSemi', 'off'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setChartType(type)}
                                                className={`px-3 py-1.5 text-sm rounded-md transition-all ${chartType === type ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {type === 'peak' ? '經常' : type === 'semi' ? '半尖峰' : type === 'satSemi' ? '週六' : '離峰'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                            {/* Actual Demand Area */}
                                            <Area
                                                type="monotone"
                                                dataKey={
                                                    chartType === 'peak' ? 'demandPeak' :
                                                        chartType === 'semi' ? 'demandSemi' :
                                                            chartType === 'satSemi' ? 'demandSatSemi' : 'demandOff'
                                                }
                                                name="實際需量"
                                                fill="#eff6ff"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                            />

                                            {/* Contract Lines */}
                                            <ReferenceLine
                                                y={currentContract[chartType]}
                                                stroke="#ef4444"
                                                strokeDasharray="5 5"
                                                label={{ position: 'right', value: '原始契約', fill: '#ef4444', fontSize: 12 }}
                                            />
                                            <ReferenceLine
                                                y={optimizedResult.config[chartType]}
                                                stroke="#10b981"
                                                strokeDasharray="5 5"
                                                label={{ position: 'right', value: '最佳化', fill: '#10b981', fontSize: 12 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* 2. Cost Structure Comparison */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-indigo-500" />
                                    年度費用結構比較
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={annualComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 14, fontWeight: 500 }} />
                                            <YAxis tickFormatter={(val: number) => `$${(val / 10000).toFixed(0)}萬`} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                            <Tooltip formatter={(val: number) => `$${formatCurrency(val)}`} />
                                            <Legend />
                                            <Bar dataKey="basic" name="基本電費" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                                            <Bar dataKey="excess" name="超約罰款" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* 3. Monthly Savings Trend */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-green-500" />
                                    每月費用比較
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                            <YAxis hide />
                                            <Tooltip formatter={(val: number) => `$${formatCurrency(val)}`} />
                                            <Legend />
                                            <Bar dataKey="originalTotal" name="原始" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="optimizedTotal" name="最佳化" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>

                        {/* Detailed Breakdown Table */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">每月費用明細表</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b text-gray-600">
                                            <th className="py-3 px-4 text-left">月份</th>
                                            <th className="py-3 px-4 text-right">基本電費</th>
                                            <th className="py-3 px-4 text-right">超約附加費</th>
                                            <th className="py-3 px-4 text-right">當月合計</th>
                                            <th className="py-3 px-4 text-left pl-8">備註 (超約狀況)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 12 }).map((_, i) => {
                                            const res = calculateMonthlyCost(i, optimizedResult.config, demands[i], rates);
                                            const hasExcess = res.excessCost > 0;
                                            return (
                                                <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 font-medium">{i + 1}月</td>
                                                    <td className="py-3 px-4 text-right">{formatCurrency(res.basicCost)}</td>
                                                    <td className={`py-3 px-4 text-right ${hasExcess ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                        {hasExcess ? formatCurrency(res.excessCost) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(res.totalCost)}</td>
                                                    <td className="py-3 px-4 pl-8 text-xs text-gray-500">
                                                        {hasExcess ? (
                                                            <div className="flex gap-2">
                                                                {res.excessKW.peak > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">尖峰超約 {res.excessKW.peak.toFixed(0)}</span>}
                                                                {res.excessKW.semi > 0 && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">半尖峰超約 {res.excessKW.semi.toFixed(0)}</span>}
                                                                {res.excessKW.satSemi > 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">週六超約 {res.excessKW.satSemi.toFixed(0)}</span>}
                                                                {res.excessKW.off > 0 && <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded">離峰超約 {res.excessKW.off.toFixed(0)}</span>}
                                                            </div>
                                                        ) : <span className="text-green-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 未超約</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-gray-50 font-bold text-gray-800">
                                        <tr>
                                            <td className="py-3 px-4">年度總計</td>
                                            <td className="py-3 px-4 text-right">
                                                {formatCurrency(Array.from({ length: 12 }).reduce((acc: number, _, i) => acc + calculateMonthlyCost(i, optimizedResult.config, demands[i], rates).basicCost, 0))}
                                            </td>
                                            <td className="py-3 px-4 text-right text-red-600">
                                                {formatCurrency(Array.from({ length: 12 }).reduce((acc: number, _, i) => acc + calculateMonthlyCost(i, optimizedResult.config, demands[i], rates).excessCost, 0))}
                                            </td>
                                            <td className="py-3 px-4 text-right text-lg text-blue-700">
                                                {formatCurrency(optimizedResult.cost)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="text-center text-sm text-gray-400 mt-8">
                            <p>* 運算結果僅供規劃參考，實際電費請以台灣電力公司正式帳單為準。</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
