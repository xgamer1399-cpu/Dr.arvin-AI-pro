
import React from 'react';
import { MenuIcon } from './icons';
import { UserProfile, SmartSuggestion } from '../types';

interface HeaderProps {
    onMenuClick: () => void;
    onProfileClick: () => void;
    userProfile: UserProfile;
    suggestion?: SmartSuggestion | null;
    onApplySuggestion?: (s: SmartSuggestion) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onProfileClick, userProfile, suggestion, onApplySuggestion }) => {
    return (
        <header className="flex-shrink-0 relative z-20 bg-slate-900/40 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto w-full px-4 py-3 flex flex-col gap-3">
                
                {/* Top Row: Menu, Status, Profile */}
                <div className="flex items-center justify-between">
                     {/* Mobile Menu Button */}
                    <button 
                        onClick={onMenuClick} 
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white shadow-sm md:hidden transition-all active:scale-95"
                    >
                        <MenuIcon />
                    </button>

                    {/* Left Side: Status / Suggestion */}
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 bg-black/20 border border-white/5 rounded-full px-4 py-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs text-gray-300 font-medium tracking-wide">Business Co-Pilot Active</span>
                        </div>

                        {/* SMART SUGGESTION BUTTON */}
                        {suggestion && onApplySuggestion && (
                            <button 
                                onClick={() => onApplySuggestion(suggestion)}
                                className="animate-slideUp flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-full border border-white/20 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 group"
                            >
                                <span className="text-sm">✨</span>
                                <span className="text-xs font-bold text-white">پیشنهاد: {suggestion.label}</span>
                                <div className="hidden group-hover:block absolute top-full mt-2 left-0 w-48 bg-gray-900 border border-white/10 p-2 rounded-lg text-[10px] text-gray-300 z-50 shadow-xl backdrop-blur-xl">
                                    {suggestion.reason}
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Profile Section */}
                    <div className="flex items-center gap-2">
                        {/* Streak Badge */}
                        <div className="flex flex-col items-center bg-orange-500/10 border border-orange-500/20 rounded-xl px-2 py-0.5">
                             <span className="text-sm">🔥</span>
                             <span className="text-[10px] font-bold text-orange-400">{userProfile.currentStreak || 0} روز</span>
                        </div>

                        <button 
                            onClick={onProfileClick}
                            className="flex items-center gap-3 pl-1 pr-4 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{userProfile.name || 'کاربر مهمان'}</p>
                                <div className="flex items-center gap-1 justify-end">
                                    <span className="text-[10px] text-yellow-400 font-bold">Lvl {userProfile.userLevel || 1}</span>
                                    <span className="text-[10px] text-gray-500">|</span>
                                    <p className="text-[10px] text-gray-400">{userProfile.businessName || 'کسب‌وکار من'}</p>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-black shadow-lg">
                                    {userProfile.name ? userProfile.name.charAt(0) : 'U'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full px-1 border border-white/10 text-[8px] font-bold text-yellow-400">
                                    {userProfile.userLevel || 1}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Growth Bars */}
                <div className="grid grid-cols-2 gap-4 pb-1">
                    {/* Business Growth */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">رشد کسب‌وکار</span>
                            <span className="text-[10px] text-blue-200">{userProfile.businessLevel}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-blue-900/30 rounded-full overflow-hidden border border-blue-500/10">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out rounded-full"
                                style={{ width: `${userProfile.businessLevel}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Manager Discipline */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] text-fuchsia-300 font-bold uppercase tracking-wider">رشد مدیر</span>
                            <span className="text-[10px] text-fuchsia-200">{userProfile.managerLevel}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-fuchsia-900/30 rounded-full overflow-hidden border border-fuchsia-500/10">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.5)] transition-all duration-1000 ease-out rounded-full"
                                style={{ width: `${userProfile.managerLevel}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
