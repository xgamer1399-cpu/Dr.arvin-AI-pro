
import React, { useState } from 'react';
import { ChatMessage } from '../types.ts';
import { UserIcon, BotIcon, PlayIcon } from './icons.tsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
    message: ChatMessage;
    onPlayAudio: (text: string) => Promise<void>;
}

const Message: React.FC<MessageProps> = ({ message, onPlayAudio }) => {
    const isModel = message.role === 'model';
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    const handlePlayClick = async () => {
        if (!message.content) return;
        setIsLoadingAudio(true);
        try {
            await onPlayAudio(message.content);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const renderContent = () => {
        if (message.isGenerating) {
            const generatingText = message.isGenerating === 'image' 
                ? 'در حال ساخت تصویر...' 
                : 'در حال ساخت ویدیو...';
            return (
                <div className="flex flex-col items-center justify-center p-6 gap-4 min-w-[220px]">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm font-medium text-indigo-200 animate-pulse tracking-wide">{generatingText}</p>
                    {message.content && <p className="text-xs text-indigo-400/70 text-center max-w-xs truncate">{message.content}</p>}
                </div>
            );
        }

        if (message.imageUrl) {
            return (
                <div className="relative group overflow-hidden rounded-xl mt-1 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                    <img src={message.imageUrl} alt="Generated" className="w-full max-w-md h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
                    <a href={message.imageUrl} download="image.jpg" className="absolute bottom-4 right-4 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all font-bold translate-y-2 group-hover:translate-y-0">دانلود تصویر</a>
                </div>
            );
        }
        if (message.videoUrl) {
            return <video src={message.videoUrl} controls className="rounded-xl w-full max-w-md h-auto shadow-2xl mt-1 border border-white/10" />;
        }
        if (message.content) {
            return (
                <div className={`
                    prose prose-sm md:prose-base prose-invert max-w-none 
                    prose-p:leading-8 prose-p:text-gray-200 prose-p:my-2
                    prose-headings:text-indigo-300 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                    prose-ul:my-2 prose-li:my-1 prose-li:marker:text-gray-500
                    prose-strong:text-white prose-strong:font-bold
                    prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                    prose-code:text-yellow-200 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[0.9em] prose-code:border prose-code:border-white/10
                    prose-pre:bg-gray-950/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-4 prose-pre:shadow-inner
                    prose-blockquote:border-r-4 prose-blockquote:border-indigo-500/50 prose-blockquote:bg-indigo-500/5 prose-blockquote:pr-4 prose-blockquote:py-1 prose-blockquote:rounded-l-lg
                    break-words text-right
                `}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
            );
        }
        // Typing indicator
        return (
            <div className="flex items-center gap-1.5 h-6 px-2">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
            </div>
        );
    };

    return (
        <div className={`flex w-full ${!isModel ? 'justify-end' : 'justify-start'} group animate-fadeIn`} dir="ltr">
             <div className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[75%] items-start gap-4 ${!isModel ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg mt-1 relative z-10 ${
                    isModel ? 'bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 ring-2 ring-indigo-500/30' : 'bg-gradient-to-br from-fuchsia-600 to-purple-600 ring-2 ring-fuchsia-500/30'
                }`}>
                    {isModel ? <BotIcon /> : <UserIcon />}
                </div>

                {/* Bubble */}
                <div className={`relative px-6 py-5 shadow-lg text-sm md:text-base overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                    isModel
                        ? 'bg-gray-900/60 backdrop-blur-xl border border-white/10 text-gray-100 rounded-3xl rounded-tl-none hover:border-white/20'
                        : 'bg-gradient-to-br from-indigo-600/90 to-purple-700/90 backdrop-blur-md text-white rounded-3xl rounded-tr-none border border-white/10 shadow-indigo-900/20'
                }`}>
                    {/* Content Wrapper */}
                    <div className="relative z-10 w-full" dir="rtl">
                         {renderContent()}
                    </div>

                    {/* Audio Play Button for Bot - Adjusted for better visibility on mobile */}
                    {isModel && message.content && !message.imageUrl && !message.videoUrl && !message.isGenerating && (
                        <div className="absolute top-3 left-3 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-x-0 md:translate-x-2 md:group-hover:translate-x-0">
                             <button 
                                onClick={handlePlayClick}
                                disabled={isLoadingAudio}
                                className={`p-2 rounded-full text-white transition-all backdrop-blur-md border border-white/10 ${
                                    isLoadingAudio 
                                    ? 'bg-indigo-500/20 cursor-wait' 
                                    : 'bg-white/5 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/40'
                                }`}
                                title="پخش صوتی"
                            >
                                {isLoadingAudio ? (
                                     <svg className="animate-spin h-4 w-4 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <PlayIcon />
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Message;
