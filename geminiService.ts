
import { GoogleGenAI, Part, GenerateContentParameters, Modality, Content, Schema, Type } from "@google/genai";
import { ChatMessage, ChatMode, UserProfile, SmartSuggestion } from "../types.ts";
import { 
    SYSTEM_INSTRUCTION, 
    HERO_PATH_CHAT_SYSTEM_INSTRUCTION, 
    HERO_PATH_AUDIO_SYSTEM_INSTRUCTION, 
    HERO_SKILL_SYSTEM_INSTRUCTION, 
    PRO_SALES_CAMPAIGN_SYSTEM_INSTRUCTION, 
    TOP_INVESTOR_SYSTEM_INSTRUCTION, 
    GUIDE_SYSTEM_INSTRUCTION, 
    COMPANY_ANALYSIS_SYSTEM_INSTRUCTION, 
    LIVE_SYSTEM_INSTRUCTION,
    LOCATION_BUSINESS_SYSTEM_INSTRUCTION,
    ADVANCED_NETWORKING_SYSTEM_INSTRUCTION,
    IRAN_NEGOTIATION_SYSTEM_INSTRUCTION,
    PRODUCT_INCUBATION_SYSTEM_INSTRUCTION,
    CREATIVE_IDEAS_SYSTEM_INSTRUCTION,
    SALES_BOOST_SYSTEM_INSTRUCTION,
    BOOK_ANALYSIS_SYSTEM_INSTRUCTION,
    YOUTUBE_ANALYSIS_SYSTEM_INSTRUCTION,
    PROMPT_ENGINEERING_SYSTEM_INSTRUCTION,
    ACHIEVEMENTS_LIST 
} from "../constants.ts";

let ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const reinitializeGoogleGenAI = () => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const getLiveSession = () => {
    return ai.live;
}

