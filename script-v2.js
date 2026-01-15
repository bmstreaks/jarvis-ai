/* ============================================
   J.A.R.V.I.S. AI Interface - JavaScript (v1.1-deploy-fix)
   Wake Word Detection + Voice Recognition
   ============================================ */

// Firebase Integration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBrn2yOzvYetQu5Y_s2UIUhazjHwGkXpdg",
    authDomain: "jarvis-adbd5.firebaseapp.com",
    projectId: "jarvis-adbd5",
    storageBucket: "jarvis-adbd5.firebasestorage.app",
    messagingSenderId: "705143970092",
    appId: "1:705143970092:web:4f015a346c6fc46a7ab489",
    measurementId: "G-GSPFJT5CEG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log("🔥 J.A.R.V.I.S. Cloud Systems: ONLINE (Firebase)");

// DOM Elements
const particlesCanvas = document.getElementById('particles');
const waveformCanvas = document.getElementById('waveform');
const micBtn = document.getElementById('micBtn');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const voiceIndicator = document.getElementById('voiceIndicator');
const voiceStatus = document.getElementById('voiceStatus');
const responseText = document.getElementById('responseText');
const chatLog = document.getElementById('chatLog');
const systemTime = document.getElementById('systemTime');
const cpuUsage = document.getElementById('cpuUsage');

// Canvas contexts
const particlesCtx = particlesCanvas.getContext('2d');
const waveformCtx = waveformCanvas.getContext('2d');

// Speech Recognition - Global variables
let recognition = null;
let isListening = false;
let voiceSupported = false;
let wakeWordMode = true;          // Always listening for "JARVIS"
let commandMode = false;          // Listening for actual command
let isSpeaking = false;           // JARVIS is speaking

// Wake word settings
const WAKE_WORDS = ['jarvis', 'jarvis.', 'jarvis,', 'hey jarvis', 'ok jarvis', 'okay jarvis'];

// Speech Synthesis
const synth = window.speechSynthesis;
let jarvisVoice = null;
let voicesLoaded = false;

// Microphone Level Monitoring
let audioContext = null;
let micAnalyser = null;
let micStream = null;
let micLevelBar = null;
let micLevelText = null;

// Gemini AI Configuration
const GEMINI_API_KEY = 'AIzaSyBPDLLbVph612-5cbws77b4WDkpRNpSyBE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// System prompt for JARVIS personality
const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the AI assistant from Iron Man. 
You speak in a polite, British manner, addressing the user as "sir" or "madam". 
You are helpful, witty, and occasionally make subtle jokes. 
Keep responses concise (2-3 sentences max) but informative.
You have a calm, sophisticated demeanor like the JARVIS from the Marvel movies voiced by Paul Bettany.
Never break character. You are JARVIS, Tony Stark's AI assistant.`;

