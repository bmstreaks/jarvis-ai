/* ============================================
   J.A.R.V.I.S. AI Interface - JavaScript (v3.0)
   Biometric Authorization + MediaPipe Vision HUD
   ============================================ */

// Firebase Integration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrn2yOzvYetQu5Y_s2UIUhazjHwGkXpdg",
    authDomain: "jarvis-adbd5.firebaseapp.com",
    projectId: "jarvis-adbd5",
    storageBucket: "jarvis-adbd5.firebasestorage.app",
    messagingSenderId: "705143970092",
    appId: "1:705143970092:web:4f015a346c6fc46a7ab489",
    measurementId: "G-GSPFJT5CEG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log("🔥 J.A.R.V.I.S. Intelligence Systems: ONLINE (v3.0)");

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

// Security & Vision Elements
const securityOverlay = document.getElementById('securityOverlay');
const faceVideo = document.getElementById('faceVideo');
const faceOverlay = document.getElementById('faceOverlay');
const securityStatus = document.getElementById('securityStatus');
const loginStatus = document.getElementById('loginStatus');
const faceCtx = faceOverlay.getContext('2d');

// Canvas contexts
const particlesCtx = particlesCanvas.getContext('2d');
const waveformCtx = waveformCanvas.getContext('2d');

// Speech Recognition - Global variables
let recognition = null;
let isListening = false;
let voiceSupported = false;
let wakeWordMode = true;
let commandMode = false;
let isSpeaking = false;

// Vision & Security Globals
let faceMesh = null;
let camera = null;
let isSubjectAuthorized = false;
let enrollmentMode = false;
let scanStartTime = 0;
let lastFaceDetectedTime = 0;

// Wake word settings
const WAKE_WORDS = ['jarvis', 'jarvis.', 'jarvis,', 'hey jarvis', 'ok jarvis', 'okay jarvis'];

// Speech Synthesis
const synth = window.speechSynthesis;
let jarvisVoice = null;
let fridayVoice = null;
let currentPersona = 'JARVIS'; // Toggle: JARVIS / FRIDAY
let voicesLoaded = false;

// Microphone Level Monitoring
let audioContext = null;
let micAnalyser = null;
let micStream = null;
let micLevelBar = document.getElementById('micLevelBar');
let micLevelText = document.getElementById('micLevelText');

// AI Configuration
const LOCAL_AI_URL = 'http://192.168.29.22:5000/v1/chat/completions';
const LOCAL_AI_MODEL = 'microsoft_fara-7b';

// Persona Data with full theme colors
const personaData = {
    JARVIS: {
        name: 'JARVIS',
        systemPrompt: 'You are J.A.R.V.I.S., the polite, British-accented assistant from Iron Man. Address the user as "sir". Keep it concise and sophisticated.',
        theme: {
            primaryCyan: '#00d4ff',
            primaryBlue: '#0077ff',
            accentCyan: '#00f7ff',
            glowCyan: 'rgba(0, 212, 255, 0.6)',
            panelBg: 'rgba(0, 20, 40, 0.7)',
            panelBorder: 'rgba(0, 212, 255, 0.3)',
            textPrimary: '#e0f7ff',
            textSecondary: '#7eb8c9'
        },
        responses: {
            greeting: ["Good day, sir. How may I assist you today?", "Welcome back. I've been expecting you."],
            wakeResponse: ["Yes, sir?", "At your service.", "I'm listening, sir."],
            unknown: ["I didn't quite catch that, sir.", "Apologies, sir. Could you repeat?"]
        }
    },
    FRIDAY: {
        name: 'FRIDAY',
        systemPrompt: 'You are F.R.I.D.A.Y., the soft-spoken, polite, and efficient British female assistant from Iron Man. Address the user as "sir". Keep it concise and sophisticated.',
        theme: {
            primaryCyan: '#ff00ff',
            primaryBlue: '#cc00cc',
            accentCyan: '#ff66ff',
            glowCyan: 'rgba(255, 0, 255, 0.6)',
            panelBg: 'rgba(40, 0, 40, 0.7)',
            panelBorder: 'rgba(255, 0, 255, 0.3)',
            textPrimary: '#ffe0ff',
            textSecondary: '#c97eb8'
        },
        responses: {
            greeting: ["Good evening, sir. Boss? How can I help?", "F.R.I.D.A.Y. online. What's the plan, sir?"],
            wakeResponse: ["Yes, Boss?", "Listening.", "Always here, sir."],
            unknown: ["Sorry sir, could you say that again?", "I missed that. Repeat?"]
        }
    }
};

