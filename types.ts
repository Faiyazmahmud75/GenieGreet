
export enum Occasion {
  Birthday = 'Birthday',
  Eid = 'Eid',
  Valentine = 'Valentine',
  NewYear = 'New Year',
  Anniversary = 'Anniversary'
}

export interface WishData {
  recipientName: string;
  senderName: string;
  occasion: Occasion;
  relationship?: string;
  manualMessage?: string;
}

export interface GeneratedWish {
  message: string;
  mood: string;
  colorTheme: string;
  recipientName: string;
  senderName: string;
  occasion: Occasion;
}

export interface ThemeConfig {
  gradient: string;
  particleType: 'heart' | 'confetti' | 'star' | 'crescent' | 'sparkle';
  primaryColor: string;
  penColor: string;
  glowColor: string;
  audioUrl: string;
  bgIcons: string[]; // Lucide icon names or emojis
}
