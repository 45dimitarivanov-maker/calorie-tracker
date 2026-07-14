/**
 * Voice Module - Handles Web Speech API for voice input
 */

class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.onResult = null;
        this.onStart = null;
        this.onEnd = null;
        this.onError = null;
        this.onInterim = null;
        
        this.init();
    }
    
    /**
     * Initialize the speech recognition
     */
    init() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        // Set up event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            this.transcript = '';
            if (this.onStart) this.onStart();
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update interim results
            if (interimTranscript && this.onInterim) {
                this.onInterim(interimTranscript);
            }
            
            // Handle final result
            if (finalTranscript) {
                this.transcript = finalTranscript;
                if (this.onResult) {
                    this.onResult(finalTranscript);
                }
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            
            let errorMessage = 'An error occurred';
            
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'No microphone found. Please check your device.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone access denied. Please allow microphone access.';
                    break;
                case 'network':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                case 'aborted':
                    errorMessage = 'Speech recognition was aborted.';
                    break;
                default:
                    errorMessage = `Error: ${event.error}`;
            }
            
            if (this.onError) {
                this.onError(errorMessage);
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEnd) this.onEnd();
        };
    }
    
    /**
     * Check if speech recognition is supported
     */
    isSupported() {
        return this.recognition !== null;
    }
    
    /**
     * Start listening for voice input
     */
    start() {
        if (!this.recognition) {
            if (this.onError) {
                this.onError('Speech recognition is not supported in this browser');
            }
            return false;
        }
        
        if (this.isListening) {
            return false;
        }
        
        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            if (this.onError) {
                this.onError('Failed to start voice recognition');
            }
            return false;
        }
    }
    
    /**
     * Stop listening
     */
    stop() {
        if (!this.recognition || !this.isListening) {
            return;
        }
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }
    
    /**
     * Toggle listening state
     */
    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    /**
     * Abort recognition without triggering result
     */
    abort() {
        if (!this.recognition) return;
        
        try {
            this.recognition.abort();
        } catch (error) {
            console.error('Error aborting recognition:', error);
        }
    }
    
    /**
     * Set the language for recognition
     */
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }
    
    /**
     * Set callback for when recognition starts
     */
    setOnStart(callback) {
        this.onStart = callback;
    }
    
    /**
     * Set callback for when final result is received
     */
    setOnResult(callback) {
        this.onResult = callback;
    }
    
    /**
     * Set callback for interim results
     */
    setOnInterim(callback) {
        this.onInterim = callback;
    }
    
    /**
     * Set callback for when recognition ends
     */
    setOnEnd(callback) {
        this.onEnd = callback;
    }
    
    /**
     * Set callback for errors
     */
    setOnError(callback) {
        this.onError = callback;
    }
}

// Export a singleton instance
export const voiceRecognition = new VoiceRecognition();

// Also export the class for testing or multiple instances
export { VoiceRecognition };