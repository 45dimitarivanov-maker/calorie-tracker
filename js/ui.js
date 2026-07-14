/**
 * UI Module - Handles all UI updates and DOM manipulation
 */

/**
 * Format date for display
 */
export function formatDate(date = new Date()) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Update the date display in header
 */
export function updateDateDisplay() {
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = formatDate();
    }
}

/**
 * Update the progress ring based on calories consumed vs goal
 */
export function updateProgressRing(consumed, goal) {
    const progressRing = document.getElementById('progressRing');
    const caloriesConsumed = document.getElementById('caloriesConsumed');
    const caloriesGoal = document.getElementById('caloriesGoal');
    const caloriesRemaining = document.getElementById('caloriesRemaining');
    
    if (!progressRing) return;
    
    // Update text displays
    caloriesConsumed.textContent = consumed;
    caloriesGoal.textContent = goal;
    
    // Calculate remaining
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
    
    // Calculate progress percentage (cap at 100% for ring)
    const percentage = Math.min((consumed / goal) * 100, 100);
    
    // SVG circle math
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    progressRing.style.strokeDasharray = circumference;
    progressRing.style.strokeDashoffset = offset;
    
    // Change color if over goal
    if (consumed > goal) {
        progressRing.classList.add('over-goal');
    } else {
        progressRing.classList.remove('over-goal');
    }
}

/**
 * Render a single food entry card
 */
export function createFoodEntryElement(entry, onDelete) {
    const div = document.createElement('div');
    div.className = 'food-entry';
    div.dataset.id = entry.id;
    
    const quantityText = entry.quantity !== 1 ? `${entry.quantity} ${entry.unit}` : entry.unit;
    
    div.innerHTML = `
        <div class="food-entry-info">
            <div class="food-entry-name">${escapeHtml(entry.name)}</div>
            <div class="food-entry-details">${escapeHtml(quantityText)}</div>
        </div>
        <div class="food-entry-calories">${entry.calories} <span>kcal</span></div>
        <button class="delete-btn" aria-label="Delete entry">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        </button>
    `;
    
    // Attach delete handler
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        if (onDelete) {
            div.style.transform = 'translateX(100%)';
            div.style.opacity = '0';
            setTimeout(() => onDelete(entry.id), 200);
        }
    });
    
    return div;
}

/**
 * Render the food log
 */
export function renderFoodLog(entries, onDelete) {
    const foodLog = document.getElementById('foodLog');
    const emptyState = document.getElementById('emptyState');
    
    if (!foodLog) return;
    
    // Clear existing entries (except empty state)
    const existingEntries = foodLog.querySelectorAll('.food-entry');
    existingEntries.forEach(el => el.remove());
    
    if (entries.length === 0) {
        if (emptyState) emptyState.hidden = false;
        return;
    }
    
    if (emptyState) emptyState.hidden = true;
    
    // Render entries in reverse order (newest first)
    const sortedEntries = [...entries].reverse();
    
    sortedEntries.forEach(entry => {
        const element = createFoodEntryElement(entry, onDelete);
        foodLog.appendChild(element);
    });
}

/**
 * Create a proposed entry card (from AI suggestions)
 */
