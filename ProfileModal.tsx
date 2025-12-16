
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types.ts';
import { CloseIcon } from './icons.tsx';
import { ACHIEVEMENTS_LIST } from '../constants.ts';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onSave: (profile: UserProfile) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, onSave }) => {
    const [formData, setFormData] = useState<UserProfile>(profile);

    useEffect(() => {
        setFormData(profile);
    }, [profile, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'businessLevel' || name === 'managerLevel' ? parseInt(value) : value
        }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    // Helper to render achievement category
    const renderAchievementSection = (title: string, category: string) => (
        <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider border-b border-white/5 pb-1">{title}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {ACHIEVEMENTS_LIST.filter(a => a.category === category).map((ach) => {
                    const isUnlocked = formData.unlockedAchievements.some(ua => ua.id === ach.id);
                    return (
                        <div key={ach.id} className={`relative p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                            isUnlocked 
                            ? 'bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border-yellow-500/30 shadow-lg shadow-yellow-900/20' 
                            : 'bg-white/5 border-white/5 opacity-40 grayscale hover:opacity-60'
                        }`}>
                            <div className={`text-3xl ${isUnlocked ? 'animate-pulseSlow' : ''}`}>{ach.icon}</div>
                            <h4 className={`text-[10px] font-bold ${isUnlocked ? 'text-yellow-100' : 'text-gray-500'}`}>{ach.title}</h4>
                            <p className="text-[9px] text-gray-400 leading-tight hidden sm:block">{ach.description}</p>
                            {isUnlocked && <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-white/10 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-black shadow-xl">
                            {formData.name ? formData.name.charAt(0) : 'U'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{formData.name || 'کاربر مهمان'}</h2>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded">Lvl {formData.userLevel || 1}</span>
                                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded">🔥 {formData.currentStreak || 0} روز استریک</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                    
                    {/* 1. Progress Section (Automated) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-indigo-900/10 border border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <label className="text-indigo-200 text-sm font-bold mb-2 block flex justify-between items-end">
                                    <span className="flex items-center gap-2"><span className="text-xl">🚀</span> رشد کسب‌وکار (Level {formData.businessLevel})</span>
                                    <span className="text-xs font-mono text-indigo-400">{formData.businessXP} XP</span>
                                </label>
                                <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out rounded-full"
                                        style={{ width: `${formData.businessLevel}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-fuchsia-900/10 border border-fuchsia-500/20 p-5 rounded-2xl relative overflow-hidden group">
                             <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             <div className="relative z-10">
                                <label className="text-fuchsia-200 text-sm font-bold mb-2 block flex justify-between items-end">
                                    <span className="flex items-center gap-2"><span className="text-xl">🧠</span> رشد مدیر (Level {formData.managerLevel})</span>
                                    <span className="text-xs font-mono text-fuchsia-400">{formData.managerXP} XP</span>
                                </label>
                                <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] transition-all duration-1000 ease-out rounded-full"
                                        style={{ width: `${formData.managerLevel}%` }}
                                    ></div>
                                </div>
                             </div>
                        </div>
                    </div>

                     {/* 2. Detailed Info Form */}
                     <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">اطلاعات فردی و شخصیتی</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">نام شما</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="مثلا: علی رضایی"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">هدف اولیه و فوری</label>
                                <input type="text" name="initialGoal" value={formData.initialGoal} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="مثلا: فروش اولین محصول"/>
                            </div>
                        </div>

                         {/* Psychology & Location */}
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">استان</label>
                                <input type="text" name="province" value={formData.province} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="مثلا: تهران"/>
                             </div>
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">شهر</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="مثلا: ورامین"/>
                             </div>
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">شخصیت MBTI</label>
                                <input type="text" name="mbtiType" value={formData.mbtiType} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="مثلا: INTJ, ENFP..."/>
                             </div>
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">شخصیت DISC</label>
                                <input type="text" name="discType" value={formData.discType} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="مثلا: D, I, S, C"/>
                             </div>
                        </div>

                        <div>
                             <label className="block text-xs text-gray-500 mb-1">مهارت‌ها و توانایی‌ها (Skills)</label>
                             <input type="text" name="skills" value={formData.skills} onChange={handleChange}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="مثلا: برنامه نویسی، فروش، طراحی سایت..."/>
                        </div>

                        <div>
                             <label className="block text-xs text-gray-500 mb-1">توضیحات کامل درباره من (علایق، تجربه، داستان)</label>
                             <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="من یک طراح گرافیک هستم که به بازارهای مالی علاقه دارم..."></textarea>
                        </div>
                        
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-white/5 pb-2 pt-4">اطلاعات کسب‌وکار و مالی</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">نام کسب‌وکار</label>
                                <input type="text" name="businessName" value={formData.businessName} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">حوزه فعالیت</label>
                                <input type="text" name="businessType" value={formData.businessType} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">سرمایه اولیه (شروع)</label>
                                <input type="text" name="initialCapital" value={formData.initialCapital} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="مثلا: ۵۰ میلیون"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">سرمایه فعلی (در دسترس)</label>
                                <input type="text" name="currentCapital" value={formData.currentCapital} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="مثلا: ۱۰۰ میلیون"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">مرحله فعلی</label>
                                <select name="businessStage" value={formData.businessStage} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors">
                                    <option value="Idea">ایده خام (Idea)</option>
                                    <option value="MVP">محصول اولیه (MVP)</option>
                                    <option value="Traction">در حال فروش (Traction)</option>
                                    <option value="Scaling">توسعه و اسکیل (Scaling)</option>
                                    <option value="Established">شرکت بلوغ یافته</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">هدف بزرگ (بلند مدت)</label>
                            <input type="text" name="goals" value={formData.goals} onChange={handleChange}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="رسیدن به بازار جهانی..."/>
                        </div>
                    </div>

                    {/* 3. Achievements Grid (Trophy Room) */}
                    <div>
                         <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-6 flex items-center gap-2">
                             🏆 تالار افتخارات <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">({formData.unlockedAchievements.length} / {ACHIEVEMENTS_LIST.length})</span>
                         </h3>
                         
                         {renderAchievementSection('🌱 شروع مسیر (Beginner)', 'beginner')}
                         {renderAchievementSection('📈 رشد و ابزارها (Growth)', 'growth')}
                         {renderAchievementSection('💰 مالی و بیزنس (Financial)', 'financial')}
                         {renderAchievementSection('👑 استادی و تداوم (Mastery)', 'mastery')}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-gray-300 hover:bg-white/5 transition-colors">
                        انصراف
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all font-bold">
                        ذخیره تغییرات
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;