function getSystemInstruction(mode: ChatMode, profile?: UserProfile): string {
    let baseInstruction = '';
    
    // Exact Mapping for EVERY mode to ensure no generic fallback for specialized tools
    switch(mode) {
        case ChatMode.HERO_PATH_CHAT: baseInstruction = HERO_PATH_CHAT_SYSTEM_INSTRUCTION; break;
        case ChatMode.HERO_PATH_AUDIO: baseInstruction = HERO_PATH_AUDIO_SYSTEM_INSTRUCTION; break;
        case ChatMode.HERO_SKILL: baseInstruction = HERO_SKILL_SYSTEM_INSTRUCTION; break;
        case ChatMode.PRO_SALES_CAMPAIGN: baseInstruction = PRO_SALES_CAMPAIGN_SYSTEM_INSTRUCTION; break;
        case ChatMode.TOP_INVESTOR: baseInstruction = TOP_INVESTOR_SYSTEM_INSTRUCTION; break;
        case ChatMode.COMPANY_ANALYSIS: baseInstruction = COMPANY_ANALYSIS_SYSTEM_INSTRUCTION; break;
        case ChatMode.GUIDE_MODE: baseInstruction = GUIDE_SYSTEM_INSTRUCTION; break;
        case ChatMode.LIVE_CONVERSATION: baseInstruction = LIVE_SYSTEM_INSTRUCTION; break;
        case ChatMode.PROMPT_ENGINEERING: baseInstruction = PROMPT_ENGINEERING_SYSTEM_INSTRUCTION; break; // New
        
        // New Specialized Mappings
        case ChatMode.LOCATION_BUSINESS: baseInstruction = LOCATION_BUSINESS_SYSTEM_INSTRUCTION; break;
        case ChatMode.ADVANCED_NETWORKING: baseInstruction = ADVANCED_NETWORKING_SYSTEM_INSTRUCTION; break;
        case ChatMode.IRAN_NEGOTIATION: baseInstruction = IRAN_NEGOTIATION_SYSTEM_INSTRUCTION; break;
        case ChatMode.PRODUCT_INCUBATION: baseInstruction = PRODUCT_INCUBATION_SYSTEM_INSTRUCTION; break;
        case ChatMode.CREATIVE_IDEAS: baseInstruction = CREATIVE_IDEAS_SYSTEM_INSTRUCTION; break;
        case ChatMode.SALES_BOOST: baseInstruction = SALES_BOOST_SYSTEM_INSTRUCTION; break;
        case ChatMode.BOOK_ANALYSIS: baseInstruction = BOOK_ANALYSIS_SYSTEM_INSTRUCTION; break;
        case ChatMode.YOUTUBE_ANALYSIS: baseInstruction = YOUTUBE_ANALYSIS_SYSTEM_INSTRUCTION; break;
        
        case ChatMode.MAPS: baseInstruction = LOCATION_BUSINESS_SYSTEM_INSTRUCTION; break; // Use Location logic for Maps too

        default: baseInstruction = SYSTEM_INSTRUCTION;
    }

    // --- 1. STRICT CONTEXT & PERSONA ENFORCEMENT ---
    const contextEnforcement = `
    
    =========== SYSTEM OVERRIDE: ACTIVE MODE CHANGED ===========
    CURRENT ACTIVE MODE: **"${mode}"**
    
    **INSTRUCTIONS:**
    1. **IGNORE** any persona or behavioral constraints from previous turns in the conversation history if they conflict with the current mode.
    2. **ADOPT** the persona, expertise, and tone defined in the "System Instructions" below IMMEDIATELY.
    3. **RETAIN DATA:** Do NOT forget the user's business details, numbers, or previous topics discussed in the history. Use them as context.
    4. **GOAL:** Continue the conversation seamlessly using the historical data, but process it strictly through the lens of the "${mode}" framework.
    
    ============================================================
    `;

    // --- 2. USER PROFILE INJECTION ---
    let profileContext = '';
    if (profile) {
        const unlockedTitles = ACHIEVEMENTS_LIST
            .filter(a => profile.unlockedAchievements.some(ua => ua.id === a.id))
            .map(a => a.title)
            .join(', ');

        profileContext = `
        **👤 USER PROFILE CONTEXT:**
        - Name: ${profile.name || 'User'}
        - Location: ${profile.city || ''}, ${profile.province || ''} (Iran)
        - Psychology: MBTI: ${profile.mbtiType || 'Unknown'} | DISC: ${profile.discType || 'Unknown'}
        - Skills: ${profile.skills || 'N/A'}
        - Bio: ${profile.description || 'N/A'}
        - Goal: ${profile.initialGoal || 'N/A'}
        
        **🏢 BUSINESS CONTEXT:**
        - Name: ${profile.businessName || 'N/A'}
        - Type: ${profile.businessType || 'N/A'}
        - Stage: ${profile.businessStage || 'N/A'}
        - Capital (Initial/Current): ${profile.initialCapital || 'N/A'} / ${profile.currentCapital || 'N/A'}
        
        **🎮 PROGRESS:**
        - Level: User Lvl ${profile.userLevel}, Business Lvl ${profile.businessLevel}
        - Achievements: ${unlockedTitles || 'None'}

        **ADAPTATION INSTRUCTIONS:**
        - Use '${profile.province}' for local laws/market analysis.
        - Adapt tone to '${profile.discType}' and '${profile.mbtiType}'.
        - Respect budget limit: '${profile.currentCapital}'.
        `;
    }

    return contextEnforcement + baseInstruction + profileContext;
}