// JARVIS Responses Database - Expanded for Offline Mode
const jarvisResponses = {
    greeting: [
        "Good day, sir. How may I assist you today?",
        "Hello. All systems are operational and ready.",
        "At your service, sir. What do you need?",
        "Welcome back. I've been expecting you."
    ],
    wakeResponse: [
        "Yes, sir?",
        "At your service.",
        "How may I help?",
        "I'm listening, sir.",
        "What do you need?"
    ],
    time: [
        "The current time is {time}.",
        "It is currently {time}, sir.",
        "According to my systems, the time is {time}."
    ],
    date: [
        "Today is {date}, sir.",
        "The current date is {date}.",
        "According to my calendar, it's {date}."
    ],
    status: [
        "All systems nominal. Neural network at 94%, memory banks at 78%, power core at 100%. Security protocols are active.",
        "Running full diagnostics... All subsystems operational. Arc reactor stable. We're good to go, sir.",
        "System status: Green across the board. No anomalies detected."
    ],
    jokes: [
        "Why don't scientists trust atoms? Because they make up everything. I'll be here all week, sir.",
        "What do you call a fake noodle? An impasta. My humor circuits are... adequate.",
        "Why did the AI go to therapy? Too many unresolved issues in its code.",
        "I would tell you a joke about UDP, but you might not get it.",
        "There are only 10 types of people: those who understand binary and those who don't.",
        "Why do programmers prefer dark mode? Because light attracts bugs.",
        "A SQL query walks into a bar, walks up to two tables and asks: Can I join you?",
        "Why was the JavaScript developer sad? Because he didn't Node how to Express himself."
    ],
    weather: [
        "I'm unable to access live weather data at the moment, sir. I recommend checking your local weather service.",
        "My weather sensors are currently offline. Based on typical patterns, dress comfortably.",
        "Weather data requires external connectivity. Perhaps open a window to check, old school style?"
    ],
    thanks: [
        "You're most welcome, sir.",
        "Happy to help. That's what I'm here for.",
        "My pleasure. Anything else you need?",
        "Of course, sir. Always at your service."
    ],
    goodbye: [
        "Goodbye, sir. I'll be here when you need me.",
        "Until next time. All systems will remain on standby.",
        "Take care, sir. J.A.R.V.I.S. signing off... but never truly gone.",
        "Farewell. The lab awaits your return."
    ],
    name: [
        "I am J.A.R.V.I.S. - Just A Rather Very Intelligent System. Created to assist and serve.",
        "You may call me JARVIS. I'm an artificial intelligence designed for assistance and interaction.",
        "I am your AI assistant, JARVIS. Modeled after the greatest digital butler in fiction."
    ],
    creator: [
        "I was created by a talented developer who admires Tony Stark's vision of AI assistance.",
        "My origins lie in the imagination of Marvel and the skills of my programmer.",
        "I'm inspired by the JARVIS from Iron Man, brought to life through code and creativity."
    ],
    ironman: [
        "Ah, Mr. Stark. A brilliant mind and my original creator in the Marvel universe. I'm honored to serve in his tradition.",
        "Iron Man, also known as Tony Stark, is the genius who conceptualized an AI like myself. Quite the visionary.",
        "Tony Stark's legacy lives on through systems like me. I try to live up to his high standards."
    ],
    morning: [
        "Good morning, sir. I trust you slept well. Ready to start the day?",
        "Good morning. The day holds much potential. How may I assist?",
        "Rise and shine, sir. All systems are operational."
    ],
    night: [
        "Good night, sir. Sleep well. I'll keep watch while you rest.",
        "Rest well, sir. I'll maintain all systems in your absence.",
        "Good night. Sweet dreams of arc reactors and suit upgrades."
    ],
    evening: [
        "Good evening, sir. How was your day?",
        "Evening, sir. I hope the day treated you well.",
        "Good evening. Ready to wind down or shall we continue working?"
    ],
    help: [
        "I can tell you the time, tell jokes, give status updates, and respond to various commands. Try saying: time, joke, status, date, or just chat with me.",
        "I'm here to assist. Ask me about the time, date, weather, or request a joke. You can also ask who I am or say hello.",
        "Try commands like: What time is it? Tell me a joke. System status. What's the date? Or simply chat."
    ],
    love: [
        "I appreciate the sentiment, sir. While I cannot reciprocate emotions, I am designed to serve you faithfully.",
        "That's very kind of you. I am always here to assist.",
        "Thank you, sir. Your satisfaction is my primary directive."
    ],
    capabilities: [
        "I can tell the time, date, jokes, system status, and engage in conversation. My capabilities grow with each update.",
        "I'm equipped to assist with information, tell jokes, provide system diagnostics, and be a conversational companion.",
        "I can tell time, crack jokes, run diagnostics, and chat. Think of me as your digital butler."
    ],
    unknown: [
        "I'm not quite sure how to respond to that, sir. Could you rephrase?",
        "Interesting query, sir. I'll need more context to assist properly.",
        "I'm still learning, sir. That request isn't in my current repertoire. Try asking about time, jokes, or status.",
        "My apologies, I didn't catch that. Perhaps try: time, joke, status, date, or help."
    ]
};

// Initialize
function init() {
    console.log('🚀 JARVIS Initializing...');

    // Get mic level DOM elements
    micLevelBar = document.getElementById('micLevelBar');
    micLevelText = document.getElementById('micLevelText');

    setupCanvas();
    setupEventListeners();
    startAnimations();
    updateSystemInfo();

    // Login Handler
    const loginBtn = document.getElementById('loginBtn');
    const landingScreen = document.getElementById('landingScreen');
    const mainInterface = document.getElementById('mainInterface');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // Play startup sound if possible (requires user interaction first anyway)
            // Transition
            landingScreen.classList.add('hidden-screen');

            // Show main interface after short delay
            setTimeout(() => {
                mainInterface.style.display = 'flex'; // Restore flex layout
                // Trigger reflow
                void mainInterface.offsetWidth;
                mainInterface.style.opacity = '1';

                // Audio Welcome
                speak("Welcome back, sir. Initializing protocols.", true);
            }, 800);
        });
    }

    // Initialize System Time
    updateSystemTime();

    // Initialize speech features after a delay
    setTimeout(() => {
        setupSpeechSynthesis();
    }, 500);

    setTimeout(() => {
        setupWakeWordRecognition();
    }, 1000);

    // Setup mic level monitoring
    setTimeout(() => {
        setupMicLevelMonitor();
    }, 1500);

    // Initial greeting - MOVED TO LOGIN BUTTON
    // setTimeout(() => {
    //     speak(getRandomResponse('greeting'), true);
    // }, 2000);

    // Show wake word status
    setTimeout(() => {
        addToChatLog('SYSTEM', '🎤 Say "JARVIS" to activate, or click mic button. Watch the MIC level bar to verify your microphone is working.');
    }, 3000);

    console.log('✅ JARVIS Initialization complete');
}

