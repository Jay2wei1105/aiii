import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { inputText, template } = await req.json();

        if (!inputText || !template) {
            return NextResponse.json(
                { error: '請提供現勘紀錄和報告模板' },
                { status: 400 }
            );
        }

        console.log('[API] Template structure:', template.substring(0, 200));

        // New approach: Use template as structure guide, not field extraction
        const systemPrompt = `你是專業的能源管理顧問與節能報告撰寫專家。

## 核心任務
根據現場勘查紀錄和報告結構要求，生成完整、專業、可交付客戶的節能診斷報告。

## 輸出格式要求 (CRITICAL)
1. **整體回應必須是 Valid JSON**
2. **JSON 的 Value 必須是「Markdown 格式的 String」**
3. ❌ **嚴禁**在 Value 字串中包含 JSON 語法 (如 {"analysis": "..."})
4. ✅ 此內容將直接顯示於網頁，請善用 Markdown (###, **, -, >) 排版

## 撰寫原則

### 1. 數據智慧推算
當現勘紀錄缺少具體數據時，根據以下規則推算：

**電力數據**：
- 年度用電量 = 契約容量(kW) × 使用率(0.6-0.8) × 運轉時數 × 工作天數
- 年度電費 = 用電量 × 平均電價(工業約3.5-4.5元/kWh)

**設備能耗佔比**（工業廠推估）：
- 空調：25-35%
- 空壓：15-25%
- 製程：40-55%
- 照明：5-10%

### 2. 內容品質要求

**節能方案撰寫規範**（每個方案必須包含以下三大段落）：

**1️⃣ 現況問題分析**（至少 150 字）  
必須包含：
- 設備規格與現況（型號、容量、使用年限、運轉時數）
- 具體問題描述（效率衰退、能耗過高、操作不當等）
- 數據佐證（實測數據、能耗佔比、損耗估算）
- 問題影響（能源浪費金額、碳排放、設備壽命）

**2️⃣ 改善對策說明**（至少 200 字）  
必須包含：
- **主要方案**：技術原理、設備規格、預期效果
- **替代方案**：至少提出 1-2 種其他可行方案，並比較優劣
- 實施步驟與時程規劃
- 技術可行性分析
- 搭配措施（如：控制策略優化、操作流程改善）

**3️⃣ 效益試算**（必須詳細計算）  
必須包含：
- 節電量計算公式與過程
- 年節費試算（含電價假設）
- 投資成本明細
- 回收年限計算
- 減碳量估算
- 其他附加效益（如：維護成本降低、生產品質提升）

**其他要求**：
- **綜合效益分析** (Section 5) 必須使用 **Markdown 表格** 呈現，包含欄位：方案名稱、投資額、年效益、回收年限。
- 語氣必須專業、肯定，避免模稜兩可。
- 每個方案總字數應達 500 字以上，內容要有深度與專業度。

## JSON 輸出範例

{
  "1. 客戶基本資料": "本報告針對**宏大精密塑膠工業股份有限公司**（位於台中市工業區）之射出成型廠區進行能源診斷...",
  "2. 能源使用現況分析": "### 2.1 整體用電概況\\n\\n- **契約容量**：1,200 kW\\n- **年度總用電量**：約 5,760,000 kWh\\n- **年度電費**：約 2,208 萬元\\n- **平均電價**：約 3.83 元/kWh\\n\\n### 2.2 主要設備現況\\n**空調系統**：200RT螺旋式冰水主機，冷齡18年...",
  "3. 節能改善建議方案": "### 方案一：空壓機系統變頻改善\\n\\n**1. 現況問題分析**\\n\\n本廠目前使用兩台 100HP 定頻螺旋式空壓機（品牌：復盛 SA-100A，使用年限 12 年），供應全廠 7 kg/cm² 壓縮空氣需求。現場勘查發現以下問題：\\n\\n- **卸載運轉時間過長**：透過電力監測發現，空壓機每小時卸載時間達 18 分鐘（佔比約 30%），卸載時仍耗用滿載功率的 25-30%，造成每年約 20 萬度無謂電力浪費。\\n- **管路洩漏嚴重**：以超音波洩漏檢測儀檢查，發現管路系統洩漏率約 15-20%，相當於每年浪費約 25 萬度電。\\n- **壓力設定過高**：目前出口壓力設定 8.5 kg/cm²，但實際製程僅需 7 kg/cm²，過高壓力使能耗增加約 7-10%。\\n- **能源浪費成本**：上述問題合計每年浪費電費約 173 萬元（以平均電價 3.85 元/kWh 計），並額外排放約 225 公噸 CO2e。\\n\\n**2. 改善對策說明**\\n\\n**主要方案：變頻空壓機+管路優化**\\n- 汰換為 IE4 高效率永磁變頻空壓機（如：Hitachi DSP-100VW 或同等品），搭載智慧變頻控制系統，可依實際用氣量自動調整轉速，消除卸載損耗。\\n- 進行全廠管路洩漏修復，預估可降低洩漏率至 5% 以下。\\n- 優化壓力設定至 7.2 kg/cm²（含 0.2 kg/cm² 安全餘裕），降低無謂能耗。\\n- 加裝儲氣桶（2.0 m³）穩定供氣壓力，減少空壓機啟停頻率。\\n\\n**替代方案比較**：\\n- **方案 A**：僅加裝變頻器於現有機台 → 節電率約 15-20%，但設備老舊效率仍差，投資報酬率較低。\\n- **方案 B**：採用兩段壓力系統 → 適合用氣壓力差異大的場域，本廠需求單一，不適用。\\n- **建議方案**：全機汰換+管路優化，節能效果最佳且可同步改善供氣穩定性。\\n\\n**實施步驟**：\\n1. 第 1 個月：完成設備採購與管路洩漏修復\\n2. 第 2 個月：安裝新機並進行系統整合測試\\n3. 第 3 個月：原機台備用，監測新系統運轉效能\\n\\n**3. 效益試算**\\n\\n**節電量計算**：\\n- 變頻控制節電：100HP × 0.746 × 30% (卸載比) × 70% (節省率) × 6,000 hr/yr = 93,996 kWh/yr\\n- 洩漏修復節電：100HP × 0.746 × 15% × 6,000 hr/yr = 67,140 kWh/yr\\n- 壓力優化節電：100HP × 0.746 × 8% × 6,000 hr/yr = 35,808 kWh/yr\\n- **總節電量**：約 197,000 kWh/yr\\n\\n**經濟效益**：\\n- 年節省電費：197,000 kWh × 3.85 元/kWh = 758,450 元/年\\n- 維護成本降低：約 10 萬元/年（變頻機保養簡易）\\n- **總年效益**：約 86 萬元\\n\\n**投資成本**：\\n- 變頻空壓機：120 萬元\\n- 管路修復：15 萬元\\n- 儲氣桶+配管：10 萬元\\n- **總投資**：145 萬元\\n\\n**投資回報**：145 萬 ÷ 86 萬 = **1.7 年**\\n\\n**減碳效益**：197,000 kWh × 0.509 kg CO2e/kWh = **100 公噸 CO2e/年**\\n\\n**其他效益**：\\n- 供氣穩定性提升，降低製程不良率\\n- 設備噪音由 85 dB 降至 75 dB，改善工作環境\\n- 延長設備壽命，降低故障風險",
  "4. 總結與建議": "### 5.1 各方案效益彙總表\\n\\n| 方案名稱 | 預估投資額(萬) | 預估年效益(萬) | 回收年限(年) | 減碳量(噸/年) |\\n| :--- | :---: | :---: | :---: | :---: |\\n| 空壓機變頻 | 120 | 115 | 1.1 | 150 |\\n| 冰機汰換 | 300 | 120 | 2.5 | 160 |\\n| **總計** | **420** | **235** | **1.8** | **310** |\\n\\n### 5.2 綜合評估\\n本廠節能潛力巨大，建議優先執行回收年限短之空壓機改善案..."
}`;

        const userPrompt = `請根據以下現場勘查紀錄，生成專業的節能診斷報告。

現場勘查紀錄：
${inputText}

---

報告結構要求：
${template}

---

**重要提醒**：
1. 輸出必須是純 JSON 格式
2. JSON 的 key 必須是報告中的 ## 標題（如："1. 客戶基本資料"）
3. 每個 key 的內容必須完整且專業
4. 缺失的數據請根據業界標準合理推算
5. 禁止在內容中留下空白或「無法生成」字樣

請立即以 JSON 格式回應：`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const responseText = completion.choices[0].message.content;
        if (!responseText) {
            throw new Error('AI 未返回內容');
        }

        console.log('[API] Raw AI response length:', responseText.length);

        const generatedData = JSON.parse(responseText);
        const sectionNames = Object.keys(generatedData);

        console.log('[API] Generated sections:', sectionNames);

        // Format response asections array
        // Format response asections array
        const sections: { name: string, content: string }[] = [];

        sectionNames.forEach(name => {
            const value = generatedData[name];

            if (typeof value === 'object' && value !== null) {
                // If the value is an object (nested sections), verify if it's just keys/values
                // We'll flatten it by joining sub-keys as headers
                const subContent = Object.entries(value)
                    .map(([subKey, subValue]) => `### ${subKey}\n\n${typeof subValue === 'string' ? subValue : JSON.stringify(subValue)}`)
                    .join('\n\n');

                sections.push({
                    name,
                    content: subContent
                });
            } else {
                sections.push({
                    name,
                    content: String(value)
                });
            }
        });

        console.log('[API] Total sections generated:', sections.length);

        return NextResponse.json({
            sections,
            rawData: generatedData,
        });
    } catch (error) {
        console.error('[API] Error generating report:', error);
        return NextResponse.json(
            { error: '生成報告時發生錯誤，請檢查控制台日誌' },
            { status: 500 }
        );
    }
}
