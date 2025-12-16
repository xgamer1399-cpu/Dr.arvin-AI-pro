
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types.ts';
import Message from './Message.tsx';

interface ChatWindowProps {
    messages: ChatMessage[];
    onPlayAudio: (text: string) => Promise<void>;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onPlayAudio }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <main className="absolute inset-0 overflow-y-auto px-3 md:px-0 pt-4 pb-32 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="max-w-4xl mx-auto space-y-8 px-2 md:px-8">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-0 animate-fadeIn delay-100 fill-forwards">
                         <div className="relative group cursor-default">
                             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                             <div className="w-28 h-28 bg-gray-900/50 backdrop-blur-2xl rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                                <span className="text-6xl drop-shadow-lg filter grayscale-0">👋</span>
                             </div>
                         </div>
                        
                        <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-4 tracking-tight">سلام! چطور می‌توانم کمک کنم؟</h3>
                        <p className="text-gray-400 max-w-lg text-lg leading-relaxed font-light">
                            من <span className="text-indigo-300 font-medium">دکتر آروین</span> هستم، دستیار هوشمند کسب‌وکار شما.<br/>
                            <span className="text-sm text-gray-500 mt-4 block bg-white/5 py-2 px-4 rounded-full border border-white/5 inline-block backdrop-blur-sm">
                                برای شروع، یکی از ابزارهای منو را انتخاب کنید یا پروفایل خود را تکمیل کنید.
                            </span>
                        </p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <Message key={index} message={msg} onPlayAudio={onPlayAudio} />
                ))}
                <div ref={messagesEndRef} className="h-4" />
            </div>
        </main>
    );
};

export default ChatWindow;