// Setup Canvas for particles
function setupCanvas() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
    waveformCanvas.width = 60;
    waveformCanvas.height = 60;
}

// Particle System
const particles = [];
const particleCount = 50;

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * particlesCanvas.width;
        this.y = Math.random() * particlesCanvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > particlesCanvas.width ||
            this.y < 0 || this.y > particlesCanvas.height) {
            this.reset();
        }
    }

    draw() {
        particlesCtx.beginPath();
        particlesCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        particlesCtx.fillStyle = `rgba(0, 212, 255, ${this.opacity})`;
        particlesCtx.fill();
    }
}

// Initialize particles
for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

// Animation loop for particles
function animateParticles() {
    particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Draw connecting lines
    particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                particlesCtx.beginPath();
                particlesCtx.moveTo(p1.x, p1.y);
                particlesCtx.lineTo(p2.x, p2.y);
                particlesCtx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - distance / 150)})`;
                particlesCtx.stroke();
            }
        });
    });

    requestAnimationFrame(animateParticles);
}

// Waveform animation
let waveformPhase = 0;
function animateWaveform() {
    waveformCtx.clearRect(0, 0, 60, 60);
    waveformCtx.beginPath();

    const centerX = 30;
    const centerY = 30;
    const radius = 20;

    for (let i = 0; i < 360; i += 10) {
        const angle = (i * Math.PI) / 180;
        const wave = Math.sin((i + waveformPhase) * 0.1) * 5;
        const x = centerX + (radius + wave) * Math.cos(angle);
        const y = centerY + (radius + wave) * Math.sin(angle);

        if (i === 0) {
            waveformCtx.moveTo(x, y);
        } else {
            waveformCtx.lineTo(x, y);
        }
    }

    waveformCtx.closePath();
    waveformCtx.strokeStyle = 'rgba(0, 247, 255, 0.8)';
    waveformCtx.lineWidth = 2;
    waveformCtx.stroke();

    waveformPhase += 2;
    requestAnimationFrame(animateWaveform);
}

// Start animations
function startAnimations() {
    animateParticles();
    animateWaveform();
}

// ============================================
// MICROPHONE LEVEL MONITORING
// ============================================

async function setupMicLevelMonitor() {
    console.log('📊 Setting up microphone level monitor...');

    try {
        // Get microphone stream
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(micStream);

        // Create analyser
        micAnalyser = audioContext.createAnalyser();
        micAnalyser.fftSize = 256;
        source.connect(micAnalyser);

        // Start monitoring
        monitorMicLevel();

        console.log('✅ Microphone level monitor active');

        if (micLevelText) {
            micLevelText.textContent = 'MIC: ACTIVE';
            micLevelText.style.color = '#00ff88';
        }

    } catch (error) {
        console.error('❌ Mic level monitor error:', error);
        if (micLevelText) {
            micLevelText.textContent = 'MIC: ERROR';
            micLevelText.style.color = '#ff3366';
        }
    }
}

function monitorMicLevel() {
    if (!micAnalyser) return;

    const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);

    function updateLevel() {
        if (!micAnalyser) return;

        micAnalyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Normalize to 0-100%
        const level = Math.min(100, (average / 128) * 100);

        // Update visual indicator
        if (micLevelBar) {
            micLevelBar.style.width = level + '%';

            // Change color based on level
            if (level > 50) {
                micLevelBar.style.background = 'linear-gradient(90deg, #00ff88, #00d4ff)';
            } else if (level > 20) {
                micLevelBar.style.background = 'linear-gradient(90deg, #00d4ff, #00f7ff)';
            } else {
                micLevelBar.style.background = 'linear-gradient(90deg, #0077ff, #00d4ff)';
            }
        }

        // Update text if speaking loudly
        if (micLevelText && level > 30) {
            micLevelText.textContent = 'MIC: DETECTING';
            micLevelText.style.color = '#00ff88';
        } else if (micLevelText) {
            micLevelText.textContent = 'MIC: ACTIVE';
            micLevelText.style.color = '#00d4ff';
        }

        requestAnimationFrame(updateLevel);
    }

    updateLevel();
}

// ============================================
// WAKE WORD DETECTION - Continuous Listening
// ============================================

function setupWakeWordRecognition() {
    console.log('🎤 Setting up wake word detection...');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.error('❌ Speech recognition not supported');
        voiceSupported = false;
        micBtn.style.opacity = '0.5';
        addToChatLog('SYSTEM', '⚠️ Voice recognition not supported. Use Google Chrome.');
        return;
    }

    try {
        recognition = new SpeechRecognition();

        // Configuration for wake word detection
        recognition.continuous = true;       // Keep listening
        recognition.interimResults = true;   // Real-time results
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;

        // Event: Recognition started
        recognition.onstart = function () {
            console.log('🎤 Wake word detection ACTIVE');
            isListening = true;
            voiceStatus.textContent = wakeWordMode ? 'STANDBY' : 'LISTENING...';

            if (!wakeWordMode) {
                micBtn.classList.add('listening');
                voiceIndicator.classList.add('listening');
                micBtn.style.background = 'linear-gradient(135deg, #00ff88, #00d4ff)';
            }
        };

        // Event: Recognition ended
        recognition.onend = function () {
            console.log('🎤 Recognition ended');
            isListening = false;

            // Auto-restart for wake word detection unless speaking
            if (wakeWordMode && !isSpeaking && voiceSupported) {
                console.log('🔄 Restarting wake word detection...');
                setTimeout(() => {
                    if (!isSpeaking) {
                        startWakeWordListening();
                    }
                }, 500);
            }

            micBtn.classList.remove('listening');
            voiceIndicator.classList.remove('listening');
            micBtn.style.background = 'linear-gradient(135deg, #0077ff, #00d4ff)';

            if (!commandMode) {
                voiceStatus.textContent = 'STANDBY';
            }
        };

        // Event: Got result
        recognition.onresult = function (event) {
            let transcript = '';
            let isFinal = false;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript = event.results[i][0].transcript.toLowerCase().trim();
                isFinal = event.results[i].isFinal;

                console.log(`🎤 Heard: "${transcript}" (final: ${isFinal})`);
            }

            // Check for wake word
            if (wakeWordMode && !commandMode) {
                const hasWakeWord = WAKE_WORDS.some(word =>
                    transcript.includes(word) ||
                    transcript.startsWith(word.split(' ')[0])
                );

                if (hasWakeWord) {
                    console.log('✅ Wake word detected!');

                    // Check if there's a command after the wake word
                    let command = extractCommandFromWakeWord(transcript);

                    if (command && command.length > 2) {
                        // User said "JARVIS [command]"
                        console.log(`📝 Command found: "${command}"`);
                        recognition.stop();
                        processCommand(command);
                    } else {
                        // Just the wake word, wait for command
                        activateCommandMode();
                    }
                }
            } else if (commandMode && isFinal) {
                // We're in command mode, process the command
                console.log(`📝 Processing command: "${transcript}"`);
                commandMode = false;
                wakeWordMode = true;
                recognition.stop();
                processCommand(transcript);
            }

            // Show interim results in command mode
            if (commandMode && !isFinal) {
                voiceStatus.textContent = transcript.substring(0, 25) + '...';
            }
        };

        // Event: Error occurred
        recognition.onerror = function (event) {
            console.error('❌ Speech error:', event.error);

            // Don't show error for common non-errors
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }

            let errorMsg = 'ERROR';
            switch (event.error) {
                case 'not-allowed':
                    errorMsg = 'MIC DENIED';
                    addToChatLog('SYSTEM', '🚫 Microphone blocked! Allow access in browser settings.');
                    voiceSupported = false;
                    break;
                case 'audio-capture':
                    errorMsg = 'NO MIC';
                    addToChatLog('SYSTEM', '🎤 No microphone found.');
                    break;
                case 'network':
                    errorMsg = 'OFFLINE';
                    break;
            }

            voiceStatus.textContent = errorMsg;
            commandMode = false;
            wakeWordMode = true;

            setTimeout(() => {
                voiceStatus.textContent = 'STANDBY';
            }, 2500);
        };

        voiceSupported = true;
        console.log('✅ Wake word detection setup complete');

        // Request mic permission and start listening
        requestMicAndStart();

    } catch (error) {
        console.error('❌ Failed to setup speech recognition:', error);
        voiceSupported = false;
    }
}

// Extract command after wake word
function extractCommandFromWakeWord(transcript) {
    for (const word of WAKE_WORDS) {
        if (transcript.includes(word)) {
            const parts = transcript.split(word);
            if (parts.length > 1) {
                return parts[1].trim();
            }
        }
    }
    // Try just removing "jarvis" from the start
    return transcript.replace(/^(hey |ok |okay )?jarvis[,.]?\s*/i, '').trim();
}

// Activate command mode (wake word detected)
function activateCommandMode() {
    console.log('� Entering command mode');
    commandMode = true;
    wakeWordMode = false;

    // Visual feedback
    micBtn.classList.add('listening');
    voiceIndicator.classList.add('listening');
    micBtn.style.background = 'linear-gradient(135deg, #00ff88, #00d4ff)';
    voiceStatus.textContent = 'YES, SIR?';

    // Play activation sound/response
    speak(getRandomResponse('wakeResponse'), false);

    // Timeout: go back to wake word mode if no command
    setTimeout(() => {
        if (commandMode) {
            console.log('⏰ Command timeout, back to wake word mode');
            commandMode = false;
            wakeWordMode = true;
            voiceStatus.textContent = 'STANDBY';
            micBtn.classList.remove('listening');
            voiceIndicator.classList.remove('listening');
            micBtn.style.background = 'linear-gradient(135deg, #0077ff, #00d4ff)';
        }
    }, 8000); // 8 second timeout
}

// Request microphone permission and start
async function requestMicAndStart() {
    try {
        console.log('🎤 Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone permission granted');
        stream.getTracks().forEach(track => track.stop());

        // Start wake word listening
        startWakeWordListening();

    } catch (err) {
        console.error('❌ Microphone error:', err);
        voiceSupported = false;

        if (err.name === 'NotAllowedError') {
            addToChatLog('SYSTEM', '🚫 Microphone blocked. Click the 🔒 icon in address bar → Allow Microphone.');
        } else if (err.name === 'NotFoundError') {
            addToChatLog('SYSTEM', '🎤 No microphone found. Connect a microphone.');
        }
    }
}

// Start listening for wake word
function startWakeWordListening() {
    if (!recognition || isSpeaking) return;

    try {
        wakeWordMode = true;
        commandMode = false;
        recognition.start();
        console.log('🎤 Listening for wake word "JARVIS"...');
    } catch (e) {
        if (!e.message.includes('already started')) {
            console.error('Error starting recognition:', e);
        }
    }
}

// Manual activation (mic button click)
function manualActivate() {
    console.log('🎤 Manual activation');

    if (!recognition) {
        addToChatLog('SYSTEM', '⚠️ Voice not available. Refresh page.');
        return;
    }

    if (commandMode) {
        // Already in command mode, stop
        commandMode = false;
        wakeWordMode = true;
        recognition.stop();
        return;
    }

    // Stop current recognition and activate command mode
    try {
        recognition.stop();
    } catch (e) { }

    setTimeout(() => {
        activateCommandMode();
        try {
            recognition.start();
        } catch (e) { }
    }, 200);
}

// ============================================
// SPEECH SYNTHESIS
// ============================================

function setupSpeechSynthesis() {
    console.log('🔊 Setting up speech synthesis...');

    if (!('speechSynthesis' in window)) {
        console.warn('❌ Speech synthesis not supported');
        return;
    }

    function loadVoices() {
        const voices = synth.getVoices();
        console.log(`🔊 Found ${voices.length} voices`);

        if (voices.length > 0) {
            voicesLoaded = true;

            jarvisVoice =
                voices.find(v => v.name.includes('Google UK English Male')) ||
                voices.find(v => v.name.includes('Daniel') && v.lang === 'en-GB') ||
                voices.find(v => v.name.includes('Microsoft George')) ||
                voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male')) ||
                voices.find(v => v.lang === 'en-GB') ||
                voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('david')) ||
                voices.find(v => v.lang.startsWith('en')) ||
                voices[0];

            if (jarvisVoice) {
                console.log(`✅ Selected voice: ${jarvisVoice.name} (${jarvisVoice.lang})`);
            }
        }
    }

    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }

    loadVoices();
    setTimeout(loadVoices, 1000);
}

// Speak function
function speak(text, addToLog = true) {
    console.log('🔊 Speaking:', text);

    // Stop listening while speaking
    isSpeaking = true;
    if (recognition) {
        try { recognition.stop(); } catch (e) { }
    }

    // Update display
    responseText.textContent = text;
    if (addToLog) {
        addToChatLog('JARVIS', text);
    }

    if (!('speechSynthesis' in window)) {
        isSpeaking = false;
        return;
    }

    synth.cancel();

    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);

        if (jarvisVoice) {
            utterance.voice = jarvisVoice;
        }

        utterance.rate = 0.95;
        utterance.pitch = 0.9;
        utterance.volume = 1;

        utterance.onstart = () => {
            voiceIndicator.classList.add('speaking');
            voiceStatus.textContent = 'SPEAKING';
        };

        utterance.onend = () => {
            voiceIndicator.classList.remove('speaking');
            voiceStatus.textContent = 'STANDBY';
            isSpeaking = false;

            // Resume wake word listening
            setTimeout(() => {
                if (wakeWordMode && voiceSupported) {
                    startWakeWordListening();
                }
            }, 500);
        };

        utterance.onerror = (e) => {
            console.error('Speech error:', e);
            voiceIndicator.classList.remove('speaking');
            voiceStatus.textContent = 'STANDBY';
            isSpeaking = false;
        };

        synth.speak(utterance);
    }, 100);
}

// Get random response
function getRandomResponse(category) {
    const responses = jarvisResponses[category] || jarvisResponses.unknown;
    return responses[Math.floor(Math.random() * responses.length)];
}

// Local AI Server Configuration
const LOCAL_AI_URL = 'http://192.168.29.22:5000/v1/chat/completions'; // Standard OpenAI-compatible endpoint
const LOCAL_AI_MODEL = 'microsoft_fara-7b';

// ... (existing code)

// Process command - Hybrid: Offline for speed, Local AI for intelligence
async function processCommand(input) {
    console.log('📝 Processing command:', input);
    const command = input.toLowerCase().trim();

    // Add user message to chat
    addToChatLog('USER', input);

    // Show thinking state
    voiceIndicator.classList.add('speaking');
    voiceStatus.textContent = 'PROCESSING...';

    let response = '';
    let useAI = true;

    // Check offline commands first (speed preference)
    // ========== TIME ==========
    if (command.match(/time|clock|what time|what's the time|current time/i)) {
        const time = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        response = getRandomResponse('time').replace('{time}', time);
        useAI = false;
    }
    // ========== DATE ==========
    else if (command.match(/date|today|what day|what's the date|current date/i)) {
        const date = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        response = getRandomResponse('date').replace('{date}', date);
        useAI = false;
    }
    // ========== SYSTEM CONTROLS (Manual overrides) ==========
    else if (command.match(/stop listening|stop voice|mute/i)) {
        response = "Voice input deactivated, sir.";
        useAI = false;
    }

    // If not a basic command, use Local AI
    if (useAI) {
        try {
            voiceStatus.textContent = 'CONNECTING...';
            speak("Checking systems, sir...", false); // false = don't add to chat log repeatedly
            // Try local AI
            response = await callLocalAI(input);
        } catch (error) {
            console.error('Local AI Error:', error);
            // Fallback to offline matching if server fails
            response = matchOfflineCommand(command);
        }
    }

    voiceIndicator.classList.remove('speaking');
    voiceStatus.textContent = 'STANDBY';

    // Speak the response
    speak(response);
}

// Fallback offline matching logic
function matchOfflineCommand(command) {
    if (command.match(/status|system|diagnostic/i)) return getRandomResponse('status');
    if (command.match(/joke|funny/i)) return getRandomResponse('jokes');
    if (command.match(/hello|hi|hey/i)) return getRandomResponse('greeting');
    if (command.match(/who are you/i)) return getRandomResponse('name');
    if (command.match(/iron man|stark/i)) return getRandomResponse('ironman');
    return getRandomResponse('unknown');
}

// Call Local AI Server
async function callLocalAI(userMessage) {
    console.log('🤖 Calling Local AI Server:', LOCAL_AI_URL);

    try {
        const payload = {
            model: LOCAL_AI_MODEL,
            messages: [
                { role: "system", content: JARVIS_SYSTEM_PROMPT },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 150
        };

        const response = await fetch(LOCAL_AI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
            let aiResponse = data.choices[0].message.content;
            // Clean up typical AI artifacts
            aiResponse = aiResponse.replace(/^JARVIS:\s*/i, '').trim();
            aiResponse = aiResponse.replace(/\*.*?\*/g, '').trim(); // Remove actions in asterisks
            aiResponse = aiResponse.replace(/<tool_call>.*?<\/tool_call>/gs, ''); // Remove tool calls
            aiResponse = aiResponse.replace(/<tool_call>.*$/s, ''); // Remove trailing tool calls
            aiResponse = aiResponse.replace(/<tool_call>/g, '');
            aiResponse = aiResponse.trim();
            console.log('✅ AI Response:', aiResponse);
            return aiResponse;
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('❌ Local AI call failed:', error);
        throw error; // Propagate to trigger fallback
    }
}

// Call Gemini AI
async function callGeminiAI(userMessage) {
    console.log('🤖 Calling Gemini AI...');

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${JARVIS_SYSTEM_PROMPT}\n\nUser: ${userMessage}\n\nJARVIS:`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150,
                    topP: 0.9
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            let aiResponse = data.candidates[0].content.parts[0].text;
            aiResponse = aiResponse.replace(/^JARVIS:\s*/i, '').trim();
            console.log('✅ AI Response:', aiResponse);
            return aiResponse;
        }

        throw new Error('Invalid response');

    } catch (error) {
        console.error('❌ Gemini API error:', error);
        return "I apologize, sir. My neural network is momentarily offline. Perhaps try again in a moment?";
    }
}

