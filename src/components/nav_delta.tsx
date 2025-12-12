import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Added for optimized images
import { usePathname } from 'next/navigation'; // Added for active link state
import { Globe, Menu, X } from 'lucide-react';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    mobile?: boolean;
    isActive?: boolean; // New prop
}

const NavLink = ({ href, children, mobile = false, isActive = false }: NavLinkProps) => (
    <Link
        href={href}
        className={`
      font-medium text-[15px] transition-colors duration-200
      ${isActive ? 'text-[#0076CE] font-bold' : 'text-[#333333] hover:text-[#0076CE]'}
      ${mobile ? 'block py-3 border-b border-gray-50' : ''}
    `}
    >
        {children}
    </Link>
);

const DeltaLogo = () => (
    <div className="relative h-10 w-40">
        <Image
            src="/delta-logo.png"
            alt="Delta Logo"
            fill
            className="object-contain object-left"
            priority
        />
    </div>
);

export default function NavbarDelta() {
    const pathname = usePathname(); // Get current path
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // 處理 Safari 彈性滾動導致的負值
            if (currentScrollY < 0) return;

            if (currentScrollY > lastScrollY.current) {
                // 向下滾動 (Scrolling Down)
                // 當滾動超過 50px 且目前是顯示狀態時，隱藏導覽列
                if (currentScrollY > 50 && isVisible) {
                    setIsVisible(false);
                    setIsMobileMenuOpen(false); // 隱藏導覽列時同時關閉手機選單
                }
            } else {
                // 向上滾動 (Scrolling Up)
                // 當向上滾動超過 10px 且目前是隱藏狀態時，顯示導覽列
                if (lastScrollY.current - currentScrollY > 10 && !isVisible) {
                    setIsVisible(true);
                }
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isVisible]);

    const navItems = [
        { name: '最新消息', href: '/news-feed' },
        { name: '提示庫', href: '/prompt' },
        { name: '數據分析工具', href: '/chart' },
        { name: 'AI工具', href: '/aitools' },
        { name: '技能樹', href: '/skills' },
    ];

    return (
        <div className="font-sans">
            <nav
                className={`fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
                    }`}
            >
                <div className="container mx-auto px-6 lg:px-12 h-20 flex justify-between items-center">

                    {/* Left Side: Logo Area */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <DeltaLogo />
                    </Link>

                    {/* Right Side: Desktop Menu */}
                    <div className="hidden lg:flex items-center space-x-10">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                href={item.href}
                                isActive={pathname === item.href}
                            >
                                {item.name}
                            </NavLink>
                        ))}

                        {/* Language Selector */}
                        <div className="flex items-center gap-1.5 cursor-pointer text-gray-700 hover:text-[#0076CE] transition-colors border-l border-gray-300 pl-8 ml-2 group">
                            <Globe className="w-5 h-5" strokeWidth={1.5} />
                            <span className="text-[15px] font-medium group-hover:opacity-80">繁體中文</span>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden text-gray-600 hover:text-[#0076CE] focus:outline-none transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-7 h-7" />
                        ) : (
                            <Menu className="w-7 h-7" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-lg">
                        <div className="container mx-auto px-6 py-4 flex flex-col">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.name}
                                    href={item.href}
                                    mobile
                                    isActive={pathname === item.href}
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                            <div className="pt-4 mt-2 flex items-center gap-2 text-gray-700 cursor-pointer hover:text-[#0076CE]">
                                <Globe className="w-5 h-5" strokeWidth={1.5} />
                                <span className="font-medium">繁體中文</span>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
}