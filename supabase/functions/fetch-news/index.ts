
import { createClient } from 'jsr:@supabase/supabase-js@2'
import Parser from 'npm:rss-parser';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const openAiApiKey = Deno.env.get('OPENAI_API_KEY');

        if (!openAiApiKey) throw new Error('Missing OPENAI_API_KEY');

        const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
        const parser = new Parser();

        // Fetch RSS sources from database (Should be only Inoreader now)
        console.log('Fetching enabled RSS sources from database...');
        const { data: rssSources, error: sourcesError } = await supabase
            .from('rss_sources')
            .select('*')
            .eq('enabled', true);

        if (sourcesError) {
            throw new Error(`Failed to fetch RSS sources: ${sourcesError.message}`);
        }

        if (!rssSources || rssSources.length === 0) {
            return new Response(JSON.stringify({ message: 'No enabled RSS sources found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        let allItems = [];
        try {
            for (const source of rssSources) {
                console.log(`Fetching: ${source.name} (${source.url})`);
                const feedRes = await fetch(source.url);
                const feed = await parser.parseString(await feedRes.text());

                for (const item of feed.items) {
                    allItems.push({
                        ...item,
                        sourceName: source.name,
                    });
                }
            }
        } catch (e) {
            throw new Error(`RSS Parse Failed: ${e.message}`);
        }

        // Filter duplicates by checking existing links
        const links = allItems.map(i => i.link);
        if (links.length > 0) {
            const { data: existingData } = await supabase.from('news').select('source').in('source', links);
            const existingLinks = new Set(existingData?.map(d => d.source) || []);
            allItems = allItems.filter(item => !existingLinks.has(item.link));
        }

        if (allItems.length === 0) {
            return new Response(JSON.stringify({ message: 'No new items.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }

        // Process new unique items (Limit to 50 for safety/speed)
        const itemsToProcess = allItems.slice(0, 50);
        const newNewsEntries = [];

        console.log(`Processing ${itemsToProcess.length} new items...`);

        for (const item of itemsToProcess) {
            let analysis = {
                tag: '節能',
                tag_variant: 'General'
            };

            // AI Analysis: Generate tags from Title
            try {
                const prompt = `
你是一個新聞分類助手。請根據以下標題，判斷其屬於哪一個標籤 (Tag)。
標題：${item.title}

請從以下標籤中選擇最合適的一個：
"再生能源" (包含太陽能、風能、綠電等)
"節能" (包含ESG、減碳、能源效率、電動車等)
"政策" (包含法規、補助、政府公告)
"市場" (包含企業動態、投資、股市)

並給出一個簡短的具體類別 (Tag Variant)，例如：太陽能、離岸風電、電動車、碳權、補助計畫等 (不要超過4個字)。

JSON 格式回傳：
{ "tag": "...", "tag_variant": "..." }
`;
                const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openAiApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.3,
                        max_tokens: 100
                    })
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    if (aiData.choices?.[0]?.message?.content) {
                        const raw = aiData.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
                        const parsed = JSON.parse(raw);
                        analysis = {
                            tag: parsed.tag || '節能',
                            tag_variant: parsed.tag_variant || '一般'
                        };
                    }
                }
            } catch (err) {
                console.error("AI Tagging fail:", err);
            }

            newNewsEntries.push({
                title: item.title,
                source: item.link,
                source_name: "Inoreader", // Or extract domain if needed
                date: new Date(item.pubDate || item.isoDate || Date.now()).toISOString(),
                summary: "", // No summary needed
                region: "Taiwan", // Default
                tag: analysis.tag,
                tag_variant: analysis.tag_variant,
                full_content: "", // No scraping
                image: null // No image
            });
        }

        // Batch Upsert
        if (newNewsEntries.length > 0) {
            const { error } = await supabase.from('news').upsert(newNewsEntries, { onConflict: 'source' });
            if (error) throw error;
        }

        return new Response(JSON.stringify({
            success: true,
            processed: newNewsEntries.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