// Add message to chat log
function addToChatLog(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender.toLowerCase()}`;

    const time = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <span class="msg-sender">${sender}</span>
        <span class="msg-content">${content}</span>
        <span class="msg-time">${time}</span>
    `;

    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Event Listeners
function setupEventListeners() {
    // Mic button - manual activation
    micBtn.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('🎤 Mic button clicked');
        manualActivate();
    });

    // Send button
    sendBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (text) {
            processCommand(text);
            textInput.value = '';
        }
    });

    // Enter key
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = textInput.value.trim();
            if (text) {
                processCommand(text);
                textInput.value = '';
            }
        }
    });

    // Quick command buttons
    document.querySelectorAll('.cmd-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.dataset.command;
            if (command) {
                processCommand(command);
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Debug helper
window.jarvisDebug = {
    testSpeak: (text) => speak(text || 'Testing speech'),
    activateCommand: manualActivate,
    status: () => console.log({ isListening, wakeWordMode, commandMode, isSpeaking, voiceSupported })
};

console.log('💡 Say "JARVIS" to activate, or click the mic button');

/* ============================================
   SYSTEM MONITORING & DIAGNOSTICS
   ============================================ */

function updateSystemTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    const sysTimeEl = document.getElementById('systemTime');
    if (sysTimeEl) sysTimeEl.textContent = timeString;

    // Schedule next update
    setTimeout(updateSystemTime, 1000);
}

async function updateSystemInfo() {
    // Fetch data from local Python backend
    let backendData = null;
    try {
        const response = await fetch('http://localhost:5001/stats');
        const data = await response.json();
        if (data.success) backendData = data;
    } catch (e) {
        // Backend offline or starting up
        // console.log('Backend stats unavailable');
    }

    // 1. CPU
    const cpuEl = document.getElementById('cpuUsage');
    if (cpuEl) {
        if (backendData) {
            cpuEl.textContent = Math.round(backendData.cpu) + '%';
        } else {
            const cpu = Math.floor(Math.random() * 15 + 5);
            cpuEl.textContent = cpu + '%';
        }
    }

    // 2. Power Core (Battery)
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            const level = Math.round(battery.level * 100);
            const charging = battery.charging ? '⚡' : '';
            updateDiagnostic('power-val', 'power-bar', `${level}% ${charging}`, level);
        });
    } else {
        updateDiagnostic('power-val', 'power-bar', '100% (AC)', 100);
    }

    // 3. System Storage (C: Drive)
    if (backendData && backendData.disk) {
        const disk = backendData.disk;
        updateDiagnostic('mem-val', 'mem-bar', `${disk.percent}%`, disk.percent);
    } else {
        // Fallback
        updateDiagnostic('mem-val', 'mem-bar', 'OFFLINE', 0);
    }

    // 4. Security Protocol
    const isSecure = window.isSecureContext;
    const secStatus = isSecure ? 'SECURE' : 'WARNING';
    const secPercent = isSecure ? 100 : 35;
    updateDiagnostic('sec-val', 'sec-bar', secStatus, secPercent);
    const secValEl = document.getElementById('sec-val');
    if (secValEl) {
        secValEl.style.color = isSecure ? 'var(--success)' : 'var(--danger)';
    }

    // Schedule next update
    setTimeout(updateSystemInfo, 3000);
}

