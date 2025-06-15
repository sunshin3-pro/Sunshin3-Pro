// i18n Initialization for Electron App
let translations = {};
let currentLanguage = 'de';

// Load translations for a specific language
async function loadTranslations(language) {
    try {
        const response = await fetch(`../locales/${language}.json`);
        translations = await response.json();
        currentLanguage = language;
        console.log(`Translations loaded for language: ${language}`);
        return translations;
    } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        // Fallback to German if loading fails
        if (language !== 'de') {
            return await loadTranslations('de');
        }
        return {};
    }
}

// Get translation for a key
function getTranslation(key) {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            console.warn(`Translation not found for key: ${key}`);
            return key; // Return the key as fallback
        }
    }
    
    return value;
}

// Get current language
function getCurrentLanguage() {
    return currentLanguage;
}

// Get all translations
function getAllTranslations() {
    return translations;
}

// Replace placeholders in translation string
function replaceTranslationPlaceholders(text, replacements = {}) {
    if (typeof text !== 'string') return text;
    
    return text.replace(/\{(\w+)\}/g, (match, key) => {
        return replacements[key] || match;
    });
}

// Update UI elements with translations
function updateUITranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key);
        if (translation && translation !== key) {
            element.textContent = translation;
        }
    });
}

// Initialize i18n system
async function initializeI18n(language = 'de') {
    try {
        await loadTranslations(language);
        updateUITranslations();
        console.log('i18n system initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize i18n system:', error);
        return false;
    }
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.i18n = {
        loadTranslations,
        getTranslation,
        getCurrentLanguage,
        getAllTranslations,
        replaceTranslationPlaceholders,
        updateUITranslations,
        initializeI18n
    };
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadTranslations,
        getTranslation,
        getCurrentLanguage,
        getAllTranslations,
        replaceTranslationPlaceholders,
        updateUITranslations,
        initializeI18n
    };
}