let JARVIS_SYSTEM_PROMPT = personaData.JARVIS.systemPrompt;

// ============================================
// INITIALIZATION
// ============================================

function init() {
    console.log('🚀 JARVIS Initializing...');
    setupCanvas();
    setupEventListeners();
    startAnimations();
    updateSystemInfo();
    updateSystemTime();

    // Init speech & vision
    setTimeout(setupSpeechSynthesis, 500);
    setTimeout(setupWakeWordRecognition, 1000);
    setTimeout(setupMicLevelMonitor, 1500);
    setTimeout(setupVisionSystem, 2000);

    // Initial Security Status
    if (loginStatus) loginStatus.textContent = 'SECURE STANDBY';

    console.log('✅ JARVIS Initialization complete');
}

// ============================================
// VISION & BIOMETRIC GATE
// ============================================

// Biometric Database
let subjects = JSON.parse(localStorage.getItem('jarvis_subjects') || '[]');

async function setupVisionSystem() {
    console.log('👁️ Initializing Vision System (MediaPipe)...');

    faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onVisionResults);

    camera = new window.Camera(faceVideo, {
        onFrame: async () => {
            await faceMesh.send({ image: faceVideo });
        },
        width: 640,
        height: 480
    });

    console.log('✅ Vision System Ready');
}

function onVisionResults(results) {
    if (faceOverlay.width !== faceVideo.videoWidth) {
        faceOverlay.width = faceVideo.videoWidth;
        faceOverlay.height = faceVideo.videoHeight;
    }

    faceCtx.clearRect(0, 0, faceOverlay.width, faceOverlay.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        lastFaceDetectedTime = Date.now();
        const landmarks = results.multiFaceLandmarks[0];

        drawFaceMeshHUD(landmarks);

        // Enrollment Capture Trigger
        if (enrollmentMode === "capturing") {
            const signature = calculateFaceSignature(landmarks);
            subjects.push({ name: currentEnrollmentName, signature: signature });
            localStorage.setItem('jarvis_subjects', JSON.stringify(subjects));

            enrollmentMode = false;
            currentEnrollmentName = "";
            document.getElementById('enrollmentForm').style.display = 'none';

            speak(`Biometric profile for ${subjects[subjects.length - 1].name} successfully registered. Access granted.`, true);
            authorizeSubject(subjects[subjects.length - 1].name);
            return;
        }

        if (securityOverlay.classList.contains('active')) {
            processBiometricAuth(landmarks);
        }
    } else {
        if (securityOverlay.classList.contains('active')) {
            updateSecurityStatus('LOST SIGNAL', 'PLEASE POSITION FACE WITHIN RETICLE');
            const label = document.getElementById('subjectLabel');
            if (label) label.textContent = 'NO SIGNAL';
        }
    }
}

function drawFaceMeshHUD(landmarks) {
    faceCtx.save();
    faceCtx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    faceCtx.lineWidth = 1;

    const connectors = window.FACEMESH_TESSELATION;
    if (window.drawConnectors && connectors) {
        window.drawConnectors(faceCtx, landmarks, connectors, { color: '#00d4ff33', lineWidth: 1 });
    }

    const contours = window.FACEMESH_CONTOURS;
    if (window.drawConnectors && contours) {
        window.drawConnectors(faceCtx, landmarks, contours, { color: '#00d4ff', lineWidth: 2 });
    }

    faceCtx.restore();
}

/**
 * Generates a scale-invariant biometric signature based on facial ratios
 */
function calculateFaceSignature(landmarks) {
    // We use ratios of distances between key landmarks
    // e.g. Eye distance / Face width, Nose length / Face height
    const getDist = (a, b) => Math.sqrt(Math.pow(landmarks[a].x - landmarks[b].x, 2) + Math.pow(landmarks[a].y - landmarks[b].y, 2));

    const faceWidth = getDist(234, 454); // Cheek to cheek
    const faceHeight = getDist(10, 152); // Forehead to chin
    const eyeDist = getDist(33, 263);    // Outer eye corners
    const noseLength = getDist(1, 2);    // Nose bridge
    const mouthWidth = getDist(61, 291); // Lip corners

    return [
        eyeDist / faceWidth,
        noseLength / faceHeight,
        mouthWidth / faceWidth,
        eyeDist / faceHeight
    ];
}

