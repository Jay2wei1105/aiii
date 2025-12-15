"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"

const navItems = [
    { label: "News", href: "/news-feed" },
    { label: "Prompt", href: "/prompt" },
    { label: "Chart", href: "/chart" },
    { label: "Tools", href: "/aitools" },
    { label: "Skills", href: "/skills" },
]

export default function Navbar() {
    const pathname = usePathname()
    const [isVisible, setIsVisible] = useState(true)
    const lastScrollY = useRef(0)

    useEffect(() => {
        const controlNavbar = () => {
            const currentScrollY = window.scrollY
            const scrollDiff = currentScrollY - lastScrollY.current

            console.log('Scroll:', { currentScrollY, lastScrollY: lastScrollY.current, scrollDiff })

            // 如果在頂部附近（小於 10px），總是顯示
            if (currentScrollY < 10) {
                setIsVisible(true)
            }
            // 向下滾動且超過 100px 時隱藏
            else if (scrollDiff > 0 && currentScrollY > 50) {
                console.log('Hiding navbar')
                setIsVisible(false)
            }
            // 向上滾動時顯示
            else if (scrollDiff < -5) {
                console.log('Showing navbar')
                setIsVisible(true)
            }

            lastScrollY.current = currentScrollY
        }

        let ticking = false
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    controlNavbar()
                    ticking = false
                })
                ticking = true
            }
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, []) // 空依賴陣列

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 flex flex-wrap items-stretch gap-3 bg-[#f5f5f7] p-3 text-sm font-semibold uppercase tracking-[0.3em] mx-6 mt-6 rounded-3xl transition-transform duration-300 shadow-lg ${isVisible ? "translate-y-0" : "-translate-y-[120%]"
                }`}
        >
            <Link
                href="/"
                className="flex flex-1 items-center justify-center rounded-2xl bg-black/00 px-6 min-h-[72px] text-black tracking-[0.25em] transition-all duration-300 group overflow-hidden"
            >
                <span className="text-2xl font-black text-black group-hover:text-black group-hover:text-4xl transition-all duration-300">
                    DSE
                </span>
                <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -z-10" />
            </Link>
            {navItems.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    className={`flex flex-1 items-center justify-center rounded-2xl px-5 min-h-[72px] transition-all duration-300 text-base ${pathname === item.href
                        ? "bg-black/50 text-white shadow-lg -translate-y-1"
                        : "text-black hover:bg-black/50 hover:text-white hover:-translate-y-1 hover:shadow-xl"
                        }`}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}
