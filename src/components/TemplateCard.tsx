'use client';

import React, { useState } from 'react';
import { ReportTemplate } from '@/data/reportTemplates';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import TemplatePreviewModal from './TemplatePreviewModal';

interface TemplateCardProps {
    template: ReportTemplate;
    isSelected: boolean;
    onSelect: (template: ReportTemplate) => void;
}

export default function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
    const [showPreview, setShowPreview] = useState(false);

    // Dynamically get icon component
    const IconComponent = (Icons[template.icon as keyof typeof Icons] as LucideIcon) || Icons.FileText;

    const handlePreviewClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection when clicking preview
        setShowPreview(true);
    };

    return (
        <>
            <button
                onClick={() => onSelect(template)}
                className={`
          relative flex flex-col items-center justify-between
          w-full h-36 rounded-xl p-4
          transition-all duration-200
          ${isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20'
                        : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }
          hover:scale-105 hover:shadow-xl
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        `}
                aria-pressed={isSelected}
                aria-label={`選擇 ${template.name}`}
            >
                {/* Icon */}
                <div className={`
          mb-2 p-2 rounded-lg
          ${isSelected
                        ? 'bg-emerald-100 dark:bg-emerald-900/50'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }
        `}>
                    <IconComponent
                        className={`
              w-6 h-6
              ${isSelected
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }
            `}
                    />
                </div>

                {/* Template Name */}
                <h3 className={`
          text-sm font-semibold text-center mb-3
          ${isSelected
                        ? 'text-emerald-900 dark:text-emerald-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }
        `}>
                    {template.name}
                </h3>

                {/* Preview Button */}
                <button
                    onClick={handlePreviewClick}
                    className={`
            w-full py-1 px-2 text-xs font-medium rounded
            transition-all duration-150
            ${isSelected
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }
          `}
                >
                    <Icons.Eye className="w-3 h-3 inline mr-1" />
                    預覽
                </button>

                {/* Selected Indicator */}
                {isSelected && (
                    <div className="absolute top-2 right-2">
                        <Icons.CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                )}
            </button>

            {/* Preview Modal */}
            <TemplatePreviewModal
                template={template}
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
            />
        </>
    );
}