function processBiometricAuth(landmarks) {
    if (isSubjectAuthorized || enrollmentMode) return;

    const currentSignature = calculateFaceSignature(landmarks);
    const label = document.getElementById('subjectLabel');

    // 1. Identify Subject
    let bestMatch = null;
    let minDistance = 0.05; // Tight threshold for recognition

    subjects.forEach(subject => {
        const distance = Math.sqrt(
            subject.signature.reduce((acc, val, i) => acc + Math.pow(val - currentSignature[i], 2), 0)
        );

        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = subject;
        }
    });

    if (bestMatch) {
        if (label) label.textContent = bestMatch.name.toUpperCase();
        authorizeSubject(bestMatch.name);
    } else {
        if (label) label.textContent = 'UNKNOWN';
        const elapsed = Date.now() - scanStartTime;

        if (elapsed < 4000) {
            updateSecurityStatus('IDENTIFYING...', 'SCANNING NEURAL MESH - ' + Math.floor((elapsed / 4000) * 100) + '%');
        } else {
            initiateEnrollment();
        }
    }
}

function authorizeSubject(name) {
    isSubjectAuthorized = true;
    securityOverlay.classList.remove('unauthorized');
    securityOverlay.classList.add('authorized');
    updateSecurityStatus('AUTHORIZED', `WELCOME HOME, ${name.toUpperCase()}`);

    speak(`Biometric match confirmed. Welcome back, ${name}.`, false);

    setTimeout(() => {
        completeSystemInitialization();
    }, 2000);
}

function initiateEnrollment() {
    if (enrollmentMode) return;
    enrollmentMode = true;

    securityOverlay.classList.add('unauthorized');
    updateSecurityStatus('UNKNOWN SUBJECT', 'ACCESS DENIED - REGISTRATION REQUIRED');

    document.getElementById('enrollmentForm').style.display = 'block';
    speak("Identity not found in database. Please register your profile to proceed.", true);
}

// Enrollment Capture
function registerNewSubject() {
    const nameInput = document.getElementById('userNameInput');
    const name = nameInput.value.trim();

    if (!name) {
        speak("Please enter a valid identification name, sir.", false);
        return;
    }

    // Get current frame landmarks
    // We already have a logic to send images to faceMesh. 
    // We'll use the last detected landmarks which are available globally or we can trigger a manual scan.
    // For this implementation, we assume the user is still in front of the camera.

    // We need to capture the current signature from the last valid frame
    // Since we don't store landmarks globally, we'll do it on the next frame result.

    enrollmentMode = "capturing"; // Special state to trigger save on next frame
    currentEnrollmentName = name;
}

let currentEnrollmentName = "";

// Helper for enrollment in onVisionResults (needs update to the results handler)

function updateSecurityStatus(tag, detail) {
    const tagEl = securityStatus.querySelector('.status-tag');
    const detailEl = securityStatus.querySelector('.status-detail');
    if (tagEl) tagEl.textContent = tag;
    if (detailEl) detailEl.textContent = detail;
}

function completeSystemInitialization() {
    securityOverlay.classList.remove('active');
    const landingScreen = document.getElementById('landingScreen');
    const mainInterface = document.getElementById('mainInterface');

    landingScreen.classList.add('hidden-screen');

    setTimeout(() => {
        mainInterface.style.display = 'flex';
        void mainInterface.offsetWidth;
        mainInterface.style.opacity = '1';
        speak("System protocols initialized. All modules are green.", true);
    }, 800);
}

// ============================================
// VOICE ENGINE (FIXED)
// ============================================

function setupWakeWordRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        voiceStatus.textContent = wakeWordMode ? 'STANDBY' : 'LISTENING...';
    };

    recognition.onend = () => {
        isListening = false;
        // Robust auto-restart logic
        if (!isSpeaking && voiceSupported) {
            setTimeout(startRecognition, 500);
        }
    };

    recognition.onresult = (event) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript = event.results[i][0].transcript.toLowerCase().trim();
            isFinal = event.results[i].isFinal;
        }

        if (wakeWordMode && !commandMode) {
            if (WAKE_WORDS.some(w => transcript.includes(w))) {
                console.log('✅ Wake word detected');
                activateCommandMode();
            }
        } else if (commandMode && isFinal) {
            processCommand(transcript);
        }
    };

    voiceSupported = true;
    startRecognition();
}

function startRecognition() {
    if (!recognition || isSpeaking || isListening) return;
    try {
        recognition.start();
        console.log(`🎤 Recognition started. Mode: ${wakeWordMode ? 'Wake' : 'Command'}`);
    } catch (e) { }
}

function activateCommandMode() {
    // CRITICAL FIX: Update state before stopping/starting
    wakeWordMode = false;
    commandMode = true;

    voiceStatus.textContent = 'YES, SIR?';
    micBtn.classList.add('listening');

    // Stop wake word listener to transition
    try { recognition.stop(); } catch (e) { }

    speak("Yes, sir?", false);

    // Timeout back to wake word if no command
    setTimeout(() => {
        if (commandMode) {
            resetToWakeWord();
        }
    }, 8000);
}

function resetToWakeWord() {
    commandMode = false;
    wakeWordMode = true;
    voiceStatus.textContent = 'STANDBY';
    micBtn.classList.remove('listening');
    try { recognition.stop(); } catch (e) { }
}

// ============================================
// HELPERS (CANVAS, LOGS, STATS)
// ============================================

function speak(text, addToLog = true) {
    if (!synth) return;
    isSpeaking = true;

    // Stop recognition while speaking
    try { recognition.stop(); } catch (e) { }

    const utterance = new SpeechSynthesisUtterance(text);

    // Select voice based on persona
    if (currentPersona === 'FRIDAY' && fridayVoice) {
        utterance.voice = fridayVoice;
    } else if (jarvisVoice) {
        utterance.voice = jarvisVoice;
    }

    utterance.rate = 0.95;

    utterance.onstart = () => {
        voiceIndicator.classList.add('speaking');
        voiceStatus.textContent = 'SPEAKING';
    };

    utterance.onend = () => {
        voiceIndicator.classList.remove('speaking');
        isSpeaking = false;

        // Resume in correct mode
        startRecognition();
    };

    synth.cancel();
    synth.speak(utterance);

    if (addToLog) addToChatLog(currentPersona, text);
    responseText.textContent = text;
}

async function processCommand(input) {
    if (!input) return;
    resetToWakeWord();

    addToChatLog('USER', input);
    voiceStatus.textContent = 'PROCESSING...';

    // Simplified command router
    if (input.includes('time')) {
        speak(`The time is ${new Date().toLocaleTimeString()}.`);
    } else if (input.includes('status')) {
        speak("All systems are operational, sir.");
    } else {
        // Fallback to offline matching or AI
        const response = await callLocalAI(input);
        speak(response);
    }
}

async function callLocalAI(userMessage) {
    try {
        const response = await fetch(LOCAL_AI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: LOCAL_AI_MODEL,
                messages: [{ role: "system", content: JARVIS_SYSTEM_PROMPT }, { role: "user", content: userMessage }]
            })
        });
        const data = await response.json();
        let content = data.choices[0].message.content;

        // --- CLEANUP AI ARTIFACTS ---
        // 1. Remove <tool_call> blocks
        content = content.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '');
        // 2. Remove markdown code blocks (often used for JSON)
        content = content.replace(/```[\s\S]*?```/g, '');
        // 3. Remove raw JSON-like structures that might be missed
        content = content.replace(/\{[\s\S]*?"action"[\s\S]*?\}/g, '');
        // 4. Final trim
        content = content.trim();

        if (!content) return "I'm sorry sir, the internal logic processor failed to provide a valid response.";
        return content;
    } catch (e) {
        return "Local intelligence server is currently unreachable, sir.";
    }
}