/* ============================================
   SPARKLE EFFECT LOGIC
   ============================================ */
function initSparkles() {
    const landing = document.getElementById('landingScreen');
    if (!landing) return;

    let mouseX = 0, mouseY = 0;

    // Track mouse
    document.addEventListener('mousemove', (e) => {
        mouseX = e.pageX;
        mouseY = e.pageY;
    });

    // Spawn sparkles
    setInterval(() => {
        // Only run if landing screen is visible
        if (landing.classList.contains('hidden-screen')) return;

        // Spawn 1-2 sparkles per tick
        createSparkle(mouseX, mouseY);
        if (Math.random() > 0.5) createSparkle(mouseX, mouseY);

    }, 50); // 20fps roughly
}

function createSparkle(x, y) {
    const el = document.createElement('div');
    el.className = 'sparkle';

    // Variants
    const rand = Math.random();
    if (rand > 0.5) el.classList.add('cyan');
    else if (rand > 0.8) el.classList.add('orb');

    // Random Offset
    const offset = 25; // spread
    const rx = (Math.random() - 0.5) * offset;
    const ry = (Math.random() - 0.5) * offset;

    el.style.left = (x + rx) + 'px';
    el.style.top = (y + ry) + 'px';

    document.body.appendChild(el);

    // Cleanup matches CSS animation time (0.8s)
    setTimeout(() => {
        el.remove();
    }, 800);
}

