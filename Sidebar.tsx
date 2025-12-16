
import React, { useRef } from 'react';
import { ChatMode, ChatSession } from '../types.ts';
import { CloseIcon, DownloadIcon, UploadIcon } from './icons.tsx';

interface SidebarProps {
    chatMode: ChatMode;
    setChatMode: (mode: ChatMode) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    chatSessions: ChatSession[];
    activeChatId: string | null;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onExportChats: () => void;
    onImportChats: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    chatMode, setChatMode, isOpen, setIsOpen, 
    chatSessions, activeChatId, onNewChat, onSelectChat, onDeleteChat,
    onExportChats, onImportChats
}) => {
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const businessModes = [
        ChatMode.NORMAL, ChatMode.THINKING, ChatMode.COMPANY_ANALYSIS, ChatMode.SEARCH, ChatMode.MAPS,
        ChatMode.FILE_ANALYSIS, ChatMode.YOUTUBE_ANALYSIS, ChatMode.BOOK_ANALYSIS,
        ChatMode.SALES_BOOST, ChatMode.LOCATION_BUSINESS, ChatMode.CREATIVE_IDEAS,
        ChatMode.FINANCE, ChatMode.ADVANCED_NETWORKING, ChatMode.IRAN_NEGOTIATION,
        ChatMode.PRODUCT_INCUBATION
    ];

    const heroPathModes = [
        ChatMode.HERO_PATH_CHAT, ChatMode.HERO_PATH_AUDIO, ChatMode.HERO_SKILL, ChatMode.TOP_INVESTOR
    ];

    const creativeModes = [
        ChatMode.PROMPT_ENGINEERING, // Added here
        ChatMode.LIVE_CONVERSATION, ChatMode.IMAGE_GENERATION, 
        ChatMode.IMAGE_EDITING, ChatMode.PRO_SALES_CAMPAIGN
    ];

    const handleModeChange = (mode: ChatMode) => {
        setChatMode(mode);
        // On mobile, keep sidebar open to see change or close it? Let's keep it open for multi-select feel or close for simplicity.
        // Usually clicking a nav item should close drawer on mobile.
        if (window.innerWidth < 768) setIsOpen(false);
    };

    const handleNewChatClick = () => {
        onNewChat();
    }
    
    const handleSelectChatClick = (id: string) => {
        onSelectChat(id);
    }

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); 
        onDeleteChat(id);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            {/* Overlay for mobile with smooth fade */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            ></div>

            {/* Sidebar Container */}
            <aside
                className={`fixed inset-y-0 right-0 z-40 w-80 bg-slate-900/80 backdrop-blur-2xl border-l border-white/5 flex flex-col flex-shrink-0 shadow-2xl
                           transform transition-transform duration-300 ease-out md:relative md:translate-x-0 md:shadow-none
                           ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header Section */}
                <div className="p-5 pb-2 flex-shrink-0 z-10 relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 group cursor-default">
                             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow duration-300">
                                A
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-lg font-bold text-white tracking-wide">دکتر آروین</h2>
                                <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-semibold opacity-70">Business AI v1.6</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white transition-colors" aria-label="Close menu">
                            <CloseIcon />
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleNewChatClick}
                        className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-900/30 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 group border border-white/10"
                    >
                        <span className="text-lg group-hover:rotate-90 transition-transform duration-300">+</span> 
                        <span>گفتگوی جدید</span>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-grow overflow-y-auto px-4 py-2 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    
                    {/* Recent Chats */}
                    <div className="space-y-2">
                         <div className="flex items-center justify-between px-2 mb-1">
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">تاریخچه گفتگوها</p>
                         </div>
                         <div className="space-y-1">
                            {chatSessions.length === 0 && <p className="text-xs text-gray-600 px-3 italic py-2">هنوز گفتگویی ندارید...</p>}
                            {chatSessions.slice(0, 5).map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => handleSelectChatClick(session.id)}
                                    className={`w-full flex justify-between items-center text-right px-3 py-2.5 rounded-lg text-sm transition-all group relative overflow-hidden ${
                                        activeChatId === session.id
                                            ? 'bg-white/10 text-white font-medium border border-white/10 shadow-sm backdrop-blur-sm'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                    }`}
                                >
                                    <span className="truncate flex-1 z-10 relative opacity-90">{session.title}</span>
                                    <span 
                                        onClick={(e) => handleDeleteClick(e, session.id)}
                                        className="ml-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10 relative p-1"
                                    >
                                        &times;
                                    </span>
                                </button>
                            ))}
                         </div>
                    </div>

                    {/* Guide Mode (Prominent) */}
                    <div className="space-y-1 pt-2 border-t border-white/5">
                        <button 
                            onClick={() => handleModeChange(ChatMode.GUIDE_MODE)} 
                            className={`w-full text-right px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-between group border ${
                                chatMode === ChatMode.GUIDE_MODE 
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                : 'text-gray-300 bg-white/5 border-transparent hover:bg-emerald-500/5 hover:text-emerald-300 hover:border-emerald-500/20'
                            }`}
                        >
                            <div className="flex flex-col items-start">
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">🧭</span>
                                    {ChatMode.GUIDE_MODE}
                                </span>
                                <span className="text-[10px] opacity-60 font-normal mt-0.5 mr-7">از اینجا شروع کنید</span>
                            </div>
                        </button>
                    </div>

                    {/* Mode Sections Helper */}
                    {[
                        { title: 'مسیر قهرمان 🏆', modes: heroPathModes, color: 'yellow' },
                        { title: 'ابزارهای کسب‌وکار 💼', modes: businessModes, color: 'indigo' },
                        { title: 'استودیو خلاق 🎨', modes: creativeModes, color: 'pink' }
                    ].map((section, idx) => (
                         <div key={idx} className="space-y-1">
                            <p className={`text-[11px] font-bold uppercase tracking-wider px-2 mb-2 text-${section.color}-400/80`}>{section.title}</p>
                            {section.modes.map((mode) => {
                                const isActive = chatMode === mode;
                                // Dynamic class construction isn't ideal in tailwind without safelist, using explicit logic or style prop usually better, 
                                // but simpler here with conditioned strings.
                                let activeClass = '';
                                if (section.color === 'yellow') activeClass = isActive ? 'bg-yellow-500/10 text-yellow-200 border-yellow-500/30' : 'hover:bg-yellow-500/5 hover:text-yellow-100';
                                else if (section.color === 'indigo') activeClass = isActive ? 'bg-indigo-500/10 text-indigo-200 border-indigo-500/30' : 'hover:bg-indigo-500/5 hover:text-indigo-100';
                                else activeClass = isActive ? 'bg-pink-500/10 text-pink-200 border-pink-500/30' : 'hover:bg-pink-500/5 hover:text-pink-100';

                                return (
                                    <button 
                                        key={mode} 
                                        onClick={() => handleModeChange(mode)} 
                                        className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all border border-transparent ${activeClass} ${!isActive ? 'text-gray-400' : ''}`}
                                    >
                                        {mode}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Footer / Actions */}
                <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                     <div className="grid grid-cols-2 gap-2 mb-3">
                        <button 
                            onClick={onExportChats}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs rounded-lg transition-colors border border-white/5"
                            title="دانلود تاریخچه چت"
                        >
                            <DownloadIcon />
                            <span>دانلود چت</span>
                        </button>
                         <button 
                            onClick={handleImportClick}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs rounded-lg transition-colors border border-white/5"
                            title="بازیابی چت از فایل"
                        >
                            <UploadIcon />
                            <span>بازیابی</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={onImportChats}
                            className="hidden"
                            accept=".json"
                        />
                     </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
