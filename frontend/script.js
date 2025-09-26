// ConRumbo - Aplicacion de Primeros Auxilios
class ConRumboApp {
    constructor() {
        this.currentProtocol = null;
        this.currentStep = -1;
        this.sessionId = this.generateSessionId();
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis || null;
        this.voices = [];
        this.autoAdvanceTimer = null;
        this.activeUtterance = null;
        this.statusKey = 'statusReady';
        this.isAdvancing = false;
        this.voicePitch = 1.0;
        this.emergencyDisplayNumber = '112';
        this.emergencyDialNumber = '689876686';
        this.autoAdvanceMinDelay = 2600;
        this.autoAdvancePerWord = 320;

        this.config = {
            language: localStorage.getItem('cr_lang') || 'es',
            vibrationEnabled: localStorage.getItem('cr_vibration') !== 'false',
            voiceFeedbackEnabled: localStorage.getItem('cr_voice_feedback') !== 'false',
            darkMode: localStorage.getItem('cr_dark_mode') === 'true'
        };

        this.apiBase = '/api';

        console.log('ConRumbo frontend build 2025-09-26-05');

        this.translations = {
            es: {
                loadingText: 'Cargando asistente de primeros auxilios...',
                subtitle: 'Asistente de Primeros Auxilios',
                statusReady: 'Listo para ayudar',
                statusProcessing: 'Procesando...',
                statusListening: 'Escuchando...',
                statusVoiceError: 'Error en reconocimiento de voz',
                statusVoiceUnavailable: 'Reconocimiento de voz no disponible',
                statusVoiceStartError: 'Error al iniciar reconocimiento',
                statusIntentUnknown: 'No se pudo identificar la emergencia',
                statusConnectionError: 'Error de conexi\u00f3n',
                statusProtocolError: 'Error al cargar protocolo',
                statusProtocolActive: 'Protocolo en curso',
                statusAdvanceError: 'No se pudo avanzar al siguiente paso',
                statusOffline: 'Modo offline',
                voicePrompt: 'Mant\u00e9n presionado para hablar',
                voiceListening: 'Escuchando...',
                voiceUnavailablePrompt: 'Reconocimiento de voz no disponible',
                textPlaceholder: 'O escribe tu emergencia aqu\u00ed...',
                repeatButton: 'Repetir',
                nextButton: 'Siguiente',
                languageLabel: 'Idioma:',
                languageOptionEs: 'Espa\u00f1ol',
                languageOptionEn: 'Ingl\u00e9s',
                vibration: 'Vibraci\u00f3n',
                voiceFeedback: 'Respuesta por voz',
                darkMode: 'Modo oscuro',
                completionTitle: 'Fin del protocolo',
                completionMessage: 'Hemos llegado al \u00faltimo paso. Si necesitas revisar algo, puedes repetir el protocolo o iniciar una nueva emergencia.',
                completionFeedback: 'Enviar comentarios',
                completionRestart: 'Nueva emergencia',
                feedbackTitle: 'Comentarios',
                feedbackPlaceholder: 'Comparte tu experiencia con ConRumbo...',
                feedbackCancel: 'Cancelar',
                feedbackSend: 'Enviar',
                feedbackEmpty: 'Por favor, escribe tu comentario.',
                feedbackThanks: '\u00a1Gracias por tu comentario!',
                feedbackError: 'Error al enviar comentario. Int\u00e9ntalo de nuevo.',
                legalNotice: 'Aviso: esta aplicaci\u00f3n no sustituye la formaci\u00f3n oficial ni la asistencia sanitaria profesional. Ante cualquier duda, llama a los servicios de emergencia.',
                speakUnknown: 'No he podido identificar la situaci\u00f3n. Describe la emergencia con un poco m\u00e1s de detalle, por favor.',
                speakError: 'Ha ocurrido un error. Int\u00e9ntalo de nuevo en unos segundos.',
                finalVoiceMessage: 'Hemos terminado las instrucciones disponibles. Si necesitas volver a escucharlas o empezar otro protocolo, puedes indicarlo cuando quieras.',
                confirmCall: (displayNumber, dialNumber) => `\u00bfDeseas iniciar una llamada de demostraci\u00f3n al ${dialNumber} en representaci\u00f3n del ${displayNumber}?`,
                emergencyAria: 'Llamar a emergencias',
                stepCounter: (index, total) => `Paso ${index} de ${total}`,
                modalClose: 'Cerrar',
                emergencyLabel: 'Emergencias',
                emergencyDescription: 'Llamar a asistencia',
                darkModeToggleAria: 'Cambiar modo oscuro',
                voiceToggleAria: 'Activar respuesta por voz',
                vibrationToggleAria: 'Activar vibraci\u00f3n'
            },
            en: {
                loadingText: 'Loading first-aid assistant...',
                subtitle: 'First Aid Assistant',
                statusReady: 'Ready to help',
                statusProcessing: 'Processing...',
                statusListening: 'Listening...',
                statusVoiceError: 'Voice recognition error',
                statusVoiceUnavailable: 'Voice recognition unavailable',
                statusVoiceStartError: 'Unable to start recognition',
                statusIntentUnknown: 'Emergency intent not identified',
                statusConnectionError: 'Connection error',
                statusProtocolError: 'Could not load protocol',
                statusProtocolActive: 'Protocol in progress',
                statusAdvanceError: 'Could not advance to the next step',
                statusOffline: 'Offline mode',
                voicePrompt: 'Hold to speak',
                voiceListening: 'Listening...',
                voiceUnavailablePrompt: 'Voice recognition unavailable',
                textPlaceholder: 'Or describe your emergency here...',
                repeatButton: 'Repeat',
                nextButton: 'Next',
                languageLabel: 'Language:',
                languageOptionEs: 'Spanish',
                languageOptionEn: 'English',
                vibration: 'Vibration',
                voiceFeedback: 'Voice feedback',
                darkMode: 'Dark mode',
                completionTitle: 'Protocol finished',
                completionMessage: 'We have reached the final step. Feel free to repeat any instruction or start a new emergency when you are ready.',
                completionFeedback: 'Send feedback',
                completionRestart: 'New emergency',
                feedbackTitle: 'Feedback',
                feedbackPlaceholder: 'Let us know how ConRumbo helped...',
                feedbackCancel: 'Cancel',
                feedbackSend: 'Send',
                feedbackEmpty: 'Please type your comment.',
                feedbackThanks: 'Thank you for your feedback!',
                feedbackError: 'Could not send your comment. Please try again.',
                legalNotice: 'Notice: this app does not replace formal training or professional medical assistance. In case of doubt, call emergency services.',
                speakUnknown: 'I could not identify the situation. Please describe the emergency with a little more detail.',
                speakError: 'Something went wrong. Please try again in a moment.',
                finalVoiceMessage: 'Those are all the available instructions. If you want to hear them again or start another protocol, just let me know.',
                confirmCall: (displayNumber, dialNumber) => `This demo will dial ${dialNumber} on behalf of ${displayNumber}. Proceed?`,
                emergencyAria: 'Call emergency services',
                stepCounter: (index, total) => `Step ${index} of ${total}`,
                modalClose: 'Close',
                emergencyLabel: 'Emergency',
                emergencyDescription: 'Call assistance',
                darkModeToggleAria: 'Toggle dark mode',
                voiceToggleAria: 'Toggle voice feedback',
                vibrationToggleAria: 'Toggle vibration'
            }
        };

        this.init();
    }

