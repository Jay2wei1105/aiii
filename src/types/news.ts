export type BadgeVariant = 'blue' | 'purple' | 'amber' | 'zinc' | 'dark';

export interface NewsItem {
    id: number;
    image?: string;
    region: string;
    tag: string;
    tagVariant: BadgeVariant;
    title: string;
    summary: string;
    fullContent: string;
    source: string;
    sourceName: string;  // Display name for source (e.g., "CleanTechnica", "能源局")
    date: string;
}

export interface DateRange {
    start: string;
    end: string;
}