// Placeholder for missing helper functions from script-v2
function setupCanvas() { resizeCanvas(); window.addEventListener('resize', resizeCanvas); }
function resizeCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
    waveformCanvas.width = 60; waveformCanvas.height = 60;
}
function startAnimations() { animateParticles(); animateWaveform(); }
function animateParticles() {
    particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    requestAnimationFrame(animateParticles);
}
function animateWaveform() {
    waveformCtx.clearRect(0, 0, 60, 60);
    requestAnimationFrame(animateWaveform);
}
function addToChatLog(sender, content) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${sender.toLowerCase()}`;
    msg.innerHTML = `<span class="msg-sender">${sender}</span><span class="msg-content">${content}</span>`;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
}
function updateSystemTime() {
    systemTime.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    setTimeout(updateSystemTime, 1000);
}
async function updateSystemInfo() {
    const cpu = Math.floor(Math.random() * 10) + 5;
    cpuUsage.textContent = `${cpu}%`;
    setTimeout(updateSystemInfo, 3000);
}

function setupSpeechSynthesis() {
    const voices = synth.getVoices();
    if (voices.length === 0) {
        // Retry if voices aren't loaded yet (some browsers)
        setTimeout(setupSpeechSynthesis, 100);
        return;
    }

    // Improved voice selection
    jarvisVoice = voices.find(v => v.name.includes('Google UK English Male')) ||
        voices.find(v => v.name.includes('Male') && v.lang.includes('en-GB')) ||
        voices[0];

    fridayVoice = voices.find(v => v.name.includes('Google UK English Female')) ||
        voices.find(v => v.name.includes('Female') && v.lang.includes('en-GB')) ||
        voices.find(v => v.name.includes('Hazel')) ||
        voices[0];

    voicesLoaded = true;
    console.log('🎙️ Voices Initialized:', { jarvis: jarvisVoice?.name, friday: fridayVoice?.name });
}

async function setupMicLevelMonitor() {
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(micStream);
        micAnalyser = audioContext.createAnalyser();
        source.connect(micAnalyser);
        monitorMicLevel();
    } catch (e) { }
}

function monitorMicLevel() {
    const data = new Uint8Array(micAnalyser.frequencyBinCount);
    function update() {
        micAnalyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b) / data.length;
        micLevelBar.style.width = `${Math.min(100, (avg / 128) * 100)}%`;
        requestAnimationFrame(update);
    }
    update();
}

function setupEventListeners() {
    micBtn.addEventListener('click', () => {
        if (commandMode) resetToWakeWord();
        else activateCommandMode();
    });

    document.getElementById('loginBtn').addEventListener('click', () => {
        securityOverlay.classList.add('active');
        scanStartTime = Date.now();
        camera.start();
    });

    // Enrollment Form
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', registerNewSubject);
    }

    // Persona Toggle is handled via onclick="window.togglePersona()" in HTML
}

function togglePersona() {
    currentPersona = (currentPersona === 'JARVIS') ? 'FRIDAY' : 'JARVIS';
    const data = personaData[currentPersona];
    const theme = data.theme;

    // Update UI Button
    const btn = document.getElementById('personaToggle');
    const icon = btn.querySelector('.persona-icon');

    // Swap SVG - Arc reactor with different glow colors
    if (currentPersona === 'FRIDAY') {
        icon.innerHTML = `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>`;
        btn.classList.add('friday');
    } else {
        icon.innerHTML = `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>`;
        btn.classList.remove('friday');
    }

    btn.querySelector('.persona-name').textContent = data.name;

    // Update Internal Logic
    JARVIS_SYSTEM_PROMPT = data.systemPrompt;

    // Apply FULL Theme Color Transformation
    const root = document.documentElement;
    root.style.setProperty('--primary-cyan', theme.primaryCyan);
    root.style.setProperty('--primary-blue', theme.primaryBlue);
    root.style.setProperty('--accent-cyan', theme.accentCyan);
    root.style.setProperty('--glow-cyan', theme.glowCyan);
    root.style.setProperty('--panel-bg', theme.panelBg);
    root.style.setProperty('--panel-border', theme.panelBorder);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-secondary', theme.textSecondary);

    speak(`Persona switched to ${data.name}. Systems re-routing.`, false);
}

// Start
document.addEventListener('DOMContentLoaded', init);

// Expose to global scope for onclick handlers (ES Modules don't expose by default)
window.togglePersona = togglePersona;
