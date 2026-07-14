/**
 * Storage Module - Handles all LocalStorage operations
 */

const STORAGE_KEYS = {
    FOOD_ENTRIES: 'calorieTracker_foodEntries',
    SETTINGS: 'calorieTracker_settings',
    API_KEY: 'calorieTracker_apiKey'
};

const DEFAULT_SETTINGS = {
    dailyGoal: 2000
};

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get all food entries from storage
 * Returns object with dates as keys and arrays of entries as values
 */
export function getAllEntries() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.FOOD_ENTRIES);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading food entries:', error);
        return {};
    }
}

/**
 * Get food entries for a specific date
 */
export function getEntriesForDate(dateKey = getTodayKey()) {
    const allEntries = getAllEntries();
    return allEntries[dateKey] || [];
}

/**
 * Get today's food entries
 */
export function getTodayEntries() {
    return getEntriesForDate(getTodayKey());
}

/**
 * Save a food entry
 */
export function saveEntry(entry, dateKey = getTodayKey()) {
    const allEntries = getAllEntries();
    
    if (!allEntries[dateKey]) {
        allEntries[dateKey] = [];
    }
    
    // Add unique ID and timestamp
    const newEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date().toISOString()
    };
    
    allEntries[dateKey].push(newEntry);
    
    try {
        localStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(allEntries));
        return newEntry;
    } catch (error) {
        console.error('Error saving entry:', error);
        return null;
    }
}

/**
 * Save multiple food entries at once
 */
export function saveEntries(entries, dateKey = getTodayKey()) {
    const savedEntries = [];
    
    for (const entry of entries) {
        const saved = saveEntry(entry, dateKey);
        if (saved) {
            savedEntries.push(saved);
        }
    }
    
    return savedEntries;
}

/**
 * Delete a food entry by ID
 */
export function deleteEntry(entryId, dateKey = getTodayKey()) {
    const allEntries = getAllEntries();
    
    if (!allEntries[dateKey]) {
        return false;
    }
    
    const initialLength = allEntries[dateKey].length;
    allEntries[dateKey] = allEntries[dateKey].filter(entry => entry.id !== entryId);
    
    if (allEntries[dateKey].length === initialLength) {
        return false;
    }
    
    try {
        localStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(allEntries));
        return true;
    } catch (error) {
        console.error('Error deleting entry:', error);
        return false;
    }
}

/**
 * Update a food entry
 */
export function updateEntry(entryId, updates, dateKey = getTodayKey()) {
    const allEntries = getAllEntries();
    
    if (!allEntries[dateKey]) {
        return null;
    }
    
    const entryIndex = allEntries[dateKey].findIndex(entry => entry.id === entryId);
    
    if (entryIndex === -1) {
        return null;
    }
    
    allEntries[dateKey][entryIndex] = {
        ...allEntries[dateKey][entryIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    try {
        localStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(allEntries));
        return allEntries[dateKey][entryIndex];
    } catch (error) {
        console.error('Error updating entry:', error);
        return null;
    }
}

/**
 * Calculate total calories for a date
 */
export function getTotalCalories(dateKey = getTodayKey()) {
    const entries = getEntriesForDate(dateKey);
    return entries.reduce((total, entry) => total + (entry.calories || 0), 0);
}

/**
 * Get settings from storage
 */
export function getSettings() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (error) {
        console.error('Error reading settings:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Save settings to storage
 */
export function saveSettings(settings) {
    try {
        const currentSettings = getSettings();
        const newSettings = { ...currentSettings, ...settings };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
        return newSettings;
    } catch (error) {
        console.error('Error saving settings:', error);
        return null;
    }
}

/**
 * Get API key from storage
 */
export function getApiKey() {
    try {
        return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
    } catch (error) {
        console.error('Error reading API key:', error);
        return '';
    }
}

/**
 * Save API key to storage
 */
export function saveApiKey(apiKey) {
    try {
        localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
        return true;
    } catch (error) {
        console.error('Error saving API key:', error);
        return false;
    }
}

/**
 * Clear all data from storage
 */
export function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.FOOD_ENTRIES);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        return false;
    }
}

/**
 * Generate a unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Export data for backup
 */
export function exportData() {
    return {
        foodEntries: getAllEntries(),
        settings: getSettings(),
        exportedAt: new Date().toISOString()
    };
}

/**
 * Import data from backup
 */
export function importData(data) {
    try {
        if (data.foodEntries) {
            localStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(data.foodEntries));
        }
        if (data.settings) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        return false;
    }
}