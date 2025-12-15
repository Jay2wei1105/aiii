"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh-TW';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
    'en': {
        'nav.news': 'News',
        'nav.prompt': 'Prompt',
        'nav.chart': 'Chart',
        'nav.tools': 'Tools',
        'nav.skills': 'Skills',
        'chart.simple': 'Simple View',
        'chart.advanced': 'Advanced Analysis',
        'chart.upload': 'Uploaded Files',
        'chart.noFiles': 'No files uploaded yet',
        'chart.analysis': 'Chart Analysis',
        'chart.loadData': 'Load Data',
        'chart.processing': 'Processing...',
        'chart.input': 'Data Input',
        'chart.settings': 'Chart Settings',
        'chart.display': 'Chart Display',
        'chart.selectFile': 'Select File',
        'chart.delimiter': 'Delimiter',
        'chart.encoding': 'Encoding',
        'chart.dateColumn': 'Time Column',
        'chart.enableDateFilter': 'Enable Date Filter',
        'chart.chartType': 'Chart Type',
        'chart.width': 'Width',
        'chart.height': 'Height',
        'chart.valueColumn': 'Value Column',
        'chart.xAxisUnit': 'X Axis Unit',
        'chart.yAxisUnit': 'Y Axis Unit',
        'chart.colorTheme': 'Color Theme',
        'chart.analysisColumn': 'Analysis Column',
        'chart.binSize': 'Bin Size',
        'chart.xAxis': 'X Axis',
        'chart.yAxis': 'Y Axis',
        'chart.enableOutlier': 'Enable Outlier Filter',
        'chart.iqrMultiplier': 'IQR Multiplier',
        'chart.generate': 'Generate Chart',
        'chart.export': 'Export Chart',
        'chart.reset': 'Reset Zoom',
    },
    'zh-TW': {
        'nav.news': '最新消息',
        'nav.prompt': '提示庫',
        'nav.chart': '圖表分析',
        'nav.tools': 'AI 工具',
        'nav.skills': '技能樹',
        'chart.simple': '簡易檢視',
        'chart.advanced': '進階分析',
        'chart.upload': '已上傳檔案',
        'chart.noFiles': '尚未上傳檔案',
        'chart.analysis': '圖表分析',
        'chart.loadData': '載入資料',
        'chart.processing': '處理中...',
        'chart.input': '資料輸入',
        'chart.settings': '圖表設定',
        'chart.display': '圖表顯示區',
        'chart.selectFile': '選擇檔案',
        'chart.delimiter': '分隔符',
        'chart.encoding': '編碼',
        'chart.dateColumn': '時間欄位',
        'chart.enableDateFilter': '啟用時間過濾',
        'chart.chartType': '圖表類型',
        'chart.width': '寬度',
        'chart.height': '高度',
        'chart.valueColumn': '數值欄位',
        'chart.xAxisUnit': 'X 軸單位',
        'chart.yAxisUnit': 'Y 軸單位',
        'chart.colorTheme': '顏色主題',
        'chart.analysisColumn': '分析欄位',
        'chart.binSize': 'Bin 尺寸',
        'chart.xAxis': 'X 軸',
        'chart.yAxis': 'Y 軸 (多選)',
        'chart.enableOutlier': '啟用離群值過濾',
        'chart.iqrMultiplier': 'IQR 乘數',
        'chart.generate': '生成圖表',
        'chart.export': '匯出圖表',
        'chart.reset': '重置縮放',
    }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('zh-TW');

    const t = (key: string) => {
        return (translations[language] as any)[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
