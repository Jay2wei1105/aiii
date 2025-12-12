import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// --- Components ---

const DeltaLogo = () => (
    <div className="flex flex-col items-start gap-2">
        <div className="relative h-12 w-48 mb-1">
            <Image
                src="/delta-logo.png"
                alt="Delta Logo"
                fill
                className="object-contain object-left"
                priority
            />
        </div>
    </div>
);

interface FooterLinkProps {
    href?: string;
    children: React.ReactNode;
}

const FooterLink = ({ href = '#', children }: FooterLinkProps) => (
    <Link
        href={href}
        className="text-[#333333] hover:text-[#0076CE] transition-colors duration-200 text-sm no-underline block w-fit"
    >
        {children}
    </Link>
);

interface LinkItem {
    name: string;
    href: string;
}

interface FooterColumnProps {
    title: string;
    links: LinkItem[];
}

const FooterColumn = ({ title, links }: FooterColumnProps) => (
    <div className="flex flex-col space-y-4">
        <h3 className="text-base font-medium text-gray-800 mb-2">{title}</h3>
        <div className="flex flex-col space-y-3">
            {links.map((link, index) => (
                <FooterLink key={index} href={link.href}>
                    {link.name}
                </FooterLink>
            ))}
        </div>
    </div>
);

// --- Main Component ---

export default function FooterDelta() {
    const columns = [
        {
            title: '解決方案',
            links: [
                { name: '綠電交易平台', href: '#' },
                { name: '綠電匹配服務', href: '#' },
                { name: '減碳諮詢服務', href: '#' },
            ],
        },
        {
            title: '關於台達能源',
            links: [
                { name: '關於我們', href: '#' },
                { name: '新聞中心', href: '#' },
                { name: '台達能源部落格', href: '#' },
                { name: '售電業公開資料', href: '#' },
            ],
        },
        {
            title: '支援中心',
            links: [
                { name: '聯絡我們', href: '#' },
                { name: '隱私權政策', href: '#' },
                { name: '使用條款', href: '#' },
                { name: '資料收集', href: '#' },
            ],
        },
    ];

    return (
        <footer className="w-full bg-white pt-6">
            <div className="container mx-auto px-6 lg:px-12">
                {/* Top Border */}
                <div className="w-full border-t border-gray-200 mb-6"></div>

                {/* Main Footer Content */}
                <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-8 lg:gap-0">
                    {/* Left Section: Logo */}
                    <div className="mb-6 lg:mb-0">
                        <DeltaLogo />
                    </div>

                    {/* Right Section: Links Grid */}
                    <div className="flex flex-col md:flex-row gap-12 lg:gap-24 w-full lg:w-auto">
                        {columns.map((col, index) => (
                            <FooterColumn key={index} title={col.title} links={col.links} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Blue Bar */}
            <div className="w-full bg-[#0076CE] text-white py-2">
                <div className="container mx-auto px-6 lg:px-12 flex items-center">
                    <p className="text-sm font-light tracking-wide opacity-90">
                        &copy; 2025 Delta Energy, Inc. All Rights Reserved.
                    </p>
                    {/* Right side explicitly empty per requirements */}
                </div>
            </div>
        </footer>
    );
}