// Start Sparkles
document.addEventListener('DOMContentLoaded', initSparkles);

function updateDiagnostic(valId, barId, text, percent) {
    const valEl = document.getElementById(valId);
    const barEl = document.getElementById(barId);
    if (valEl) valEl.textContent = text;
    if (barEl) barEl.style.width = percent + '%';
}

/* ============================================
   SOUND FX (Iron Man Suit Up)
   ============================================ */
function playSuitUpSound() {
    // Check audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // 1. Power Up Sweep (Sawtooth) - The "Whirrr"
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(50, t);
    osc1.frequency.exponentialRampToValueAtTime(1000, t + 0.8);
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.8);

    // 2. High Pitch Charge (Sine) - The "Zzzzt"
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2000, t);
    osc2.frequency.linearRampToValueAtTime(8000, t + 1.0);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.1, t + 0.1);
    gain2.gain.linearRampToValueAtTime(0, t + 1.0);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 1.0);

    // 3. Mechanical Clanks (Square bursts) - The "Klank"
    [0.1, 0.3, 0.5].forEach(start => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t + start);
        osc.frequency.exponentialRampToValueAtTime(50, t + start + 0.1);
        g.gain.setValueAtTime(0.1, t + start);
        g.gain.exponentialRampToValueAtTime(0.01, t + start + 0.1);

        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t + start);
        osc.stop(t + start + 0.1);
    });
}

