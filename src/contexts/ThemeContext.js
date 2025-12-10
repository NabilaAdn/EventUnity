import { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, Platform } from 'react-native';

const ThemeContext = createContext(null);
const THEME_KEY = 'app_theme_mode';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export const lightTheme = {
  background: '#F5F7FA',
  backgroundSecondary: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F9FAFB',
  text: '#1A202C',
  textSecondary: '#4A5568',
  textTertiary: '#A0AEC0',
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#EDE9FE',
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  tabActive: '#7C3AED',
  tabInactive: '#94A3B8',
  
  // Category Colors
  categories: {
    Seminar: { bg: '#EDE9FE', text: '#7C3AED', border: '#C4B5FD' },
    Workshop: { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' },
    Lomba: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
    Webinar: { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
    'Seminar Kerja Praktik': { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
    'Seminar Proposal': { bg: '#FCE7F3', text: '#DB2777', border: '#F9A8D4' },
    'Sidang Terbuka': { bg: '#E0E7FF', text: '#4F46E5', border: '#A5B4FC' },
    'Tanpa Kategori': { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' },
  },
};

export const darkTheme = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  card: '#1E293B',
  cardHover: '#334155',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#2E1065',
  success: '#10B981',
  successLight: '#064E3B',
  error: '#EF4444',
  errorLight: '#7F1D1D',
  warning: '#F59E0B',
  warningLight: '#78350F',
  info: '#3B82F6',
  infoLight: '#1E3A8A',
  border: '#334155',
  borderLight: '#475569',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabActive: '#8B5CF6',
  tabInactive: '#64748B',
  
  // Category Colors (Dark Mode)
  categories: {
    Seminar: { bg: '#2E1065', text: '#C4B5FD', border: '#5B21B6' },
    Workshop: { bg: '#1E3A8A', text: '#93C5FD', border: '#1D4ED8' },
    Lomba: { bg: '#7F1D1D', text: '#FCA5A5', border: '#991B1B' },
    Webinar: { bg: '#064E3B', text: '#6EE7B7', border: '#065F46' },
    'Seminar Kerja Praktik': { bg: '#78350F', text: '#FCD34D', border: '#92400E' },
    'Seminar Proposal': { bg: '#831843', text: '#F9A8D4', border: '#9F1239' },
    'Sidang Terbuka': { bg: '#312E81', text: '#A5B4FC', border: '#3730A3' },
    'Tanpa Kategori': { bg: '#334155', text: '#CBD5E1', border: '#475569' },
  },
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      let saved = null;
      
      if (Platform.OS === 'web') {
        saved = localStorage.getItem(THEME_KEY);
      }
      
      if (saved !== null) {
        setIsDark(saved === 'dark');
      } else {
        const colorScheme = Appearance.getColorScheme();
        setIsDark(colorScheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDark;
      setIsDark(newMode);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
      }
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}