export function createProposedEntryElement(entry, index, { onConfirm, onEdit, onRemove }) {
    const div = document.createElement('div');
    div.className = 'proposed-entry';
    div.dataset.index = index;
    
    const quantityText = `${entry.quantity} ${entry.unit}`;
    
    div.innerHTML = `
        <div class="proposed-entry-info">
            <div class="proposed-entry-name">${escapeHtml(entry.name)}</div>
            <div class="proposed-entry-details">${escapeHtml(quantityText)}${entry.notes ? ` • ${escapeHtml(entry.notes)}` : ''}</div>
        </div>
        <div class="proposed-entry-calories">${entry.calories}</div>
        <div class="proposed-entry-actions">
            <button class="icon-btn confirm" aria-label="Confirm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </button>
            <button class="icon-btn edit" aria-label="Edit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="icon-btn remove" aria-label="Remove">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    
    // Attach handlers
    div.querySelector('.confirm').addEventListener('click', () => onConfirm(index));
    div.querySelector('.edit').addEventListener('click', () => onEdit(index));
    div.querySelector('.remove').addEventListener('click', () => {
        div.style.transform = 'translateX(100%)';
        div.style.opacity = '0';
        setTimeout(() => onRemove(index), 200);
    });
    
    return div;
}

/**
 * Render proposed entries section
 */
export function renderProposedEntries(entries, handlers) {
    const proposedSection = document.getElementById('proposedSection');
    const proposedEntries = document.getElementById('proposedEntries');
    
    if (!proposedSection || !proposedEntries) return;
    
    // Clear existing
    proposedEntries.innerHTML = '';
    
    if (entries.length === 0) {
        proposedSection.hidden = true;
        return;
    }
    
    proposedSection.hidden = false;
    
    entries.forEach((entry, index) => {
        const element = createProposedEntryElement(entry, index, handlers);
        proposedEntries.appendChild(element);
    });
}

/**
 * Show/hide loading overlay
 */
export function showLoading(show, text = 'Analyzing...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    if (!loadingOverlay) return;
    
    loadingOverlay.hidden = !show;
    if (loadingText) loadingText.textContent = text;
}

/**
 * Show toast notification
 */
export function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.hidden = false;
    
    // Clear any existing timeout
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }
    
    // Hide after duration
    toast.timeoutId = setTimeout(() => {
        toast.hidden = true;
    }, duration);
}

/**
 * Update voice button state
 */
export function setVoiceButtonState(isListening) {
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

/**
 * Update transcription display
 */
export function updateTranscription(text, show = true) {
    const transcriptionDisplay = document.getElementById('transcriptionDisplay');
    const transcriptionText = document.getElementById('transcriptionText');
    
    if (!transcriptionDisplay || !transcriptionText) return;
    
    if (show && text) {
        transcriptionText.textContent = `"${text}"`;
        transcriptionDisplay.hidden = false;
    } else {
        transcriptionDisplay.hidden = true;
    }
}

/**
 * Show/hide settings modal
 */
export function toggleSettingsModal(show) {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.hidden = !show;
        
        // Focus management for accessibility
        if (show) {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }
    }
}

/**
 * Toggle manual entry form
 */
export function toggleManualEntryForm(show) {
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

/**
 * Reset manual entry form
 */
export function resetManualEntryForm() {
    const form = document.getElementById('manualEntryForm');
    if (form) {
        form.reset();
        document.getElementById('foodQuantity').value = '1';
    }
}

/**
 * Load settings into form
 */
export function loadSettingsIntoForm(settings, apiKey) {
    const apiKeyInput = document.getElementById('apiKey');
    const dailyGoalInput = document.getElementById('dailyGoal');
    
    if (apiKeyInput) apiKeyInput.value = apiKey || '';
    if (dailyGoalInput) dailyGoalInput.value = settings.dailyGoal || 2000;
}

/**
 * Get settings from form
 */
export function getSettingsFromForm() {
    const apiKeyInput = document.getElementById('apiKey');
    const dailyGoalInput = document.getElementById('dailyGoal');
    
    return {
        apiKey: apiKeyInput?.value?.trim() || '',
        dailyGoal: parseInt(dailyGoalInput?.value, 10) || 2000
    };
}

/**
 * Create edit modal for proposed entry
 */
export function showEditModal(entry, onSave, onCancel) {
    // Create modal dynamically
    const modalHtml = `
        <div class="modal-overlay" id="editModal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Edit Entry</h2>
                    <button class="close-btn" id="closeEditBtn" aria-label="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <form class="edit-form" id="editEntryForm">
                        <div class="form-group">
                            <label for="editFoodName">Food Name</label>
                            <input type="text" class="form-input" id="editFoodName" value="${escapeHtml(entry.name)}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="flex: 1;">
                                <label for="editQuantity">Quantity</label>
                                <input type="number" class="form-input" id="editQuantity" value="${entry.quantity}" min="0" step="0.1" required>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label for="editUnit">Unit</label>
                                <select class="form-select" id="editUnit" style="width: 100%;">
                                    <option value="serving" ${entry.unit === 'serving' ? 'selected' : ''}>serving</option>
                                    <option value="g" ${entry.unit === 'g' ? 'selected' : ''}>grams</option>
                                    <option value="oz" ${entry.unit === 'oz' ? 'selected' : ''}>oz</option>
                                    <option value="cup" ${entry.unit === 'cup' ? 'selected' : ''}>cup</option>
                                    <option value="piece" ${entry.unit === 'piece' ? 'selected' : ''}>piece</option>
                                    <option value="slice" ${entry.unit === 'slice' ? 'selected' : ''}>slice</option>
                                    <option value="tbsp" ${entry.unit === 'tbsp' ? 'selected' : ''}>tbsp</option>
                                    <option value="tsp" ${entry.unit === 'tsp' ? 'selected' : ''}>tsp</option>
                                    <option value="bowl" ${entry.unit === 'bowl' ? 'selected' : ''}>bowl</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="editCalories">Calories</label>
                            <input type="number" class="form-input" id="editCalories" value="${entry.calories}" min="0" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="cancelEditBtn">Cancel</button>
                    <button class="btn btn-primary" id="saveEditBtn">Save</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('editModal');
    const closeBtn = document.getElementById('closeEditBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const saveBtn = document.getElementById('saveEditBtn');
    
    const closeModal = () => {
        modal.remove();
        if (onCancel) onCancel();
    };
    
    const saveEntry = () => {
        const updatedEntry = {
            ...entry,
            name: document.getElementById('editFoodName').value.trim(),
            quantity: parseFloat(document.getElementById('editQuantity').value) || 1,
            unit: document.getElementById('editUnit').value,
            calories: parseInt(document.getElementById('editCalories').value, 10) || 0
        };
        modal.remove();
        if (onSave) onSave(updatedEntry);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveEntry);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Focus first input
    document.getElementById('editFoodName').focus();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}