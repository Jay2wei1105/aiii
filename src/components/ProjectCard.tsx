interface CardProps {
    title: string;
    description: string;
    imageUrl?: string;
    tag?: string;
}

export default function Card({ title, description, imageUrl, tag }: CardProps) {
    return (
        <article className="group space-y-4 rounded-3xl border bg-black/10 p-4 hover:border-black/10 hover:bg-black/20 transition-all duration-300">
            <div className="h-48 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden relative">
                {imageUrl ? (
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
                        Image Placeholder
                    </div>
                )}
            </div>
            <div>
                {tag && (
                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                        {tag}
                    </p>
                )}
                <h3 className="text-lg font-semibold mb-2 group-hover:text-slate-700 transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-slate-400">{description}</p>
            </div>
        </article>
    );
}
