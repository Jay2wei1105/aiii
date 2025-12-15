"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ChartAnalysisProps {
    className?: string;
}

export default function ChartAnalysis({ className }: ChartAnalysisProps) {
    // Data State
    const [csvData, setCsvData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Settings State
    const [delimiter, setDelimiter] = useState(",");
    const [encoding, setEncoding] = useState("");

    // Chart Configuration
    const [chartType, setChartType] = useState("heatmap");
    const [chartHeight, setChartHeight] = useState(600);
    const [chartWidth, setChartWidth] = useState(1200);

    // Axis & Data Selection
    const [xAxis, setXAxis] = useState("");
    const [yAxis, setYAxis] = useState<string[]>([]);
    const [dateColumn, setDateColumn] = useState("");
    const [valueColumn, setValueColumn] = useState(""); // For heatmap
    const [frequencyColumn, setFrequencyColumn] = useState(""); // For frequency chart

    // Time Filter
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [enableDateFilter, setEnableDateFilter] = useState(true);

    // Advanced Settings
    const [enableOutlierFilter, setEnableOutlierFilter] = useState(false);
    const [iqrMultiplier, setIqrMultiplier] = useState(1.5);
    const [binSize, setBinSize] = useState(10);

    // Heatmap Specific
    const [xAxisUnit, setXAxisUnit] = useState("month");
    const [yAxisUnit, setYAxisUnit] = useState("hour");
    const [colorTheme, setColorTheme] = useState("Jet_r");

    // Plotly Data & Layout
    const [plotData, setPlotData] = useState<any[]>([]);
    const [plotLayout, setPlotLayout] = useState<any>({});

    // Layout Resizing State
    const [leftPanelWidth, setLeftPanelWidth] = useState(300); // Initial width in pixels
    const isResizing = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Helper: Format date for input
    const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Helper: Calculate optimal bin size
    const calculateOptimalBinSize = (data: any[], column: string) => {
        const validData = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
        if (validData.length === 0) return 10;

        const min = Math.min(...validData);
        const max = Math.max(...validData);
        const range = max - min;
        const sturgesBins = 1 + 3.322 * Math.log10(validData.length);

        const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length;
        const variance = validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length;
        const stdDev = Math.sqrt(variance);
        const scottBinWidth = 3.5 * stdDev / Math.pow(validData.length, 1 / 3);

        let calculatedBinSize;
        if (range === 0) {
            calculatedBinSize = 1;
        } else if (!isFinite(scottBinWidth) || scottBinWidth <= 0) {
            calculatedBinSize = range / sturgesBins;
        } else {
            calculatedBinSize = (range / sturgesBins + scottBinWidth) / 2;
        }

        let precision = 3;
        if (range > 1000) precision = 0;
        else if (range > 100) precision = 1;
        else if (range > 10) precision = 2;

        const factor = Math.pow(10, precision);
        calculatedBinSize = Math.round(calculatedBinSize * factor) / factor;

        return Math.max(calculatedBinSize, range / 100);
    };

    // Effect: Auto-calculate bin size
    // Effect: Auto-calculate bin size
    useEffect(() => {
        if (frequencyColumn && csvData.length > 0) {
            const optimal = calculateOptimalBinSize(csvData, frequencyColumn);
            setBinSize(optimal);
        }
    }, [frequencyColumn, csvData]);

    // Effect: Auto-detect date column
    useEffect(() => {
        if (headers.length > 0 && !dateColumn) {
            const dateCol = headers.find((h: string) => {
                if (!h || typeof h !== 'string') return false;
                const lower = h.toLowerCase();
                return lower.includes('date') || lower.includes('time') || lower.includes('日期') || lower.includes('時間');
            });
            if (dateCol) setDateColumn(dateCol);
        }
    }, [headers, dateColumn]);

    // Effect: Set default date range
    useEffect(() => {
        if (dateColumn && csvData.length > 0) {
            try {
                const validDates = csvData
                    .map(row => new Date(row[dateColumn]))
                    .filter(d => !isNaN(d.getTime()))
                    .sort((a, b) => a.getTime() - b.getTime());

                if (validDates.length > 0) {
                    setStartDate(formatDateForInput(validDates[0]));
                    setEndDate(formatDateForInput(validDates[validDates.length - 1]));
                }
            } catch (e) {
                console.error("Error setting date range", e);
            }
        }
    }, [dateColumn, csvData]);

    // Layout Resizing Logic
    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        isResizing.current = true;
    }, []);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
    }, []);

    const resize = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing.current && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = mouseMoveEvent.clientX - containerRect.left;
            if (newWidth > 200 && newWidth < containerRect.width - 200) {
                setLeftPanelWidth(newWidth);
            }
        }
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);


    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setFileSize((file.size / 1024).toFixed(2) + " KB");
        setLoading(true);
        setError(null);

        const fileType = file.name.split('.').pop()?.toLowerCase();

        if (fileType === 'csv') {
            Papa.parse(file, {
                header: true,
                delimiter: delimiter,
                dynamicTyping: true,
                skipEmptyLines: true,
                encoding: encoding || undefined,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        setError(results.errors[0].message);
                        setLoading(false);
                        return;
                    }
                    setCsvData(results.data);
                    setHeaders((results.meta.fields || []).filter(h => h && typeof h === 'string'));
                    setLoading(false);
                },
                error: (err: any) => {
                    setError(err.message);
                    setLoading(false);
                }
            });
        } else if (fileType === 'xlsx' || fileType === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false });

                    if (jsonData.length > 0) {
                        const rawHeaders = jsonData[0] as any[];
                        const headers = rawHeaders.map(h => (h != null ? String(h) : '')).filter(h => h);
                        const rows = jsonData.slice(1).map((row: any) => {
                            const obj: any = {};
                            headers.forEach((h, i) => {
                                obj[h] = row[i] instanceof Date ? row[i].toISOString() : row[i];
                            });
                            return obj;
                        });
                        setHeaders(headers);
                        setCsvData(rows);
                    }
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            setError("不支援的檔案格式");
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        let data = [...csvData];
        if (enableDateFilter && startDate && endDate && dateColumn) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            data = data.filter((row: any) => {
                const d = new Date(row[dateColumn]);
                return !isNaN(d.getTime()) && d >= start && d <= end;
            });
        }
        return data;
    };

    // Helper: Calculate Quantile
    const quantile = (arr: number[], q: number) => {
        const sorted = arr.slice().sort((a, b) => a - b);
        const pos = (sorted.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sorted[base + 1] !== undefined) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        } else {
            return sorted[base];
        }
    };

    // Helper: Filter Outliers using IQR
    const filterOutliersIQR = (data: any[], xAxisColumn: string, yAxisColumns: string[], multiplier: number) => {
        let filteredData = [...data];
        yAxisColumns.forEach(yAxisColumn => {
            const yValues = filteredData.map((row: any) => parseFloat(row[yAxisColumn]));
            const validYValues = yValues.filter((val: number) => !isNaN(val)).sort((a: number, b: number) => a - b);
            if (validYValues.length <= 2) return;

            const q1 = quantile(validYValues, 0.25);
            const q3 = quantile(validYValues, 0.75);
            const iqr = q3 - q1;
            const lowerBound = q1 - multiplier * iqr;
            const upperBound = q3 + multiplier * iqr;

            filteredData = filteredData.filter((row: any, index: number) => {
                const yValue = parseFloat(row[yAxisColumn]);
                return isNaN(yValue) || (yValue >= lowerBound && yValue <= upperBound);
            });
        });
        return filteredData;
    };

    // Helper: Polynomial Regression
    const calculatePolynomialRegression = (xValues: number[], yValues: number[]) => {
        const validPairs = xValues.map((x, i) => ({ x, y: yValues[i] })).filter(p => !isNaN(p.x) && !isNaN(p.y));
        if (validPairs.length < 3) return null;

        const n = validPairs.length;
        let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
        let sumY = 0, sumXY = 0, sumX2Y = 0;

        for (const p of validPairs) {
            const x = p.x;
            const y = p.y;
            const x2 = x * x;
            sumX += x; sumX2 += x2; sumX3 += x2 * x; sumX4 += x2 * x2;
            sumY += y; sumXY += x * y; sumX2Y += x2 * y;
        }

        const d = n * (sumX2 * sumX4 - sumX3 * sumX3) - sumX * (sumX * sumX4 - sumX3 * sumX2) + sumX2 * (sumX * sumX3 - sumX2 * sumX2);
        const d1 = sumY * (sumX2 * sumX4 - sumX3 * sumX3) - sumX * (sumXY * sumX4 - sumX3 * sumX2Y) + sumX2 * (sumXY * sumX3 - sumX2 * sumX2Y);
        const d2 = n * (sumXY * sumX4 - sumX3 * sumX2Y) - sumY * (sumX * sumX4 - sumX3 * sumX2) + sumX2 * (sumX * sumX2Y - sumXY * sumX2);
        const d3 = n * (sumX2 * sumX2Y - sumXY * sumX3) - sumX * (sumX * sumX2Y - sumXY * sumX2) + sumY * (sumX * sumX3 - sumX2 * sumX2);

        if (Math.abs(d) < 1e-9) return null;

        const c = d1 / d;
        const b = d2 / d;
        const a = d3 / d;

        const meanY = sumY / n;
        let totalVariation = 0;
        let residualVariation = 0;
        validPairs.forEach(p => {
            const pred = a * p.x * p.x + b * p.x + c;
            totalVariation += Math.pow(p.y - meanY, 2);
            residualVariation += Math.pow(p.y - pred, 2);
        });
        const rSquared = 1 - (residualVariation / totalVariation);

        const xMin = Math.min(...validPairs.map(p => p.x));
        const xMax = Math.max(...validPairs.map(p => p.x));
        const step = (xMax - xMin) / 100;
        const points = [];
        for (let x = xMin; x <= xMax; x += step) {
            points.push({ x, y: a * x * x + b * x + c });
        }

        return { a, b, c, rSquared, points };
    };

    const generateChart = () => {
        if (csvData.length === 0) return;
        setLoading(true);

        try {
            let data = getFilteredData();
            if (data.length === 0) {
                alert("選定的時間範圍內沒有數據");
                setLoading(false);
                return;
            }

            // Apply Outlier Filter if enabled
            if (enableOutlierFilter && !['heatmap', 'frequency'].includes(chartType)) {
                data = filterOutliersIQR(data, xAxis, yAxis, iqrMultiplier);
            }

            let traces: any[] = [];
            let layout: any = {
                title: '數據分析',
                autosize: true,
                showlegend: true,
                margin: { l: 70, r: 50, b: 50, t: 80, pad: 4 },
                legend: { x: 1.1, y: 1 }
            };

            if (chartType === 'heatmap') {
                if (!valueColumn || !dateColumn) {
                    alert("請選擇數值欄位和時間欄位");
                    setLoading(false);
                    return;
                }

                const xLabels = xAxisUnit === 'month' ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] :
                    xAxisUnit === 'weekday' ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] :
                        Array.from({ length: 31 }, (_, i) => `${i + 1}日`);

                const yLabels = yAxisUnit === 'hour' ? Array.from({ length: 24 }, (_, i) => `${i}:00`) :
                    yAxisUnit === 'weekday' ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] :
                        yAxisUnit === 'month' ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] :
                            Array.from({ length: 31 }, (_, i) => `${i + 1}日`);

                const zValues = Array.from({ length: yLabels.length }, () => Array.from({ length: xLabels.length }, () => [] as number[]));

                data.forEach((row: any) => {
                    const date = new Date(row[dateColumn]);
                    const val = parseFloat(row[valueColumn]);
                    if (isNaN(date.getTime()) || isNaN(val)) return;

                    let xIdx = xAxisUnit === 'month' ? date.getMonth() :
                        xAxisUnit === 'weekday' ? date.getDay() :
                            date.getDate() - 1;

                    let yIdx = yAxisUnit === 'hour' ? date.getHours() :
                        yAxisUnit === 'weekday' ? date.getDay() :
                            yAxisUnit === 'month' ? date.getMonth() :
                                date.getDate() - 1;

                    if (zValues[yIdx] && zValues[yIdx][xIdx]) {
                        zValues[yIdx][xIdx].push(val);
                    }
                });

                const zValuesAvg = zValues.map(row => row.map(cell => cell.length ? cell.reduce((a, b) => a + b, 0) / cell.length : null));

                let colorscale: any;
                switch (colorTheme) {
                    case 'YlOrRd': colorscale = 'YlOrRd'; break;
                    case 'RdBu_r': colorscale = 'RdBu'; break;
                    case 'Jet_r': colorscale = [
                        [0, 'rgb(0,0,128)'], [0.25, 'rgb(0,255,255)'],
                        [0.5, 'rgb(0,255,0)'], [0.75, 'rgb(255,255,0)'], [1, 'rgb(255,0,0)']
                    ]; break;
                    case 'Viridis': colorscale = 'Viridis'; break;
                    default: colorscale = 'Jet';
                }

                traces = [{
                    z: zValuesAvg,
                    x: xLabels,
                    y: yLabels,
                    type: 'heatmap',
                    colorscale: colorscale,
                    colorbar: { title: valueColumn },
                    hoverongaps: false,
                    hovertemplate: '%{y} - %{x}<br>%{z:.2f}<extra></extra>'
                }];

                layout.title = `空調運轉分析熱力圖 (${valueColumn})`;
                layout.xaxis = { title: xAxisUnit === 'month' ? '月份' : xAxisUnit === 'weekday' ? '星期' : '日期' };
                layout.yaxis = { title: yAxisUnit === 'hour' ? '小時' : yAxisUnit === 'weekday' ? '星期' : yAxisUnit === 'month' ? '月份' : '日期', autorange: 'reversed' };

            } else if (chartType === 'frequency') {
                if (!frequencyColumn) {
                    alert("請選擇分析欄位");
                    setLoading(false);
                    return;
                }
                const values = data.map((r: any) => parseFloat(r[frequencyColumn])).filter((v: number) => !isNaN(v));
                if (values.length === 0) {
                    alert("沒有有效的數據");
                    setLoading(false);
                    return;
                }

                const min = Math.floor(Math.min(...values));
                const max = Math.ceil(Math.max(...values));
                const bins = [];
                for (let i = min; i <= max + binSize; i += binSize) {
                    bins.push(i);
                }

                const frequencies = new Array(bins.length - 1).fill(0);
                values.forEach((val: number) => {
                    const binIndex = Math.floor((val - min) / binSize);
                    if (binIndex >= 0 && binIndex < frequencies.length) {
                        frequencies[binIndex]++;
                    }
                });

                const total = frequencies.reduce((a, b) => a + b, 0);
                let cumSum = 0;
                const cumulativePercentages = frequencies.map(freq => {
                    cumSum += freq;
                    return (cumSum / total) * 100;
                });

                // Trace 1: Frequency Bar
                traces.push({
                    x: bins.slice(0, -1).map(val => val.toFixed(1)),
                    y: frequencies,
                    type: 'bar',
                    name: '頻次',
                    text: frequencies.map(String),
                    textposition: 'outside',
                    marker: {
                        color: 'rgba(58, 130, 238, 0.85)',
                        line: { color: 'rgba(8, 48, 107, 0.85)', width: 1.5 }
                    }
                });

                // Trace 2: Cumulative Percentage Line
                traces.push({
                    x: bins.slice(0, -1).map(val => val.toFixed(1)),
                    y: cumulativePercentages,
                    type: 'scatter',
                    mode: 'lines+markers+text',
                    name: '累積百分比',
                    text: cumulativePercentages.map(val => val.toFixed(1) + '%'),
                    textposition: 'top center',
                    yaxis: 'y2',
                    line: { color: 'rgba(255, 127, 14, 1)', width: 3 },
                    marker: { color: 'rgba(255, 255, 255, 1)', size: 10, line: { color: 'rgba(255, 127, 14, 1)', width: 2 } }
                });

                layout.title = `頻次分佈圖 (${frequencyColumn})`;
                layout.xaxis = { title: frequencyColumn };
                layout.yaxis = { title: '頻次', gridcolor: 'rgba(200, 200, 200, 0.3)' };
                layout.yaxis2 = {
                    title: '累積百分比 (%)',
                    overlaying: 'y',
                    side: 'right',
                    range: [0, 110],
                    showgrid: false,
                    titlefont: { color: 'rgba(255, 127, 14, 1)' },
                    tickfont: { color: 'rgba(255, 127, 14, 1)' }
                };
                layout.margin.r = 100; // Extra margin for secondary axis

            } else {
                // General Charts (Line, Scatter, Bar, Box)
                if (!xAxis && chartType !== 'box') { // Box plot can work without X (just distribution of Y)
                    alert("請選擇 X 軸");
                    setLoading(false);
                    return;
                }
                if (yAxis.length === 0) {
                    alert("請選擇 Y 軸");
                    setLoading(false);
                    return;
                }

                yAxis.forEach((yCol, idx) => {
                    const color = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'][idx % 5];

                    if (chartType === 'box') {
                        // Box Plot Logic
                        if (xAxis) {
                            // Group by X
                            const groupedData: { [key: string]: number[] } = {};
                            data.forEach((row: any) => {
                                const xVal = row[xAxis];
                                const yVal = parseFloat(row[yCol]);
                                if (!isNaN(yVal)) {
                                    if (!groupedData[xVal]) groupedData[xVal] = [];
                                    groupedData[xVal].push(yVal);
                                }
                            });

                            Object.keys(groupedData).sort().forEach(key => {
                                traces.push({
                                    y: groupedData[key],
                                    type: 'box',
                                    name: `${yCol} - ${key}`,
                                    boxmean: true,
                                    marker: { color: color }
                                });
                            });
                        } else {
                            // Single Box
                            const yVals = data.map((r: any) => parseFloat(r[yCol])).filter((v: number) => !isNaN(v));
                            traces.push({
                                y: yVals,
                                type: 'box',
                                name: yCol,
                                boxmean: true,
                                marker: { color: color }
                            });
                        }

                    } else {
                        // Line, Scatter, Bar
                        const xVals = data.map((r: any) => r[xAxis]);
                        const yVals = data.map((r: any) => parseFloat(r[yCol]));

                        let trace: any = {
                            x: xVals,
                            y: yVals,
                            name: yCol,
                            marker: { color: color }
                        };

                        switch (chartType) {
                            case 'line': trace.type = 'scatter'; trace.mode = 'lines+markers'; break;
                            case 'scatter': trace.type = 'scatter'; trace.mode = 'markers'; break;
                            case 'bar': trace.type = 'bar'; break;
                            case 'stackedBar': trace.type = 'bar'; layout.barmode = 'stack'; break;
                            case 'groupedBar': trace.type = 'bar'; layout.barmode = 'group'; break;
                        }
                        traces.push(trace);

                        // Polynomial Regression for Scatter
                        if (chartType === 'scatter') {
                            const regression = calculatePolynomialRegression(xVals.map((x: any) => parseFloat(x)), yVals);
                            if (regression) {
                                const equation = `y = ${regression.a.toFixed(4)}x² + ${regression.b.toFixed(4)}x + ${regression.c.toFixed(4)}`;
                                const rSquared = `R² = ${regression.rSquared.toFixed(4)}`;
                                traces.push({
                                    x: regression.points.map(p => p.x),
                                    y: regression.points.map(p => p.y),
                                    type: 'scatter',
                                    mode: 'lines',
                                    name: `${yCol} 回歸線<br><span style="font-size:0.8em">${equation}<br>${rSquared}</span>`,
                                    line: { color: color, width: 2, dash: 'dash' }
                                });
                            }
                        }
                    }
                });

                layout.xaxis = { title: xAxis || '數據系列', automargin: true };
                layout.yaxis = { title: '數值' };
            }

            setPlotData(traces);
            setPlotLayout(layout);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={containerRef} className={`flex h-full w-full ${className} relative`}>
            {/* Left Panel: Controls */}
            <div style={{ width: leftPanelWidth }} className="flex-shrink-0 h-full overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-6 pb-6">
                    {/* Data Input */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-4 text-slate-800">資料輸入</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">選擇檔案</label>
                                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#0085CA] hover:file:bg-blue-100" />
                                {fileName && <p className="text-xs text-slate-500 mt-1">{fileName} ({fileSize})</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">分隔符</label>
                                    <select value={delimiter} onChange={e => setDelimiter(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                        <option value=",">逗號 (,)</option>
                                        <option value=";">分號 (;)</option>
                                        <option value="\t">Tab</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">編碼</label>
                                    <select value={encoding} onChange={e => setEncoding(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                        <option value="">自動</option>
                                        <option value="UTF-8">UTF-8</option>
                                        <option value="Big5">Big5</option>
                                    </select>
                                </div>
                            </div>

                            {headers.length > 0 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">時間欄位</label>
                                        <select value={dateColumn} onChange={e => setDateColumn(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                            <option value="">請選擇時間欄位</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {dateColumn && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" checked={enableDateFilter} onChange={e => setEnableDateFilter(e.target.checked)} id="enableDate" className="rounded border-slate-300 text-[#0085CA] focus:ring-[#0085CA]" />
                                                <label htmlFor="enableDate" className="text-sm text-slate-600">啟用日期篩選</label>
                                            </div>
                                            {enableDateFilter && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]" />
                                                    <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Chart Settings */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-4 text-slate-800">圖表設定</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">圖表類型</label>
                                <select value={chartType} onChange={e => setChartType(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                    <option value="heatmap">熱力圖</option>
                                    <option value="frequency">頻次圖</option>
                                    <option value="line">曲線圖</option>
                                    <option value="scatter">散佈圖</option>
                                    <option value="bar">柱狀圖</option>
                                    <option value="stackedBar">堆疊柱狀圖</option>
                                    <option value="groupedBar">分組柱狀圖</option>
                                    <option value="box">箱形圖</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">寬度</label>
                                    <input type="number" value={chartWidth} onChange={e => setChartWidth(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">高度</label>
                                    <input type="number" value={chartHeight} onChange={e => setChartHeight(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]" />
                                </div>
                            </div>

                            {/* Dynamic Settings based on Chart Type */}
                            {chartType === 'heatmap' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">數值欄位</label>
                                        <select value={valueColumn} onChange={e => setValueColumn(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                            <option value="">請選擇數值</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">X軸單位</label>
                                            <select value={xAxisUnit} onChange={e => setXAxisUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                                <option value="month">月份</option>
                                                <option value="weekday">星期</option>
                                                <option value="day">日期</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Y軸單位</label>
                                            <select value={yAxisUnit} onChange={e => setYAxisUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                                <option value="hour">小時</option>
                                                <option value="weekday">星期</option>
                                                <option value="day">日期</option>
                                                <option value="month">月份</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">配色主題</label>
                                        <select value={colorTheme} onChange={e => setColorTheme(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                            <option value="Jet_r">彩虹漸變 (Jet)</option>
                                            <option value="YlOrRd">黃紅漸變</option>
                                            <option value="RdBu_r">藍紅漸變</option>
                                            <option value="Viridis">綠藍漸變 (Viridis)</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {chartType === 'frequency' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">分析欄位</label>
                                        <select value={frequencyColumn} onChange={e => setFrequencyColumn(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                            <option value="">請選擇欄位</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">區間大小 (Bin Size)</label>
                                        <input type="number" value={binSize} onChange={e => setBinSize(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]" />
                                    </div>
                                </>
                            )}

                            {!['heatmap', 'frequency'].includes(chartType) && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">X 軸</label>
                                        <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                            <option value="">請選擇 X 軸</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Y 軸</label>
                                        <select multiple value={yAxis} onChange={e => setYAxis(Array.from(e.target.selectedOptions, option => option.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm h-32 text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]">
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={enableOutlierFilter} onChange={e => setEnableOutlierFilter(e.target.checked)} id="enableOutlier" className="rounded border-slate-300 text-[#0085CA] focus:ring-[#0085CA]" />
                                            <label htmlFor="enableOutlier" className="text-sm text-slate-600">過濾離群值</label>
                                        </div>
                                        {enableOutlierFilter && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">IQR 倍數</label>
                                                <input type="number" step="0.1" value={iqrMultiplier} onChange={e => setIqrMultiplier(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:border-[#0085CA] focus:ring-1 focus:ring-[#0085CA]" />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <button onClick={generateChart} disabled={loading || csvData.length === 0} className="w-full bg-[#0085CA] hover:bg-[#006699] text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? "處理中..." : "載入數據"}
                            </button>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resizer */}
            <div
                className="w-1 bg-slate-200 hover:bg-[#0085CA] cursor-col-resize transition-colors flex flex-col justify-center items-center group"
                onMouseDown={startResizing}
            >
                <div className="h-8 w-1 bg-slate-400 rounded-full group-hover:bg-[#0085CA]"></div>
            </div>

            {/* Right Panel: Chart */}
            <div className="flex-1 h-full pl-2 min-w-0 overflow-hidden">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 h-full flex flex-col">
                    <div className="flex-1 w-full relative">
                        {plotData.length > 0 ? (
                            <Plot
                                data={plotData}
                                layout={{
                                    ...plotLayout,
                                    width: undefined, // Let it be responsive
                                    height: undefined,
                                    autosize: true
                                }}
                                style={{ width: '100%', height: '100%' }}
                                useResizeHandler={true}
                                config={{ responsive: true, displayModeBar: true }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-lg font-medium">請匯入資料並點擊載入數據</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
