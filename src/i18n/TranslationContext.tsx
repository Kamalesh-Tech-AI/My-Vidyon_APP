import React, { createContext, useContext, ReactNode } from 'react';
import { translations, Language } from './translations';
import { TranslationKeys } from './translations/en';
import { useLanguage } from './LanguageContext';

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationKeys;
    translate: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const STORAGE_KEY = 'eduErp_language';

export function TranslationProvider({ children }: { children: ReactNode }) {
    // Adapter: Use the single source of truth from LanguageContext
    const { currentLanguage, changeLanguage } = useLanguage();

    // Determine the language key safely (fallback to 'en' if undefined)
    const activeLanguage = currentLanguage || 'en';

    // Select the correct translation object
    // Cast to any to avoid strict indexing issues if types aren't perfectly aligned yet, 
    // ensuring we always get an object.
    const t = translations[activeLanguage as keyof typeof translations] || translations['en'];

    // Helper function to get nested translation by dot notation (Legacy support)
    const translate = (key: string): string => {
        const keys = key.split('.');
        let value: any = t;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <TranslationContext.Provider value={{
            language: activeLanguage as Language, // Cast to maintain compatibility
            setLanguage: changeLanguage,
            t,
            translate
        }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within TranslationProvider');
    }
    return context;
}
