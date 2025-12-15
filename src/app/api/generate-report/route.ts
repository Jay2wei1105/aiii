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
- **節能方案**務必依照「現況問題」、「改善對策」、「效益試算」分段詳細論述，內容要豐富完整。
- **綜合效益分析** (Section 5) 必須使用 **Markdown 表格** 呈現，包含欄位：方案名稱、投資額、年效益、回收年限。
- 語氣必須專業、肯定，避免模稜兩可。

## JSON 輸出範例

{
  "1. 客戶基本資料": "本報告針對**宏大精密塑膠工業股份有限公司**（位於台中市工業區）之射出成型廠區進行能源診斷...",
  "2. 能源使用現況分析": "### 2.1 整體用電概況\\n\\n- **契約容量**：1,200 kW\\n- **年度總用電量**：約 5,760,000 kWh\\n- **年度電費**：約 2,208 萬元\\n- **平均電價**：約 3.83 元/kWh\\n\\n### 2.2 主要設備現況\\n**空調系統**：200RT螺旋式冰水主機，冷齡18年...",
  "3. 節能改善建議方案": "### 方案一：空壓機系統變頻改善\\n\\n**1. 現況問題分析**\\n目前使用 100HP 定頻空壓機，卸載運轉時間過長（約 30%），造成無謂的電力浪費。\\n\\n**2. 改善對策說明**\\n建議導入 IE4 高效率變頻空壓機，配合變頻控制技術，可穩定管網壓力並消除卸載損耗。\\n\\n**3. 效益試算**\\n- **預估年節電量**：約 300,000 kWh/年\\n- **預估年節費**：約 115 萬元/年\\n- **預估投資金額**：約 120 萬元\\n- **回收年限**：約 1.1 年\\n- **減碳量**：約 150 公噸 CO2e/年",
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
            model: 'gpt-5-mini',
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
