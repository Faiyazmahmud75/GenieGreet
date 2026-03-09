
import { Occasion, ThemeConfig } from '../types';
import { MUSIC_ASSETS } from './music';

export const OCCASION_THEMES: Record<Occasion, ThemeConfig> = {
  [Occasion.Birthday]: {
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    particleType: 'confetti',
    primaryColor: '#f59e0b',
    penColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    audioUrl: MUSIC_ASSETS[Occasion.Birthday],
    bgIcons: ['🎂', '🎈', '🎁', '✨', '🥳', '🎉', '🧁']
  },
  [Occasion.Eid]: {
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    particleType: 'crescent',
    primaryColor: '#059669',
    penColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    audioUrl: MUSIC_ASSETS[Occasion.Eid],
    bgIcons: ['🌙', '⭐', '🕌', '🏮', '✨', '🐫', '🍬']
  },
  [Occasion.Valentine]: {
    gradient: 'from-rose-400 via-pink-500 to-purple-600',
    particleType: 'heart',
    primaryColor: '#e11d48',
    penColor: '#f472b6',
    glowColor: 'rgba(225, 29, 72, 0.6)',
    audioUrl: MUSIC_ASSETS[Occasion.Valentine],
    bgIcons: ['❤️', '💖', '🌹', '💌', '💘', '💍', '🧸']
  },
  [Occasion.NewYear]: {
    gradient: 'from-blue-500 via-indigo-600 to-violet-700',
    particleType: 'sparkle',
    primaryColor: '#2563eb',
    penColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    audioUrl: MUSIC_ASSETS[Occasion.NewYear],
    bgIcons: ['🎆', '🥂', '🕛', '✨', '🍾', '🎇', '🎊']
  },
  [Occasion.Anniversary]: {
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    particleType: 'star',
    primaryColor: '#9333ea',
    penColor: '#fbbf24',
    glowColor: 'rgba(217, 70, 239, 0.6)',
    audioUrl: MUSIC_ASSETS[Occasion.Anniversary],
    bgIcons: ['💍', '🥂', '✨', '💐', '👫', '🏩', '💎']
  }
};
