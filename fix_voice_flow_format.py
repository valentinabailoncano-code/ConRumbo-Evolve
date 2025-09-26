from pathlib import Path
from textwrap import dedent

def replace_block(source, start_marker, end_marker, new_text):
    start = source.index(start_marker)
    end = source.index(end_marker, start)
    return source[:start] + new_text + source[end:]

path = Path('frontend/script.js')
text = path.read_text(encoding='utf-8')

text = text.replace(
    "        this.autoPlay = this.config.voiceFeedbackEnabled;\n        this.isAdvancing = false;\n        this.activeUtterance = null;",
    dedent('''
        this.autoPlay = this.config.voiceFeedbackEnabled;
        this.voiceRate = 0.7;
        this.voicePitch = 1;
        this.autoAdvanceDelayMs = 5500;
        this.autoAdvanceTimer = null;
        this.isAdvancing = false;
        this.activeUtterance = null;
'''),
    1,
)

text = text.replace(
    "        this.elements.voiceFeedbackToggle.checked = this.config.voiceFeedbackEnabled;\n        this.elements.darkModeToggle.checked = this.config.darkMode;",
    dedent('''
        this.elements.voiceFeedbackToggle.checked = this.config.voiceFeedbackEnabled;
        this.elements.darkModeToggle.checked = this.config.darkMode;
        this.autoPlay = this.config.voiceFeedbackEnabled;
'''),
    1,
)

if 'cancelAutoAdvance() {' not in text:
    insert_point = text.index('    cancelActiveSpeech(')
    helper = dedent('''
    cancelAutoAdvance() {
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
    }

''')
    text = text[:insert_point] + helper + text[insert_point:]

new_get = dedent('''
    getVoiceForLanguage(language) {
        if (!this.voices.length) return null;

        const preferredLangs = language === 'es'
            ? ['es-es', 'es_es', 'es-mx', 'es-419', 'es', 'spa']
            : ['en-us', 'en_us', 'en-gb', 'en_gb', 'en-au', 'en', 'eng'];
        const preferredNames = language === 'es'
            ? ['google espa', 'google us español', 'google español', 'microsoft sabina', 'microsoft laura', 'microsoft pablo', 'microsoft andres']
            : ['google us english', 'google uk english', 'google english', 'microsoft aria', 'microsoft guy', 'microsoft zira'];

        const scored = this.voices
            .map((voice) => {
                const lang = (voice.lang || '').toLowerCase();
                const name = (voice.name || '').toLowerCase();
                let score = 0;

                preferredLangs.forEach((target, index) => {
                    const weight = 50 - index * 6;
                    if (lang === target) score += weight + 25;
                    if (lang.startsWith(target)) score += weight + 12;
                    if (lang.includes(target)) score += weight;
                });

                preferredNames.forEach((pattern, index) => {
                    const weight = 60 - index * 8;
                    if (name.includes(pattern)) score += weight;
                });

                if (name.includes('neural')) score += 6;
                if (name.includes('natural')) score += 4;
                if (name.includes('premium')) score += 4;

                return { voice, score };
            })
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score);

        if (scored.length) {
            return scored[0].voice;
        }

        const fallbackPrefix = language === 'es' ? 'es' : 'en';
        return this.voices.find((voice) => (voice.lang || '').toLowerCase().startsWith(fallbackPrefix)) || this.voices[0];
    }

    scheduleAutoAdvance() {
        this.cancelAutoAdvance();
        if (!this.autoPlay) return;
        this.autoAdvanceTimer = setTimeout(() => {
            if (this.autoPlay) {
                this.advanceStep(true);
            }
        }, this.autoAdvanceDelayMs);
    }

''')
text = replace_block(text, '    getVoiceForLanguage(language) {', '    setupDOM() {', new_get)

new_advance = dedent('''
    async advanceStep(autoTriggered = false) {
        if (!this.currentProtocol || this.isAdvancing) return;
        this.isAdvancing = true;

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
                throw new Error(`HTTP error ${response.status}`);
            }

            const result = await response.json();

            this.cancelAutoAdvance();

            if (result.done) {
                this.completeProtocol();
            } else {
                this.currentStep = result.step_index;
                this.showStep(result.step, result.step_index, result.total_steps, true);
            }
        } catch (error) {
            console.error('Error al avanzar paso:', error);
            this.updateStatus('statusAdvanceError');
        } finally {
            this.isAdvancing = false;
        }
    }

''')
text = replace_block(text, '    async advanceStep(', '    showStep(', new_advance)

new_show = dedent('''
    showStep(stepText, stepIndex, totalSteps, autoAdvance = false) {
        this.elements.currentStep.textContent = stepText;
        this.elements.stepCounter.textContent = `${this.config.language === 'es' ? 'Paso' : 'Step'} ${stepIndex + 1} ${this.config.language === 'es' ? 'de' : 'of'} ${totalSteps}`;

        const shouldContinue = this.autoPlay && !this.isListening;
        this.speak(stepText, {
            onEnd: () => {
                if (shouldContinue && autoAdvance) {
                    this.scheduleAutoAdvance();
                }
            },
        });

        this.vibrate(200);
    }

''')
text = replace_block(text, '    showStep(stepText', '    repeatCurrentStep()', new_show)

new_repeat = dedent('''
    repeatCurrentStep() {
        if (!this.currentProtocol || this.currentStep < 0) return;
        this.cancelActiveSpeech(true);
        const stepText = this.currentProtocol.steps[this.currentStep];
        const shouldContinue = this.autoPlay;
        this.speak(stepText, {
            onEnd: () => {
                if (shouldContinue) {
                    this.scheduleAutoAdvance();
                }
            },
        });
        this.vibrate(120);
    }

''')
text = replace_block(text, '    repeatCurrentStep() {', '    completeProtocol()', new_repeat)

new_complete = dedent('''
    completeProtocol() {
        this.autoPlay = false;
        this.cancelAutoAdvance();
        const finish = () => {
            setTimeout(() => {
                this.showScreen('completion');
            }, 800);
        };
        this.speak(this.t('speakCompletion'), { onEnd: finish });
        this.vibrate([200, 100, 200]);
    }

''')
text = replace_block(text, '    completeProtocol() {', '    restart()', new_complete)

new_speak = dedent('''
    speak(text, options = {}) {
        const { onEnd } = options;

        if (!this.config.voiceFeedbackEnabled || !this.synthesis) {
            if (typeof onEnd === 'function') {
                setTimeout(onEnd, 0);
            }
            return;
        }

        this.cancelActiveSpeech(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.config.language === 'es' ? 'es-ES' : 'en-US';
        const voice = this.getVoiceForLanguage(this.config.language);
        if (voice) {
            utterance.voice = voice;
        }
        utterance.rate = this.voiceRate;
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

''')
text = replace_block(text, '    speak(text, options = {}) {', '    vibrate(pattern) {', new_speak)

text = text.replace(
    "            this.currentStep = -1;\n            this.showProtocol();\n            this.advanceStep();",
    dedent('''
            this.currentStep = -1;
            this.showProtocol();
            this.autoPlay = this.config.voiceFeedbackEnabled;
            this.cancelAutoAdvance();
            this.advanceStep(true);
'''),
    1,
)

path.write_text(text, encoding='utf-8')
