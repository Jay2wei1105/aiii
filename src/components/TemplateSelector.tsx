'use client';

import React, { useState } from 'react';
import { ReportTemplate, reportTemplates } from '@/data/reportTemplates';
import TemplateCard from './TemplateCard';
import { Edit3, X } from 'lucide-react';

interface TemplateSelectorProps {
    selectedTemplateId: string | null;
    customTemplate: string;
    onSelectTemplate: (templateId: string | null) => void;
    onCustomTemplateChange: (template: string) => void;
}

export default function TemplateSelector({
    selectedTemplateId,
    customTemplate,
    onSelectTemplate,
    onCustomTemplateChange,
}: TemplateSelectorProps) {
    const [isCustomMode, setIsCustomMode] = useState(false);

    const handleSelectTemplate = (template: ReportTemplate) => {
        setIsCustomMode(false);
        onSelectTemplate(template.id);
    };

    const handleCustomMode = () => {
        setIsCustomMode(true);
        onSelectTemplate(null);
    };

    const handleCloseCustom = () => {
        setIsCustomMode(false);
        // Default back to first template
        onSelectTemplate('energy-diagnosis');
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    📑 選擇報告模板
                </h3>
                {isCustomMode && (
                    <button
                        onClick={handleCloseCustom}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                    >
                        <X className="w-4 h-4" />
                        關閉自訂
                    </button>
                )}
            </div>

            {/* Template Cards Horizontal Scroll */}
            {!isCustomMode && (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 -mx-1 px-1">
                    {reportTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="flex-none w-[85%] md:w-[45%] lg:w-[calc(25%-0.75rem)] snap-start"
                        >
                            <TemplateCard
                                template={template}
                                isSelected={selectedTemplateId === template.id}
                                onSelect={handleSelectTemplate}
                            />
                        </div>
                    ))}

                    {/* Custom Template Card */}
                    <div className="flex-none w-[85%] md:w-[45%] lg:w-[calc(25%-0.75rem)] snap-start">
                        <button
                            onClick={handleCustomMode}
                            className={`
                  relative flex flex-col items-center justify-center
                  w-full h-full min-h-[9rem] rounded-xl p-4
                  transition-all duration-200
                  bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30
                  border-2 border-dashed border-purple-300 dark:border-purple-700
                  hover:border-purple-500 dark:hover:border-purple-500
                  hover:scale-105 hover:shadow-xl
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                `}
                        >
                            <div className="mb-2 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                                <Edit3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                                自訂模板
                            </h3>
                            <p className="text-xs text-center text-purple-700 dark:text-purple-300">
                                進階用戶自訂
                            </p>
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Template Editor */}
            {isCustomMode && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        自訂報告模板 <span className="text-purple-600">（進階模式）</span>
                    </label>
                    <textarea
                        value={customTemplate}
                        onChange={(e) => onCustomTemplateChange(e.target.value)}
                        placeholder="請輸入您的模板內容...使用 {{欄位名稱}} 標記需要 AI 填寫的部分"
                        className="w-full h-80 px-4 py-3 rounded-lg border-2 border-purple-300 dark:border-purple-700 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent
                     resize-none font-mono text-sm"
                    />
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>💡 提示：使用 <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{'{{欄位名}}'}</code> 標記需要 AI 生成的內容</span>
                    </div>
                </div>
            )}
        </div>
    );
}
