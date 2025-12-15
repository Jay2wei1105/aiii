"use client";

import { useState, useRef } from "react";
import dynamic from 'next/dynamic';
import Navbar from "@/components/Navbar";
import ChartAnalysis from "@/components/ChartAnalysis";
import ChillerReplacementCalculator from "@/components/ChillerReplacementCalculator";
// import ContractCapacityOptimizer from "@/components/ContractCapacityOptimizer"; // SSR issue
import { useLanguage } from "@/context/LanguageContext";

const ContractCapacityOptimizer = dynamic(() => import('@/components/ContractCapacityOptimizer'), { ssr: false });

interface UploadedFile {
    id: string;
    name: string;
    size: string;
    selected: boolean;
    columns?: string[];
}

const chartTypes = [
    { id: "bar", name: "Bar Chart", icon: "📊" },
    { id: "line", name: "Line Chart", icon: "📈" },
    { id: "pie", name: "Pie Chart", icon: "🥧" },
    { id: "scatter", name: "Scatter Plot", icon: "⚫" },
];

// 模擬檔案欄位（實際應該從上傳的檔案解析）
const mockColumns = ["Month", "Sales", "Revenue", "Profit", "Expenses"];

export default function ChartPage() {
    const { t } = useLanguage();
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [selectedChart, setSelectedChart] = useState("bar");
    const [xAxisColumn, setXAxisColumn] = useState("Month");
    const [yAxisColumns, setYAxisColumns] = useState<string[]>(["Sales"]);
    const [activeTab, setActiveTab] = useState<'simple' | 'advanced' | 'calculator' | 'contract'>('simple');

    const tabs = [
        { id: 'simple', label: t('chart.simple') },
        { id: 'advanced', label: t('chart.advanced') },
        { id: 'calculator', label: t('chart.calculator') },
        { id: 'contract', label: t('chart.contract_optimization') }
    ];
    const chartRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = e.target.files;
        if (uploadedFiles) {
            const newFilesPromises = Array.from(uploadedFiles).map(async (file) => {
                let columns: string[] = mockColumns;

                // 嘗試解析檔案內容以取得欄位名稱
                if (file.name.endsWith('.csv')) {
                    try {
                        const text = await file.text();
                        const firstLine = text.split('\n')[0];
                        columns = firstLine.split(',').map(col => col.trim().replace(/"/g, ''));
                    } catch (error) {
                        console.error('Error parsing CSV:', error);
                    }
                } else if (file.name.endsWith('.json')) {
                    try {
                        const text = await file.text();
                        const jsonData = JSON.parse(text);
                        if (Array.isArray(jsonData) && jsonData.length > 0) {
                            columns = Object.keys(jsonData[0]);
                        }
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                    }
                }
                // XLSX 需要額外的庫來解析，這裡暫時使用 mock data

                return {
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    size: (file.size / 1024).toFixed(2) + " KB",
                    selected: true,
                    columns: columns,
                };
            });

            const newFiles = await Promise.all(newFilesPromises);
            setFiles([...files, ...newFiles]);

            // 自動設定第一個檔案的欄位為預設軸
            if (files.length === 0 && newFiles.length > 0 && newFiles[0].columns) {
                const cols = newFiles[0].columns;
                if (cols.length > 0) {
                    setXAxisColumn(cols[0]);
                    if (cols.length > 1) {
                        setYAxisColumns([cols[1]]);
                    }
                }
            }
        }
    };

    const toggleFileSelection = (id: string) => {
        setFiles(files.map(file =>
            file.id === id ? { ...file, selected: !file.selected } : file
        ));
    };

    const removeFile = (id: string) => {
        setFiles(files.filter(file => file.id !== id));
    };

    const toggleYAxisColumn = (column: string) => {
        if (yAxisColumns.includes(column)) {
            setYAxisColumns(yAxisColumns.filter(c => c !== column));
        } else {
            setYAxisColumns([...yAxisColumns, column]);
        }
    };

    const handleExport = () => {
        if (!chartRef.current) return;

        // 使用 html2canvas 或類似庫來匯出圖表
        // 這裡先用簡單的方式示意
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (ctx) {
            canvas.width = 1200;
            canvas.height = 800;
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.fillText('Chart Export - ' + chartTypes.find(c => c.id === selectedChart)?.name, 50, 50);

            // 轉換為圖片並下載
            const link = document.createElement('a');
            link.download = `chart-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    const availableColumns = files.find(f => f.selected)?.columns || mockColumns;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <div className="flex flex-col">
                <Navbar />

                <div className="px-6 py-4">
                    <div className="w-full mx-auto">
                        <div className="mb-12">
                            <h1 className="text-4xl font-bold mb-4">Data Visualization</h1>
                            <p className="text-lg text-slate-400 mb-6">
                                Upload your data and create interactive charts
                            </p>

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

                        {activeTab === 'advanced' ? (
                            <ChartAnalysis />
                        ) : activeTab === 'calculator' ? (
                            <ChillerReplacementCalculator />
                        ) : activeTab === 'contract' ? (
                            <ContractCapacityOptimizer />
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* 左側欄位 */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* 上方：檔案上傳區 */}
                                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                                        <h2 className="text-lg font-bold mb-4 text-slate-800">Upload Files</h2>

                                        {/* 上傳按鈕 */}
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#0085CA] hover:bg-blue-50/50 transition-all">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <svg className="w-10 h-10 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-sm text-slate-400">
                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-slate-500">CSV, XLSX, JSON</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                multiple
                                                accept=".csv,.xlsx,.json"
                                                onChange={handleFileUpload}
                                            />
                                        </label>

                                        {/* 已上傳檔案列表 */}
                                        <div className="mt-6 space-y-2">
                                            <h3 className="text-sm font-semibold text-slate-400 mb-3">
                                                Uploaded Files ({files.length})
                                            </h3>
                                            {files.length === 0 ? (
                                                <p className="text-sm text-slate-500 text-center py-4">No files uploaded yet</p>
                                            ) : (
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {files.map((file) => (
                                                        <div
                                                            key={file.id}
                                                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={file.selected}
                                                                onChange={() => toggleFileSelection(file.id)}
                                                                className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                                                <p className="text-xs text-slate-500">{file.size}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFile(file.id)}
                                                                className="text-slate-400 hover:text-red-400 transition-colors"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 中間：軸設定 */}
                                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                                        <h2 className="text-lg font-bold mb-4 text-slate-800">Axis Configuration</h2>

                                        {/* X 軸選擇 */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">
                                                X-Axis (Horizontal)
                                            </label>
                                            <select
                                                value={xAxisColumn}
                                                onChange={(e) => setXAxisColumn(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA] outline-none"
                                            >
                                                {availableColumns.map((col) => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Y 軸選擇 */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">
                                                Y-Axis (Vertical)
                                            </label>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {availableColumns.filter(col => col !== xAxisColumn).map((col) => (
                                                    <label
                                                        key={col}
                                                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={yAxisColumns.includes(col)}
                                                            onChange={() => toggleYAxisColumn(col)}
                                                            className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-slate-700">{col}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 下方：圖表類型選擇 */}
                                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                                        <h2 className="text-lg font-bold mb-4 text-slate-800">Chart Type</h2>
                                        <div className="grid grid-cols-2 gap-3">
                                            {chartTypes.map((chart) => (
                                                <button
                                                    key={chart.id}
                                                    onClick={() => setSelectedChart(chart.id)}
                                                    className={`p-4 rounded-xl border transition-all ${selectedChart === chart.id
                                                        ? "border-[#0085CA] bg-blue-50 text-[#0085CA]"
                                                        : "border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600"
                                                        }`}
                                                >
                                                    <div className="text-3xl mb-2">{chart.icon}</div>
                                                    <div className="text-sm font-medium">{chart.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 右側：圖表展示區 */}
                                <div className="lg:col-span-2">
                                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 h-full min-h-[600px]">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-lg font-bold text-slate-800">Data Visualization</h2>
                                            <button
                                                onClick={handleExport}
                                                className="px-4 py-2 rounded-lg bg-[#0085CA] hover:bg-[#006699] text-white text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Export Chart
                                            </button>
                                        </div>

                                        {/* 圖表顯示區域 */}
                                        <div ref={chartRef} className="bg-white rounded-xl p-8 h-[calc(100%-80px)] flex items-center justify-center border border-slate-100">
                                            {files.filter(f => f.selected).length === 0 ? (
                                                <div className="text-center">
                                                    <svg className="w-24 h-24 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                    <h3 className="text-xl font-semibold text-slate-400 mb-2">No Data Selected</h3>
                                                    <p className="text-sm text-slate-500">Upload and select files to visualize your data</p>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex flex-col">
                                                    <div className="text-center mb-6">
                                                        <h3 className="text-lg font-semibold text-slate-800">
                                                            {chartTypes.find(c => c.id === selectedChart)?.name}
                                                        </h3>
                                                        <p className="text-sm text-slate-500">
                                                            {yAxisColumns.length > 0 ? yAxisColumns.join(", ") : "No Y-axis selected"} vs {xAxisColumn}
                                                        </p>
                                                    </div>

                                                    {/* 示意圖表 with 軸標題 */}
                                                    <div className="flex-1 flex items-center justify-center relative">
                                                        {/* Y 軸標題 */}
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-slate-400">
                                                            {yAxisColumns.length > 0 ? yAxisColumns.join(", ") : "Y-Axis"}
                                                        </div>

                                                        {/* 圖表區域 */}
                                                        <div className="flex-1 flex flex-col items-center justify-center px-12">
                                                            <div className="w-full flex items-end justify-around gap-4 pb-8" style={{ height: "300px" }}>
                                                                {selectedChart === "bar" && (
                                                                    <>
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <div className="w-16 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg" style={{ height: "60%" }}></div>
                                                                            <span className="text-xs text-slate-500">Jan</span>
                                                                        </div>
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <div className="w-16 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg" style={{ height: "85%" }}></div>
                                                                            <span className="text-xs text-slate-500">Feb</span>
                                                                        </div>
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <div className="w-16 bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-lg" style={{ height: "45%" }}></div>
                                                                            <span className="text-xs text-slate-500">Mar</span>
                                                                        </div>
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <div className="w-16 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg" style={{ height: "70%" }}></div>
                                                                            <span className="text-xs text-slate-500">Apr</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {selectedChart === "line" && (
                                                                    <div className="w-full h-full relative">
                                                                        <svg className="w-full h-full" viewBox="0 0 400 200">
                                                                            <polyline
                                                                                points="20,150 100,80 180,120 260,60 340,100"
                                                                                fill="none"
                                                                                stroke="url(#lineGradient)"
                                                                                strokeWidth="3"
                                                                            />
                                                                            <defs>
                                                                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                                    <stop offset="0%" stopColor="#3b82f6" />
                                                                                    <stop offset="100%" stopColor="#8b5cf6" />
                                                                                </linearGradient>
                                                                            </defs>
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                                {selectedChart === "pie" && (
                                                                    <div className="w-64 h-64 rounded-full relative" style={{
                                                                        background: "conic-gradient(from 0deg, #3b82f6 0deg 120deg, #8b5cf6 120deg 240deg, #ec4899 240deg 300deg, #f59e0b 300deg 360deg)"
                                                                    }}>
                                                                        <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                                                                            <span className="text-2xl font-bold">100%</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {selectedChart === "scatter" && (
                                                                    <div className="w-full h-full relative">
                                                                        <svg className="w-full h-full" viewBox="0 0 400 200">
                                                                            {[...Array(20)].map((_, i) => (
                                                                                <circle
                                                                                    key={i}
                                                                                    cx={Math.random() * 360 + 20}
                                                                                    cy={Math.random() * 160 + 20}
                                                                                    r="6"
                                                                                    fill={`hsl(${Math.random() * 360}, 70%, 60%)`}
                                                                                    opacity="0.8"
                                                                                />
                                                                            ))}
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* X 軸標題 */}
                                                            <div className="text-sm font-semibold text-slate-400 mt-2">
                                                                {xAxisColumn}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
