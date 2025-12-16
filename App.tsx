
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import ChatWindow from './components/ChatWindow.tsx';
import InputBar from './components/InputBar.tsx';
import ProfileModal from './components/ProfileModal.tsx';
import { ChatMessage, ChatMode, ChatSession, UserProfile, AppNotification, SmartSuggestion } from './types.ts';
import { getChatResponse, generateImage, editImage, generateSpeech, getLiveSession, getSmartSuggestion } from './services/geminiService.ts';
import { LIVE_SYSTEM_INSTRUCTION, HERO_PATH_AUDIO_SYSTEM_INSTRUCTION, ACHIEVEMENTS_LIST } from './constants.ts';
import { LiveServerMessage, Modality } from '@google/genai';
import { MicIcon, StopIcon, AttachmentIcon } from './components/icons.tsx';

// --- Audio Helper Functions ---
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// --- Helper function to extract the first frame from a video ---
const extractVideoFrame = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.onloadeddata = () => video.currentTime = 0;
        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            resolve({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
            URL.revokeObjectURL(video.src);
        };
        video.onerror = () => {
            reject(new Error('Failed to load video file.'));
            URL.revokeObjectURL(video.src);
        };
        video.src = URL.createObjectURL(file);
    });
};

const readFileAsBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            if (base64String) {
                resolve({ data: base64String, mimeType: file.type });
            } else {
                reject(new Error('Failed to read file as base64.'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

// --- Notification Component ---
const NotificationToast: React.FC<{ notification: AppNotification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    let bgClass = "bg-slate-900/90 border-slate-700";
    if (notification.type === 'achievement') bgClass = "bg-gradient-to-r from-yellow-900/90 to-amber-900/90 border-yellow-500/30";
    if (notification.type === 'levelUp') bgClass = "bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border-indigo-500/30";
    if (notification.type === 'streak') bgClass = "bg-gradient-to-r from-orange-900/90 to-red-900/90 border-orange-500/30";
    if (notification.type === 'info') bgClass = "bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border-emerald-500/30";

    return (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slideUp ${bgClass}`}>
             <div className="text-2xl">
                {notification.type === 'achievement' && '🏆'}
                {notification.type === 'levelUp' && '🚀'}
                {notification.type === 'streak' && '🔥'}
                {notification.type === 'info' && '✨'}
            </div>
            <div>
                <h4 className="font-bold text-white text-sm">{notification.title}</h4>
                <p className="text-xs text-gray-200">{notification.message}</p>
            </div>
        </div>
    );
};


// --- App Component ---
const App: React.FC = () => {
    // Default Profile State
    const defaultProfile: UserProfile = {
        name: '',
        city: '',
        province: '',
        skills: '',
        description: '',
        initialGoal: '',
        discType: '',
        mbtiType: '',
        businessName: '',
        businessType: '',
        businessStage: 'Idea',
        initialCapital: '',
        currentCapital: '',
        goals: '',
        userLevel: 1,
        totalXP: 0,
        currentStreak: 0,
        lastActiveDate: null,
        businessLevel: 1,
        businessXP: 0,
        managerLevel: 1,
        managerXP: 0,
        unlockedAchievements: [],
        stats: {
            totalMessages: 0,
            totalSessions: 0,
            toolsUsed: []
        }
    };

    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.NORMAL);
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [suggestion, setSuggestion] = useState<SmartSuggestion | null>(null);
    
    // Profile State
    const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    // Notification State
    const [notification, setNotification] = useState<AppNotification | null>(null);

    const activeSession = chatSessions.find(s => s.id === activeChatId);

    // --- Live Conversation State ---
    const [isLive, setIsLive] = useState(false);
    const [liveSessionFiles, setLiveSessionFiles] = useState<{ name: string; data: string; mimeType: string; tempId: string }[]>([]);
    const sessionRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const liveFileInputRef = useRef<HTMLInputElement | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const isStoppingRef = useRef(false);

    const showNotification = (title: string, message: string, type: AppNotification['type']) => {
        setNotification({ id: Date.now().toString(), title, message, type });
    };

    // --- Automated Gamification Logic ---
    const checkAndAwardAchievements = (currentProfile: UserProfile, message: string, currentMode: ChatMode) => {
        let newProfile = { ...currentProfile };
        const newUnlockedIds: string[] = [];
        let earnedXP = 0;
        let earnedBusinessXP = 0;
        let earnedManagerXP = 0;

        // --- STREAK LOGIC ---
        const today = new Date().toDateString();
        const lastActive = newProfile.lastActiveDate ? new Date(newProfile.lastActiveDate).toDateString() : null;
        
        // If first time active today
        if (today !== lastActive) {
            newProfile.lastActiveDate = new Date().toISOString();
            
            // Check if yesterday was active
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastActive === yesterday.toDateString()) {
                newProfile.currentStreak += 1;
                showNotification('ادامه زنجیره!', `🔥 شما ${newProfile.currentStreak} روز متوالی فعال بوده‌اید!`, 'streak');
            } else {
                newProfile.currentStreak = 1; // Reset or Start
            }
        }

        // 1. Update Stats
        newProfile.stats.totalMessages += 1;
        if (!newProfile.stats.toolsUsed.includes(currentMode)) {
            newProfile.stats.toolsUsed.push(currentMode);
        }

        // 2. XP for Action
        earnedXP += 15; 
        earnedManagerXP += 10;
        earnedBusinessXP += 5;

        // 3. Check Achievements
        ACHIEVEMENTS_LIST.forEach(achievement => {
            const isUnlocked = newProfile.unlockedAchievements.find(ua => ua.id === achievement.id);
            if (!isUnlocked) {
                let unlocked = false;

                if (achievement.conditionType === 'message_count') {
                    if (newProfile.stats.totalMessages >= achievement.conditionValue) unlocked = true;
                } else if (achievement.conditionType === 'keyword') {
                    const keywords = achievement.conditionValue as string[];
                    if (keywords.some(k => message.toLowerCase().includes(k.toLowerCase()))) unlocked = true;
                } else if (achievement.conditionType === 'manual') {
                     if (typeof achievement.conditionValue === 'string' && achievement.conditionValue === currentMode) unlocked = true;
                } else if (achievement.conditionType === 'streak') {
                    if (newProfile.currentStreak >= achievement.conditionValue) unlocked = true;
                } else if (achievement.conditionType === 'level') {
                    if (newProfile.businessLevel >= achievement.conditionValue) unlocked = true;
                }

                if (unlocked) {
                    newUnlockedIds.push(achievement.id);
                    newProfile.unlockedAchievements.push({ id: achievement.id, unlockedAt: new Date().toISOString() });
                    earnedXP += achievement.xpReward;
                    
                    if (achievement.category === 'financial' || achievement.category === 'growth') {
                         earnedBusinessXP += achievement.xpReward;
                    } else {
                         earnedManagerXP += achievement.xpReward;
                    }

                    showNotification('دستاورد جدید باز شد!', `${achievement.icon} ${achievement.title}`, 'achievement');
                }
            }
        });

        // 4. Update XP Stores
        newProfile.totalXP += earnedXP;
        newProfile.businessXP += earnedBusinessXP;
        newProfile.managerXP += earnedManagerXP;

        // 5. Calculate Levels
        // Global User Level: Sqrt(XP) * 0.1 approx
        const newUserLevel = Math.floor(Math.sqrt(newProfile.totalXP) * 0.2) + 1;
        const newBusinessLevel = Math.min(100, Math.floor(newProfile.businessXP / 200) + 1);
        const newManagerLevel = Math.min(100, Math.floor(newProfile.managerXP / 100) + 1);

        if (newUserLevel > newProfile.userLevel) {
             showNotification('لول آپ!', `تبریک! سطح کلی شما به ${newUserLevel} رسید.`, 'levelUp');
        }
        if (newBusinessLevel > newProfile.businessLevel) {
            showNotification('رشد کسب‌وکار!', `تبریک! سطح کسب‌وکار شما به ${newBusinessLevel} رسید.`, 'levelUp');
        }
        if (newManagerLevel > newProfile.managerLevel) {
            showNotification('رشد مدیریتی!', `تبریک! سطح مدیریت شما به ${newManagerLevel} رسید.`, 'levelUp');
        }

        newProfile.userLevel = newUserLevel;
        newProfile.businessLevel = newBusinessLevel;
        newProfile.managerLevel = newManagerLevel;

        return newProfile;
    };


    const handleNewChat = useCallback(() => {
        const newSession: ChatSession = {
            id: `chat-${Date.now()}`,
            title: 'گفتگوی جدید',
            messages: [],
            chatMode: ChatMode.NORMAL,
        };
        setChatSessions(prev => [newSession, ...prev]);
        setActiveChatId(newSession.id);
        setChatMode(ChatMode.NORMAL);
        setSuggestion(null);
        
        // Update total sessions stat
        setUserProfile(prev => ({
            ...prev,
            stats: { ...prev.stats, totalSessions: prev.stats.totalSessions + 1 }
        }));

        if (window.innerWidth < 768) setIsSidebarOpen(false);
    }, []);

    // Load data from localStorage on initial render
    useEffect(() => {
        try {
            // Load Chats
            const savedSessions = localStorage.getItem('chatSessions');
            if (savedSessions) {
                const parsedSessions = JSON.parse(savedSessions);
                if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
                    setChatSessions(parsedSessions);
                    setActiveChatId(parsedSessions[0].id);
                } else {
                    handleNewChat();
                }
            } else {
                handleNewChat();
            }

            // Load Profile
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                const parsed = JSON.parse(savedProfile);
                // Merge with default to ensure new fields exist
                setUserProfile({ ...defaultProfile, ...parsed, stats: { ...defaultProfile.stats, ...(parsed.stats || {}) } });
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            handleNewChat();
        }
    }, [handleNewChat]);

    // Save to localStorage whenever data changes
    useEffect(() => {
        if (chatSessions.length > 0) {
            localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
        }
    }, [chatSessions]);

    useEffect(() => {
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }, [userProfile]);

     // Sync chatMode with active session's mode
     useEffect(() => {
        if (activeSession) {
            setChatMode(activeSession.chatMode);
        }
    }, [activeSession]);

    const handleSelectChat = (id: string) => {
        setActiveChatId(id);
        setSuggestion(null);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleDeleteChat = (id: string) => {
        setChatSessions(prev => {
            const remainingSessions = prev.filter(session => session.id !== id);
            if (activeChatId === id) {
                if (remainingSessions.length > 0) {
                    setActiveChatId(remainingSessions[0].id);
                } else {
                     setTimeout(handleNewChat, 0);
                }
            }
            if (remainingSessions.length === 0) {
                 localStorage.removeItem('chatSessions');
            }
            return remainingSessions;
        });
    };

    const handleExportChats = () => {
        try {
            const exportData = {
                version: "2.6", 
                date: new Date().toISOString(),
                userProfile: userProfile, 
                sessions: chatSessions
            };
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new window.Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `dr-arvin-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed", e);
            alert("خطا در دانلود فایل.");
        }
    };

    const handleImportChats = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonContent = JSON.parse(e.target?.result as string);
                
                let sessionsToImport: ChatSession[] = [];
                let profileToImport: UserProfile | null = null;

                if (Array.isArray(jsonContent)) {
                    sessionsToImport = jsonContent;
                } else if (jsonContent.sessions && Array.isArray(jsonContent.sessions)) {
                    sessionsToImport = jsonContent.sessions;
                    if (jsonContent.userProfile) {
                        profileToImport = jsonContent.userProfile;
                    }
                }

                if (sessionsToImport.length > 0 || profileToImport) {
                    if (sessionsToImport.length > 0) {
                        const processedSessions = sessionsToImport.map(session => ({
                            ...session,
                            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            title: session.title + ' (بازیابی شده)'
                        }));
                        setChatSessions(prev => [...processedSessions, ...prev]);
                        setActiveChatId(processedSessions[0].id);
                    }
                    
                    if (profileToImport) {
                         setUserProfile(prev => ({
                            ...prev,
                            ...profileToImport,
                            userLevel: Math.max(prev.userLevel, profileToImport?.userLevel || 1),
                            totalXP: Math.max(prev.totalXP, profileToImport?.totalXP || 0),
                            currentStreak: Math.max(prev.currentStreak, profileToImport?.currentStreak || 0),
                            // Ensure arrays/objects are merged correctly, favoring imported for fields but merging lists
                            unlockedAchievements: [
                                ...prev.unlockedAchievements,
                                ...(profileToImport?.unlockedAchievements || []).filter(newUa => !prev.unlockedAchievements.some(oldUa => oldUa.id === newUa.id))
                            ]
                        }));
                        showNotification('موفقیت', 'پروفایل کامل و گفتگوها با موفقیت بازیابی شدند.', 'success');
                    } else {
                         showNotification('موفقیت', 'گفتگوها بازیابی شدند.', 'success');
                    }
                } else {
                    alert("فایل حاوی اطلاعات معتبر نیست.");
                }
            } catch (err) {
                console.error("Import failed", err);
                alert("خطا در خواندن فایل.");
            }
            if (event.target) event.target.value = '';
        };
        reader.readAsText(file);
    };


    const handleSetChatMode = (mode: ChatMode) => {
        setChatMode(mode);
        setSuggestion(null); // Clear suggestion if manual switch
        if (activeChatId) {
            setChatSessions(prev =>
                prev.map(session =>
                    session.id === activeChatId ? { ...session, chatMode: mode } : session
                )
            );
        }
    };
    
    // Apply Suggested Mode
    const handleApplySuggestion = (s: SmartSuggestion) => {
        handleSetChatMode(s.mode);
        setSuggestion(null);
        showNotification('تغییر حالت', `حالت گفتگو به ${s.label} تغییر کرد تا بهترین نتیجه را بگیرید.`, 'info');
    };

    useEffect(() => {
        if (chatMode === ChatMode.MAPS || chatMode === ChatMode.LOCATION_BUSINESS) {
            navigator.geolocation.getCurrentPosition(
                (position) => { setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }); },
                (error) => { console.error("Error getting location:", error); }
            );
        }
    }, [chatMode]);
    
    const updateMessagesInSession = (updateFn: (messages: ChatMessage[]) => ChatMessage[]) => {
        setChatSessions(prev =>
            prev.map(session =>
                session.id === activeChatId
                    ? { ...session, messages: updateFn(session.messages) }
                    : session
            )
        );
    };

    const handleSendMessage = async (message: string, file: { data: string; mimeType: string } | null, aspectRatio: string) => {
        if (!message.trim() && !file) return;
        setIsLoading(true);
        setSuggestion(null); // Clear old suggestion while thinking

        const updatedProfile = checkAndAwardAchievements(userProfile, message, chatMode);
        setUserProfile(updatedProfile);

        const userMessage: ChatMessage = { role: 'user', content: message };
        if (file && (chatMode === ChatMode.IMAGE_EDITING || chatMode === ChatMode.PRO_SALES_CAMPAIGN)) {
            userMessage.imageUrl = `data:${file.mimeType};base64,${file.data}`;
        }
        
        if (activeSession?.messages.length === 0) {
            const newTitle = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            setChatSessions(prev =>
                prev.map(session =>
                    session.id === activeChatId ? { ...session, title: newTitle } : session
                )
            );
        }

        updateMessagesInSession(prev => [...prev, userMessage]);
        
        const modelResponse: ChatMessage = { role: 'model', content: '' };
        
        try {
            const currentHistory = activeSession?.messages || [];

            if (chatMode === ChatMode.PRO_SALES_CAMPAIGN) {
                const ttsMatch = message.match(/^(?:بگو|say|voice|صدا|ویس)\s*[:\s]*(.*)/ims);
                const imageGenMatch = message.match(/^(?:بساز|ساخت|generate|create)\s*(?:image|عکس|تصویر)\s*[:\s]*(.*)/ims);
                
                modelResponse.content = `در حال پردازش درخواست شما...`;
                updateMessagesInSession(prev => [...prev, modelResponse]);

                if (ttsMatch && ttsMatch[1]) {
                    const textToSpeak = ttsMatch[1].trim();
                    updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: `در حال تولید صدا برای: "${textToSpeak}"` } : msg));

                    const base64Audio = await generateSpeech(textToSpeak); // No history needed for just TTS command
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContext.destination);
                    source.start();
                    updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: `صدا تولید و پخش شد.\n\nمتن: ${textToSpeak}` } : msg));
                
                } else if (file && file.mimeType.startsWith('image/')) {
                    updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, isGenerating: 'image', content: `در حال ویرایش تصویر با دستور: "${message}"` } : msg));
                    const editedImageUrl = await editImage(message, file, currentHistory);
                    updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, imageUrl: editedImageUrl, isGenerating: false, content: '' } : msg));
                
                } else if (imageGenMatch && imageGenMatch[1]) {
                    const imagePrompt = imageGenMatch[1].trim();
                     updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, isGenerating: 'image', content: `در حال ساخت تصویر با شرح: "${imagePrompt}"` } : msg));
                    const imageUrl = await generateImage(imagePrompt, aspectRatio, currentHistory);
                    updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, imageUrl, isGenerating: false, content: '' } : msg));
                }
                else {
                    const stream = getChatResponse(currentHistory, message, chatMode, location, file, updatedProfile);
                    let fullResponse = '';
                    for await (const chunk of stream) {
                        fullResponse += chunk;
                        updateMessagesInSession(prev => {
                           const newMessages = [...prev];
                           newMessages[newMessages.length-1].content = fullResponse;
                           return newMessages;
                        });
                    }
                }
            } else {
                 updateMessagesInSession(prev => [...prev, modelResponse]);
                switch (chatMode) {
                    case ChatMode.IMAGE_GENERATION:
                        updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, isGenerating: 'image', content: `در حال ساخت تصویر با شرح: "${message}"` } : msg));
                        const imageUrl = await generateImage(message, aspectRatio, currentHistory);
                        updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, imageUrl, isGenerating: false, content: '' } : msg));
                        break;
                    
                    case ChatMode.IMAGE_EDITING:
                        if (!file) throw new Error("لطفا برای ویرایش، یک تصویر انتخاب کنید.");
                        updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, isGenerating: 'image', content: `در حال ویرایش تصویر با دستور: "${message}"` } : msg));
                        const editedImageUrl = await editImage(message, file, currentHistory);
                        updateMessagesInSession(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, imageUrl: editedImageUrl, isGenerating: false, content: '' } : msg));
                        break;
                    
                    default: // Text-based chat modes
                        const stream = getChatResponse(currentHistory, message, chatMode, location, file, updatedProfile);
                        let fullResponse = '';
                        for await (const chunk of stream) {
                            fullResponse += chunk;
                           updateMessagesInSession(prev => {
                               const newMessages = [...prev];
                               newMessages[newMessages.length-1].content = fullResponse;
                               return newMessages;
                           });
                        }
                        
                        // --- CHECK FOR SMART SUGGESTION ---
                        // Only check if we have a valid response and it's not a special mode
                        if (!file && fullResponse.length > 50) {
                            // We need to pass the updated history (user + model)
                            const updatedHistory = [...currentHistory, userMessage, { role: 'model', content: fullResponse } as ChatMessage];
                            // Don't await this, let it run in background to not block UI
                            getSmartSuggestion(updatedHistory, chatMode).then(sugg => {
                                if (sugg) setSuggestion(sugg);
                            });
                        }
                }
            }
        } catch (error: any) {
            console.error("Error sending message:", error);
            const errorMessage = error.message?.includes("entity was not found") 
                ? "کلید API نامعتبر است. لطفا دوباره انتخاب کنید. aistudio.google.com/app/apikey"
                : "متاسفانه خطایی رخ داد. لطفا دوباره تلاش کنید.";
            updateMessagesInSession(prev => {
                const newMessages = [...prev];
                const lastMsgIndex = newMessages.length - 1;
                newMessages[lastMsgIndex] = { ...newMessages[lastMsgIndex], content: errorMessage, isGenerating: false };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- UPDATED TTS FUNCTION (GEMINI API) ---
    // This replaces the unreliable window.speechSynthesis
    const handlePlayAudio = useCallback(async (text: string) => {
        try {
            // Remove markdown symbols for cleaner speech
            const cleanText = text
                .replace(/[#*`_~>]/g, '') 
                .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                .trim();

            if (!cleanText) return;

            // Generate Speech via API
            const base64Audio = await generateSpeech(cleanText);
            
            // Decode and Play
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

        } catch (error) {
            console.error("Audio playback error:", error);
            alert("خطا در دریافت صدا. لطفاً اتصال اینترنت خود را بررسی کنید.");
        }
    }, []);

    const stopLiveConversation = useCallback(() => {
        if (isStoppingRef.current) return;
        isStoppingRef.current = true;

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current?.state !== 'closed') {
            inputAudioContextRef.current?.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current?.state !== 'closed') {
            outputAudioContextRef.current?.close();
            outputAudioContextRef.current = null;
        }
        if (sessionRef.current) {
            sessionRef.current.then(session => session.close());
            sessionRef.current = null;
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsLive(false);
        setTimeout(() => { isStoppingRef.current = false; }, 500);
    }, []);

    const startLiveConversation = useCallback(async () => {
        if (isLive) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                } 
            });
            mediaStreamRef.current = stream;

            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            const getLiveSystemInstruction = (mode: ChatMode): string => {
                switch(mode) {
                    case ChatMode.HERO_PATH_AUDIO:
                        return HERO_PATH_AUDIO_SYSTEM_INSTRUCTION;
                    case ChatMode.LIVE_CONVERSATION:
                    default:
                        return LIVE_SYSTEM_INSTRUCTION;
                }
            };

            const sessionPromise = getLiveSession().connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log('Live session opened.');
                        setIsLive(true);
                        
                        if (liveSessionFiles.length > 0) {
                            sessionPromise.then((session) => {
                                for (const file of liveSessionFiles) {
                                    session.sendRealtimeInput({
                                        media: { data: file.data, mimeType: file.mimeType },
                                    });
                                }
                            });
                        }

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmData = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmData });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            updateMessagesInSession(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage?.role === 'user' && !message.serverContent?.turnComplete) {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1] = {...lastMessage, content: (lastMessage.content || '') + text};
                                    return newMessages;
                                }
                                return [...prev, { role: 'user', content: text }];
                            });
                        }

                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                             updateMessagesInSession(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage?.role === 'model' && !message.serverContent?.turnComplete) {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1] = {...lastMessage, content: (lastMessage.content || '') + text};
                                    return newMessages;
                                }
                                 return [...prev, { role: 'model', content: text }];
                            });
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const sourceNode = outputAudioContextRef.current.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputAudioContextRef.current.destination);
                            sourceNode.onended = () => sourcesRef.current.delete(sourceNode);
                            sourceNode.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(sourceNode);
                        }
                        
                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(s => s.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        stopLiveConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live session closed.');
                        stopLiveConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
                    systemInstruction: getLiveSystemInstruction(chatMode),
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });
            sessionRef.current = sessionPromise;

        } catch (error) {
            console.error('Failed to start live conversation:', error);
            stopLiveConversation();
        }
    }, [isLive, stopLiveConversation, liveSessionFiles, chatMode]);
    
    useEffect(() => {
        const isLiveModeActive = chatMode === ChatMode.LIVE_CONVERSATION || chatMode === ChatMode.HERO_PATH_AUDIO;
        if (!isLiveModeActive && isLive) {
            stopLiveConversation();
        }
        return () => {
            if (isLive) stopLiveConversation();
        };
    }, [chatMode, isLive, stopLiveConversation]);
    
    const handleLiveButtonClick = () => {
        if (isLive) {
            stopLiveConversation();
        } else {
            startLiveConversation();
        }
    };

    const handleLiveFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles) return;

        for (const file of Array.from(selectedFiles) as File[]) {
            const tempId = `${file.name}-${Date.now()}`;
            setLiveSessionFiles(prev => [...prev, { name: `در حال پردازش: ${file.name}`, data: '', mimeType: '', tempId }]);

            try {
                let processedFile: { data: string; mimeType: string };
                if (file.type.startsWith('video/')) {
                    processedFile = await extractVideoFrame(file);
                } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                    processedFile = await readFileAsBase64(file);
                } else {
                    throw new Error('Unsupported file type');
                }
                setLiveSessionFiles(prev => prev.map(f => f.tempId === tempId ? { ...f, ...processedFile, name: file.name } : f));
            } catch (error) {
                console.error("Error processing file:", file.name, error);
                setLiveSessionFiles(prev => prev.filter(f => f.tempId !== tempId));
            }
        }
        if (liveFileInputRef.current) liveFileInputRef.current.value = '';
    };

    const handleRemoveLiveFile = (tempId: string) => {
        setLiveSessionFiles(prev => prev.filter(f => f.tempId !== tempId));
    };
    
    const handleLiveAttachClick = () => {
        liveFileInputRef.current?.click();
    };

    const isLiveModeActive = chatMode === ChatMode.LIVE_CONVERSATION || chatMode === ChatMode.HERO_PATH_AUDIO;

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-950 selection:bg-indigo-500/30 overflow-hidden">
             {notification && <NotificationToast notification={notification} onClose={() => setNotification(null)} />}
             
            {/* Background Layers */}
             <div className="fixed inset-0 z-0 pointer-events-none">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2532&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/50"></div>
                 <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
                 <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] mix-blend-screen"></div>
            </div>

            <div className="relative z-10 flex flex-1 overflow-hidden backdrop-blur-[1px]">
                <Sidebar 
                    chatMode={chatMode} 
                    setChatMode={handleSetChatMode} 
                    isOpen={isSidebarOpen} 
                    setIsOpen={setIsSidebarOpen}
                    chatSessions={chatSessions}
                    activeChatId={activeChatId}
                    onNewChat={handleNewChat}
                    onSelectChat={handleSelectChat}
                    onDeleteChat={handleDeleteChat}
                    onExportChats={handleExportChats}
                    onImportChats={handleImportChats}
                />
                
                {/* Main Content Column */}
                <div className="flex flex-col flex-1 min-w-0 relative">
                    <Header 
                        onMenuClick={() => setIsSidebarOpen(true)} 
                        onProfileClick={() => setIsProfileOpen(true)}
                        userProfile={userProfile}
                        suggestion={suggestion}
                        onApplySuggestion={handleApplySuggestion}
                    />
                    
                    {/* Chat Area */}
                    <div className="flex-1 overflow-hidden relative">
                         <ChatWindow messages={activeSession?.messages || []} onPlayAudio={handlePlayAudio} />
                         
                         {/* Live Controls or Input Bar */}
                         {isLiveModeActive ? (
                            <div className="absolute bottom-0 left-0 right-0 z-20 flex-shrink-0 p-4 mx-2 mb-2 lg:mx-8 lg:mb-6 animate-slideUp pointer-events-none">
                                <div className="pointer-events-auto bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                    <div className="flex flex-col items-center justify-center gap-5 relative z-10">
                                        {!isLive && (
                                            <div className="w-full max-w-lg text-center space-y-3">
                                                <input
                                                    type="file"
                                                    ref={liveFileInputRef}
                                                    onChange={handleLiveFileChange}
                                                    className="hidden"
                                                    accept="image/*,video/mp4,video/webm,application/pdf"
                                                    multiple
                                                />
                                                {liveSessionFiles.length > 0 && (
                                                    <div className="flex flex-wrap justify-center gap-2">
                                                        {liveSessionFiles.map(file => (
                                                            <div key={file.tempId} className="flex items-center bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs text-gray-200 shadow-sm backdrop-blur-md">
                                                                <span className="truncate max-w-xs">{file.name}</span>
                                                                <button 
                                                                    onClick={() => handleRemoveLiveFile(file.tempId)}
                                                                    className="mr-2 text-red-400 hover:text-red-300 font-bold p-0.5"
                                                                    aria-label={`Remove ${file.name}`}
                                                                >&times;</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={handleLiveAttachClick}
                                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-300 hover:text-white transition-all duration-300 shadow-inner group/attach"
                                                    aria-label="Attach files for live conversation"
                                                >
                                                    <AttachmentIcon />
                                                    <span className="group-hover/attach:tracking-wide transition-all">ضمیمه کردن فایل برای مکالمه</span>
                                                </button>
                                            </div>
                                        )}

                                        <div className="relative">
                                            <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${isLive ? 'bg-red-500/40 scale-150 animate-pulseSlow' : 'bg-emerald-500/20 scale-100'}`}></div>
                                            <button
                                                onClick={handleLiveButtonClick}
                                                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_0_40px_rgba(0,0,0,0.4)] border-4 border-white/5 relative z-10 ${
                                                    isLive 
                                                    ? 'bg-gradient-to-br from-red-600 to-rose-600 hover:scale-105 shadow-red-900/50' 
                                                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-105 shadow-emerald-900/50'
                                                }`}
                                                aria-label={isLive ? 'Stop Conversation' : 'Start Conversation'}
                                            >
                                                {isLive ? <StopIcon /> : <MicIcon />}
                                            </button>
                                        </div>
                                        
                                        <p className={`text-sm font-medium tracking-wide transition-colors ${isLive ? 'text-red-200 animate-pulse' : 'text-emerald-200/80'}`}>
                                            {isLive ? 'دکتر آروین در حال گوش دادن است...' : 'برای شروع مکالمه زنده ضربه بزنید'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <InputBar onSendMessage={handleSendMessage} isLoading={isLoading} chatMode={chatMode} />
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            <ProfileModal 
                isOpen={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)} 
                profile={userProfile}
                onSave={setUserProfile}
            />
        </div>
    );
};

export default App;
