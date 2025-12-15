import {
    MessageSquare, ImageIcon, Code, Video, Briefcase, Music, Zap, Sparkles
} from 'lucide-react';

// TOOLS_DATA moved to Supabase


export const CATEGORIES = [
    { id: 'All', label: 'All Tools', icon: Sparkles },
    { id: 'Chat', label: 'Chatbots', icon: MessageSquare },
    { id: 'Image', label: 'Image Gen', icon: ImageIcon },
    { id: 'Video', label: 'Video', icon: Video },
    { id: 'Coding', label: 'Coding', icon: Code },
    { id: 'Productivity', label: 'Productivity', icon: Briefcase },
    { id: 'Audio', label: 'Audio', icon: Music },
];