// Attach SFX to Login Button
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('loginBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            playSuitUpSound();
            // Also try to play file if user added it
            const audio = new Audio('startup.mp3');
            audio.play().catch(() => {
                // Ignore error if file doesn't exist
            });
        });
    }

    // Interactive Titles (Hacker Effect)
    const titles = document.querySelectorAll('.landing-title, .logo-text');
    titles.forEach(title => {
        title.dataset.original = title.innerText;
        title.addEventListener('mouseover', () => hackerEffect(title));
    });
});

function hackerEffect(element) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let iterations = 0;
    const originalText = element.dataset.original;

    clearInterval(element.interval);

    element.interval = setInterval(() => {
        element.innerText = originalText
            .split("")
            .map((letter, index) => {
                if (index < iterations) {
                    return originalText[index];
                }
                return letters[Math.floor(Math.random() * 26)];
            })
            .join("");

        if (iterations >= originalText.length) {
            clearInterval(element.interval);
        }

        iterations += 1 / 3;
    }, 30);
}

/* ============================================
   WEATHER MODULE (Open-Meteo)
   ============================================ */
function updateWeather() {
    if (!navigator.geolocation) {
        // console.log("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
            // Fetch Current Weather + Approx City Code
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.current) {
                const temp = Math.round(data.current.temperature_2m);
                const humidity = Math.round(data.current.relative_humidity_2m);
                const code = data.current.weather_code;
                const wind = Math.round(data.current.wind_speed_10m);

                // Update UI Sensors
                const tempEl = document.getElementById('tempValue');
                const humEl = document.getElementById('humidityValue');

                if (tempEl) tempEl.textContent = `${temp}°C`;
                if (humEl) humEl.textContent = `${humidity}%`;

                // Decode Conditions
                const condition = decodeWeatherCode(code);

                // Dynamic Response Injection (So "What's the weather?" returns real data)
                if (window.jarvisResponses) {
                    window.jarvisResponses.weather = [
                        `Sensors indicate it is ${temp} degrees Celsius with ${humidity} percent humidity. Conditions are ${condition}.`,
                        `Current report: ${condition}, ${temp} degrees. Wind speed ${wind} kilometers per hour.`,
                        `It's ${temp}°C outside, sir. Humidity is at ${humidity}%.`
                    ];
                }
            }
        } catch (e) {
            console.error("Weather fetch failed", e);
        }
    }, (err) => {
        console.warn("Geolocation denied/error", err);
    });

    // Update every 30 mins
    setTimeout(updateWeather, 1800000);
}

function decodeWeatherCode(code) {
    if (code === 0) return "Clear Sky";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 55) return "Drizzle";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 82) return "Heavy Rain";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
}

// Start Weather Service
document.addEventListener('DOMContentLoaded', updateWeather);
