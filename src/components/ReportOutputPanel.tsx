'use client';

import { Download, Copy, CheckCircle, FileDown } from 'lucide-react';
import { useState } from 'react';

interface GeneratedField {
    label: string;
    content: string;
}

interface ReportOutputPanelProps {
    generatedContent: GeneratedField[] | null;
    template: string;
    onDownload: () => void;
    isDownloading: boolean;
}

export default function ReportOutputPanel({
    generatedContent,
    template,
    onDownload,
    isDownloading,
}: ReportOutputPanelProps) {
    const [copied, setCopied] = useState(false);

    // Generate the final report by replacing {{fields}} in template
    const generateFinalReport = (): string => {
        if (!generatedContent || !template) return '';

        let finalReport = template;

        // Replace each {{field}} with its generated content
        generatedContent.forEach(field => {
            const placeholder = `{{${field.label}}}`;
            finalReport = finalReport.replace(placeholder, field.content);
        });

        return finalReport;
    };

    const finalReport = generateFinalReport();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(finalReport);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                            <FileDown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                報告預覽
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                完整報告內容（已填入 AI 生成內容）
                            </p>
                        </div>
                    </div>
                    {generatedContent && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                title="複製全部內容"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        已複製
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-5 h-5" />
                                        複製全部
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onDownload}
                                disabled={isDownloading}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                {isDownloading ? '下載中...' : '下載 DOCX'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto">
                {!generatedContent ? (
                    /* Empty State */
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="w-24 h-24 mx-auto mb-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                <FileDown className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-3">
                                尚未生成報告
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                請在左側輸入現勘紀錄和報告模板，然後點擊「生成專業報告」按鈕，
                                AI 將自動填入模板中的欄位內容。
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Full Template with Replaced Content */
                    <div className="bg-white dark:bg-slate-950 rounded-xl p-8 shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-['system-ui'] text-base">
                                {finalReport}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
