
import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { SendIcon, AttachmentIcon, LoadingIcon, SmallMicIcon } from './icons.tsx';
import { ChatMode } from '../types.ts';

interface InputBarProps {
    onSendMessage: (message: string, file: { data: string; mimeType: string } | null, aspectRatio: string) => void;
    isLoading: boolean;
    chatMode: ChatMode;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading, chatMode }) => {
    const [input, setInput] = useState('');
    const [file, setFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [isFocused, setIsFocused] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        const hasFileInput = file && (chatMode === ChatMode.IMAGE_EDITING || chatMode === ChatMode.FILE_ANALYSIS || chatMode === ChatMode.PRO_SALES_CAMPAIGN || chatMode === ChatMode.TOP_INVESTOR);
        if (isLoading || (!input.trim() && !hasFileInput)) return;
        
        onSendMessage(input, file ? { data: file.data, mimeType: file.mimeType } : null, aspectRatio);
        setInput('');
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const base64String = (loadEvent.target?.result as string).split(',')[1];
                if (base64String) {
                    setFile({ name: selectedFile.name, data: base64String, mimeType: selectedFile.type });
                }
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    // --- Voice Input Logic ---
    const handleVoiceInput = () => {
        if (isListening) {
            // Usually stopping happens automatically on silence, but for toggle:
            // Since we can't easily grab the active instance here without ref, we rely on browser events
            // or just let user know to be quiet. But typically SpeechRecognition stops on its own.
            // For this UI, we treat click as "Start". To "Stop" manually is complex without ref.
            // But let's implementing a simple "Stop" if supported.
            setIsListening(false);
            return; 
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("مرورگر شما از قابلیت تبدیل صدا به متن پشتیبانی نمی‌کند. لطفا از کروم استفاده کنید.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fa-IR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };


    const getPlaceholder = () => {
        switch(chatMode) {
            case ChatMode.GUIDE_MODE: return "چه کاری می‌خواهید انجام دهید؟ من راهنمایی‌تان می‌کنم...";
            case ChatMode.IMAGE_GENERATION: return "تصویری که در ذهن دارید را توصیف کنید...";
            case ChatMode.IMAGE_EDITING: return "دستور ویرایش را بنویسید...";
            case ChatMode.HERO_SKILL: return "چه مهارتی را می‌خواهید یاد بگیرید؟";
            default: return isListening ? "در حال گوش دادن..." : "پیام خود را بنویسید (یا صحبت کنید)...";
        }
    };

    const getAcceptTypes = () => {
        switch(chatMode) {
            case ChatMode.IMAGE_EDITING:
            case ChatMode.PRO_SALES_CAMPAIGN:
            case ChatMode.TOP_INVESTOR:
                return "image/*";
            case ChatMode.FILE_ANALYSIS:
                return "application/pdf,.txt,.csv";
            default:
                return "image/*,video/*,application/pdf,.txt,.csv";
        }
    };
    
    const showAttachmentButton = ![ChatMode.IMAGE_GENERATION].includes(chatMode);

    let availableRatios: { value: string; label: string }[] = [];
    if (chatMode === ChatMode.PRO_SALES_CAMPAIGN || chatMode === ChatMode.IMAGE_GENERATION) {
        availableRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"].map(r => ({ value: r, label: r }));
    }

    return (
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 z-20 transition-all duration-300">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
                {/* Aspect Ratio Selector */}
                {availableRatios.length > 0 && (
                     <div className="flex justify-center items-center gap-2 animate-fadeIn mb-1">
                        {availableRatios.map(ratio => (
                            <button 
                                key={ratio.value} 
                                onClick={() => setAspectRatio(ratio.value)} 
                                className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-full transition-all border ${
                                    aspectRatio === ratio.value 
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] scale-105' 
                                    : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-700 backdrop-blur-sm'
                                }`}
                            >
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                )}
               
                {/* Floating Input Container */}
                <div 
                    className={`relative bg-gray-900/60 backdrop-blur-2xl border transition-all duration-300 rounded-[28px] shadow-2xl flex flex-col ${
                        isFocused ? 'border-indigo-500/50 shadow-indigo-500/10 ring-1 ring-indigo-500/20' : 'border-white/10 shadow-black/50'
                    }`}
                >
                    
                    {/* File Preview */}
                    {file && (
                        <div className="absolute bottom-full left-6 mb-2 p-2 bg-gray-800/90 backdrop-blur-md border border-white/10 text-white text-xs rounded-xl flex items-center shadow-lg animate-slideUp">
                            <span className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center mr-2 text-indigo-300">📎</span>
                            <span className="max-w-[150px] truncate font-medium text-gray-200">{file.name}</span>
                            <button onClick={() => setFile(null)} className="mr-3 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors">&times;</button>
                        </div>
                    )}

                    <div className="flex items-end px-3 py-3 gap-2">
                         {/* Attachment Button */}
                         {showAttachmentButton && (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={getAcceptTypes()} />
                                <button
                                    onClick={handleAttachClick}
                                    className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
                                        file ? 'text-indigo-400 bg-indigo-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                    disabled={isLoading}
                                    aria-label="Attach file"
                                >
                                    <AttachmentIcon />
                                </button>
                            </>
                        )}

                        {/* Mic Button (Voice to Text) */}
                         <button
                            onClick={handleVoiceInput}
                            className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
                                isListening 
                                ? 'text-red-500 bg-red-500/10 animate-pulse' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                            disabled={isLoading}
                            aria-label="Voice input"
                        >
                            <SmallMicIcon />
                        </button>

                        {/* Text Area */}
                        <textarea
                            className="flex-1 bg-transparent text-gray-100 text-base py-3 px-2 resize-none focus:outline-none placeholder-gray-500/80 leading-relaxed"
                            placeholder={getPlaceholder()}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            rows={1}
                            disabled={isLoading}
                            style={{ minHeight: '48px', maxHeight: '150px' }}
                        />

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            className={`p-3 rounded-full transition-all duration-300 transform flex-shrink-0 flex items-center justify-center ${
                                (input.trim() || file) && !isLoading
                                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-110 hover:shadow-indigo-500/50'
                                    : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={isLoading || (!input.trim() && !file)}
                            aria-label="Send message"
                        >
                            {isLoading ? <LoadingIcon /> : <SendIcon />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputBar;
