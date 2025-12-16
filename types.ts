
export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  translation?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isLoading?: boolean;
  isGenerating?: 'image' | 'video' | false;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  conditionType: 'message_count' | 'keyword' | 'manual' | 'streak' | 'level';
  conditionValue?: any;
  category?: 'beginner' | 'financial' | 'growth' | 'mastery';
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO Date
}

export interface UserStats {
  totalMessages: number;
  totalSessions: number;
  toolsUsed: string[];
}

export interface UserProfile {
  // Personal Info
  name: string;
  city: string;
  province: string;
  skills: string;
  description: string; 
  initialGoal: string; 
  
  // Psychology
  discType: string;
  mbtiType: string;

  // Business Info
  businessName: string;
  businessType: string;
  businessStage: string; // Idea, MVP, Traction, Scaling, Established
  initialCapital: string; 
  currentCapital: string;
  goals: string; // Long term goals
  
  // Gamification State
  userLevel: number; // Global Level
  totalXP: number;   // Global XP
  currentStreak: number;
  lastActiveDate: string | null; // ISO Date string for streak tracking
  
  businessLevel: number; 
  businessXP: number;
  managerLevel: number; 
  managerXP: number;
  
  // Collections
  unlockedAchievements: UnlockedAchievement[];
  stats: UserStats;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  chatMode: ChatMode;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'achievement' | 'levelUp' | 'streak';
}

export interface SmartSuggestion {
  mode: ChatMode;
  reason: string;
  label: string;
}

export enum ChatMode {
  // Guide Mode
  GUIDE_MODE = 'راهنمای هوشمند',
  
  // Normal Modes
  NORMAL = 'استراتژی عادی',
  THINKING = 'تحلیل عمیق',
  COMPANY_ANALYSIS = 'تحلیل آزمایشگاهی محصول',
  SEARCH = 'جستجوی وب',
  MAPS = 'جستجوی نقشه',
  FILE_ANALYSIS = 'تحلیل فایل',
  YOUTUBE_ANALYSIS = 'تحلیل یوتیوب',
  BOOK_ANALYSIS = 'تحلیل کتاب',
  SALES_BOOST = 'افزایش فروش تخصصی',
  LOCATION_BUSINESS = 'کسب‌وکار منطقه‌ای',
  CREATIVE_IDEAS = 'ایده‌های خلاق',
  FINANCE = 'مشاوره مالی',
  ADVANCED_NETWORKING = 'شبکه سازی پیشرفته',
  IRAN_NEGOTIATION = 'آموزش مذاکره حرفه‌ای',
  PRODUCT_INCUBATION = 'پرورش محصول',
  PROMPT_ENGINEERING = 'مهندسی پرامپت', // New Mode
  // New Hero's Path Modes
  HERO_PATH_CHAT = 'مسیر قهرمان (چت)',
  HERO_PATH_AUDIO = 'مسیر قهرمان (صوتی)',
  HERO_SKILL = 'مهارت قهرمان',
  TOP_INVESTOR = 'سرمایه گذار برتر',
  // AI Creative Tools
  LIVE_CONVERSATION = 'مکالمه زنده',
  IMAGE_GENERATION = 'ساخت تصویر',
  IMAGE_EDITING = 'ویرایش تصویر',
  PRO_SALES_CAMPAIGN = 'کمپین فروش حرفه‌ای',
}