export async function* getChatResponse(
    history: ChatMessage[],
    message: string,
    mode: ChatMode,
    location: { latitude: number; longitude: number } | null,
    file: { data: string; mimeType: string } | null,
    profile?: UserProfile
): AsyncGenerator<string, void, undefined> {

    const model = 'gemini-3-pro-preview'; 
    const messageParts: Part[] = [{ text: message }];
    if (file) {
        messageParts.unshift({
            inlineData: {
                mimeType: file.mimeType,
                data: file.data,
            },
        });
    }

    const contents = [
        ...history.map(msg => ({
            role: (msg.role === 'user' || msg.role === 'model') ? msg.role : 'user',
            parts: [{ text: msg.content }]
        })),
        {
            role: 'user' as const,
            parts: messageParts
        }
    ];

    let temperature = 1.6;
    if (
        mode === ChatMode.CREATIVE_IDEAS ||
        mode === ChatMode.PRODUCT_INCUBATION ||
        mode === ChatMode.SALES_BOOST ||
        mode === ChatMode.PRO_SALES_CAMPAIGN ||
        mode === ChatMode.PROMPT_ENGINEERING
    ) {
        temperature = 2.0;
    } else if (mode === ChatMode.COMPANY_ANALYSIS) {
        temperature = 1.4;
    }

    const request: GenerateContentParameters = {
        model,
        contents,
        config: {
            systemInstruction: getSystemInstruction(mode, profile),
            thinkingConfig: { thinkingBudget: 32768 }, 
            temperature: temperature,
            topP: 0.95,
            topK: 64,
        },
    };

    if (mode === ChatMode.MAPS || mode === ChatMode.LOCATION_BUSINESS) {
        request.config.tools = [{ googleMaps: {} }];
        if (location) {
            request.config.toolConfig = {
                retrievalConfig: { latLng: location }
            };
        }
    } else {
        request.config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContentStream(request);
    for await (const chunk of response) {
        if (chunk.text) {
            yield chunk.text;
        }
    }
}

// --- SMART SUGGESTION SERVICE ---
export const getSmartSuggestion = async (history: ChatMessage[], currentMode: ChatMode): Promise<SmartSuggestion | null> => {
    if (history.length < 2) return null;

    const recentMessages = history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
    const availableModes = Object.values(ChatMode).filter(m => m !== currentMode && m !== ChatMode.GUIDE_MODE).join(', ');

    const prompt = `
    Analyze this conversation history strictly to recommend the SINGLE BEST tool (ChatMode) to use next.
    Context: ${recentMessages}
    Available Modes: ${availableModes}
    Rules:
    1. Prices/Money -> FINANCE or TOP_INVESTOR
    2. Negotiation -> IRAN_NEGOTIATION
    3. Logo/Visual -> IMAGE_GENERATION
    4. Location/City -> LOCATION_BUSINESS or MAPS
    5. Brainstorming -> CREATIVE_IDEAS
    6. Testing Failure -> COMPANY_ANALYSIS
    7. Growth/Sales -> SALES_BOOST
    8. Networking -> ADVANCED_NETWORKING
    9. Writing Prompts -> PROMPT_ENGINEERING
    
    Output JSON: { "recommendedMode": "Enum Value", "reason": "Short Persian reason", "label": "Short Persian Action Label" }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendedMode: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        label: { type: Type.STRING }
                    }
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);
            if (Object.values(ChatMode).includes(result.recommendedMode)) {
                return {
                    mode: result.recommendedMode as ChatMode,
                    reason: result.reason,
                    label: result.label
                };
            }
        }
        return null;
    } catch (e) {
        console.error("Smart suggestion error", e);
        return null;
    }
};

// --- IMAGE GENERATION ---
export const generateImage = async (prompt: string, aspectRatio: string, history: ChatMessage[]) => {
    // 1. Refine prompt
    const refinementResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Enhance this image prompt for a high-quality, photorealistic generation. Context: ${JSON.stringify(history.slice(-2))}. User Prompt: "${prompt}". Output ONLY the English prompt.`,
    });
    const refinedPrompt = refinementResponse.text || prompt;

    // 2. Generate
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: refinedPrompt }] },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio,
                imageSize: "1K"
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Failed to generate image");
};

// --- IMAGE EDITING ---
export const editImage = async (prompt: string, file: { data: string; mimeType: string }, history: ChatMessage[]) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: file.mimeType, data: file.data } },
                { text: prompt }
            ]
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Failed to edit image");
};

// --- SPEECH GENERATION (TTS) ---
export const generateSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is often good for deeper tones, Puck for lighter.
                },
            },
        },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
        throw new Error("No audio data received from Gemini TTS");
    }
    return audioData;
};
