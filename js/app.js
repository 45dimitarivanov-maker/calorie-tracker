/**
 * Calorie Tracker - Complete Application
 * All modules bundled into a single file for direct file:// usage
 */

(function() {
    'use strict';

    // ==========================================
    // STORAGE MODULE
    // ==========================================

    const STORAGE_KEYS = {
        FOOD_ENTRIES: 'calorieTracker_foodEntries',
        SETTINGS: 'calorieTracker_settings',
        API_KEY: 'calorieTracker_apiKey',
        RECENT_FOODS: 'calorieTracker_recentFoods',
        WEIGHT_ENTRIES: 'calorieTracker_weightEntries',
        FAVORITES: 'calorieTracker_favorites'
    };

    const DEFAULT_SETTINGS = {
        dailyGoal: 2000,
        proteinGoal: 150,
        carbsGoal: 250,
        fatGoal: 65
    };

    // Calculate calories from macros: P*4 + C*4 + F*9
    function calculateCaloriesFromMacros(protein, carbs, fat) {
        return Math.round((protein * 4) + (carbs * 4) + (fat * 9));
    }

    function getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }

    function getAllEntries() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.FOOD_ENTRIES);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error reading food entries:', error);
            return {};
        }
    }

    function getEntriesForDate(dateKey) {
        dateKey = dateKey || getTodayKey();
        const allEntries = getAllEntries();
        return allEntries[dateKey] || [];
    }

    function getTodayEntries() {
        return getEntriesForDate(getTodayKey());
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    function saveEntry(entry, dateKey) {
        dateKey = dateKey || getTodayKey();
        const allEntries = getAllEntries();
        
        if (!allEntries[dateKey]) {
            allEntries[dateKey] = [];
        }
        
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

    function saveEntries(entries, dateKey) {
        const savedEntries = [];
        for (const entry of entries) {
            const saved = saveEntry(entry, dateKey);
            if (saved) {
                savedEntries.push(saved);
            }
        }
        return savedEntries;
    }

    function deleteEntry(entryId, dateKey) {
        dateKey = dateKey || getTodayKey();
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

    function getTotalCalories(dateKey) {
        const entries = getEntriesForDate(dateKey);
        return entries.reduce((total, entry) => total + (entry.calories || 0), 0);
    }

    function getSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Error reading settings:', error);
            return DEFAULT_SETTINGS;
        }
    }

    function saveSettings(settings) {
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

    function getApiKey() {
        try {
            return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
        } catch (error) {
            console.error('Error reading API key:', error);
            return '';
        }
    }

    function saveApiKey(apiKey) {
        try {
            localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
            return true;
        } catch (error) {
            console.error('Error saving API key:', error);
            return false;
        }
    }

    function clearAllData() {
        try {
            localStorage.removeItem(STORAGE_KEYS.FOOD_ENTRIES);
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            localStorage.removeItem(STORAGE_KEYS.API_KEY);
            localStorage.removeItem(STORAGE_KEYS.WEIGHT_ENTRIES);
            localStorage.removeItem(STORAGE_KEYS.RECENT_FOODS);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // ==========================================
    // WEIGHT STORAGE HELPERS
    // ==========================================

    function getAllWeightEntries() {
        try {
            var data = localStorage.getItem(STORAGE_KEYS.WEIGHT_ENTRIES);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error reading weight entries:', error);
            return {};
        }
    }

    function getWeightForDate(dateKey) {
        var all = getAllWeightEntries();
        return typeof all[dateKey] === 'number' ? all[dateKey] : null;
    }

    function saveWeight(dateKey, kg) {
        var all = getAllWeightEntries();
        all[dateKey] = kg;
        try {
            localStorage.setItem(STORAGE_KEYS.WEIGHT_ENTRIES, JSON.stringify(all));
            return true;
        } catch (error) {
            console.error('Error saving weight:', error);
            return false;
        }
    }

    // Get the most recent weight up to and including a date. Returns { dateKey, kg } or null.
    function getLatestWeight(uptoDateKey) {
        var all = getAllWeightEntries();
        var keys = Object.keys(all).sort(); // ascending
        var latest = null;
        for (var i = 0; i < keys.length; i++) {
            if (!uptoDateKey || keys[i] <= uptoDateKey) {
                latest = { dateKey: keys[i], kg: all[keys[i]] };
            } else {
                break;
            }
        }
        return latest;
    }

    // Get weight entries for a specific year+month. Returns { day: kg } (day is 1..31).
    function getWeightsForMonth(year, monthIdx) {
        var all = getAllWeightEntries();
        var result = {};
        Object.keys(all).forEach(function(dateKey) {
            var d = new Date(dateKey + 'T12:00:00');
            if (d.getFullYear() === year && d.getMonth() === monthIdx) {
                result[d.getDate()] = all[dateKey];
            }
        });
        return result;
    }

    // Get last N days of weight (in chronological order). Returns array of { dateKey, kg }.
    function getRecentWeights(days) {
        days = days || 7;
        var all = getAllWeightEntries();
        var keys = Object.keys(all).sort();
        var recent = keys.slice(-days);
        return recent.map(function(k) { return { dateKey: k, kg: all[k] }; });
    }

    // ==========================================
    // FAVORITES STORAGE & HELPERS
    // ==========================================

    function getAllFavorites() {
        try {
            var data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading favorites:', error);
            return [];
        }
    }

    function saveFavorite(entry) {
        var favorites = getAllFavorites();
        
        // Check if already exists by name (case insensitive)
        var existingIndex = favorites.findIndex(function(f) {
            return f.name.toLowerCase() === entry.name.toLowerCase();
        });
        
        var favorite = {
            id: existingIndex !== -1 ? favorites[existingIndex].id : generateId(),
            name: entry.name,
            quantity: entry.quantity || 1,
            unit: entry.unit || 'serving',
            calories: entry.calories || 0,
            protein: entry.protein || 0,
            carbs: entry.carbs || 0,
            fat: entry.fat || 0,
            fiber: entry.fiber || 0,
            addedAt: existingIndex !== -1 ? favorites[existingIndex].addedAt : new Date().toISOString()
        };
        
        if (existingIndex !== -1) {
            // Update existing
            favorites[existingIndex] = favorite;
        } else {
            // Add new
            favorites.unshift(favorite);
        }
        
        try {
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
            return favorite;
        } catch (error) {
            console.error('Error saving favorite:', error);
            return null;
        }
    }

    function removeFavorite(favoriteId) {
        var favorites = getAllFavorites();
        var initialLength = favorites.length;
        favorites = favorites.filter(function(f) { return f.id !== favoriteId; });
        
        if (favorites.length === initialLength) {
            return false;
        }
        
        try {
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
            return true;
        } catch (error) {
            console.error('Error removing favorite:', error);
            return false;
        }
    }

    function isFavorite(name) {
        var favorites = getAllFavorites();
        return favorites.some(function(f) {
            return f.name.toLowerCase() === name.toLowerCase();
        });
    }

    function getFavoriteByName(name) {
        var favorites = getAllFavorites();
        return favorites.find(function(f) {
            return f.name.toLowerCase() === name.toLowerCase();
        });
    }

    // ==========================================
    // UI MODULE
    // ==========================================

    function formatDate(date) {
        date = date || new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    function updateDateDisplay() {
        const dateDisplay = document.getElementById('dateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = formatDate();
        }
    }

    function updateProgressRing(consumed, goal) {
        const progressRing = document.getElementById('progressRing');
        const caloriesConsumed = document.getElementById('caloriesConsumed');
        const caloriesGoalEl = document.getElementById('caloriesGoal');
        const caloriesRemaining = document.getElementById('caloriesRemaining');
        
        if (!progressRing) return;
        
        caloriesConsumed.textContent = consumed;
        caloriesGoalEl.textContent = goal;
        
        const remaining = goal - consumed;
        const remainingValue = caloriesRemaining.querySelector('.remaining-value');
        
        if (remaining >= 0) {
            remainingValue.textContent = remaining;
            remainingValue.classList.remove('over');
            caloriesRemaining.querySelector('.remaining-label').textContent = 'remaining';
        } else {
            remainingValue.textContent = Math.abs(remaining);
            remainingValue.classList.add('over');
            caloriesRemaining.querySelector('.remaining-label').textContent = 'over goal';
        }
        
        const percentage = Math.min((consumed / goal) * 100, 100);
        const radius = 85;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;
        
        progressRing.style.strokeDasharray = circumference;
        progressRing.style.strokeDashoffset = offset;
        
        if (consumed > goal) {
            progressRing.classList.add('over-goal');
        } else {
            progressRing.classList.remove('over-goal');
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function createFoodEntryElement(entry, onDelete) {
        const div = document.createElement('div');
        div.className = 'food-entry';
        div.dataset.id = entry.id;
        
        const quantityText = entry.quantity !== 1 ? entry.quantity + ' ' + entry.unit : entry.unit;
        const hasMacros = entry.protein || entry.carbs || entry.fat;
        const macrosText = hasMacros ? 
            'P: ' + (entry.protein || 0).toFixed(1) + 'g · C: ' + (entry.carbs || 0).toFixed(1) + 'g · F: ' + (entry.fat || 0).toFixed(1) + 'g' : '';
        
        const isAlreadyFavorite = isFavorite(entry.name);
        const starClass = isAlreadyFavorite ? 'star-btn is-favorite' : 'star-btn';
        const starIcon = isAlreadyFavorite ? 
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' :
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        
        div.innerHTML = 
            '<div class="food-entry-info">' +
                '<div class="food-entry-name">' + escapeHtml(entry.name) + '</div>' +
                '<div class="food-entry-details">' + escapeHtml(quantityText) + 
                    (macrosText ? '<span class="food-entry-macros">' + macrosText + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<div class="food-entry-calories">' + entry.calories + ' <span>kcal</span></div>' +
            '<button class="' + starClass + '" aria-label="' + (isAlreadyFavorite ? 'Already in favorites' : 'Add to favorites') + '">' + starIcon + '</button>' +
            '<button class="delete-btn" aria-label="Delete entry">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<polyline points="3 6 5 6 21 6"></polyline>' +
                    '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
                '</svg>' +
            '</button>';
        
        const starBtn = div.querySelector('.star-btn');
        starBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!starBtn.classList.contains('is-favorite')) {
                handleAddToFavorites(entry);
                starBtn.classList.add('is-favorite');
                starBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
            } else {
                showToast('Already in favorites!', 2000);
            }
        });
        
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            if (onDelete) {
                div.style.transform = 'translateX(100%)';
                div.style.opacity = '0';
                setTimeout(function() { onDelete(entry.id); }, 200);
            }
        });
        
        return div;
    }

    function renderFoodLog(entries, onDelete) {
        const foodLog = document.getElementById('foodLog');
        const emptyState = document.getElementById('emptyState');
        
        if (!foodLog) return;
        
        const existingEntries = foodLog.querySelectorAll('.food-entry');
        existingEntries.forEach(function(el) { el.remove(); });
        
        if (entries.length === 0) {
            if (emptyState) emptyState.hidden = false;
            return;
        }
        
        if (emptyState) emptyState.hidden = true;
        
        const sortedEntries = entries.slice().reverse();
        
        sortedEntries.forEach(function(entry) {
            const element = createFoodEntryElement(entry, onDelete);
            foodLog.appendChild(element);
        });
    }

    function createProposedEntryElement(entry, index, handlers) {
        const div = document.createElement('div');
        div.className = 'proposed-entry';
        div.dataset.index = index;
        
        const quantityText = entry.quantity + ' ' + entry.unit;
        const macrosText = 'P: ' + (entry.protein || 0).toFixed(1) + 'g · C: ' + (entry.carbs || 0).toFixed(1) + 'g · F: ' + (entry.fat || 0).toFixed(1) + 'g';
        
        div.innerHTML = 
            '<div class="proposed-entry-info">' +
                '<div class="proposed-entry-name">' + escapeHtml(entry.name) + '</div>' +
                '<div class="proposed-entry-details">' + escapeHtml(quantityText) + '</div>' +
                '<div class="proposed-entry-macros">' + macrosText + '</div>' +
            '</div>' +
            '<div class="proposed-entry-calories">' + entry.calories + '</div>' +
            '<div class="proposed-entry-actions">' +
                '<button class="icon-btn confirm" aria-label="Confirm">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<polyline points="20 6 9 17 4 12"></polyline>' +
                    '</svg>' +
                '</button>' +
                '<button class="icon-btn edit" aria-label="Edit">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>' +
                        '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
                    '</svg>' +
                '</button>' +
                '<button class="icon-btn remove" aria-label="Remove">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                        '<line x1="6" y1="6" x2="18" y2="18"></line>' +
                    '</svg>' +
                '</button>' +
            '</div>';
        
        div.querySelector('.confirm').addEventListener('click', function() { handlers.onConfirm(index); });
        div.querySelector('.edit').addEventListener('click', function() { handlers.onEdit(index); });
        div.querySelector('.remove').addEventListener('click', function() {
            div.style.transform = 'translateX(100%)';
            div.style.opacity = '0';
            setTimeout(function() { handlers.onRemove(index); }, 200);
        });
        
        return div;
    }

    function renderProposedEntries(entries, handlers) {
        const proposedSection = document.getElementById('proposedSection');
        const proposedEntries = document.getElementById('proposedEntries');
        
        if (!proposedSection || !proposedEntries) return;
        
        proposedEntries.innerHTML = '';
        
        if (entries.length === 0) {
            proposedSection.hidden = true;
            return;
        }
        
        proposedSection.hidden = false;
        
        entries.forEach(function(entry, index) {
            const element = createProposedEntryElement(entry, index, handlers);
            proposedEntries.appendChild(element);
        });
    }

    function showLoading(show, text) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (!loadingOverlay) return;
        
        if (typeof show === 'string') {
            // Called as showLoading(text)
            text = show;
            show = true;
        }
        
        loadingOverlay.hidden = !show;
        if (loadingText) loadingText.textContent = text || 'Analyzing...';
    }
    
    function hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.hidden = true;
    }

    function showToast(message, duration) {
        duration = duration || 3000;
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;
        
        toastMessage.textContent = message;
        toast.hidden = false;
        
        if (toast.timeoutId) {
            clearTimeout(toast.timeoutId);
        }
        
        toast.timeoutId = setTimeout(function() {
            toast.hidden = true;
        }, duration);
    }

    function setVoiceButtonState(isListening) {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceHint = document.getElementById('voiceHint');
        
        if (!voiceBtn) return;
        
        if (isListening) {
            voiceBtn.classList.add('listening');
            if (voiceHint) voiceHint.textContent = 'Listening... tap to stop';
        } else {
            voiceBtn.classList.remove('listening');
            if (voiceHint) voiceHint.textContent = 'Tap to speak what you ate';
        }
    }

    var pendingTranscript = '';

    function updateTranscription(text, show, showActions) {
        var transcriptionDisplay = document.getElementById('transcriptionDisplay');
        var transcriptionText = document.getElementById('transcriptionText');
        var transcriptionActions = document.getElementById('transcriptionActions');
        
        if (!transcriptionDisplay || !transcriptionText) return;
        
        if (show && text) {
            transcriptionText.textContent = '"' + text + '"';
            transcriptionDisplay.hidden = false;
            if (transcriptionActions) {
                transcriptionActions.hidden = !showActions;
            }
        } else {
            transcriptionDisplay.hidden = true;
            if (transcriptionActions) {
                transcriptionActions.hidden = true;
            }
        }
    }

    function toggleSettingsModal(show) {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.hidden = !show;
            if (show) {
                const firstInput = modal.querySelector('input');
                if (firstInput) firstInput.focus();
            }
        }
    }

    function toggleManualEntryForm(show) {
        const toggle = document.getElementById('manualEntryToggle');
        const form = document.getElementById('manualEntryForm');
        
        if (!toggle || !form) return;
        
        if (show === undefined) {
            show = form.hidden;
        }
        
        toggle.hidden = show;
        form.hidden = !show;
        
        if (show) {
            const firstInput = form.querySelector('input');
            if (firstInput) firstInput.focus();
        }
    }

    function resetManualEntryForm() {
        const form = document.getElementById('manualEntryForm');
        if (form) {
            form.reset();
            document.getElementById('foodQuantity').value = '1';
        }
    }

    function loadSettingsIntoForm(settings, apiKey) {
        var apiKeyInput = document.getElementById('apiKey');
        var proteinGoalInput = document.getElementById('proteinGoalInput');
        var carbsGoalInput = document.getElementById('carbsGoalInput');
        var fatGoalInput = document.getElementById('fatGoalInput');
        var calculatedCalories = document.getElementById('calculatedCalories');
        
        if (apiKeyInput) apiKeyInput.value = apiKey || '';
        if (proteinGoalInput) proteinGoalInput.value = settings.proteinGoal || 150;
        if (carbsGoalInput) carbsGoalInput.value = settings.carbsGoal || 250;
        if (fatGoalInput) fatGoalInput.value = settings.fatGoal || 65;
        
        // Update calculated calories display
        updateCalculatedCaloriesDisplay();
    }

    function updateCalculatedCaloriesDisplay() {
        var proteinGoalInput = document.getElementById('proteinGoalInput');
        var carbsGoalInput = document.getElementById('carbsGoalInput');
        var fatGoalInput = document.getElementById('fatGoalInput');
        var calculatedCalories = document.getElementById('calculatedCalories');
        
        if (!calculatedCalories) return;
        
        var protein = parseInt(proteinGoalInput ? proteinGoalInput.value : 0, 10) || 0;
        var carbs = parseInt(carbsGoalInput ? carbsGoalInput.value : 0, 10) || 0;
        var fat = parseInt(fatGoalInput ? fatGoalInput.value : 0, 10) || 0;
        
        var calories = calculateCaloriesFromMacros(protein, carbs, fat);
        calculatedCalories.textContent = calories;
    }

    function getSettingsFromForm() {
        var apiKeyInput = document.getElementById('apiKey');
        var proteinGoalInput = document.getElementById('proteinGoalInput');
        var carbsGoalInput = document.getElementById('carbsGoalInput');
        var fatGoalInput = document.getElementById('fatGoalInput');
        
        var protein = parseInt(proteinGoalInput ? proteinGoalInput.value : 150, 10) || 150;
        var carbs = parseInt(carbsGoalInput ? carbsGoalInput.value : 250, 10) || 250;
        var fat = parseInt(fatGoalInput ? fatGoalInput.value : 65, 10) || 65;
        
        return {
            apiKey: apiKeyInput ? apiKeyInput.value.trim() : '',
            proteinGoal: protein,
            carbsGoal: carbs,
            fatGoal: fat,
            dailyGoal: calculateCaloriesFromMacros(protein, carbs, fat)
        };
    }

    function showEditModal(entry, onSave, onCancel) {
        // Store baseline values for auto-scale calculations
        var baselineQty = entry.quantity;
        var baselineCalories = entry.calories;
        var baselineProtein = entry.protein || 0;
        var baselineCarbs = entry.carbs || 0;
        var baselineFat = entry.fat || 0;
        var baselineFiber = entry.fiber || 0;
        
        const modalHtml = 
            '<div class="modal-overlay" id="editModal">' +
                '<div class="modal">' +
                    '<div class="modal-header">' +
                        '<h2>Edit Entry</h2>' +
                        '<button class="close-btn" id="closeEditBtn" aria-label="Close">' +
                            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                                '<line x1="6" y1="6" x2="18" y2="18"></line>' +
                            '</svg>' +
                        '</button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                        '<form class="edit-form" id="editEntryForm">' +
                            '<div class="form-group">' +
                                '<label for="editFoodName">Food Name</label>' +
                                '<input type="text" class="form-input" id="editFoodName" value="' + escapeHtml(entry.name) + '" required>' +
                            '</div>' +
                            '<div class="form-row">' +
                                '<div class="form-group" style="flex: 1;">' +
                                    '<label for="editQuantity">Quantity</label>' +
                                    '<input type="number" class="form-input" id="editQuantity" value="' + entry.quantity + '" min="0" step="0.1" required>' +
                                '</div>' +
                                '<div class="form-group" style="flex: 1;">' +
                                    '<label for="editUnit">Unit</label>' +
                                    '<select class="form-select" id="editUnit" style="width: 100%;">' +
                                        '<option value="serving"' + (entry.unit === 'serving' ? ' selected' : '') + '>serving</option>' +
                                        '<option value="g"' + (entry.unit === 'g' ? ' selected' : '') + '>grams</option>' +
                                        '<option value="oz"' + (entry.unit === 'oz' ? ' selected' : '') + '>oz</option>' +
                                        '<option value="cup"' + (entry.unit === 'cup' ? ' selected' : '') + '>cup</option>' +
                                        '<option value="piece"' + (entry.unit === 'piece' ? ' selected' : '') + '>piece</option>' +
                                        '<option value="slice"' + (entry.unit === 'slice' ? ' selected' : '') + '>slice</option>' +
                                        '<option value="tbsp"' + (entry.unit === 'tbsp' ? ' selected' : '') + '>tbsp</option>' +
                                        '<option value="tsp"' + (entry.unit === 'tsp' ? ' selected' : '') + '>tsp</option>' +
                                        '<option value="bowl"' + (entry.unit === 'bowl' ? ' selected' : '') + '>bowl</option>' +
                                    '</select>' +
                                '</div>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label for="editCalories">Calories</label>' +
                                '<input type="number" class="form-input" id="editCalories" value="' + entry.calories + '" min="0" required>' +
                            '</div>' +
                            '<div class="form-row">' +
                                '<div class="form-group" style="flex: 1;">' +
                                    '<label for="editProtein">Protein (g)</label>' +
                                    '<input type="number" class="form-input" id="editProtein" value="' + (entry.protein || 0).toFixed(1) + '" min="0" step="0.1">' +
                                '</div>' +
                                '<div class="form-group" style="flex: 1;">' +
                                    '<label for="editCarbs">Carbs (g)</label>' +
                                    '<input type="number" class="form-input" id="editCarbs" value="' + (entry.carbs || 0).toFixed(1) + '" min="0" step="0.1">' +
                                '</div>' +
                            '</div>' +
                            '<div class="form-row">' +
                                '<div class="form-group" style="flex: 1;">' +
                                    '<label for="editFat">Fat (g)</label>' +
                                    '<input type="number" class="form-input" id="editFat" value="' + (entry.fat || 0).toFixed(1) + '" min="0" step="0.1">' +
                                '</div>' +
                                '<div class="form-group" style="flex: 1;">' +
                                    '<label for="editFiber">Fiber (g)</label>' +
                                    '<input type="number" class="form-input" id="editFiber" value="' + (entry.fiber || 0).toFixed(1) + '" min="0" step="0.1">' +
                                '</div>' +
                            '</div>' +
                            '<div class="form-group" style="margin-top: 8px;">' +
                                '<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">' +
                                    '<input type="checkbox" id="autoScaleMacros" checked style="cursor: pointer;">' +
                                    '<span>Auto-scale macros with quantity</span>' +
                                '</label>' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button class="btn btn-outline" id="cancelEditBtn">Cancel</button>' +
                        '<button class="btn btn-primary" id="saveEditBtn">Save</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('editModal');
        const closeBtn = document.getElementById('closeEditBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        const saveBtn = document.getElementById('saveEditBtn');
        const quantityInput = document.getElementById('editQuantity');
        const caloriesInput = document.getElementById('editCalories');
        const proteinInput = document.getElementById('editProtein');
        const carbsInput = document.getElementById('editCarbs');
        const fatInput = document.getElementById('editFat');
        const fiberInput = document.getElementById('editFiber');
        const autoScaleCheckbox = document.getElementById('autoScaleMacros');
        
        // Function to rescale all nutrition values based on quantity ratio
        function rescaleNutrition() {
            if (!autoScaleCheckbox.checked) return;
            
            var newQty = parseFloat(quantityInput.value) || baselineQty;
            if (newQty <= 0) return;
            
            var ratio = newQty / baselineQty;
            
            caloriesInput.value = Math.round(baselineCalories * ratio);
            proteinInput.value = (baselineProtein * ratio).toFixed(1);
            carbsInput.value = (baselineCarbs * ratio).toFixed(1);
            fatInput.value = (baselineFat * ratio).toFixed(1);
            fiberInput.value = (baselineFiber * ratio).toFixed(1);
        }
        
        // Function to update baseline when user edits a macro field
        function updateBaseline(field, newValue) {
            var numValue = parseFloat(newValue) || 0;
            if (field === 'calories') baselineCalories = numValue;
            else if (field === 'protein') baselineProtein = numValue;
            else if (field === 'carbs') baselineCarbs = numValue;
            else if (field === 'fat') baselineFat = numValue;
            else if (field === 'fiber') baselineFiber = numValue;
        }
        
        // Attach quantity input listener
        quantityInput.addEventListener('input', rescaleNutrition);
        
        // Attach macro field listeners to update baseline
        caloriesInput.addEventListener('input', function() { updateBaseline('calories', this.value); });
        proteinInput.addEventListener('input', function() { updateBaseline('protein', this.value); });
        carbsInput.addEventListener('input', function() { updateBaseline('carbs', this.value); });
        fatInput.addEventListener('input', function() { updateBaseline('fat', this.value); });
        fiberInput.addEventListener('input', function() { updateBaseline('fiber', this.value); });
        
        function closeModal() {
            modal.remove();
            if (onCancel) onCancel();
        }
        
        function saveEntryHandler() {
            var updatedEntry = Object.assign({}, entry, {
                name: document.getElementById('editFoodName').value.trim(),
                quantity: parseFloat(quantityInput.value) || 1,
                unit: document.getElementById('editUnit').value,
                calories: parseInt(caloriesInput.value, 10) || 0,
                protein: parseFloat(proteinInput.value) || 0,
                carbs: parseFloat(carbsInput.value) || 0,
                fat: parseFloat(fatInput.value) || 0,
                fiber: parseFloat(fiberInput.value) || 0
            });
            modal.remove();
            if (onSave) onSave(updatedEntry);
        }
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        saveBtn.addEventListener('click', saveEntryHandler);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
        
        document.getElementById('editFoodName').focus();
    }

    // ==========================================
    // VOICE MODULE
    // ==========================================

    var voiceRecognition = {
        recognition: null,
        isListening: false,
        transcript: '',
        onResult: null,
        onStart: null,
        onEnd: null,
        onError: null,
        onInterim: null
    };

    function initVoice() {
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
            return;
        }
        
        // Store the SpeechRecognition constructor for later use
        voiceRecognition.SpeechRecognition = SpeechRecognition;
        voiceRecognition.currentLang = 'en-US';
        
        createRecognitionInstance('en-US');
    }

    function createRecognitionInstance(lang) {
        var SpeechRecognition = voiceRecognition.SpeechRecognition;
        if (!SpeechRecognition) return;
        
        try {
            voiceRecognition.recognition = new SpeechRecognition();
            voiceRecognition.recognition.continuous = false;
            voiceRecognition.recognition.interimResults = true;
            voiceRecognition.recognition.lang = lang;
            voiceRecognition.recognition.maxAlternatives = 3;
            voiceRecognition.currentLang = lang;
            console.log('Recognition created with lang:', lang);
        } catch (e) {
            console.error('Error creating recognition:', e);
            return;
        }
        
        voiceRecognition.recognition.onstart = function() {
            voiceRecognition.isListening = true;
            voiceRecognition.transcript = '';
            if (voiceRecognition.onStart) voiceRecognition.onStart();
        };
        
        voiceRecognition.recognition.onresult = function(event) {
            var interimTranscript = '';
            var finalTranscript = '';
            
            for (var i = event.resultIndex; i < event.results.length; i++) {
                var transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (interimTranscript && voiceRecognition.onInterim) {
                voiceRecognition.onInterim(interimTranscript);
            }
            
            if (finalTranscript) {
                voiceRecognition.transcript = finalTranscript;
                if (voiceRecognition.onResult) {
                    voiceRecognition.onResult(finalTranscript);
                }
            }
        };
        
        voiceRecognition.recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            voiceRecognition.isListening = false;
            
            var errorMessage = 'An error occurred';
            switch (event.error) {
                case 'no-speech': errorMessage = 'No speech detected. Please try again.'; break;
                case 'audio-capture': errorMessage = 'No microphone found.'; break;
                case 'not-allowed': errorMessage = 'Microphone access denied. Check Safari settings.'; break;
                case 'service-not-allowed': errorMessage = 'Voice not available on iOS Safari. Use Type instead!'; break;
                case 'network': errorMessage = 'Network error. Check your connection.'; break;
                default: errorMessage = 'Voice error: ' + event.error + '. Try using Type instead.';
            }
            
            if (voiceRecognition.onError) voiceRecognition.onError(errorMessage);
        };
        
        voiceRecognition.recognition.onend = function() {
            voiceRecognition.isListening = false;
            if (voiceRecognition.onEnd) voiceRecognition.onEnd();
        };
    }

    function isVoiceSupported() {
        return voiceRecognition.recognition !== null;
    }

    function startVoice() {
        // Use Whisper API when on iOS Safari with Bulgarian, or when explicitly requested
        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        var useWhisper = isIOS && voiceRecognition.currentLang === 'bg-BG';
        
        if (useWhisper) {
            console.log('Using Whisper API for Bulgarian on iOS');
            return startWhisperRecording();
        }
        
        if (!voiceRecognition.recognition) {
            console.error('Recognition not initialized');
            showToast('Voice not initialized. Refresh the page.', 4000);
            return false;
        }
        if (voiceRecognition.isListening) {
            console.log('Already listening');
            return false;
        }
        try {
            console.log('Starting speech recognition...');
            console.log('Language:', voiceRecognition.recognition.lang);
            voiceRecognition.recognition.start();
            console.log('Start command sent');
            return true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            showToast('Voice error: ' + error.message, 4000);
            return false;
        }
    }

    function stopVoice() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            return;
        }
        if (voiceRecognition.recognition && voiceRecognition.isListening) {
            voiceRecognition.recognition.stop();
        }
    }

    // ==========================================
    // WHISPER API MODULE (For iOS Bulgarian support)
    // ==========================================
    
    var mediaRecorder = null;
    var audioChunks = [];
    var audioStream = null;

    function startWhisperRecording() {
        if (!getApiKey()) {
            showToast('Please add your OpenAI API key in Settings first', 4000);
            return false;
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('Audio recording not supported on this browser', 4000);
            return false;
        }
        
        audioChunks = [];
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                audioStream = stream;
                
                // Try different MIME types for iOS compatibility
                var mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                }
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = ''; // Let browser choose
                }
                
                var options = mimeType ? { mimeType: mimeType } : {};
                mediaRecorder = new MediaRecorder(stream, options);
                
                mediaRecorder.ondataavailable = function(e) {
                    if (e.data.size > 0) {
                        audioChunks.push(e.data);
                    }
                };
                
                mediaRecorder.onstop = function() {
                    // Stop all audio tracks
                    if (audioStream) {
                        audioStream.getTracks().forEach(function(track) { track.stop(); });
                    }
                    
                    // Combine chunks and send to Whisper
                    var audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                    transcribeWithWhisper(audioBlob);
                };
                
                mediaRecorder.start();
                voiceRecognition.isListening = true;
                if (voiceRecognition.onStart) voiceRecognition.onStart();
                console.log('Whisper recording started, mimeType:', mediaRecorder.mimeType);
            })
            .catch(function(err) {
                console.error('Error accessing microphone:', err);
                showToast('Microphone access denied', 4000);
                if (voiceRecognition.onError) voiceRecognition.onError('Microphone access denied');
            });
        
        return true;
    }

    function transcribeWithWhisper(audioBlob) {
        voiceRecognition.isListening = false;
        if (voiceRecognition.onEnd) voiceRecognition.onEnd();
        
        showLoading(true, 'Transcribing Bulgarian speech...');
        
        var apiKey = getApiKey();
        var formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'bg'); // Bulgarian ISO code
        formData.append('response_format', 'json');
        
        fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey
            },
            body: formData
        })
        .then(function(response) {
            if (!response.ok) {
                return response.text().then(function(text) {
                    throw new Error('Whisper API error: ' + response.status + ' - ' + text);
                });
            }
            return response.json();
        })
        .then(function(data) {
            hideLoading();
            var transcript = data.text || '';
            console.log('Whisper transcript:', transcript);
            
            if (transcript && voiceRecognition.onResult) {
                voiceRecognition.onResult(transcript);
            } else {
                showToast('No speech detected. Please try again.', 3000);
            }
        })
        .catch(function(error) {
            hideLoading();
            console.error('Whisper API error:', error);
            showToast('Voice transcription failed: ' + error.message, 4000);
            if (voiceRecognition.onError) voiceRecognition.onError(error.message);
        });
    }

    // ==========================================
    // AI MODULE
    // ==========================================

    var OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
    var MODEL = 'gpt-4o-mini';

    function parseFoodDescription(foodDescription) {
        var apiKey = getApiKey();
        
        if (!apiKey) {
            return Promise.reject(new Error('OpenAI API key not configured. Please add your API key in Settings.'));
        }
        
    var systemPrompt = `You are a precise nutrition assistant. Given a food description (in English or Bulgarian), extract each food item and return its estimated macronutrients.

RULES:
1. Extract EACH distinct food item separately — if user says "breakfast: 2 eggs, toast with butter, orange juice", return 4 items
2. Estimate a realistic serving weight in grams based on context clues or typical portions
3. Return calories AND full macronutrients (protein, carbs, fat, fiber) for the total quantity described
4. If the user specifies a quantity (e.g. "2 eggs", "100g rice"), use it exactly
5. If no quantity is given, assume one typical serving
6. For composite dishes (e.g. "chicken salad", "shopska salata"), break into main components (chicken, lettuce, tomato, dressing) for accuracy
7. Understand Bulgarian food names: кашкавал, сирене, кисело мляко, баница, шопска салата, кебапче, кюфте, лютеница, мусака, мляко, яйце, пилешко месо, говядина, риба, хляб
8. Return ONLY valid JSON — no markdown, no explanation

RETURN FORMAT — JSON array:
[
  {
    "name": "Food name (properly capitalized, in the language the user used)",
    "quantity": <number>,
    "unit": "g|ml|piece|serving|cup",
    "calories": <total kcal for the full quantity>,
    "protein": <grams of protein>,
    "carbs": <grams of carbohydrates>,
    "fat": <grams of fat>,
    "fiber": <grams of fiber>
  }
]

ESTIMATION GUIDELINES (base on standard nutritional databases):
- A cup of cooked rice = ~185g = ~130 kcal, 2.7g P, 28g C, 0.3g F, 0.4g fiber
- 100g raw rice = 360 kcal, 7g P, 79g C, 0.6g F, 1.3g fiber
- A large egg = ~50g = ~70 kcal, 6g P, 0.5g C, 5g F, 0g fiber
- 100g chicken breast (raw) = 120 kcal, 22g P, 0g C, 2.6g F, 0g fiber
- 100g bread/toast = 250 kcal, 8g P, 48g C, 3.3g F, 2g fiber
- 1 tbsp butter = ~14g = 100 kcal, 0g P, 0g C, 11g F, 0g fiber
- 250ml orange juice = 110 kcal, 2g P, 26g C, 0.5g F, 0.5g fiber
- 250ml whole milk = 160 kcal, 8g P, 12g C, 9g F, 0g fiber
- High-fiber foods (lentils, oats, beans): estimate 5-10g fiber per 100g
- When unsure between portions, use the smaller estimate (conservative)
- Round all macros to 1 decimal place`;
        
        var userPrompt = 'Parse this food description and return the JSON array with calories and macros (protein, carbs, fat in grams).\n\nCRITICAL: Use the EXACT quantity and unit specified by the user (e.g., if user says "150 grams", use quantity: 150, unit: "g"). Do NOT convert to "serving".\n\n"' + foodDescription + '"';
        
        return fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        })
        .then(function(response) {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded.');
                } else {
                    throw new Error('API error: ' + response.status);
                }
            }
            return response.json();
        })
        .then(function(data) {
            var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            if (!content) throw new Error('No response from AI');
            
            var jsonStr = content.trim();
            var jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonStr = jsonMatch[1].trim();
            
            if (!jsonStr.startsWith('[')) {
                var arrayStart = jsonStr.indexOf('[');
                var arrayEnd = jsonStr.lastIndexOf(']');
                if (arrayStart !== -1 && arrayEnd !== -1) {
                    jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);
                }
            }
            
            var items = JSON.parse(jsonStr);
            
            return items.map(function(item) {
                return {
                    name: (item.name || 'Food').trim(),
                    quantity: parseFloat(item.quantity) || 1,
                    unit: item.unit || 'serving',
                    calories: parseInt(item.calories, 10) || 0,
                    protein: parseFloat(item.protein) || 0,
                    carbs: parseFloat(item.carbs) || 0,
                    fat: parseFloat(item.fat) || 0,
                    notes: (item.notes || '').trim()
                };
            });
        });
    }

    // Calculate total macros for a date (including fiber)
    function getTotalMacros(dateKey) {
        var entries = getEntriesForDate(dateKey);
        return entries.reduce(function(totals, entry) {
            return {
                protein: totals.protein + (entry.protein || 0),
                carbs: totals.carbs + (entry.carbs || 0),
                fat: totals.fat + (entry.fat || 0),
                fiber: totals.fiber + (entry.fiber || 0)
            };
        }, { protein: 0, carbs: 0, fat: 0, fiber: 0 });
    }

    // ==========================================
    // MAIN APPLICATION
    // ==========================================

    var state = {
        proposedEntries: [],
        settings: {},
        isProcessing: false,
        selectedDate: getTodayKey(),
        recentFoods: [],
        barcodeScanner: null,
        isScannerActive: false,
        weightGraphMonth: null, // Date object representing the first day of the viewed month
        currentView: 'food' // 'food' or 'weight'
    };

    // ==========================================
    // VIEW SWITCHING (top tabs)
    // ==========================================
    function switchView(name) {
        if (name !== 'food' && name !== 'weight') return;
        state.currentView = name;

        var foodView = document.getElementById('viewFood');
        var weightView = document.getElementById('viewWeight');
        var tabFood = document.getElementById('tabFood');
        var tabWeight = document.getElementById('tabWeight');

        if (foodView) foodView.hidden = (name !== 'food');
        if (weightView) weightView.hidden = (name !== 'weight');
        if (tabFood) {
            tabFood.classList.toggle('active', name === 'food');
            tabFood.setAttribute('aria-selected', name === 'food' ? 'true' : 'false');
        }
        if (tabWeight) {
            tabWeight.classList.toggle('active', name === 'weight');
            tabWeight.setAttribute('aria-selected', name === 'weight' ? 'true' : 'false');
        }

        // When switching to weight, re-render to pick up any state changes
        if (name === 'weight') {
            refreshWeightUI();
        }

        try { history.replaceState(null, '', '#' + name); } catch (e) {}
    }

    // ==========================================
    // WEIGHT UI RENDERING
    // ==========================================

    function renderWeightCard() {
        var currentEl = document.getElementById('weightCurrentValue');
        var deltaEl = document.getElementById('weightDelta');
        var inputEl = document.getElementById('weightInput');
        var dateLabelEl = document.getElementById('weightForDate');
        if (!currentEl) return;

        // Weight is per selected date (follows the header date-nav)
        var dateKey = state.selectedDate;
        var weightForDate = getWeightForDate(dateKey);

        // Update the "Weight for X" label
        if (dateLabelEl) {
            dateLabelEl.textContent = formatDateKey(dateKey);
        }

        // Display value: weight for the selected date if logged, else em-dash
        if (weightForDate !== null) {
            currentEl.textContent = weightForDate.toFixed(1);
        } else {
            currentEl.textContent = '—';
        }

        // Pre-fill input for the currently selected date whenever it changes
        if (inputEl) {
            var lastPrefilledFor = inputEl.dataset.prefilledFor || '';
            if (lastPrefilledFor !== dateKey) {
                inputEl.value = weightForDate !== null ? weightForDate.toFixed(1) : '';
                inputEl.dataset.prefilledFor = dateKey;
            }
        }

        // Delta: compare selected-date weight to the most recent entry strictly BEFORE this date
        if (deltaEl) {
            var allKeys = Object.keys(getAllWeightEntries()).sort();
            var earlierKeys = allKeys.filter(function(k) { return k < dateKey; });
            if (weightForDate !== null && earlierKeys.length > 0) {
                var prevKey = earlierKeys[earlierKeys.length - 1];
                var prevKg = getAllWeightEntries()[prevKey];
                var diff = weightForDate - prevKg;
                var sign = diff > 0 ? '+' : (diff < 0 ? '−' : '');
                var abs = Math.abs(diff).toFixed(1);
                deltaEl.textContent = sign + abs + ' kg';
                deltaEl.classList.remove('up', 'down');
                if (diff < -0.05) deltaEl.classList.add('down');
                else if (diff > 0.05) deltaEl.classList.add('up');
                deltaEl.hidden = false;
            } else {
                deltaEl.hidden = true;
            }
        }

        renderSparkline();
    }

    function renderSparkline() {
        var svg = document.getElementById('weightSparkline');
        if (!svg) return;
        svg.innerHTML = '';

        var recent = getRecentWeights(14); // up to 14 days
        var W = 300, H = 40, PAD = 4;

        if (recent.length < 2) {
            // Not enough data
            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', W / 2);
            text.setAttribute('y', H / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.setAttribute('class', 'weight-sparkline-empty');
            text.textContent = recent.length === 1 ? 'Log more days to see trend' : 'No weight logged yet';
            svg.appendChild(text);
            return;
        }

        var values = recent.map(function(r) { return r.kg; });
        var minV = Math.min.apply(null, values);
        var maxV = Math.max.apply(null, values);
        var range = maxV - minV;
        if (range < 0.1) range = 0.1; // avoid divide-by-zero when flat

        var innerW = W - PAD * 2;
        var innerH = H - PAD * 2;

        var points = recent.map(function(r, i) {
            var x = PAD + (i / (recent.length - 1)) * innerW;
            var y = PAD + innerH - ((r.kg - minV) / range) * innerH;
            return { x: x, y: y };
        });

        // Line path
        var d = points.map(function(p, i) {
            return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
        }).join(' ');

        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'weight-sparkline-line');
        svg.appendChild(path);

        // Dots
        points.forEach(function(p, i) {
            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x.toFixed(1));
            circle.setAttribute('cy', p.y.toFixed(1));
            circle.setAttribute('r', i === points.length - 1 ? '3' : '2');
            circle.setAttribute('class', 'weight-sparkline-dot' + (i === points.length - 1 ? ' last' : ''));
            svg.appendChild(circle);
        });
    }

    function renderWeightGraph() {
        var svg = document.getElementById('weightGraph');
        var titleEl = document.getElementById('weightGraphTitle');
        var emptyEl = document.getElementById('weightGraphEmpty');
        var statsEl = document.getElementById('weightStats');
        var nextBtn = document.getElementById('nextMonthBtn');
        if (!svg || !titleEl) return;

        // Ensure viewed month is set
        if (!state.weightGraphMonth) {
            var today = new Date();
            state.weightGraphMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        var year = state.weightGraphMonth.getFullYear();
        var monthIdx = state.weightGraphMonth.getMonth();
        var monthName = state.weightGraphMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        titleEl.textContent = monthName;

        // Disable "next" if already at current month
        var now = new Date();
        var isCurrentOrFuture = (year > now.getFullYear()) ||
            (year === now.getFullYear() && monthIdx >= now.getMonth());
        if (nextBtn) {
            nextBtn.disabled = isCurrentOrFuture;
            nextBtn.style.opacity = isCurrentOrFuture ? '0.3' : '1';
        }

        var daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
        var weights = getWeightsForMonth(year, monthIdx); // { day: kg }
        var dayNums = Object.keys(weights).map(Number).sort(function(a, b) { return a - b; });

        // Clear
        svg.innerHTML = '';

        if (dayNums.length === 0) {
            if (emptyEl) emptyEl.hidden = false;
            if (statsEl) statsEl.hidden = true;
            return;
        }
        if (emptyEl) emptyEl.hidden = true;

        // Graph dimensions (viewBox is 320x180)
        var W = 320, H = 180;
        var PAD_L = 34, PAD_R = 10, PAD_T = 12, PAD_B = 22;
        var innerW = W - PAD_L - PAD_R;
        var innerH = H - PAD_T - PAD_B;

        // Compute y-axis range with 0.5kg padding
        var values = dayNums.map(function(d) { return weights[d]; });
        var minV = Math.min.apply(null, values);
        var maxV = Math.max.apply(null, values);
        if (maxV - minV < 1) { // ensure at least 1kg range for readability
            var mid = (minV + maxV) / 2;
            minV = mid - 0.5;
            maxV = mid + 0.5;
        } else {
            minV -= 0.3;
            maxV += 0.3;
        }
        var yRange = maxV - minV;

        // Helper: x for day-of-month
        function xForDay(day) {
            return PAD_L + ((day - 1) / (daysInMonth - 1 || 1)) * innerW;
        }
        // Helper: y for weight value
        function yForVal(v) {
            return PAD_T + innerH - ((v - minV) / yRange) * innerH;
        }

        var svgNS = 'http://www.w3.org/2000/svg';

        // Y-axis gridlines + labels (3 lines: min, mid, max)
        [0, 0.5, 1].forEach(function(frac) {
            var v = minV + frac * yRange;
            var y = yForVal(v);
            var line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', PAD_L);
            line.setAttribute('y1', y);
            line.setAttribute('x2', W - PAD_R);
            line.setAttribute('y2', y);
            line.setAttribute('class', 'weight-graph-gridline');
            svg.appendChild(line);

            var label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', PAD_L - 4);
            label.setAttribute('y', y + 3);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('class', 'weight-graph-axis-label');
            label.textContent = v.toFixed(1);
            svg.appendChild(label);
        });

        // X-axis labels (day numbers) - show 1, 10, 20, and last day
        var xTicks = [1, 10, 20, daysInMonth];
        xTicks.forEach(function(day) {
            if (day > daysInMonth) return;
            var x = xForDay(day);
            var label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', H - 6);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('class', 'weight-graph-axis-label');
            label.textContent = day;
            svg.appendChild(label);
        });

        // Line path connecting dots (only through logged days, in order)
        var pathD = dayNums.map(function(d, i) {
            return (i === 0 ? 'M' : 'L') + xForDay(d).toFixed(1) + ' ' + yForVal(weights[d]).toFixed(1);
        }).join(' ');
        var path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('class', 'weight-graph-line');
        svg.appendChild(path);

        // Dots
        var todayKey = getTodayKey();
        var todayDate = new Date(todayKey + 'T12:00:00');
        var isViewingCurrentMonth = (year === todayDate.getFullYear() && monthIdx === todayDate.getMonth());
        dayNums.forEach(function(day) {
            var circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', xForDay(day).toFixed(1));
            circle.setAttribute('cy', yForVal(weights[day]).toFixed(1));
            circle.setAttribute('r', '4');
            var isToday = isViewingCurrentMonth && day === todayDate.getDate();
            circle.setAttribute('class', 'weight-graph-dot' + (isToday ? ' today' : ''));
            var titleNode = document.createElementNS(svgNS, 'title');
            titleNode.textContent = 'Day ' + day + ': ' + weights[day].toFixed(1) + ' kg';
            circle.appendChild(titleNode);
            svg.appendChild(circle);
        });

        // Stats
        if (statsEl) {
            statsEl.hidden = false;
            document.getElementById('weightMin').textContent = Math.min.apply(null, values).toFixed(1);
            document.getElementById('weightMax').textContent = Math.max.apply(null, values).toFixed(1);
            var avg = values.reduce(function(s, v) { return s + v; }, 0) / values.length;
            document.getElementById('weightAvg').textContent = avg.toFixed(1);

            // Change = last - first (chronologically)
            var first = weights[dayNums[0]];
            var last = weights[dayNums[dayNums.length - 1]];
            var change = last - first;
            var changeEl = document.getElementById('weightChange');
            var sign = change > 0 ? '+' : (change < 0 ? '−' : '');
            changeEl.textContent = sign + Math.abs(change).toFixed(1) + ' kg';
            changeEl.classList.remove('up', 'down');
            if (change < -0.05) changeEl.classList.add('down');
            else if (change > 0.05) changeEl.classList.add('up');
        }
    }

    function refreshWeightUI() {
        renderWeightCard();
        renderWeightGraph();
    }

    function handleWeightSubmit(e) {
        e.preventDefault();
        var inputEl = document.getElementById('weightInput');
        if (!inputEl) return;
        var kg = parseFloat(inputEl.value);
        if (isNaN(kg) || kg < 20 || kg > 300) {
            showToast('Please enter a valid weight (20-300 kg)', 3000);
            return;
        }
        // Round to 1 decimal
        kg = Math.round(kg * 10) / 10;
        // Save for the currently selected date (from the header date-nav)
        var dateKey = state.selectedDate;
        var ok = saveWeight(dateKey, kg);
        if (ok) {
            inputEl.dataset.prefilledFor = ''; // force re-prefill next render
            refreshWeightUI();
            showToast('Logged ' + kg.toFixed(1) + ' kg for ' + formatDateKey(dateKey), 2000);
        } else {
            showToast('Failed to save weight', 3000);
        }
    }

    function changeWeightGraphMonth(offset) {
        if (!state.weightGraphMonth) {
            var t = new Date();
            state.weightGraphMonth = new Date(t.getFullYear(), t.getMonth(), 1);
        }
        var newMonth = new Date(state.weightGraphMonth);
        newMonth.setMonth(newMonth.getMonth() + offset);
        // Don't allow future months
        var now = new Date();
        var currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (newMonth > currentMonthStart) return;
        state.weightGraphMonth = newMonth;
        renderWeightGraph();
    }

    // ==========================================
    // FOOD SEARCH MODULE (AI-Powered)
    // ==========================================

    function searchFoodDatabase(query) {
        if (!query || query.trim().length < 2) {
            return Promise.resolve([]);
        }

        var apiKey = getApiKey();
        if (!apiKey) {
            return Promise.reject(new Error('OpenAI API key not configured. Please add your API key in Settings.'));
        }

        var systemPrompt = `You are a food nutrition database. Given a food search query (in any language), return 8-10 common variations/forms of that food with their nutrition per 100g.

RULES:
1. Return different variations of the searched food (e.g., for "chicken": breast, thigh, drumstick, ground, etc.)
2. Include both raw and cooked versions where relevant
3. All nutrition values must be per 100g (not per serving)
4. Use accurate nutrition data based on standard food databases
5. Keep the food name in the SAME LANGUAGE as the user's query
6. If the query is in Bulgarian, respond with Bulgarian food names
7. If the query is in English, respond with English food names
8. Return ONLY valid JSON — no markdown, no explanation

RETURN FORMAT — JSON array:
[
  {
    "name": "Food name (in user's language)",
    "description": "Brief description in user's language",
    "calories": <kcal per 100g>,
    "protein": <grams per 100g>,
    "carbs": <grams per 100g>,
    "fat": <grams per 100g>,
    "fiber": <grams per 100g>
  }
]

EXAMPLE for "кисело мляко" (Bulgarian for yogurt):
[
  {"name": "Кисело мляко 2%", "description": "Обикновено кисело мляко", "calories": 63, "protein": 4.3, "carbs": 7.0, "fat": 2.0, "fiber": 0},
  {"name": "Кисело мляко 3.6%", "description": "Пълномаслено", "calories": 84, "protein": 4.0, "carbs": 6.5, "fat": 3.6, "fiber": 0},
  {"name": "Гръцко кисело мляко", "description": "Гъсто, цедено", "calories": 97, "protein": 9.0, "carbs": 3.6, "fat": 5.0, "fiber": 0}
]

EXAMPLE for "chicken":
[
  {"name": "Chicken breast, raw", "description": "Skinless, boneless", "calories": 120, "protein": 22.5, "carbs": 0, "fat": 2.6, "fiber": 0},
  {"name": "Chicken breast, cooked", "description": "Grilled or baked", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "fiber": 0},
  {"name": "Chicken thigh, raw", "description": "With skin", "calories": 177, "protein": 17.3, "carbs": 0, "fat": 11.5, "fiber": 0}
]`;

        var userPrompt = 'Search for: "' + query.trim() + '"';

        return fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1500
            })
        })
        .then(function(response) {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Wait a moment.');
                } else {
                    throw new Error('API error: ' + response.status);
                }
            }
            return response.json();
        })
        .then(function(data) {
            var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            if (!content) throw new Error('No response from AI');
            
            var jsonStr = content.trim();
            var jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonStr = jsonMatch[1].trim();
            
            if (!jsonStr.startsWith('[')) {
                var arrayStart = jsonStr.indexOf('[');
                var arrayEnd = jsonStr.lastIndexOf(']');
                if (arrayStart !== -1 && arrayEnd !== -1) {
                    jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);
                }
            }
            
            var items = JSON.parse(jsonStr);
            
            return items.map(function(item) {
                return {
                    name: (item.name || 'Food').trim(),
                    brand: (item.description || '').trim(),
                    calories: Math.round(parseFloat(item.calories) || 0),
                    protein: Math.round((parseFloat(item.protein) || 0) * 10) / 10,
                    carbs: Math.round((parseFloat(item.carbs) || 0) * 10) / 10,
                    fat: Math.round((parseFloat(item.fat) || 0) * 10) / 10,
                    fiber: Math.round((parseFloat(item.fiber) || 0) * 10) / 10,
                    source: 'ai'
                };
            }).filter(function(food) {
                return food.calories > 0;
            });
        });
    }

    function renderSearchResults(results) {
        var searchResults = document.getElementById('searchResults');
        var searchResultsList = document.getElementById('searchResultsList');

        if (!searchResults || !searchResultsList) return;

        searchResultsList.innerHTML = '';

        if (results.length === 0) {
            searchResults.hidden = false;
            searchResultsList.innerHTML = '<p class="search-no-results">No foods found. Try a different search term.</p>';
            return;
        }

        searchResults.hidden = false;

        results.forEach(function(food) {
            var card = document.createElement('div');
            card.className = 'search-result-card';
            card.dataset.fdcId = food.fdcId;

            var brandHtml = food.brand ? '<div class="search-result-brand">' + escapeHtml(food.brand) + '</div>' : '';

            card.innerHTML = 
                '<div class="search-result-name">' + escapeHtml(food.name) + '</div>' +
                brandHtml +
                '<div class="search-result-macros">' +
                    '<span class="search-result-macro calories">' + food.calories + ' kcal</span>' +
                    '<span class="search-result-macro protein">P: ' + food.protein + 'g</span>' +
                    '<span class="search-result-macro carbs">C: ' + food.carbs + 'g</span>' +
                    '<span class="search-result-macro fat">F: ' + food.fat + 'g</span>' +
                '</div>';

            card.addEventListener('click', function() {
                handleSearchResultClick(food);
            });

            searchResultsList.appendChild(card);
        });
    }

    function handleSearchResultClick(food) {
        // Create a proposed entry from the search result (per 100g)
        var entry = {
            name: food.name,
            quantity: 100,
            unit: 'g',
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            fiber: food.fiber || 0,
            source: 'usda',
            fdcId: food.fdcId
        };

        // Add to proposed entries
        state.proposedEntries.push(entry);
        renderProposedEntries(state.proposedEntries, getProposedEntryHandlers());

        // Clear search results and input
        var searchResults = document.getElementById('searchResults');
        var foodSearchInput = document.getElementById('foodSearchInput');
        if (searchResults) searchResults.hidden = true;
        if (foodSearchInput) foodSearchInput.value = '';

        showToast('Added: ' + food.name + ' (100g)', 2000);
    }

    function handleFoodSearch(e) {
        e.preventDefault();

        var foodSearchInput = document.getElementById('foodSearchInput');
        var query = foodSearchInput ? foodSearchInput.value.trim() : '';

        if (query.length < 2) {
            showToast('Enter at least 2 characters to search', 2000);
            return;
        }

        showLoading('Searching foods with AI...');

        searchFoodDatabase(query)
            .then(function(results) {
                hideLoading();
                renderSearchResults(results);
            })
            .catch(function(error) {
                hideLoading();
                console.error('Search error:', error);
                showToast('Search failed. Please try again.', 3000);
            });
    }

    // ==========================================
    // BARCODE SCANNER MODULE (OpenAI Vision API)
    // ==========================================

    // Debug logging to console only
    function debugLog(message) {
        console.log('[Scanner]', message);
    }

    // No-op: scanner is now photo-based only, no live camera
    function startBarcodeScanner() {
        state.isScannerActive = false;
    }

    function stopBarcodeScanner() {
        state.isScannerActive = false;
    }

    function onBarcodeScanned(barcode, result) {
        stopBarcodeScanner();
        showToast('Barcode detected: ' + barcode, 2000);
        lookupBarcode(barcode);
    }

    // Decode barcode from a photo using OpenAI Vision API
    function handleBarcodePhoto(file) {
        debugLog('Photo captured: ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)');
        
        var apiKey = getApiKey();
        if (!apiKey) {
            debugLog('No API key');
            showToast('Add OpenAI API key in Settings first', 4000);
            return;
        }
        
        showLoading('Reading barcode with AI...');
        debugLog('Sending to OpenAI Vision...');
        
        // Convert file to base64 data URL
        var reader = new FileReader();
        reader.onload = function() {
            var dataUrl = reader.result;
            debugLog('Image converted to base64');
            
            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Read the barcode number from this image. The barcode digits are usually printed below the black bars. Reply with ONLY the digits of the barcode number, no other text. If you cannot see a clear barcode with digits, reply with "NONE".'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: dataUrl,
                                    detail: 'high'
                                }
                            }
                        ]
                    }],
                    max_tokens: 30,
                    temperature: 0
                })
            })
            .then(function(response) {
                if (!response.ok) {
                    return response.text().then(function(text) {
                        throw new Error('API ' + response.status + ': ' + text);
                    });
                }
                return response.json();
            })
            .then(function(data) {
                hideLoading();
                
                var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
                if (!content) {
                    debugLog('AI returned no content');
                    showToast('AI could not read barcode. Try again.', 4000);
                    return;
                }
                
                var trimmed = content.trim();
                debugLog('AI response: "' + trimmed + '"');
                
                var digits = trimmed.replace(/\D/g, '');
                
                if (trimmed.toUpperCase().includes('NONE') || !digits || digits.length < 8) {
                    debugLog('No valid barcode');
                    showToast('AI could not read barcode. Try a clearer photo.', 4000);
                    return;
                }
                
                debugLog('✓ Barcode: ' + digits);
                onBarcodeScanned(digits, null);
            })
            .catch(function(err) {
                hideLoading();
                debugLog('Error: ' + err.message);
                showToast('AI barcode reading failed: ' + err.message.substring(0, 60), 4000);
            });
        };
        reader.onerror = function() {
            hideLoading();
            debugLog('Failed to read image file');
            showToast('Failed to read photo', 3000);
        };
        reader.readAsDataURL(file);
    }

    function lookupBarcode(barcode) {
        showLoading('Looking up product...');
        
        var url = 'https://world.openfoodfacts.org/api/v2/product/' + barcode + '.json';
        
        fetch(url)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                hideLoading();
                
                if (data.status === 1 && data.product) {
                    showProductPreview(data.product, barcode);
                } else {
                    showToast('Product not found in database', 3000);
                    // Offer to enter manually
                    offerManualEntry(barcode);
                }
            })
            .catch(function(error) {
                hideLoading();
                console.error('Error looking up barcode:', error);
                showToast('Error looking up product. Check your internet connection.', 3000);
            });
    }

    function showProductPreview(product, barcode) {
        var name = product.product_name || product.product_name_en || 'Unknown Product';
        var brand = product.brands || '';
        var nutriments = product.nutriments || {};
        
        // Get nutrition per 100g
        var caloriesPer100g = nutriments['energy-kcal_100g'] || nutriments['energy_100g'] / 4.184 || 0;
        var proteinPer100g = nutriments['proteins_100g'] || 0;
        var carbsPer100g = nutriments['carbohydrates_100g'] || 0;
        var fatPer100g = nutriments['fat_100g'] || 0;
        
        // Get serving size
        var servingSize = product.serving_size || '100g';
        var servingQuantity = parseFloat(product.serving_quantity) || 100;
        
        // Calculate per serving
        var ratio = servingQuantity / 100;
        var caloriesPerServing = Math.round(caloriesPer100g * ratio);
        var proteinPerServing = Math.round(proteinPer100g * ratio * 10) / 10;
        var carbsPerServing = Math.round(carbsPer100g * ratio * 10) / 10;
        var fatPerServing = Math.round(fatPer100g * ratio * 10) / 10;
        
        // Create entry for proposed section
        var entry = {
            name: brand ? brand + ' ' + name : name,
            quantity: servingQuantity,
            unit: 'g',
            calories: caloriesPerServing,
            protein: proteinPerServing,
            carbs: carbsPerServing,
            fat: fatPerServing,
            barcode: barcode
        };
        
        // Add to proposed entries
        state.proposedEntries = [entry];
        renderProposedEntries(state.proposedEntries, getProposedEntryHandlers());
        
        showToast('Found: ' + entry.name, 2000);
    }

    function offerManualEntry(barcode) {
        // Switch to manual entry mode
        var manualEntryForm = document.getElementById('manualEntryForm');
        var manualEntryToggle = document.getElementById('manualEntryToggle');
        
        if (manualEntryForm && manualEntryToggle) {
            manualEntryForm.hidden = false;
            manualEntryToggle.hidden = true;
        }
    }

    // ==========================================
    // DATE NAVIGATION HELPERS
    // ==========================================

    function formatDateKey(dateKey) {
        var date = new Date(dateKey + 'T12:00:00');
        var today = getTodayKey();
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var yesterdayKey = yesterday.toISOString().split('T')[0];
        
        if (dateKey === today) {
            return 'Today';
        } else if (dateKey === yesterdayKey) {
            return 'Yesterday';
        } else {
            var options = { weekday: 'short', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }
    }

    function changeDate(offset) {
        var date = new Date(state.selectedDate + 'T12:00:00');
        date.setDate(date.getDate() + offset);
        state.selectedDate = date.toISOString().split('T')[0];
        updateDateNavigationUI();
        refreshDataForDate(state.selectedDate);
    }

    function goToToday() {
        state.selectedDate = getTodayKey();
        updateDateNavigationUI();
        refreshDataForDate(state.selectedDate);
    }

    function updateDateNavigationUI() {
        var dateDisplay = document.getElementById('dateDisplay');
        var todayBtn = document.getElementById('todayBtn');
        var nextDayBtn = document.getElementById('nextDayBtn');
        
        if (dateDisplay) {
            dateDisplay.textContent = formatDateKey(state.selectedDate);
        }
        
        var isToday = state.selectedDate === getTodayKey();
        
        if (todayBtn) {
            todayBtn.hidden = isToday;
        }
        
        // Disable next button if viewing today
        if (nextDayBtn) {
            nextDayBtn.disabled = isToday;
            nextDayBtn.style.opacity = isToday ? '0.3' : '1';
        }
        
        // Update section title
        var sectionTitle = document.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.textContent = isToday ? "Today's Food" : formatDateKey(state.selectedDate) + "'s Food";
        }
    }

    function refreshDataForDate(dateKey) {
        var entries = getEntriesForDate(dateKey);
        var totalCalories = getTotalCalories(dateKey);
        var totalMacros = getTotalMacros(dateKey);
        
        renderFoodLog(entries, handleDeleteEntry);
        updateProgressRing(totalCalories, state.settings.dailyGoal);
        updateMacroSummary(totalMacros, state.settings);
        // Weight card follows selectedDate — refresh whenever date changes
        renderWeightCard();
    }

    // ==========================================
    // QUICK ADD / RECENT FOODS HELPERS
    // ==========================================

    function getRecentFoods() {
        try {
            var data = localStorage.getItem(STORAGE_KEYS.RECENT_FOODS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading recent foods:', error);
            return [];
        }
    }

    function saveRecentFood(entry) {
        var recent = getRecentFoods();
        
        // Check if food already exists (by name)
        var existingIndex = recent.findIndex(function(f) {
            return f.name.toLowerCase() === entry.name.toLowerCase();
        });
        
        // If exists, remove it (will add to front)
        if (existingIndex !== -1) {
            recent.splice(existingIndex, 1);
        }
        
        // Add to front of array
        recent.unshift({
            name: entry.name,
            quantity: entry.quantity,
            unit: entry.unit,
            calories: entry.calories,
            protein: entry.protein || 0,
            carbs: entry.carbs || 0,
            fat: entry.fat || 0
        });
        
        // Keep only last 10 items
        if (recent.length > 10) {
            recent = recent.slice(0, 10);
        }
        
        try {
            localStorage.setItem(STORAGE_KEYS.RECENT_FOODS, JSON.stringify(recent));
        } catch (error) {
            console.error('Error saving recent foods:', error);
        }
        
        return recent;
    }

    // ==========================================
    // FAVORITES UI MODULE
    // ==========================================

    function renderFavorites(filterText) {
        var favoritesSection = document.getElementById('favoritesSection');
        var favoritesList = document.getElementById('favoritesList');
        var favoritesEmpty = document.getElementById('favoritesEmpty');
        var favoritesCount = document.getElementById('favoritesCount');
        
        if (!favoritesList) return;
        
        var favorites = getAllFavorites();
        
        // Apply filter if provided
        if (filterText && filterText.trim()) {
            var lowerFilter = filterText.toLowerCase().trim();
            favorites = favorites.filter(function(f) {
                return f.name.toLowerCase().indexOf(lowerFilter) !== -1;
            });
        }
        
        // Update count
        var totalCount = getAllFavorites().length;
        if (favoritesCount) {
            favoritesCount.textContent = totalCount > 0 ? totalCount + ' saved' : '';
        }
        
        // Clear existing cards
        var existingCards = favoritesList.querySelectorAll('.favorite-card');
        existingCards.forEach(function(el) { el.remove(); });
        
        if (favorites.length === 0) {
            if (favoritesEmpty) {
                if (totalCount === 0) {
                    favoritesEmpty.textContent = 'No favorites yet. Add foods and tap ⭐ to save them!';
                } else {
                    favoritesEmpty.textContent = 'No matches found';
                }
                favoritesEmpty.hidden = false;
            }
            return;
        }
        
        if (favoritesEmpty) favoritesEmpty.hidden = true;
        
        favorites.forEach(function(fav) {
            var card = createFavoriteCard(fav);
            favoritesList.appendChild(card);
        });
    }

    function createFavoriteCard(favorite) {
        var card = document.createElement('div');
        card.className = 'favorite-card';
        card.dataset.id = favorite.id;
        
        var macrosHtml = 
            '<span class="favorite-macro calories">' + favorite.calories + ' kcal</span>' +
            '<span class="favorite-macro">P:' + (favorite.protein || 0).toFixed(0) + 'g</span>' +
            '<span class="favorite-macro">C:' + (favorite.carbs || 0).toFixed(0) + 'g</span>' +
            '<span class="favorite-macro">F:' + (favorite.fat || 0).toFixed(0) + 'g</span>';
        
        card.innerHTML = 
            '<div class="favorite-info">' +
                '<div class="favorite-name">' + escapeHtml(favorite.name) + '</div>' +
                '<div class="favorite-macros">' + macrosHtml + ' / ' + favorite.quantity + favorite.unit + '</div>' +
            '</div>' +
            '<div class="favorite-actions">' +
                '<button class="favorite-delete-btn" aria-label="Remove from favorites">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                        '<line x1="6" y1="6" x2="18" y2="18"></line>' +
                    '</svg>' +
                '</button>' +
            '</div>';
        
        // Click card to add to proposed entries with quantity picker
        card.addEventListener('click', function(e) {
            if (e.target.closest('.favorite-delete-btn')) return;
            handleFavoriteClick(favorite);
        });
        
        // Delete button
        var deleteBtn = card.querySelector('.favorite-delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            handleRemoveFavorite(favorite.id, favorite.name);
        });
        
        return card;
    }

    function handleFavoriteClick(favorite) {
        // Show edit modal pre-filled with favorite data, allowing quantity adjustment
        var entry = {
            name: favorite.name,
            quantity: favorite.quantity,
            unit: favorite.unit,
            calories: favorite.calories,
            protein: favorite.protein || 0,
            carbs: favorite.carbs || 0,
            fat: favorite.fat || 0,
            fiber: favorite.fiber || 0
        };
        
        showEditModal(entry, function(updatedEntry) {
            // Add to proposed entries
            state.proposedEntries.push(updatedEntry);
            renderProposedEntries(state.proposedEntries, getProposedEntryHandlers());
            showToast('Added: ' + updatedEntry.name, 2000);
        }, function() {});
    }

    function handleRemoveFavorite(favoriteId, name) {
        var removed = removeFavorite(favoriteId);
        if (removed) {
            renderFavorites(document.getElementById('favoritesFilterInput')?.value || '');
            showToast('Removed from favorites: ' + name, 2000);
        }
    }

    function handleAddToFavorites(entry) {
        var saved = saveFavorite(entry);
        if (saved) {
            renderFavorites('');
            showToast('⭐ Added to favorites: ' + entry.name, 2000);
        } else {
            showToast('Failed to save favorite', 3000);
        }
    }

    function init() {
        console.log('Initializing Calorie Tracker...');
        
        state.settings = getSettings();
        state.selectedDate = getTodayKey();
        
        updateDateNavigationUI();
        refreshDataForDate(state.selectedDate);
        renderFavorites('');
        refreshWeightUI();
        
        loadSettingsIntoForm(state.settings, getApiKey());
        
        setupEventListeners();
        setupStickyHeader();
        
        initVoice();
        setupVoiceRecognition();

        // Restore last view from URL hash (#food or #weight), default to food
        var initialView = 'food';
        if (typeof window !== 'undefined' && window.location && window.location.hash) {
            var h = window.location.hash.replace('#', '');
            if (h === 'weight' || h === 'food') initialView = h;
        }
        switchView(initialView);
        
        if (!getApiKey()) {
            setTimeout(function() {
                showToast('Add your OpenAI API key in Settings to use voice input', 5000);
            }, 1000);
        }
        
        console.log('Calorie Tracker initialized');
    }

    function refreshData() {
        refreshDataForDate(state.selectedDate);
        renderFavorites(document.getElementById('favoritesFilterInput')?.value || '');
    }

    function updateMacroSummary(consumed, settings) {
        var proteinConsumed = document.getElementById('proteinConsumed');
        var carbsConsumed = document.getElementById('carbsConsumed');
        var fatConsumed = document.getElementById('fatConsumed');
        var fiberConsumed = document.getElementById('fiberConsumed');
        var proteinGoal = document.getElementById('proteinGoal');
        var carbsGoal = document.getElementById('carbsGoal');
        var fatGoal = document.getElementById('fatGoal');
        var fiberGoal = document.getElementById('fiberGoal');
        
        // Update text values
        if (proteinConsumed) proteinConsumed.textContent = Math.round(consumed.protein);
        if (carbsConsumed) carbsConsumed.textContent = Math.round(consumed.carbs);
        if (fatConsumed) fatConsumed.textContent = Math.round(consumed.fat);
        if (fiberConsumed) fiberConsumed.textContent = Math.round(consumed.fiber || 0);
        
        var pGoal = settings.proteinGoal || 150;
        var cGoal = settings.carbsGoal || 250;
        var fGoal = settings.fatGoal || 65;
        var fiGoal = settings.fiberGoal || 30;
        
        if (proteinGoal) proteinGoal.textContent = pGoal;
        if (carbsGoal) carbsGoal.textContent = cGoal;
        if (fatGoal) fatGoal.textContent = fGoal;
        if (fiberGoal) fiberGoal.textContent = fiGoal;
        
        // Update progress bars
        var proteinBar = document.getElementById('proteinBar');
        var carbsBar = document.getElementById('carbsBar');
        var fatBar = document.getElementById('fatBar');
        var fiberBar = document.getElementById('fiberBar');
        
        if (proteinBar) proteinBar.style.width = Math.min((consumed.protein / pGoal) * 100, 100) + '%';
        if (carbsBar) carbsBar.style.width = Math.min((consumed.carbs / cGoal) * 100, 100) + '%';
        if (fatBar) fatBar.style.width = Math.min((consumed.fat / fGoal) * 100, 100) + '%';
        if (fiberBar) fiberBar.style.width = Math.min(((consumed.fiber || 0) / fiGoal) * 100, 100) + '%';
        
        // Update sticky header
        updateStickyHeader(consumed, settings);
    }

    function updateStickyHeader(consumed, settings) {
        var stickyCalConsumed = document.getElementById('stickyCalConsumed');
        var stickyCalGoal = document.getElementById('stickyCalGoal');
        var stickyProtein = document.getElementById('stickyProtein');
        var stickyCarbs = document.getElementById('stickyCarbs');
        var stickyFat = document.getElementById('stickyFat');
        
        var totalCal = getTotalCalories(state.selectedDate);
        
        if (stickyCalConsumed) stickyCalConsumed.textContent = totalCal;
        if (stickyCalGoal) stickyCalGoal.textContent = settings.dailyGoal || 2000;
        if (stickyProtein) stickyProtein.textContent = Math.round(consumed.protein);
        if (stickyCarbs) stickyCarbs.textContent = Math.round(consumed.carbs);
        if (stickyFat) stickyFat.textContent = Math.round(consumed.fat);
    }

    // Sticky header scroll handler
    function setupStickyHeader() {
        var progressSection = document.querySelector('.progress-section');
        var stickyHeader = document.getElementById('stickyHeader');
        
        if (!progressSection || !stickyHeader) return;
        
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    stickyHeader.classList.remove('visible');
                } else {
                    stickyHeader.classList.add('visible');
                }
            });
        }, { threshold: 0, rootMargin: '-100px 0px 0px 0px' });
        
        observer.observe(progressSection);
    }

    function setupEventListeners() {
        var settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() {
                loadSettingsIntoForm(state.settings, getApiKey());
                toggleSettingsModal(true);
            });
        }
        
        var closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', function() {
                toggleSettingsModal(false);
            });
        }
        
        var saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', handleSaveSettings);
        }
        
        var clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', handleClearData);
        }
        
        var settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.addEventListener('click', function(e) {
                if (e.target === settingsModal) {
                    toggleSettingsModal(false);
                }
            });
        }
        
        var voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', handleVoiceButtonClick);
        }
        
        var manualEntryToggle = document.getElementById('manualEntryToggle');
        if (manualEntryToggle) {
            manualEntryToggle.addEventListener('click', function() {
                toggleManualEntryForm(true);
            });
        }
        
        var manualEntryForm = document.getElementById('manualEntryForm');
        if (manualEntryForm) {
            manualEntryForm.addEventListener('submit', handleManualEntry);
        }
        
        var addAllBtn = document.getElementById('addAllBtn');
        if (addAllBtn) {
            addAllBtn.addEventListener('click', handleAddAllProposed);
        }
        
        var clearProposedBtn = document.getElementById('clearProposedBtn');
        if (clearProposedBtn) {
            clearProposedBtn.addEventListener('click', function() {
                state.proposedEntries = [];
                renderProposedEntries([], getProposedEntryHandlers());
                updateTranscription('', false);
            });
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                toggleSettingsModal(false);
            }
        });
        
        // Macro goal inputs - update calculated calories in real-time
        var proteinGoalInput = document.getElementById('proteinGoalInput');
        var carbsGoalInput = document.getElementById('carbsGoalInput');
        var fatGoalInput = document.getElementById('fatGoalInput');
        
        if (proteinGoalInput) {
            proteinGoalInput.addEventListener('input', updateCalculatedCaloriesDisplay);
        }
        if (carbsGoalInput) {
            carbsGoalInput.addEventListener('input', updateCalculatedCaloriesDisplay);
        }
        if (fatGoalInput) {
            fatGoalInput.addEventListener('input', updateCalculatedCaloriesDisplay);
        }
        
        // Input mode toggle (voice/text/search/scan)
        var voiceToggle = document.getElementById('voiceToggle');
        var textToggle = document.getElementById('textToggle');
        var searchToggle = document.getElementById('searchToggle');
        var scanToggle = document.getElementById('scanToggle');
        var stopScanBtn = document.getElementById('stopScanBtn');
        
        if (voiceToggle) {
            voiceToggle.addEventListener('click', function() {
                setInputMode('voice');
            });
        }
        if (textToggle) {
            textToggle.addEventListener('click', function() {
                setInputMode('text');
            });
        }
        if (searchToggle) {
            searchToggle.addEventListener('click', function() {
                setInputMode('search');
            });
        }
        if (scanToggle) {
            scanToggle.addEventListener('click', function() {
                setInputMode('scan');
            });
        }
        
        // Search form
        var searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', handleFoodSearch);
        }
        if (stopScanBtn) {
            stopScanBtn.addEventListener('click', function() {
                stopBarcodeScanner();
                setInputMode('voice');
            });
        }
        
        // Photo capture for barcode (works great on iOS)
        var barcodePhotoInput = document.getElementById('barcodePhotoInput');
        if (barcodePhotoInput) {
            barcodePhotoInput.addEventListener('change', function(e) {
                var file = e.target.files && e.target.files[0];
                if (file) {
                    handleBarcodePhoto(file);
                    barcodePhotoInput.value = '';
                }
            });
        }
        
        // Text input form
        var textInputForm = document.getElementById('textInputForm');
        if (textInputForm) {
            textInputForm.addEventListener('submit', handleTextInput);
        }
        
        // Voice confirmation buttons
        var retryVoiceBtn = document.getElementById('retryVoiceBtn');
        var confirmVoiceBtn = document.getElementById('confirmVoiceBtn');
        
        if (retryVoiceBtn) {
            retryVoiceBtn.addEventListener('click', function() {
                pendingTranscript = '';
                updateTranscription('', false);
                startVoice();
            });
        }
        
        if (confirmVoiceBtn) {
            confirmVoiceBtn.addEventListener('click', function() {
                if (pendingTranscript) {
                    processVoiceInput(pendingTranscript);
                    pendingTranscript = '';
                    updateTranscription(pendingTranscript, true, false);
                }
            });
        }
        
        // Language toggle buttons
        var langBG = document.getElementById('langBG');
        var langEN = document.getElementById('langEN');
        
        if (langBG) {
            langBG.addEventListener('click', function() {
                setVoiceLanguage('bg-BG');
            });
        }
        
        if (langEN) {
            langEN.addEventListener('click', function() {
                setVoiceLanguage('en-US');
            });
        }
        
        // Date navigation buttons
        var prevDayBtn = document.getElementById('prevDayBtn');
        var nextDayBtn = document.getElementById('nextDayBtn');
        var todayBtn = document.getElementById('todayBtn');
        
        if (prevDayBtn) {
            prevDayBtn.addEventListener('click', function() {
                changeDate(-1);
            });
        }
        
        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', function() {
                changeDate(1);
            });
        }
        
        if (todayBtn) {
            todayBtn.addEventListener('click', function() {
                goToToday();
            });
        }

        // Weight input form
        var weightInputForm = document.getElementById('weightInputForm');
        if (weightInputForm) {
            weightInputForm.addEventListener('submit', handleWeightSubmit);
        }

        // Weight graph month navigation
        var prevMonthBtn = document.getElementById('prevMonthBtn');
        var nextMonthBtn = document.getElementById('nextMonthBtn');
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', function() { changeWeightGraphMonth(-1); });
        }
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', function() { changeWeightGraphMonth(1); });
        }

        // View tabs (Food / Weight)
        var tabFood = document.getElementById('tabFood');
        var tabWeight = document.getElementById('tabWeight');
        if (tabFood) tabFood.addEventListener('click', function() { switchView('food'); });
        if (tabWeight) tabWeight.addEventListener('click', function() { switchView('weight'); });

        // Favorites filter input
        var favoritesFilterInput = document.getElementById('favoritesFilterInput');
        if (favoritesFilterInput) {
            favoritesFilterInput.addEventListener('input', function() {
                renderFavorites(this.value);
            });
        }
    }

    function setVoiceLanguage(lang) {
        if (!voiceRecognition.SpeechRecognition) return;
        
        // Stop any active recognition before changing language
        if (voiceRecognition.isListening && voiceRecognition.recognition) {
            try {
                voiceRecognition.recognition.stop();
            } catch (e) {}
        }
        
        // Create a NEW recognition instance with the new language
        // This is critical for iOS Safari - it doesn't respect lang changes on existing instances
        createRecognitionInstance(lang);
        console.log('Voice language changed to:', lang);
        
        // Update UI
        var langBG = document.getElementById('langBG');
        var langEN = document.getElementById('langEN');
        var voiceHint = document.getElementById('voiceHint');
        
        if (lang === 'bg-BG') {
            langBG.classList.add('active');
            langEN.classList.remove('active');
            if (voiceHint) voiceHint.textContent = 'Кажи какво яде (🇧🇬)';
        } else {
            langBG.classList.remove('active');
            langEN.classList.add('active');
            if (voiceHint) voiceHint.textContent = 'Tap to speak (🇬🇧)';
        }
        
        showToast('Language: ' + (lang === 'bg-BG' ? 'Български 🇧🇬' : 'English 🇬🇧'), 2000);
    }

    function setInputMode(mode) {
        var voiceToggle = document.getElementById('voiceToggle');
        var textToggle = document.getElementById('textToggle');
        var searchToggle = document.getElementById('searchToggle');
        var scanToggle = document.getElementById('scanToggle');
        var voiceInputContainer = document.getElementById('voiceInputContainer');
        var textInputContainer = document.getElementById('textInputContainer');
        var searchInputContainer = document.getElementById('searchInputContainer');
        var scanInputContainer = document.getElementById('scanInputContainer');
        
        // Reset all toggles
        if (voiceToggle) voiceToggle.classList.remove('active');
        if (textToggle) textToggle.classList.remove('active');
        if (searchToggle) searchToggle.classList.remove('active');
        if (scanToggle) scanToggle.classList.remove('active');
        
        // Hide all containers
        if (voiceInputContainer) voiceInputContainer.hidden = true;
        if (textInputContainer) textInputContainer.hidden = true;
        if (searchInputContainer) searchInputContainer.hidden = true;
        if (scanInputContainer) scanInputContainer.hidden = true;
        
        // Hide search results when switching away from search mode
        if (mode !== 'search') {
            var searchResults = document.getElementById('searchResults');
            if (searchResults) searchResults.hidden = true;
        }
        
        // Stop scanner if switching away from scan mode
        if (mode !== 'scan' && state.isScannerActive) {
            stopBarcodeScanner();
        }
        
        if (mode === 'voice') {
            if (voiceToggle) voiceToggle.classList.add('active');
            if (voiceInputContainer) voiceInputContainer.hidden = false;
        } else if (mode === 'text') {
            if (textToggle) textToggle.classList.add('active');
            if (textInputContainer) textInputContainer.hidden = false;
            // Focus the text input
            var foodTextInput = document.getElementById('foodTextInput');
            if (foodTextInput) foodTextInput.focus();
        } else if (mode === 'search') {
            if (searchToggle) searchToggle.classList.add('active');
            if (searchInputContainer) searchInputContainer.hidden = false;
            // Focus the search input
            var foodSearchInput = document.getElementById('foodSearchInput');
            if (foodSearchInput) foodSearchInput.focus();
        } else if (mode === 'scan') {
            if (scanToggle) scanToggle.classList.add('active');
            if (scanInputContainer) scanInputContainer.hidden = false;
            // Start the barcode scanner
            startBarcodeScanner();
        }
    }

    function handleTextInput(e) {
        e.preventDefault();
        
        var foodTextInput = document.getElementById('foodTextInput');
        var text = foodTextInput ? foodTextInput.value.trim() : '';
        
        if (!text) {
            showToast('Please type what you ate', 3000);
            return;
        }
        
        if (!getApiKey()) {
            showToast('Please add your OpenAI API key in Settings first', 4000);
            toggleSettingsModal(true);
            return;
        }
        
        // Show what was typed in the transcription display
        updateTranscription(text, true);
        
        // Process with AI
        processVoiceInput(text);
        
        // Clear the input
        foodTextInput.value = '';
    }

    function setupVoiceRecognition() {
        if (!isVoiceSupported()) {
            var voiceBtn = document.getElementById('voiceBtn');
            var voiceHint = document.getElementById('voiceHint');
            
            if (voiceBtn) {
                voiceBtn.disabled = true;
                voiceBtn.style.opacity = '0.5';
            }
            if (voiceHint) {
                voiceHint.textContent = 'Voice input not supported in this browser';
            }
            return;
        }
        
        voiceRecognition.onStart = function() {
            setVoiceButtonState(true);
            updateTranscription('', false);
        };
        
        voiceRecognition.onInterim = function(text) {
            updateTranscription(text, true);
        };
        
        voiceRecognition.onResult = function(transcript) {
            setVoiceButtonState(false);
            // Store the transcript and show confirmation buttons
            pendingTranscript = transcript;
            updateTranscription(transcript, true, true);
        };
        
        voiceRecognition.onEnd = function() {
            setVoiceButtonState(false);
        };
        
        voiceRecognition.onError = function(error) {
            setVoiceButtonState(false);
            showToast(error, 4000);
        };
    }

    function handleVoiceButtonClick() {
        if (state.isProcessing) return;
        
        if (voiceRecognition.isListening) {
            stopVoice();
        } else {
            if (!getApiKey()) {
                showToast('Please add your OpenAI API key in Settings first', 4000);
                toggleSettingsModal(true);
                return;
            }
            startVoice();
        }
    }

    function processVoiceInput(transcript) {
        if (!transcript || !transcript.trim()) {
            showToast('No speech detected. Please try again.', 3000);
            return;
        }
        
        state.isProcessing = true;
        showLoading(true, 'Analyzing your food...');
        
        parseFoodDescription(transcript)
            .then(function(foodItems) {
                if (foodItems.length === 0) {
                    showToast('Could not identify any food items.', 4000);
                    return;
                }
                
                state.proposedEntries = state.proposedEntries.concat(foodItems);
                renderProposedEntries(state.proposedEntries, getProposedEntryHandlers());
                
                showToast('Found ' + foodItems.length + ' food item' + (foodItems.length > 1 ? 's' : ''), 2000);
            })
            .catch(function(error) {
                console.error('Error processing voice input:', error);
                showToast(error.message || 'Failed to analyze food.', 4000);
            })
            .finally(function() {
                state.isProcessing = false;
                showLoading(false);
            });
    }

    function getProposedEntryHandlers() {
        return {
            onConfirm: handleConfirmProposed,
            onEdit: handleEditProposed,
            onRemove: handleRemoveProposed
        };
    }

    function handleConfirmProposed(index) {
        var entry = state.proposedEntries[index];
        if (!entry) return;
        
        var saved = saveEntry(entry);
        
        if (saved) {
            // Save to recent foods for quick add
            saveRecentFood(entry);
            state.proposedEntries.splice(index, 1);
            renderProposedEntries(state.proposedEntries, getProposedEntryHandlers());
            refreshData();
            showToast('Added ' + entry.name, 2000);
        } else {
            showToast('Failed to save entry', 3000);
        }
    }

    function handleEditProposed(index) {
        var entry = state.proposedEntries[index];
        if (!entry) return;
        
        showEditModal(
            entry,
            function(updatedEntry) {
                state.proposedEntries[index] = updatedEntry;
                renderProposedEntries(state.proposedEntries, getProposedEntryHandlers());
            },
            function() {}
        );
    }

    function handleRemoveProposed(index) {
        state.proposedEntries.splice(index, 1);
        renderProposedEntries(state.proposedEntries, getProposedEntryHandlers());
        
        if (state.proposedEntries.length === 0) {
            updateTranscription('', false);
        }
    }

    function handleAddAllProposed() {
        if (state.proposedEntries.length === 0) return;
        
        // Save all to recent foods first
        state.proposedEntries.forEach(function(entry) {
            saveRecentFood(entry);
        });
        
        var saved = saveEntries(state.proposedEntries);
        
        if (saved.length > 0) {
            state.proposedEntries = [];
            renderProposedEntries([], getProposedEntryHandlers());
            updateTranscription('', false);
            refreshData();
            showToast('Added ' + saved.length + ' item' + (saved.length > 1 ? 's' : ''), 2000);
        } else {
            showToast('Failed to save entries', 3000);
        }
    }

    function handleManualEntry(e) {
        e.preventDefault();
        
        var name = document.getElementById('foodName').value.trim();
        var calories = parseInt(document.getElementById('foodCalories').value, 10);
        var quantity = parseFloat(document.getElementById('foodQuantity').value) || 1;
        var unit = document.getElementById('foodUnit').value;
        
        if (!name || isNaN(calories)) {
            showToast('Please enter food name and calories', 3000);
            return;
        }
        
        var entry = {
            name: name,
            calories: calories,
            quantity: quantity,
            unit: unit
        };
        
        var saved = saveEntry(entry);
        
        if (saved) {
            resetManualEntryForm();
            toggleManualEntryForm(false);
            refreshData();
            showToast('Added ' + name, 2000);
        } else {
            showToast('Failed to save entry', 3000);
        }
    }

    function handleDeleteEntry(entryId) {
        var success = deleteEntry(entryId);
        
        if (success) {
            refreshData();
            showToast('Entry deleted', 2000);
        } else {
            showToast('Failed to delete entry', 3000);
        }
    }

    function handleSaveSettings() {
        var formData = getSettingsFromForm();
        
        if (formData.dailyGoal < 500 || formData.dailyGoal > 10000) {
            showToast('Calculated calories must be between 500 and 10,000 kcal. Adjust your macros.', 3000);
            return;
        }
        
        var newSettings = saveSettings({
            dailyGoal: formData.dailyGoal,
            proteinGoal: formData.proteinGoal,
            carbsGoal: formData.carbsGoal,
            fatGoal: formData.fatGoal
        });
        
        if (newSettings) {
            state.settings = newSettings;
        }
        
        if (formData.apiKey) {
            saveApiKey(formData.apiKey);
        }
        
        refreshData();
        toggleSettingsModal(false);
        showToast('Settings saved', 2000);
    }

    function handleClearData() {
        if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            return;
        }
        
        var success = clearAllData();
        
        if (success) {
            state.settings = getSettings();
            state.proposedEntries = [];
            state.weightGraphMonth = null;
            
            refreshData();
            refreshWeightUI();
            renderProposedEntries([], getProposedEntryHandlers());
            loadSettingsIntoForm(state.settings, '');
            toggleSettingsModal(false);
            
            showToast('All data cleared', 2000);
        } else {
            showToast('Failed to clear data', 3000);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();