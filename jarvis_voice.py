import speech_recognition as sr
import requests
import pyttsx3
import json
import time

# Configuration
LOCAL_AI_URL = "http://192.168.29.22:5000/v1/chat/completions"
MODEL_NAME = "microsoft_fara-7b"
WAKE_WORD = "jarvis"

# Initialize Text-to-Speech
engine = pyttsx3.init()
engine.setProperty('rate', 170)
engine.setProperty('volume', 1.0)

# Set voice (try to find a good English voice)
voices = engine.getProperty('voices')
for voice in voices:
    if "david" in voice.name.lower() or "zira" in voice.name.lower():
        engine.setProperty('voice', voice.id)
        break

def speak(text):
    print(f"JARVIS: {text}")
    engine.say(text)
    engine.runAndWait()

def query_local_ai(prompt):
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "You are JARVIS, a helpful AI assistant. Keep answers brief and polite."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }
    
    try:
        response = requests.post(LOCAL_AI_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        content = data['choices'][0]['message']['content']
        
        # Clean up artifacts
        import re
        content = re.sub(r'<tool_call>.*?</tool_call>', '', content, flags=re.DOTALL)
        content = re.sub(r'<tool_call>.*', '', content) # Catch unclosed ones at end
        content = content.replace('<tool_call>', '')
        content = content.strip()
        
        return content
    except Exception as e:
        print(f"Error querying AI: {e}")
        return "I apologize, sir. I cannot reach the neural network."

def listen():
    r = sr.Recognizer()
    mic = sr.Microphone()
    
    # Dynamic settings
    r.dynamic_energy_threshold = False # Disable dynamic adjustment to prevent it from getting "deaf"
    r.energy_threshold = 400  # Fixed sensitive threshold (lower = more sensitive)
    r.pause_threshold = 0.8   # Shorter pause to detect end of speech faster
    
    with mic as source:
        print("\n" + "="*40)
        print("   CALIBRATING BACKGROUND NOISE...   ")
        print("   (Please remain silent for 1s)     ")
        print("="*40)
        r.adjust_for_ambient_noise(source, duration=1)
        print(f"✅ Calibrated! Threshold: {r.energy_threshold}")
        print("💡 REQUIRED ACTION: Speak clearly into the mic")
        
        speak("Online.")
        
        while True:
            print("\nListening...", end="\r") 
            try:
                # Listen with a timeout to prevent hanging forever
                audio = r.listen(source, timeout=None, phrase_time_limit=10)
                
                print("Processing...   ", end="\r")
                text = r.recognize_google(audio).lower()
                print(f"🎤 Heard: '{text}'" + " "*20)
                
                # Wake Word Detection
                detected_wake_word = None
                
                # Check for various wake words
                aliases = ["hey jarvis", "hi jarvis", "ok jarvis", "jarvis", "javis", "travis", "harvest", "service"]
                
                for alias in aliases:
                    if alias in text:
                        detected_wake_word = alias
                        break
                
                if detected_wake_word:
                    # Extract command by removing the wake word part
                    # We split by the detected alias to get what comes after
                    parts = text.split(detected_wake_word, 1)
                    command = parts[1].strip() if len(parts) > 1 else ""
                    
                    if not command:
                        # speak("Yes?") # REMOVED: Potentially blocking microphone access
                        print("\n🟢 JARVIS: Yes? (Listening...)")
                        engine.say("Yes?") # Non-blocking queue
                        engine.runAndWait() 
                        
                        # Listen for command
                        print(f"   [Debug] Threshold: {r.energy_threshold}")
                        try:
                            # Listen again
                            audio = r.listen(source, timeout=5, phrase_time_limit=10)
                            command_text = r.recognize_google(audio).lower()
                            print(f"🎤 Heard Command: '{command_text}'")
                            command = command_text 
                        except sr.WaitTimeoutError:
                            print("❌ Timeout waiting for command")
                            command = ""
                        except Exception as e:
                            print(f"❌ Error hearing command: {e}")
                            command = ""
                    
                    if command:
                        print(f"🤖 Sending to AI: {command}")
                        speak("Checking systems, sir...")
                        response = query_local_ai(command)
                        speak(response)
                        
            except sr.WaitTimeoutError:
                pass # Just loop
            except sr.UnknownValueError:
                pass # Just loop (noise)
            except sr.RequestError as e:
                print(f"Could not request results; {e}")
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(1) # Prevent rapid error looping

if __name__ == "__main__":
    print("---------------------------------------")
    print("   JARVIS PYTHON CLIENT (LOCAL AI)    ")
    print("---------------------------------------")
    speak("System online. Calibrating sensors.")
    listen()
