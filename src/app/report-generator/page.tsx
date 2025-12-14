'use client';

import { useState } from 'react';
import ReportInputPanel from '@/components/ReportInputPanel';
import ReportOutputPanel from '@/components/ReportOutputPanel';
import { reportTemplates, getTemplateById } from '@/data/reportTemplates';
import { saveAs } from 'file-saver';

interface GeneratedField {
    label: string;
    content: string;
}

export default function ReportGeneratorPage() {
    const [inputText, setInputText] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('energy-diagnosis');
    const [template, setTemplate] = useState(reportTemplates[0].template); // Default to first template
    const [generatedContent, setGeneratedContent] = useState<GeneratedField[] | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleSelectTemplate = (templateId: string | null) => {
        setSelectedTemplateId(templateId);

        // If a pre-defined template is selected, load its content
        if (templateId) {
            const selectedTemplate = getTemplateById(templateId);
            if (selectedTemplate) {
                setTemplate(selectedTemplate.template);
            }
        }
        // If null (custom mode), template is managed by TemplateSelector
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputText, template }),
            });

            if (!response.ok) {
                throw new Error('生成報告失敗');
            }

            const data = await response.json();
            setGeneratedContent(data.fields);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('生成報告時發生錯誤，請稍後再試');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedContent) return;

        setIsDownloading(true);
        try {
            const response = await fetch('/api/download-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fields: generatedContent, template }),
            });

            if (!response.ok) {
                throw new Error('下載報告失敗');
            }

            // Get the blob from response
            const blob = await response.blob();

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `現勘報告_${timestamp}.docx`;

            // Download using file-saver
            saveAs(blob, filename);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('下載報告時發生錯誤，請稍後再試');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="max-w-[1800px] mx-auto px-8 py-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        AI 現勘報告生成系統
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        選擇報告模板並輸入現場勘查紀錄，AI 自動產生專業格式報告
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1800px] mx-auto px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-220px)]">
                    {/* Left Panel - Input */}
                    <ReportInputPanel
                        inputText={inputText}
                        setInputText={setInputText}
                        template={template}
                        setTemplate={setTemplate}
                        selectedTemplateId={selectedTemplateId}
                        onSelectTemplate={handleSelectTemplate}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                    />

                    {/* Right Panel - Output */}
                    <ReportOutputPanel
                        generatedContent={generatedContent}
                        template={template}
                        onDownload={handleDownload}
                        isDownloading={isDownloading}
                    />
                </div>
            </div>
        </div>
    );
}
