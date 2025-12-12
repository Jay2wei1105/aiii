export interface PortfolioTemplate {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    previewImage: string;
    price: string;
    livePreviewUrl?: string;
}

export const portfolioTemplates: PortfolioTemplate[] = []; // Data moved to Supabase
