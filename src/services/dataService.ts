
import { supabase } from '@/lib/supabase';
import {
    MessageSquare, ImageIcon, Code, Video, Briefcase, Music, Zap, Sparkles
} from 'lucide-react';

// Icon mapping for dynamic resolution
const iconMap: { [key: string]: any } = {
    MessageSquare, ImageIcon, Code, Video, Briefcase, Music, Zap, Sparkles
};

export async function fetchAiTools() {
    const { data, error } = await supabase.from('ai_tools').select('*');
    if (error) {
        console.error('Error fetching AI tools:', error);
        return [];
    }

    return data.map((tool: any) => {
        let finalLogoUrl = tool.logo_url;
        // If it's just a filename (no http), assume it's in our Supabase storage bucket
        if (tool.logo_url && !tool.logo_url.startsWith('http')) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            finalLogoUrl = `${supabaseUrl}/storage/v1/object/public/ai_logos/${tool.logo_url}`;
        }

        return {
            ...tool,
            logoUrl: finalLogoUrl,
            icon: iconMap[tool.icon_name] || Sparkles // Default icon
        };
    });
}

export async function fetchNews() {
    const { data, error } = await supabase.from('news').select('*').order('date', { ascending: false });
    if (error) {
        console.error('Error fetching news:', error);
        return [];
    }
    return data.map((item: any) => {
        let finalImageUrl = item.image;
        if (item.image && !item.image.startsWith('http')) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            finalImageUrl = `${supabaseUrl}/storage/v1/object/public/news_image/${item.image}`;
        }

        return {
            ...item,
            image: finalImageUrl,
            fullContent: item.full_content,
            tagVariant: item.tag_variant,
            sourceName: item.source_name || '未知來源'  // Map source_name to sourceName
        };
    });
}

export async function fetchPortfolios() {
    const { data, error } = await supabase.from('portfolios').select('*');
    if (error) {
        console.error('Error fetching portfolios:', error);
        return [];
    }
    return data.map((item: any) => ({
        ...item,
        previewImage: item.preview_image,
        livePreviewUrl: item.live_preview_url
    }));
}

export async function fetchPrompts() {
    const { data, error } = await supabase.from('prompts').select('*').order('id', { ascending: true });
    if (error) {
        console.error('Error fetching prompts:', error);
        return [];
    }

    // Transform data to match component expectation
    return data.map(item => ({
        title: item.title,
        description: item.description,
        promptContent: item.prompt_content,
        type: item.type,
        secondaryType: item.secondary_type
    }));
}
