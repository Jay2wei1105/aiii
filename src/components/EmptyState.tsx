import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface EmptyStateProps {
    onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onClearFilters }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
        >
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <Search className="text-zinc-300" size={32} />
            </div>
            <h3 className="text-zinc-900 font-bold text-lg">No matches found</h3>
            <p className="text-zinc-500 text-sm mt-1">Try adjusting your search or filters.</p>
            <button
                onClick={onClearFilters}
                className="mt-4 text-teal-600 font-semibold text-sm hover:underline"
            >
                Clear all filters
            </button>
        </motion.div>
    );
};
