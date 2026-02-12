import { en } from './en';
// Static translations are no longer imported here for other languages
// They are fetched dynamically via GoogleTranslationService

export const translations = {
    en,
    // Other keys (ta, te, etc.) are populated dynamically at runtime
};

export type Language = 'en' | 'ta' | 'te' | 'kn' | 'ml' | 'es' | 'hi';

export const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];
