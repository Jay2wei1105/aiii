'use client';

import { Dispatch, SetStateAction } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import TemplateSelector from './TemplateSelector';

interface ReportInputPanelProps {
    inputText: string;
    setInputText: Dispatch<SetStateAction<string>>;
    template: string;
    setTemplate: Dispatch<SetStateAction<string>>;
    selectedTemplateId: string | null;
    onSelectTemplate: (templateId: string | null) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

export default function ReportInputPanel({
    inputText,
    setInputText,
    template,
    setTemplate,
    selectedTemplateId,
    onSelectTemplate,
    onGenerate,
    isGenerating,
}: ReportInputPanelProps) {
    const charCount = inputText.length;
    const minChars = 10; // Relaxed from 50

    // Count template fields (Optional, just for display)
    const fieldMatches = template.matchAll(/\{\{([^}]+)\}\}/g);
    const fieldCount = Array.from(fieldMatches).length;

    const isValid = charCount >= minChars && template.trim().length > 0;

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            輸入資料
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            輸入現勘紀錄並選擇報告模板
                        </p>
                    </div>
                </div>
            </div>

            {/* Input Areas */}
            <div className="flex-1 p-6 flex flex-col gap-6">
                {/* Section 1 - Inspection Record */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                            現勘紀錄
                        </h3>
                        <span className="ml-auto text-sm text-slate-600 dark:text-slate-400">
                            {charCount} 字
                            {charCount < minChars && (
                                <span className="ml-2 text-amber-600 dark:text-amber-500">
                                    (建議至少 {minChars} 字)
                                </span>
                            )}
                        </span>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="請輸入現勘紀錄...&#10;&#10;範例：&#10;訪廠日期: 2025/12/14&#10;客戶名稱: 宏大精密塑膠工業&#10;主要產品: 車用塑膠零組件射出成型&#10;生產班制: 兩班16H, 年工作天數250天&#10;&#10;電力系統:&#10;契約容量: 1200 kW&#10;功率因數: 82%&#10;&#10;重點耗能設備:&#10;空調: 200 RT螺旋式, 冷齡18年&#10;空壓: 100 HP x 3台, 壓力7.0 bar&#10;照明: 傳統T5/T8..."
                        className="h-64 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 shadow-inner"
                        disabled={isGenerating}
                    />
                </div>

                {/* Section 2 - Template Selector */}
                <div className="flex flex-col">
                    <TemplateSelector
                        selectedTemplateId={selectedTemplateId}
                        customTemplate={template}
                        onSelectTemplate={onSelectTemplate}
                        onCustomTemplateChange={setTemplate}
                    />

                    {/* Validation Info */}
                    {fieldCount > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            已識別 {fieldCount} 個動態填變數
                        </div>
                    )}
                </div>
            </div>

            {/* Generate Button */}
            <div className="px-6 pb-6">
                <button
                    onClick={onGenerate}
                    disabled={!isValid || isGenerating}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-3 text-lg"
                >
                    {isGenerating && <Loader2 className="w-5 h-5 animate-spin" />}
                    {!isGenerating && <FileText className="w-5 h-5" />}
                    <span>{isGenerating ? 'AI 正在生成報告中...' : '生成報告'}</span>
                </button>
            </div>
        </div>
    );
}
