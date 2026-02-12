import { en } from '@/i18n/translations/en';

const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const GOOGLE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

// Cache prefix
const CACHE_PREFIX = 'eduErp_tr_cache_';

// Helper to flatten object values into an array (preserving order)
// Returns [valuesArray, keysMap]
// keysMap will be an array of paths: ['common.welcome', 'login.title', ...]
const flattenObject = (obj: any, prefix = ''): { paths: string[], values: string[] } => {
    let paths: string[] = [];
    let values: string[] = [];

    Object.keys(obj).forEach(key => {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
            const { paths: p, values: v } = flattenObject(value, path);
            paths = [...paths, ...p];
            values = [...values, ...v];
        } else if (typeof value === 'string') {
            paths.push(path);
            values.push(value);
        }
    });

    return { paths, values };
};

// Helper to unflatten array back to object using paths
const unflattenObject = (paths: string[], translatedValues: string[]): any => {
    const result: any = {};

    paths.forEach((path, index) => {
        const value = translatedValues[index];
        const keys = path.split('.');
        let current = result;

        keys.forEach((key, i) => {
            if (i === keys.length - 1) {
                current[key] = value;
            } else {
                current[key] = current[key] || {};
                current = current[key];
            }
        });
    });

    return result;
};

export const GoogleTranslationService = {
    // Check if translations exist in cache
    getFromCache: (lang: string) => {
        const cached = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    // Save to cache
    saveToCache: (lang: string, data: any) => {
        try {
            localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save translations to cache (quota exceeded?)', e);
        }
    },

    // Fetch translations
    translatePlatform: async (targetLang: string): Promise<any> => {
        if (!API_KEY) {
            throw new Error('Google Translate API Key is missing. Please set VITE_GOOGLE_TRANSLATE_API_KEY.');
        }

        // 1. Flatten the source (English)
        const { paths, values } = flattenObject(en);

        // 2. Prepare Chunks (Google API has limits per request, typically 128 strings or similar)
        // We'll batch by 100 to be safe.
        const BATCH_SIZE = 100;
        const translatedValues: string[] = [];

        // Loop through batches
        for (let i = 0; i < values.length; i += BATCH_SIZE) {
            const batch = values.slice(i, i + BATCH_SIZE);

            // 3. Call API
            const response = await fetch(`${GOOGLE_API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: batch,
                    target: targetLang,
                    source: 'en',
                    format: 'text' // Use 'text' to prevent HTML escaping issues if possible, or 'html' if we have markup
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Translation API request failed');
            }

            const data = await response.json();

            // 4. Collect results
            if (data.data && data.data.translations) {
                data.data.translations.forEach((t: any) => {
                    // Start decoding HTML entities if Google returns them (e.g. &#39; -> ')
                    const text = t.translatedText.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
                    translatedValues.push(text);
                });
            }
        }

        // 5. Reconstruct Object
        if (translatedValues.length !== paths.length) {
            throw new Error(`Mismatch in translation count. Sent ${paths.length}, received ${translatedValues.length}`);
        }

        const translatedObject = unflattenObject(paths, translatedValues);

        return translatedObject;
    }
};
