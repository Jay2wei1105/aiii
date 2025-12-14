

import { createClient } from 'jsr:@supabase/supabase-js@2'
import Parser from 'npm:rss-parser';
import { load } from 'npm:cheerio@1.0.0';


const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Extract real news URL from Google News RSS link
 * Google News RSS items have format: https://news.google.com/rss/articles/...
 * We need to follow the redirect to get the actual news site URL
 */
async function extractRealUrlFromGoogleNews(googleNewsUrl: string): Promise<string | null> {
    try {
        console.log(`Extracting real URL from: ${googleNewsUrl.substring(0, 80)}...`);

        // Follow redirect to get real URL
        const res = await fetch(googleNewsUrl, {
            method: 'HEAD',  // Only need headers, not content
            redirect: 'manual',  // Don't follow redirect automatically
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        // Get Location header which contains the real URL
        const location = res.headers.get('location');
        if (location) {
            console.log(`✓ Real URL found: ${location.substring(0, 80)}...`);
            return location;
        }

        // Fallback: try to extract from URL parameter
        try {
            const url = new URL(googleNewsUrl);
            const urlParam = url.searchParams.get('url');
            if (urlParam) {
                console.log(`✓ Real URL from param: ${urlParam.substring(0, 80)}...`);
                return urlParam;
            }
        } catch { }

        console.warn(`Could not extract real URL from: ${googleNewsUrl}`);
        return null;
    } catch (e) {
        console.error(`Error extracting real URL:`, e);
        return null;
    }
}

/**
 * Helper: Scraping specific news sites
 * Extracts Main Image and Readable Content
 */
async function scrapeArticle(url: string) {
    console.log(`Scraping URL: ${url}`);
    try {
        // Fetch with redirect following (default behavior)
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow' // Explicitly follow redirects from Google News
        });

        if (!res.ok) {
            console.error(`Failed to fetch ${url}: ${res.status}`);
            return null;
        }

        const finalUrl = res.url; // Get the actual destination URL after redirects
        console.log(`Final URL after redirect: ${finalUrl}`);

        const html = await res.text();
        const $ = load(html);

        // 1. Extract Main Image (from actual news site, not Google proxy)
        let image = $('meta[property="og:image"]').attr('content');
        if (!image) image = $('meta[name="twitter:image"]').attr('content');

        // Skip Google News proxy images
        if (image && image.includes('googleusercontent.com')) {
            image = null; // Force fallback to article images
        }

        if (!image) {
            // Find the first actual article image (look for large images)
            const articleImg = $('article img, .article img, .post-content img, main img').first();
            let imgSrc = articleImg.attr('src') || articleImg.attr('data-src');

            // Handle relative URLs
            if (imgSrc) {
                if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
                else if (imgSrc.startsWith('/')) {
                    const urlObj = new URL(finalUrl);
                    imgSrc = urlObj.origin + imgSrc;
                }

                if (imgSrc && imgSrc.startsWith('http') && !imgSrc.includes('googleusercontent')) {
                    image = imgSrc;
                }
            }
        }

        // 2. Extract Clean Article Content with Proper HTML Structure
        // Remove junk elements
        $('script, style, iframe, nav, footer, header, aside, .ad, .advertisement, .related-posts, .menu, .popup, .social-share, .comments').remove();

        // Find article content container
        let articleContainer = $('article').first();
        if (articleContainer.length === 0) articleContainer = $('main').first();
        if (articleContainer.length === 0) articleContainer = $('.post-content, .article-content, .story-body, .entry-content').first();

        // Extract structured content
        let structuredHtml = '';

        if (articleContainer.length > 0) {
            // Extract headings and paragraphs with clean structure
            articleContainer.find('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, img').each((index, elem) => {
                const tagName = elem.tagName?.toLowerCase();
                const $elem = $(elem);

                if (tagName === 'p') {
                    const text = $elem.text().trim();
                    if (text.length > 20) { // Filter out empty/short paragraphs
                        structuredHtml += `<p>${text}</p>\n`;
                    }
                } else if (tagName?.match(/^h[1-6]$/)) {
                    const text = $elem.text().trim();
                    if (text) {
                        structuredHtml += `<${tagName}>${text}</${tagName}>\n`;
                    }
                } else if (tagName === 'img') {
                    let imgSrc = $elem.attr('src') || $elem.attr('data-src');
                    if (imgSrc) {
                        if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
                        else if (imgSrc.startsWith('/')) {
                            const urlObj = new URL(finalUrl);
                            imgSrc = urlObj.origin + imgSrc;
                        }
                        if (imgSrc.startsWith('http')) {
                            const alt = $elem.attr('alt') || '';
                            structuredHtml += `<img src="${imgSrc}" alt="${alt}" />\n`;
                        }
                    }
                } else if (tagName === 'ul' || tagName === 'ol') {
                    const listHtml = $elem.html();
                    if (listHtml) {
                        structuredHtml += `<${tagName}>${listHtml}</${tagName}>\n`;
                    }
                } else if (tagName === 'blockquote') {
                    const text = $elem.text().trim();
                    if (text) {
                        structuredHtml += `<blockquote>${text}</blockquote>\n`;
                    }
                }
            });
        }

        // Fallback: if structured extraction failed, try to get all paragraphs
        if (structuredHtml.length < 500) {
            console.log('Structured extraction too short, using fallback...');
            $('p').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text.length > 30) {
                    structuredHtml += `<p>${text}</p>\n`;
                }
            });
        }

        // 3. Get Plain Text for AI Summary
        const plainText = load(structuredHtml || '').text().replace(/\s+/g, ' ').trim().substring(0, 3000);

        return {
            image,
            content: structuredHtml,
            plainText,
            finalUrl
        };

    } catch (e) {
        console.error(`Scraping exception for ${url}:`, e);
        return null;
    }
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

        // Fetch RSS sources from database
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

        console.log(`Found ${rssSources.length} enabled RSS sources`);

        let allItems = [];
        try {
            for (const source of rssSources) {
                console.log(`Fetching: ${source.name} (${source.url})`);
                try {
                    const feedRes = await fetch(source.url);
                    const feed = await parser.parseString(await feedRes.text());

                    // Tag items with their source
                    for (const item of feed.items) {
                        allItems.push({
                            ...item,
                            sourceName: source.name,
                            sourceLanguage: source.language
                        });
                    }
                    console.log(`  ✓ Fetched ${feed.items.length} items from ${source.name}`);
                } catch (feedError) {
                    console.error(`  ✗ Failed to fetch ${source.name}:`, feedError);
                    // Continue with other sources
                }
            }
            console.log(`Total items collected: ${allItems.length}`);
        } catch (e) {
            throw new Error(`RSS Parse Failed: ${e.message}`);
        }

        // Filter by Keywords (TEMPORARILY DISABLED FOR DEBUGGING)
        // const keywords = {
        //     renewable: ['再生能源', '綠能', '綠電', '太陽能', '光電', '風力', '風電', '離岸風電', '陸域風電', '地熱', '水力', '氫能', '潮汐能',
        //         'renewable', 'solar', 'photovoltaic', 'pv', 'wind', 'offshore wind', 'onshore wind', 'geothermal', 'hydro', 'hydrogen', 'tidal'],
        //     energySaving: ['節能', '能源效率', '能效', 'ESG', '碳排', '減碳', '淨零', '碳中和', '儲能', '電池', '電動車', 'BESS',
        //         'energy efficiency', 'energy saving', 'carbon', 'emissions', 'net zero', 'carbon neutral', 'storage', 'battery', 'ev', 'electric vehicle', 'bess'],
        //     general: ['能源', '永續', '氣候', '環保', 'energy', 'sustainable', 'sustainability', 'climate', 'green']
        // };

        // const allKeywords = [...keywords.renewable, ...keywords.energySaving, ...keywords.general];

        // const keywordFilteredItems = allItems.filter(item => {
        //     const title = (item.title || '').toLowerCase();
        //     const description = (item.contentSnippet || '').toLowerCase();
        //     const searchText = title + ' ' + description;

        //     // Check if any keyword exists in title or description
        //     return allKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
        // });

        const keywordFilteredItems = allItems; // Skip keyword filter for debugging

        console.log(`Items after keyword filter: ${keywordFilteredItems.length} (keyword filter DISABLED for debugging)`);

        // Filter by Date (skip for now to test everything)
        // const startDate = new Date('2025-12-01T00:00:00+08:00');
        // const dateFilteredItems = keywordFilteredItems.filter(item => {
        //     const pubDate = new Date(item.pubDate);
        //     return pubDate >= startDate;
        // });

        const dateFilteredItems = keywordFilteredItems; // Use all keyword-filtered items

        console.log(`Items after date filter: ${dateFilteredItems.length}`);

        if (dateFilteredItems.length === 0) {
            return new Response(JSON.stringify({ message: 'No new items > 2025/12' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }

        // Deduplicate: Compare against existing titles with similarity check
        const links = dateFilteredItems.map(i => i.link);
        const { data: existingData } = await supabase.from('news').select('source, title').in('source', links);
        const existingLinks = new Set(existingData?.map(d => d.source) || []);

        // Also get all recent titles for similarity comparison (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: recentNews } = await supabase
            .from('news')
            .select('title')
            .gte('date', thirtyDaysAgo.toISOString());

        const existingTitles = recentNews?.map(n => n.title.toLowerCase()) || [];

        // Title similarity function (simple word overlap approach)
        const titleSimilarity = (title1: string, title2: string): number => {
            const words1 = title1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const words2 = title2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

            if (words1.length === 0 || words2.length === 0) return 0;

            const set1 = new Set(words1);
            const set2 = new Set(words2);
            const intersection = new Set([...set1].filter(x => set2.has(x)));

            const similarity = (2 * intersection.size) / (words1.length + words2.length);
            return similarity;
        };

        const uniqueItems = [];
        const seen = new Set();

        for (const item of dateFilteredItems) {
            // Skip if source URL already exists
            if (existingLinks.has(item.link) || seen.has(item.link)) {
                continue;
            }

            // Check title similarity against existing titles (90% threshold)
            const itemTitle = item.title.toLowerCase();
            let isDuplicate = false;

            for (const existingTitle of existingTitles) {
                const similarity = titleSimilarity(itemTitle, existingTitle);
                if (similarity >= 0.90) {
                    console.log(`Similar title found (${(similarity * 100).toFixed(0)}%): "${item.title}" ≈ "${existingTitle}"`);
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                seen.add(item.link);
                uniqueItems.push(item);
            }
        }

        console.log(`Unique NEW items to process: ${uniqueItems.length}`);

        if (uniqueItems.length === 0) {
            return new Response(JSON.stringify({ message: 'No new unique items to process.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }

        // Process items (Google News + web scraping is resource-intensive)
        // Batch size of 5 to stay within Edge Function resource limits
        const itemsToProcess = uniqueItems.slice(0, 5);
        const newNewsEntries = [];

        console.log(`Processing ${itemsToProcess.length} items with URL extraction, scraping, AI analysis and translation...`);

        for (const item of itemsToProcess) {
            // 1. Extract real URL from Google News redirect
            const googleNewsUrl = item.link;
            const realUrl = await extractRealUrlFromGoogleNews(googleNewsUrl);

            if (!realUrl) {
                console.warn(`Skipping item - could not extract real URL: ${item.title}`);
                continue;
            }

            // 2. Scrape the actual article content and images
            console.log(`Scraping article: ${item.title?.substring(0, 50)}...`);
            const scrapeResult = await scrapeArticle(realUrl);

            if (!scrapeResult) {
                console.warn(`Skipping item - scraping failed: ${item.title}`);
                continue;
            }

            const { image, content: fullContent, plainText } = scrapeResult;

            // 3. Check content length
            if (!fullContent || fullContent.length < 300) {
                console.warn(`Skipping item - content too short (${fullContent?.length || 0} chars): ${item.title}`);
                continue;
            }

            // 4. AI Analysis (with translation for English sources)
            const isEnglish = (item as any).sourceLanguage === 'en';

            let analysis = {
                summary: item.title.substring(0, 100), // Default: truncated title
                region: 'Taiwan', // Default for TW sources
                tag: '再生能源',
                tag_variant: 'General',
                translatedTitle: item.title,  // Will be translated if English
                translatedContent: fullContent  // Will be translated if English
            };

            try {
                const prompt = isEnglish ? `
你是一個專業的新聞翻譯與分析助手。請分析這篇英文新聞，並輸出 JSON 格式。

原標題：${item.title}
原內容：${plainText}

任務：
1. translatedTitle: 將標題翻譯成繁體中文
2. summary: 用繁體中文寫摘要 (最多100字)
3. region: "Taiwan" (台灣相關) / "Asia" (亞洲其他地區) / "Global" (全球)
4. tag: "再生能源" (太陽能、風能、地熱、氫能等) 或 "節能" (能源效率、ESG、碳排、電動車等)
5. tag_variant: 具體類別 (例如：太陽能、離岸風電、電動車、政策、儲能)

JSON 格式：
{ "translatedTitle": "...", "summary": "...", "region": "...", "tag": "...", "tag_variant": "..." }
` : `
分析這篇繁體中文新聞，輸出 JSON 格式。

標題：${item.title}
內容：${plainText}

任務：
1. summary: 用繁體中文摘要 (最多100字)
2. region: "Taiwan" (台灣) / "Asia" (亞洲其他地區) / "Global" (全球)
3. tag: "再生能源" (太陽能、風能、地熱、氫能) 或 "節能" (能源效率、ESG、碳排)
4. tag_variant: 具體類別 (例如：太陽能、離岸風電、電動車、政策)

JSON 格式：
{ "summary": "...", "region": "...", "tag": "...", "tag_variant": "..." }
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
                        max_tokens: 400  // Increased for translation
                    })
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    if (aiData.choices?.[0]?.message?.content) {
                        try {
                            const raw = aiData.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
                            const parsed = JSON.parse(raw);
                            analysis = {
                                summary: parsed.summary || analysis.summary,
                                region: parsed.region || analysis.region,
                                tag: parsed.tag || analysis.tag,
                                tag_variant: parsed.tag_variant || analysis.tag_variant,
                                translatedTitle: parsed.translatedTitle || item.title,
                                translatedContent: fullContent  // Keep original HTML for now
                            };
                        } catch (e) { console.error("JSON Parse fail", e); }
                    }
                }
            } catch (err) { console.error("AI fail", err); }

            // 5. Translate full_content if English (translate HTML text content)
            let translatedContent = fullContent;
            if (isEnglish && plainText.length > 100) {  // Only translate substantial content
                try {
                    console.log(`Translating content for: ${item.title.substring(0, 50)}...`);

                    // Use AI to translate the plain text (not HTML to preserve structure)
                    const translatePrompt = `請將以下英文新聞內文翻譯成繁體中文，保持專業性和準確性：\n\n${plainText}`;

                    const translateResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openAiApiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o-mini',
                            messages: [{ role: 'user', content: translatePrompt }],
                            temperature: 0.3,
                            max_tokens: 2000
                        })
                    });

                    if (translateResponse.ok) {
                        const translateData = await translateResponse.json();
                        const translatedText = translateData.choices?.[0]?.message?.content?.trim();

                        if (translatedText) {
                            // Wrap translated text in simple HTML structure
                            translatedContent = translatedText
                                .split('\n\n')
                                .map(para => para.trim())
                                .filter(para => para.length > 0)
                                .map(para => `<p>${para}</p>`)
                                .join('\n');

                            console.log(`✓ Content translated (${translatedContent.length} chars)`);
                        }
                    }
                } catch (translateErr) {
                    console.error("Translation failed:", translateErr);
                    // Keep original content if translation fails
                }
            }

            // Extract clean source name from URL for frontend display
            const extractSourceName = (url: string, sourceName: string): string => {
                // Use the RSS source name if available
                if (sourceName) return sourceName;

                // Otherwise extract from URL
                try {
                    const urlObj = new URL(url);
                    const hostname = urlObj.hostname.replace('www.', '');

                    // Map common domains to friendly names
                    const sourceMap: { [key: string]: string } = {
                        'technews.tw': 'TechNews',
                        'reccessary.com': 'Reccessary',
                        'netzero.cna.com.tw': '淨零碳排',
                        'cna.com.tw': '中央社',
                        'cleantechnica.com': 'CleanTechnica',
                        'pv-magazine.com': 'PV Magazine',
                        'windpowermonthly.com': 'Wind Power',
                        'energy-storage.news': 'Energy Storage',
                        'electrek.co': 'Electrek',
                        'carbonbrief.org': 'Carbon Brief',
                        'greenbiz.com': 'GreenBiz',
                        'cw.com.tw': '天下雜誌',
                        'bnext.com.tw': '數位時代',
                        'taipower.com.tw': '台電',
                        'moeaboe.gov.tw': '能源局',
                        'delta-foundation.org.tw': '台達基金會',
                        'e-info.org.tw': '環境資訊',
                        'udn.com': '聯合新聞網',
                        'ltn.com.tw': '自由時報'
                    };

                    return sourceMap[hostname] || hostname;
                } catch {
                    return '未知來源';
                }
            };

            newNewsEntries.push({
                title: isEnglish ? analysis.translatedTitle : item.title,  // Use translated title for English news
                source: realUrl,  // Use real news site URL, not Google News URL
                source_name: extractSourceName(realUrl, (item as any).sourceName),
                date: new Date(item.pubDate || item.isoDate || Date.now()).toISOString(),
                summary: analysis.summary,
                region: analysis.region,
                tag: analysis.tag,
                tag_variant: analysis.tag_variant,
                full_content: translatedContent || item.contentSnippet || '',  // Use translated content
                image: image
            });
        }

        // 3. Batch Upsert
        if (newNewsEntries.length > 0) {
            console.log(`Inserting ${newNewsEntries.length} items to DB...`);
            const { error } = await supabase.from('news').upsert(newNewsEntries, { onConflict: 'source' });
            if (error) {
                console.error("DB Insert Error", error);
                throw error;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed: newNewsEntries.length,
            items: newNewsEntries.map(n => ({ title: n.title, tag: n.tag, has_image: !!n.image, has_content: !!n.full_content }))
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Critical Error", error);
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
