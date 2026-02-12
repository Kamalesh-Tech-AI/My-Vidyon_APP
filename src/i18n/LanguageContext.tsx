import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from "sonner";
import i18n from './config';
import { Language, languages } from './translations';
import { GoogleTranslationService } from '@/services/GoogleTranslationService';

interface LanguageContextType {
    currentLanguage: Language;
    changeLanguage: (lang: Language) => void;
    supportedLanguages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState<Language>((i18n.language as Language) || 'en');
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        // Sync state with i18n instance on mount
        if (i18n.language) {
            console.log('LanguageContext: Initial sync with i18n:', i18n.language);
            // Validate if the language is one of our supported languages
            const lang = i18n.language as Language;
            const isSupported = languages.some(l => l.code === lang);
            if (isSupported) {
                // If it's not English and resources are missing, we might need to load them here too
                // For now, we assume if it's set in i18n, it might have been loaded or we rely on the component mount to trigger fetch if needed.
                // Actually, i18next-browser-languagedetector might set a language that we haven't loaded resources for yet.
                // To be safe, we should check and load if necessary.
                if (lang !== 'en' && !i18n.hasResourceBundle(lang, 'translation')) {
                    loadLanguage(lang);
                } else {
                    setCurrentLanguage(lang);
                }
            }
        }
    }, [i18n.language]);

    const loadLanguage = async (lang: Language) => {
        // Check cache first
        const cached = GoogleTranslationService.getFromCache(lang);
        if (cached) {
            console.log(`LanguageContext: Loaded ${lang} from cache`);
            i18n.addResourceBundle(lang, 'translation', cached, true, true);
            i18n.changeLanguage(lang);
            setCurrentLanguage(lang);
            return;
        }

        // Fetch from API
        setIsTranslating(true);
        const toastId = toast.loading(`Translating to ${languages.find(l => l.code === lang)?.name}...`);

        try {
            const translations = await GoogleTranslationService.translatePlatform(lang);

            // Save to cache
            GoogleTranslationService.saveToCache(lang, translations);

            // Add to i18next
            i18n.addResourceBundle(lang, 'translation', translations, true, true);

            // Switch
            i18n.changeLanguage(lang);
            setCurrentLanguage(lang);

            toast.success(`Translation complete`, { id: toastId });
        } catch (error) {
            console.error("Translation failed", error);
            toast.error("Translation failed. Please check your internet or API key.", { id: toastId });
            // Fallback or stay on current
        } finally {
            setIsTranslating(false);
        }
    };

    const changeLanguage = async (lang: Language) => {
        console.log('LanguageContext: Requesting language change to:', lang);

        if (lang === 'en') {
            i18n.changeLanguage(lang);
            setCurrentLanguage(lang);
            localStorage.setItem('i18nextLng', lang);
            toast.success(`Switched to English`);
            return;
        }

        // If resources already exist (loaded previously in session), just switch
        if (i18n.hasResourceBundle(lang, 'translation')) {
            i18n.changeLanguage(lang);
            setCurrentLanguage(lang);
            localStorage.setItem('i18nextLng', lang);
            toast.success(`Switched to ${languages.find(l => l.code === lang)?.name}`);
            return;
        }

        // Otherwise load (fetch or cache)
        await loadLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, changeLanguage, supportedLanguages: languages }}>
            {children}
        </LanguageContext.Provider>
    );
};
