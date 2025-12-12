"use client"

export default function Footer() {
    return (
        <footer className="bg-[#F5F5F7] backdrop-blur-md mt-12">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-black text-zinc-900/60 mb-2">DSE.ai</h3>
                    </div>

                    <div className="flex gap-6 text-sm text-zinc-900/60">
                        <a href="#" className="hover:text-zinc-900 transition-colors">About</a>
                        <a href="#" className="hover:text-zinc-900 transition-colors">Contact</a>
                        <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
                    </div>
                </div>

                <div className="pt-6 text-center text-xs text-zinc-900/40">
                    © {new Date().getFullYear()} DSE.ai. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
