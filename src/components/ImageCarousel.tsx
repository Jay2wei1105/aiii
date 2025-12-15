"use client";

import { useState, useEffect } from "react";

const carouselImages = [
    {
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&h=1080&fit=crop",
        alt: "Modern abstract design 1",
    },
    {
        url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&h=1080&fit=crop",
        alt: "Creative workspace 2",
    },
    {
        url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&h=1080&fit=crop",
        alt: "Digital art 3",
    },
];

export default function ImageCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000); // 每5秒自動切換

        return () => clearInterval(interval);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div className="relative w-full h-[70vh] overflow-hidden">
            {/* 圖片容器 */}
            <div
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {carouselImages.map((image, index) => (
                    <div
                        key={index}
                        className="min-w-full h-full relative"
                    >
                        <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                        />
                        {/* 漸層遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                ))}
            </div>

            {/* 導航點 */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                {carouselImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 rounded-full ${index === currentIndex
                            ? "w-12 h-3 bg-white"
                            : "w-3 h-3 bg-white/50 hover:bg-white/75"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* 左右箭頭 (可選) */}
            <button
                onClick={() =>
                    setCurrentIndex((prev) =>
                        prev === 0 ? carouselImages.length - 1 : prev - 1
                    )
                }
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center text-white text-2xl"
                aria-label="Previous slide"
            >
                ‹
            </button>
            <button
                onClick={() =>
                    setCurrentIndex((prev) =>
                        prev === carouselImages.length - 1 ? 0 : prev + 1
                    )
                }
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center text-white text-2xl"
                aria-label="Next slide"
            >
                ›
            </button>
        </div>
    );
}
