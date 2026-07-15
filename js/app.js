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
        RECENT_FOODS: 'calorieTracker_recentFoods'
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
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
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
        
        div.innerHTML = 
            '<div class="food-entry-info">' +
                '<div class="food-entry-name">' + escapeHtml(entry.name) + '</div>' +
                '<div class="food-entry-details">' + escapeHtml(quantityText) + 
                    (macrosText ? '<span class="food-entry-macros">' + macrosText + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<div class="food-entry-calories">' + entry.calories + ' <span>kcal</span></div>' +
            '<button class="delete-btn" aria-label="Delete entry">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<polyline points="3 6 5 6 21 6"></polyline>' +
                    '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
                '</svg>' +
            '</button>';
        
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
        
        function closeModal() {
            modal.remove();
            if (onCancel) onCancel();
        }
        
        function saveEntryHandler() {
            var updatedEntry = Object.assign({}, entry, {
                name: document.getElementById('editFoodName').value.trim(),
                quantity: parseFloat(document.getElementById('editQuantity').value) || 1,
                unit: document.getElementById('editUnit').value,
                calories: parseInt(document.getElementById('editCalories').value, 10) || 0
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
        
        voiceRecognition.recognition = new SpeechRecognition();
        voiceRecognition.recognition.continuous = false;
        voiceRecognition.recognition.interimResults = true;
        // Use Bulgarian language for better recognition
        voiceRecognition.recognition.lang = 'bg-BG';
        voiceRecognition.recognition.maxAlternatives = 1;
        
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
        if (!voiceRecognition.recognition || voiceRecognition.isListening) return false;
        try {
            voiceRecognition.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            return false;
        }
    }

    function stopVoice() {
        if (voiceRecognition.recognition && voiceRecognition.isListening) {
            voiceRecognition.recognition.stop();
        }
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
        
    var systemPrompt = 'You are a nutrition assistant that parses food descriptions and estimates calories, macronutrients, and FIBER.\n\nWhen given a description of food, extract each food item and estimate its nutritional values.\n\nIMPORTANT RULES:\n1. Extract EACH distinct food item separately\n2. Estimate realistic values based on the specified weight/quantity\n3. If quantity/grams is mentioned, CALCULATE nutrition based on that exact amount\n4. Return ONLY valid JSON, no other text\n5. All macro values should be in grams\n6. ALWAYS include fiber content - this is critical\n7. Pay attention to RAW vs COOKED - raw foods often have different calorie density than cooked\n\nReturn a JSON array with this exact structure:\n[\n  {\n    "name": "Food name",\n    "quantity": 1,\n    "unit": "g",\n    "calories": 100,\n    "protein": 10,\n    "carbs": 15,\n    "fat": 5,\n    "fiber": 2,\n    "notes": ""\n  }\n]\n\nCRITICAL NUTRITION REFERENCES (per 100g):\n\n** RAW/UNCOOKED GRAINS & STARCHES (per 100g raw) **\n- Rice (raw/uncooked): 360 kcal, 7g protein, 79g carbs, 0.6g fat, 1.3g fiber\n- Pasta (raw/uncooked): 350 kcal, 12g protein, 72g carbs, 1.5g fat, 3g fiber\n- Oats (raw): 389 kcal, 17g protein, 66g carbs, 7g fat, 10g fiber\n- Quinoa (raw): 368 kcal, 14g protein, 64g carbs, 6g fat, 7g fiber\n- Buckwheat (raw): 343 kcal, 13g protein, 72g carbs, 3g fat, 10g fiber\n\n** COOKED GRAINS (per 100g cooked) **\n- Rice (cooked): 130 kcal, 2.7g protein, 28g carbs, 0.3g fat, 0.4g fiber\n- Pasta (cooked): 131 kcal, 5g protein, 25g carbs, 1g fat, 1.8g fiber\n\n** MEAT - RAW (per 100g raw) **\n- Chicken breast (raw): 120 kcal, 22g protein, 0g carbs, 2.6g fat, 0g fiber\n- Chicken thigh (raw): 177 kcal, 18g protein, 0g carbs, 11g fat, 0g fiber\n- Beef (raw, lean): 143 kcal, 21g protein, 0g carbs, 6g fat, 0g fiber\n- Pork (raw, lean): 143 kcal, 21g protein, 0g carbs, 6g fat, 0g fiber\n- Salmon (raw): 208 kcal, 20g protein, 0g carbs, 13g fat, 0g fiber\n\n** VEGETABLES (per 100g) **\n- Cucumber: 16 kcal, 0.7g protein, 3.6g carbs, 0.1g fat, 0.5g fiber\n- Tomato: 18 kcal, 0.9g protein, 3.9g carbs, 0.2g fat, 1.2g fiber\n- Lettuce: 15 kcal, 1.4g protein, 2.9g carbs, 0.2g fat, 1.3g fiber\n- Carrot: 41 kcal, 0.9g protein, 10g carbs, 0.2g fat, 2.8g fiber\n- Broccoli: 34 kcal, 2.8g protein, 7g carbs, 0.4g fat, 2.6g fiber\n- Onion: 40 kcal, 1.1g protein, 9g carbs, 0.1g fat, 1.7g fiber\n\n** HIGH-FIBER FOODS **\n- Avocado: 160 kcal, 2g protein, 9g carbs, 15g fat, 7g fiber\n- Almonds: 579 kcal, 21g protein, 22g carbs, 50g fat, 12g fiber\n- Lentils (cooked): 116 kcal, 9g protein, 20g carbs, 0.4g fat, 8g fiber\n- Black beans (cooked): 132 kcal, 9g protein, 24g carbs, 0.5g fat, 8g fiber\n- Chia seeds: 486 kcal, 17g protein, 42g carbs, 31g fat, 34g fiber\n\n** DAIRY & EGGS **\n- Large egg: 70 kcal, 6g protein, 0.5g carbs, 5g fat, 0g fiber\n- Milk: 61 kcal, 3.2g protein, 4.8g carbs, 3.3g fat, 0g fiber\n- Yogurt: 59 kcal, 10g protein, 3.6g carbs, 0.7g fat, 0g fiber\n\n** FRUITS (per 100g) **\n- Banana: 89 kcal, 1.1g protein, 23g carbs, 0.3g fat, 2.6g fiber\n- Apple: 52 kcal, 0.3g protein, 14g carbs, 0.2g fat, 2.4g fiber\n- Orange: 47 kcal, 0.9g protein, 12g carbs, 0.1g fat, 2.4g fiber\n\nIMPORTANT: When user specifies grams, MULTIPLY the per-100g values accordingly!';
        
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
        isScannerActive: false
    };

    // ==========================================
    // BARCODE SCANNER MODULE (QuaggaJS)
    // ==========================================

    function initBarcodeScanner() {
        // Check if Quagga is available
        if (typeof Quagga === 'undefined') {
            console.warn('QuaggaJS library not loaded');
            return false;
        }
        return true;
    }

    // Debug logging function that shows on page
    function debugLog(message) {
        console.log('[Scanner]', message);
        var debugPanel = document.getElementById('scannerDebug');
        if (debugPanel) {
            var time = new Date().toLocaleTimeString();
            debugPanel.innerHTML = '<strong>' + time + '</strong>: ' + message + '<br>' + debugPanel.innerHTML;
            // Keep only last 10 messages
            var lines = debugPanel.innerHTML.split('<br>');
            if (lines.length > 10) {
                debugPanel.innerHTML = lines.slice(0, 10).join('<br>');
            }
        }
    }

    function startBarcodeScanner() {
        debugLog('Starting QuaggaJS scanner...');
        
        if (!initBarcodeScanner()) {
            debugLog('ERROR: QuaggaJS library not loaded');
            showToast('Barcode scanner not available', 3000);
            return;
        }
        debugLog('QuaggaJS loaded OK');

        var readerElement = document.getElementById('barcodeReader');
        if (!readerElement) {
            debugLog('ERROR: Reader element not found');
            return;
        }
        debugLog('Reader element found');

        // Stop existing scanner first
        if (state.isScannerActive) {
            Quagga.stop();
            debugLog('Previous scanner stopped');
        }

        debugLog('Requesting camera access...');
        showToast('Starting camera...', 2000);

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: readerElement,
                constraints: {
                    width: { min: 640 },
                    height: { min: 480 },
                    facingMode: "environment"
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            frequency: 10,
            decoder: {
                readers: [
                    "ean_reader",
                    "ean_8_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "code_128_reader"
                ]
            },
            locate: true
        }, function(err) {
            if (err) {
                debugLog('ERROR: ' + err.message);
                var errStr = err.toString();
                
                if (errStr.includes('NotAllowed') || errStr.includes('Permission')) {
                    showToast('Camera access denied. Check browser permissions.', 5000);
                } else if (errStr.includes('NotFound')) {
                    showToast('No camera found.', 4000);
                } else if (errStr.includes('NotReadable') || errStr.includes('busy')) {
                    showToast('Camera busy - close other apps using it.', 4000);
                } else {
                    showToast('Camera error: ' + err.message.substring(0, 50), 4000);
                }
                return;
            }
            
            debugLog('Camera initialized!');
            Quagga.start();
            state.isScannerActive = true;
            debugLog('Scanner running - point at barcode');
            debugLog('TIP: Hold steady, good lighting');
            showToast('Camera ready - point at barcode', 3000);
        });

        // Detection callback
        Quagga.onDetected(function(result) {
            if (result && result.codeResult && result.codeResult.code) {
                var code = result.codeResult.code;
                debugLog('BARCODE FOUND: ' + code);
                debugLog('Format: ' + result.codeResult.format);
                onBarcodeScanned(code, result);
            }
        });

        // Processing callback (shows scanning is active)
        var processCount = 0;
        Quagga.onProcessed(function(result) {
            processCount++;
            if (processCount % 30 === 0) { // Log every ~3 seconds
                debugLog('Scanning... (frames: ' + processCount + ')');
            }
        });
    }

    function stopBarcodeScanner() {
        if (state.isScannerActive) {
            try {
                Quagga.stop();
                Quagga.offDetected();
                Quagga.offProcessed();
                state.isScannerActive = false;
                debugLog('Scanner stopped');
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
    }

    function onBarcodeScanned(barcode, result) {
        // Stop scanner immediately to prevent multiple scans
        stopBarcodeScanner();
        showToast('Barcode detected: ' + barcode, 2000);
        
        // Look up product in Open Food Facts
        lookupBarcode(barcode);
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

    function renderQuickAddChips() {
        var quickAddSection = document.getElementById('quickAddSection');
        var quickAddChips = document.getElementById('quickAddChips');
        
        if (!quickAddSection || !quickAddChips) return;
        
        var recentFoods = getRecentFoods();
        
        if (recentFoods.length === 0) {
            quickAddSection.hidden = true;
            return;
        }
        
        quickAddSection.hidden = false;
        quickAddChips.innerHTML = '';
        
        recentFoods.slice(0, 6).forEach(function(food, index) {
            var chip = document.createElement('button');
            chip.className = 'quick-add-chip';
            chip.innerHTML = 
                '<span class="quick-add-chip-name">' + escapeHtml(food.name) + '</span>' +
                '<span class="quick-add-chip-calories">' + food.calories + ' kcal</span>';
            
            chip.addEventListener('click', function() {
                handleQuickAdd(food);
            });
            
            quickAddChips.appendChild(chip);
        });
    }

    function handleQuickAdd(food) {
        // Only allow quick add on today
        if (state.selectedDate !== getTodayKey()) {
            showToast('Switch to Today to add food', 3000);
            goToToday();
            return;
        }
        
        var entry = {
            name: food.name,
            quantity: food.quantity,
            unit: food.unit,
            calories: food.calories,
            protein: food.protein || 0,
            carbs: food.carbs || 0,
            fat: food.fat || 0
        };
        
        var saved = saveEntry(entry, state.selectedDate);
        
        if (saved) {
            saveRecentFood(entry);
            refreshDataForDate(state.selectedDate);
            showToast('Added ' + food.name, 2000);
        } else {
            showToast('Failed to add food', 3000);
        }
    }

    function init() {
        console.log('Initializing Calorie Tracker...');
        
        state.settings = getSettings();
        state.selectedDate = getTodayKey();
        
        updateDateNavigationUI();
        refreshDataForDate(state.selectedDate);
        renderQuickAddChips();
        
        loadSettingsIntoForm(state.settings, getApiKey());
        
        setupEventListeners();
        setupStickyHeader();
        
        initVoice();
        setupVoiceRecognition();
        
        if (!getApiKey()) {
            setTimeout(function() {
                showToast('Add your OpenAI API key in Settings to use voice input', 5000);
            }, 1000);
        }
        
        console.log('Calorie Tracker initialized');
    }

    function refreshData() {
        refreshDataForDate(state.selectedDate);
        renderQuickAddChips();
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
        
        // Input mode toggle (voice/text/scan)
        var voiceToggle = document.getElementById('voiceToggle');
        var textToggle = document.getElementById('textToggle');
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
        if (scanToggle) {
            scanToggle.addEventListener('click', function() {
                setInputMode('scan');
            });
        }
        if (stopScanBtn) {
            stopScanBtn.addEventListener('click', function() {
                stopBarcodeScanner();
                setInputMode('voice');
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
    }

    function setVoiceLanguage(lang) {
        if (!voiceRecognition.recognition) return;
        
        voiceRecognition.recognition.lang = lang;
        
        // Update UI
        var langBG = document.getElementById('langBG');
        var langEN = document.getElementById('langEN');
        var voiceHint = document.getElementById('voiceHint');
        
        if (lang === 'bg-BG') {
            langBG.classList.add('active');
            langEN.classList.remove('active');
            if (voiceHint) voiceHint.textContent = 'Кажи какво яде';
        } else {
            langBG.classList.remove('active');
            langEN.classList.add('active');
            if (voiceHint) voiceHint.textContent = 'Tap to speak what you ate';
        }
        
        showToast('Voice language: ' + (lang === 'bg-BG' ? 'Български' : 'English'), 2000);
    }

    function setInputMode(mode) {
        var voiceToggle = document.getElementById('voiceToggle');
        var textToggle = document.getElementById('textToggle');
        var scanToggle = document.getElementById('scanToggle');
        var voiceInputContainer = document.getElementById('voiceInputContainer');
        var textInputContainer = document.getElementById('textInputContainer');
        var scanInputContainer = document.getElementById('scanInputContainer');
        
        // Reset all toggles
        if (voiceToggle) voiceToggle.classList.remove('active');
        if (textToggle) textToggle.classList.remove('active');
        if (scanToggle) scanToggle.classList.remove('active');
        
        // Hide all containers
        if (voiceInputContainer) voiceInputContainer.hidden = true;
        if (textInputContainer) textInputContainer.hidden = true;
        if (scanInputContainer) scanInputContainer.hidden = true;
        
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
            
            refreshData();
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