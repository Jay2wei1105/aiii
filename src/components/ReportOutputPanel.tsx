'use client';

import { Download, Copy, CheckCircle, FileDown } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GeneratedSection {
    name: string;
    content: string;
}

interface ReportOutputPanelProps {
    generatedContent: GeneratedSection[] | null;
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

    // Generate the final report from sections
    const generateFinalReport = (): string => {
        if (!generatedContent) return '';

        return generatedContent
            .map(section => `${section.name}\n\n${section.content}`)
            .join('\n\n---\n\n');
    };

    const finalReport = generateFinalReport();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(finalReport);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full h-fit flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[calc(100vh-120px)]">
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
                                AI 智慧生成
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
            <div className="flex-1 p-8 overflow-y-auto max-h-[800px]">
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
                                請在左側輸入現勘紀錄，選擇報告模板，然後點擊「生成專業報告」按鈕，
                                AI 將根據結構要求自動生成完整內容。
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Section-based Report Display */
                    <div className="bg-white dark:bg-slate-950 rounded-xl p-8 shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="space-y-8">
                            {generatedContent.map((section, index) => (
                                <div key={index} className="border-b border-slate-200 dark:border-slate-700 pb-8 last:border-0 last:pb-0">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                                        {section.name}
                                    </h3>
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-4" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-5 mb-3" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2" {...props} />,
                                                p: ({ node, ...props }) => <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 mb-4 text-slate-700 dark:text-slate-300" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-6 mb-4 text-slate-700 dark:text-slate-300" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-slate-100" {...props} />,
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic text-slate-600 dark:text-slate-400 mb-4" {...props} />,
                                                table: ({ node, ...props }) => <div className="overflow-x-auto mb-6 rounded-lg border border-slate-200 dark:border-slate-700"><table className="w-full text-sm text-left text-slate-600 dark:text-slate-300" {...props} /></div>,
                                                thead: ({ node, ...props }) => <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-200" {...props} />,
                                                th: ({ node, ...props }) => <th className="px-6 py-3 font-bold border-b border-slate-200 dark:border-slate-700" {...props} />,
                                                td: ({ node, ...props }) => <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800" {...props} />,
                                            }}
                                        >
                                            {section.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
