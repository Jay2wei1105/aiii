"use client"

import { useState } from "react"
import { Copy, Check, FileText, Code, ImageIcon, MessageSquare } from "lucide-react"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PromptCardProps {
    title: string
    description: string
    promptContent: string
    type: string
    secondaryType?: string
}

const typeIcons: { [key: string]: any } = {
    // English
    text: FileText,
    code: Code,
    image: ImageIcon,
    chat: MessageSquare,
    // Chinese
    "文字": FileText,
    "程式碼": Code,
    "圖片": ImageIcon,
    "對話": MessageSquare,
    "聊天": MessageSquare
}

const typeLabels: { [key: string]: string } = {
    text: "文字",
    code: "程式碼",
    image: "圖片",
    chat: "對話",
}

export default function PromptCard({ title, description, promptContent, type, secondaryType }: PromptCardProps) {
    const [isFlipped, setIsFlipped] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(promptContent)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    const Icon = typeIcons[type]
    const SecondaryIcon = secondaryType ? typeIcons[secondaryType] : null

    return (
        <div
            className="relative w-full max-w-sm h-80 [perspective:1000px]"
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
        >
            <div
                className={`relative w-full h-full transition-all duration-1000 ease-in-out [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""
                    }`}
            >
                {/* 正面 */}
                <div className="absolute w-full h-full [backface-visibility:hidden] border-zinc-200 bg-gradient-to-br from-[#B3CAD8]/100 to-[#B3CAD8]/10 backdrop-blur-md p-6 flex flex-col rounded-3xl">
                    {/* 用途簡述 - 上2/3 */}
                    <div className="flex-[2] flex flex-col justify-center mb-4">
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
                        <p className="text-zinc-600 text-sm leading-relaxed">{description}</p>
                    </div>

                    <div className="flex-[1] flex items-end border-t border-zinc-200 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600">
                                {Icon && <Icon className="w-4 h-4" />}
                                <span className="text-xs font-medium">{typeLabels[type] || type}</span>
                            </div>
                            {secondaryType && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600">
                                    {SecondaryIcon && <SecondaryIcon className="w-4 h-4" />}
                                    <span className="text-xs font-medium">{typeLabels[secondaryType] || secondaryType}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 背面 */}
                <div className="absolute w-full h-full [backface-visibility:hidden] border-zinc-200 bg-gradient-to-br from-[#B3CAD8]/80 to-[#FFFFFF] shadow-xl p-6 flex flex-col [transform:rotateY(180deg)] rounded-3xl">
                    {/* Prompt內容 - 上2/3 */}
                    <div className="flex-[2] mb-4 overflow-hidden relative">
                        <h4 className="text-sm font-semibold text-zinc-600 mb-2">Prompt Content:</h4>
                        <div className="text-zinc-600 text-sm leading-relaxed max-h-[160px] overflow-y-auto prose prose-sm prose-zinc max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {promptContent}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <div className="flex-[1] flex items-end justify-end border-t border-zinc-200 pt-4 shrink-0">
                        <button
                            onClick={handleCopy}
                            className={`flex items-center px-4 py-2 rounded-xl text-sm transition-all duration-300 border ${isCopied
                                ? "bg-green-50 text-green-600 border-green-200"
                                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200"
                                }`}
                        >
                            {isCopied ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}