    t(key, ...args) {
        const dictionary = this.translations[this.config.language] || this.translations.es;
        const value = dictionary[key];
        if (typeof value === 'function') {
            return value(...args);
        }
        if (typeof value === 'undefined') {
            console.warn(`Missing translation for key: ${key}`);
            return key;
        }
        return value;
    }

    generateSessionId() {
        return 'cr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    }

    async init() {
        try {
            await this.sleep(800);
            this.setupDOM();
            this.setupSynthesisVoices();
            this.setupSpeechRecognition();
            this.setupEventListeners();
            this.loadConfiguration();
            this.applyTranslations();
            this.updateStatus(this.statusKey);
            this.showScreen('main');
            console.log('ConRumbo inicializado');
        } catch (error) {
            console.error('Error inicializando ConRumbo:', error);
        }
    }

    setupDOM() {
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            mainScreen: document.getElementById('main-screen'),
            completionScreen: document.getElementById('completion-screen'),
            loadingText: document.getElementById('loading-text'),
            appSubtitle: document.getElementById('app-subtitle'),
            voiceBtn: document.getElementById('voice-btn'),
            voiceText: document.getElementById('voice-text'),
            textInput: document.getElementById('text-input'),
            textSubmit: document.getElementById('text-submit'),
            responseArea: document.getElementById('response-area'),
            protocolTitle: document.getElementById('protocol-title'),
            stepCounter: document.getElementById('step-counter'),
            currentStep: document.getElementById('current-step'),
            repeatStep: document.getElementById('repeat-step'),
            nextStep: document.getElementById('next-step'),
            statusText: document.getElementById('status-text'),
            languageSelect: document.getElementById('language-select'),
            vibrationToggle: document.getElementById('vibration-toggle'),
            voiceFeedbackToggle: document.getElementById('voice-feedback-toggle'),
            darkModeToggle: document.getElementById('dark-mode-toggle'),
            languageLabel: document.getElementById('language-label'),
            vibrationLabel: document.getElementById('vibration-label'),
            voiceFeedbackLabel: document.getElementById('voice-feedback-label'),
            darkModeLabel: document.getElementById('dark-mode-label'),
            emergencyButton: document.getElementById('emergency-112'),
            emergencyNumberLabel: document.getElementById('emergency-number-label'),
            legalNotice: document.getElementById('legal-notice'),
            completionTitle: document.getElementById('completion-title'),
            completionMessage: document.getElementById('completion-message'),
            feedbackBtn: document.getElementById('feedback-btn'),
            restartBtn: document.getElementById('restart-btn'),
            feedbackModal: document.getElementById('feedback-modal'),
            feedbackTitle: document.getElementById('feedback-title'),
            feedbackText: document.getElementById('feedback-text'),
            feedbackCancel: document.getElementById('feedback-cancel'),
            feedbackSend: document.getElementById('feedback-send')
        };
    }

    setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            this.elements.voiceBtn.classList.add('disabled');
            this.elements.voiceBtn.setAttribute('aria-disabled', 'true');
            this.elements.voiceText.textContent = this.t('voiceUnavailablePrompt');
            this.updateStatus('statusVoiceUnavailable');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = this.config.language === 'es' ? 'es-ES' : 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('statusListening');
            this.updateVoiceButton();
            this.vibrate(80);
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Texto reconocido:', transcript);
            this.processUserInput(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Error en reconocimiento de voz:', event.error);
            this.updateStatus('statusVoiceError');
            this.isListening = false;
            this.updateVoiceButton();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceButton();
        };
    }

    setupSynthesisVoices() {
        if (!this.synthesis) {
            console.warn('Speech synthesis not available');
            return;
        }

        const loadVoices = () => {
            this.voices = this.synthesis.getVoices() || [];
        };

        loadVoices();
        if (typeof this.synthesis.onvoiceschanged !== 'undefined') {
            this.synthesis.onvoiceschanged = () => loadVoices();
        }
    }

    setupEventListeners() {
        const startHandler = (event) => {
            event.preventDefault();
            this.startListening();
        };

        const stopHandler = (event) => {
            event.preventDefault();
            this.stopListening();
        };

        this.elements.voiceBtn.addEventListener('mousedown', startHandler);
        this.elements.voiceBtn.addEventListener('mouseup', stopHandler);
        this.elements.voiceBtn.addEventListener('mouseleave', stopHandler);
        this.elements.voiceBtn.addEventListener('touchstart', startHandler);
        this.elements.voiceBtn.addEventListener('touchend', stopHandler);

        this.elements.textSubmit.addEventListener('click', () => this.submitText());
        this.elements.textInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.submitText();
            }
        });

        this.elements.repeatStep.addEventListener('click', () => this.repeatCurrentStep());
        this.elements.nextStep.addEventListener('click', () => {
            this.cancelAutoAdvance();
            this.cancelActiveSpeech();
            this.advanceStep();
        });

        this.elements.languageSelect.addEventListener('change', (event) => {
            this.config.language = event.target.value;
            this.saveConfiguration();
            this.applyTranslations();
            if (this.recognition) {
                this.recognition.lang = this.config.language === 'es' ? 'es-ES' : 'en-US';
            }
        });

        this.elements.vibrationToggle.addEventListener('change', (event) => {
            this.config.vibrationEnabled = event.target.checked;
            this.saveConfiguration();
        });

        this.elements.voiceFeedbackToggle.addEventListener('change', (event) => {
            this.config.voiceFeedbackEnabled = event.target.checked;
            this.saveConfiguration();
            if (!this.config.voiceFeedbackEnabled) {
                this.cancelActiveSpeech(true);
            }
        });

        this.elements.darkModeToggle.addEventListener('change', (event) => {
            this.config.darkMode = event.target.checked;
            this.applyTheme();
            this.saveConfiguration();
        });

        this.elements.emergencyButton.addEventListener('click', () => this.callEmergency());
        this.elements.feedbackBtn.addEventListener('click', () => this.showFeedbackModal());
        this.elements.restartBtn.addEventListener('click', () => this.restart());
        this.elements.feedbackCancel.addEventListener('click', () => this.hideFeedbackModal());
        this.elements.feedbackSend.addEventListener('click', () => this.sendFeedback());

        this.elements.feedbackModal.addEventListener('click', (event) => {
            if (event.target === this.elements.feedbackModal) {
                this.hideFeedbackModal();
            }
        });
    }

    loadConfiguration() {
        this.elements.languageSelect.value = this.config.language;
        this.elements.vibrationToggle.checked = this.config.vibrationEnabled;
        this.elements.voiceFeedbackToggle.checked = this.config.voiceFeedbackEnabled;
        this.elements.darkModeToggle.checked = this.config.darkMode;
        this.applyTheme();
        this.elements.emergencyNumberLabel.textContent = this.emergencyDisplayNumber;
    }

    saveConfiguration() {
        localStorage.setItem('cr_lang', this.config.language);
        localStorage.setItem('cr_vibration', this.config.vibrationEnabled ? 'true' : 'false');
        localStorage.setItem('cr_voice_feedback', this.config.voiceFeedbackEnabled ? 'true' : 'false');
        localStorage.setItem('cr_dark_mode', this.config.darkMode ? 'true' : 'false');
    }

    applyTranslations() {
        document.documentElement.lang = this.config.language;
        this.elements.loadingText.textContent = this.t('loadingText');
        this.elements.appSubtitle.textContent = this.t('subtitle');
        this.elements.voiceText.textContent = this.isListening ? this.t('voiceListening') : (this.recognition ? this.t('voicePrompt') : this.t('voiceUnavailablePrompt'));
        this.elements.textInput.setAttribute('placeholder', this.t('textPlaceholder'));
        this.elements.repeatStep.querySelector('.btn-text').textContent = this.t('repeatButton');
        this.elements.nextStep.querySelector('.btn-text').textContent = this.t('nextButton');
        this.elements.languageLabel.textContent = this.t('languageLabel');
        this.elements.vibrationLabel.textContent = this.t('vibration');
        this.elements.voiceFeedbackLabel.textContent = this.t('voiceFeedback');
        this.elements.darkModeLabel.textContent = this.t('darkMode');
        this.elements.emergencyButton.setAttribute('aria-label', this.t('emergencyAria'));
        this.elements.emergencyNumberLabel.textContent = this.emergencyDisplayNumber;
        this.elements.legalNotice.textContent = this.t('legalNotice');
        this.elements.completionTitle.textContent = this.t('completionTitle');
        this.elements.completionMessage.textContent = this.t('completionMessage');
        this.elements.feedbackBtn.textContent = this.t('completionFeedback');
        this.elements.restartBtn.textContent = this.t('completionRestart');
        this.elements.feedbackTitle.textContent = this.t('feedbackTitle');
        this.elements.feedbackText.setAttribute('placeholder', this.t('feedbackPlaceholder'));
        this.elements.feedbackCancel.textContent = this.t('feedbackCancel');
        this.elements.feedbackSend.textContent = this.t('feedbackSend');

        const options = this.elements.languageSelect.options;
        for (let i = 0; i < options.length; i += 1) {
            if (options[i].value === 'es') {
                options[i].textContent = this.t('languageOptionEs');
            }
            if (options[i].value === 'en') {
                options[i].textContent = this.t('languageOptionEn');
            }
        }

        this.updateStatus(this.statusKey);
    }

    applyTheme() {
        if (this.config.darkMode) {
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.remove('theme-dark');
        }
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach((screen) => {
            if (screen.id === `${screenName}-screen`) {
                screen.classList.add('active');
            } else {
                screen.classList.remove('active');
            }
        });
    }

    updateStatus(key) {
        this.statusKey = key;
        if (this.elements.statusText) {
            this.elements.statusText.textContent = this.t(key);
        }
    }

    updateVoiceButton() {
        if (!this.recognition) {
            this.elements.voiceBtn.classList.add('disabled');
            this.elements.voiceBtn.setAttribute('aria-disabled', 'true');
            this.elements.voiceText.textContent = this.t('voiceUnavailablePrompt');
            return;
        }

        if (this.isListening) {
            this.elements.voiceBtn.classList.add('listening');
            this.elements.voiceText.textContent = this.t('voiceListening');
        } else {
            this.elements.voiceBtn.classList.remove('listening');
            this.elements.voiceText.textContent = this.t('voicePrompt');
        }
    }

    startListening() {
        if (!this.recognition || this.isListening) {
            return;
        }
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error al iniciar reconocimiento:', error);
            this.updateStatus('statusVoiceStartError');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    submitText() {\n        const text = this.elements.textInput.value.trim();\n        if (!text) {\n            return;\n        }\n        this.elements.textInput.value = '';\n        this.primeSpeechSynthesis();\n        this.processUserInput(text);\n    }

    async processUserInput(text) {
        this.updateStatus('statusProcessing');
        try {
            const response = await fetch(`${this.apiBase}/understand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    utterance: text,
                    lang: this.config.language,
                    session_id: this.sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const result = await response.json();
            if (result.protocol_id && result.confidence > 0.5) {
                await this.loadProtocol(result.protocol_id);
            } else {
                this.updateStatus('statusIntentUnknown');
                this.speak(this.t('speakUnknown'));
            }
        } catch (error) {
            console.error('Error al procesar entrada:', error);
            this.updateStatus('statusConnectionError');
            this.speak(this.t('speakError'));
        }
    }

    async loadProtocol(protocolId) {
        this.updateStatus('statusProcessing');
        try {
            const response = await fetch(`${this.apiBase}/protocol`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    protocol_id: protocolId,
                    session_id: this.sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const protocol = await response.json();
            this.currentProtocol = {
                id: protocolId,
                title: protocol.title,
                steps: Array.isArray(protocol.steps) ? protocol.steps : []
            };
            this.currentStep = -1;
            this.showProtocol();
            this.advanceStep();
        } catch (error) {
            console.error('Error al cargar protocolo:', error);
            this.updateStatus('statusProtocolError');
            this.speak(this.t('speakError'));
        }
    }

    showProtocol() {
        this.elements.responseArea.classList.remove('hidden');
        this.elements.protocolTitle.textContent = this.currentProtocol.title;
        this.updateStatus('statusProtocolActive');
    }

    async advanceStep() {
        if (!this.currentProtocol || this.isAdvancing) {
            return;
        }

        this.isAdvancing = true;
        this.cancelAutoAdvance();

        try {
            const response = await fetch(`${this.apiBase}/next_step`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    protocol_id: this.currentProtocol.id,
                    current_step: this.currentStep,
                    session_id: this.sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const result = await response.json();
            if (result.done) {
                this.completeProtocol();
            } else {
                this.currentStep = result.step_index;
                this.handleStep(result.step, result.step_index, result.total_steps);
            }
        } catch (error) {
            console.error('Error al avanzar paso:', error);
            this.updateStatus('statusAdvanceError');
        } finally {
            this.isAdvancing = false;
        }
    }

    handleStep(stepText, stepIndex, totalSteps) {
        if (!this.currentProtocol) {
            return;
        }

        const protocolSteps = Array.isArray(this.currentProtocol.steps) ? this.currentProtocol.steps : [];
        const fallbackStep = protocolSteps[stepIndex] || '';
        const resolvedStep = stepText && stepText.trim() ? stepText.trim() : fallbackStep;

        if (!resolvedStep) {
            const warning = {
                protocolId: this.currentProtocol.id,
                stepIndex,
                stepText,
                fallbackStep
            };
            console.warn('Paso sin contenido recibido', warning);
            this.elements.currentStep.textContent = this.t('statusIntentUnknown');
            this.elements.stepCounter.textContent = this.t('stepCounter', stepIndex + 1, totalSteps);
            this.cancelAutoAdvance();
            return;
        }

        if (Array.isArray(this.currentProtocol.steps)) {
            this.currentProtocol.steps[stepIndex] = resolvedStep;
        }

        this.elements.currentStep.textContent = resolvedStep;
        this.elements.stepCounter.textContent = this.t('stepCounter', stepIndex + 1, totalSteps);
        this.updateStatus('statusProtocolActive');
        this.vibrate([200, 75, 200]);

        this.speak(resolvedStep, {
            onEnd: () => {
                const delay = this.computeAutoAdvanceDelay(resolvedStep);
                this.cancelAutoAdvance();
                this.autoAdvanceTimer = setTimeout(() => this.advanceStep(), delay);
            }
        });
    }


    computeAutoAdvanceDelay(text) {
        const words = text ? text.trim().split(/\s+/).length : 0;
        const estimated = words * this.autoAdvancePerWord;
        return Math.max(this.autoAdvanceMinDelay, estimated);
    }

    cancelAutoAdvance() {
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
    }

    repeatCurrentStep() {
        if (!this.currentProtocol || this.currentStep < 0) {
            return;
        }
        const stepText = this.currentProtocol.steps[this.currentStep];
        if (!stepText) {
            return;
        }
        this.cancelAutoAdvance();
        this.speak(stepText, {
            onEnd: () => {
                const delay = this.computeAutoAdvanceDelay(stepText);
                this.autoAdvanceTimer = setTimeout(() => this.advanceStep(), delay);
            }
        });
        this.vibrate(120);
    }

    completeProtocol() {
        this.cancelAutoAdvance();
        this.cancelActiveSpeech(true);
        this.updateStatus('statusReady');
        this.showScreen('completion');
        this.speak(this.t('finalVoiceMessage'));
    }

    restart() {
        this.cancelAutoAdvance();
        this.cancelActiveSpeech(true);
        this.currentProtocol = null;
        this.currentStep = -1;
        this.sessionId = this.generateSessionId();
        this.elements.responseArea.classList.add('hidden');
        this.elements.currentStep.textContent = '';
        this.updateStatus('statusReady');
        this.showScreen('main');
    }

    callEmergency() {
        this.vibrate([100, 50, 100, 50, 100]);
        window.location.href = `tel:${this.emergencyDialNumber}`;
    }

    showFeedbackModal() {
        this.elements.feedbackModal.classList.remove('hidden');
        this.elements.feedbackText.focus();
    }

    hideFeedbackModal() {
        this.elements.feedbackModal.classList.add('hidden');
        this.elements.feedbackText.value = '';
    }

    async sendFeedback() {
        const feedback = this.elements.feedbackText.value.trim();
        if (!feedback) {
            alert(this.t('feedbackEmpty'));
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    notes: feedback
                })
            });

            if (!response.ok) {
                throw new Error('Request failed');
            }

            alert(this.t('feedbackThanks'));
            this.hideFeedbackModal();
        } catch (error) {
            console.error('Error al enviar feedback:', error);
            alert(this.t('feedbackError'));
        }
    }

    cancelActiveSpeech(skipCallbacks = false) {
        if (this.activeUtterance) {
            if (skipCallbacks) {
                this.activeUtterance.onend = null;
                this.activeUtterance.onerror = null;
            }
            this.activeUtterance = null;
        }
        if (this.synthesis) {
            try {
                this.synthesis.cancel();
            } catch (error) {
                console.warn('No se pudo cancelar la s\u00edntesis de voz', error);
            }
        }
    }

    getVoiceForLanguage(language) {
        if (!this.voices.length) {
            this.voices = this.synthesis ? this.synthesis.getVoices() || [] : [];
        }
        const langPrefix = language === 'es' ? 'es' : 'en';
        const preferredNames = language === 'es'
            ? ['Google espa\u00f1ol', 'Microsoft Sabina', 'Microsoft Helena', 'Paulina']
            : ['Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Samantha'];

        const matchingVoices = this.voices.filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith(langPrefix));

        for (const name of preferredNames) {
            const found = matchingVoices.find((voice) => voice.name && voice.name.toLowerCase().includes(name.toLowerCase()));
            if (found) {
                return found;
            }
        }

        return matchingVoices[0] || this.voices[0] || null;
    }

    primeSpeechSynthesis(callback) {
        if (this.speechPrimed || !this.synthesis) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }

        if (typeof callback === 'function') {
            this.speechPrimeQueue.push(callback);
        }

        if (this.isPrimingSpeech) {
            return;
        }

        this.isPrimingSpeech = true;
        try {
            const warmup = new SpeechSynthesisUtterance(' ');
            warmup.volume = 0;
            warmup.rate = 1;
            warmup.pitch = 1;
            warmup.lang = this.config.language === 'es' ? 'es-ES' : 'en-US';
            warmup.onend = warmup.onerror = () => {
                this.isPrimingSpeech = false;
                this.speechPrimed = true;
                const queue = [...this.speechPrimeQueue];
                this.speechPrimeQueue = [];
                queue.forEach((cb) => {
                    try {
                        cb();
                    } catch (error) {
                        console.warn('Error en callback de primeSpeechSynthesis', error);
                    }
                });
            };
            this.synthesis.speak(warmup);
        } catch (error) {
            console.warn('No se pudo inicializar la sintesis de voz', error);
            this.isPrimingSpeech = false;
            this.speechPrimed = true;
            const queue = [...this.speechPrimeQueue];
            this.speechPrimeQueue = [];
            queue.forEach((cb) => {
                try {
                    cb();
                } catch (cbError) {
                    console.warn('Error en callback tras primeSpeechSynthesis fallida', cbError);
                }
            });
        }
    }

    speak(text, options = {}) {
        const { onEnd } = options;

        if (!this.config.voiceFeedbackEnabled || !this.synthesis) {\n            if (typeof onEnd === 'function') {\n                setTimeout(() => onEnd(), 0);\n            }\n            return;\n        }\n\n        if (!this.speechPrimed) {\n            this.primeSpeechSynthesis(() => this.speak(text, options));\n            return;\n        }\n\n        this.cancelActiveSpeech(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.config.language === 'es' ? 'es-ES' : 'en-US';
        const voice = this.getVoiceForLanguage(this.config.language);
        if (voice) {
            utterance.voice = voice;
        }

        if (this.synthesis && typeof this.synthesis.resume === 'function') {
            try {
                this.synthesis.resume();
            } catch (error) {
                console.warn('No se pudo reanudar la sintesis de voz', error);
            }
        }

        const voiceRate = this.config.language === 'es' ? 0.98 : 1.04;
        utterance.rate = voiceRate;
        utterance.pitch = this.voicePitch;
        utterance.volume = 1;

        if (typeof onEnd === 'function') {
            utterance.onend = () => {
                this.activeUtterance = null;
                onEnd();
            };
            utterance.onerror = () => {
                this.activeUtterance = null;
                onEnd();
            };
        } else {
            utterance.onend = () => {
                this.activeUtterance = null;
            };
            utterance.onerror = () => {
                this.activeUtterance = null;
            };
        }

        this.activeUtterance = utterance;
        this.synthesis.speak(utterance);
    }

    vibrate(pattern) {
        if (this.config.vibrationEnabled && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.conrumboApp = new ConRumboApp();
});

window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no manejada:', event.reason);
});

function updateOnlineStatus() {
    if (window.conrumboApp) {
        const key = navigator.onLine ? 'statusReady' : 'statusOffline';
        window.conrumboApp.updateStatus(key);
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

























