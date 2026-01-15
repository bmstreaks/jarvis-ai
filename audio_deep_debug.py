import pyaudio
import sys
import time
import math
import struct

print("=================================================================")
print("   JARVIS AUDIO DEEP DIAGNOSTIC")
print("=================================================================")

p = pyaudio.PyAudio()

try:
    # 1. Check PortAudio
    print(f"\n[1] PortAudio API Status:")
    print(f"    Version: {pyaudio.get_portaudio_version_text()}")
    
    host_info = p.get_default_host_api_info()
    print(f"    Default Host API: {host_info.get('name')} (Index: {p.get_default_host_api_info()['index']})")

    # 2. Enumerate Input Devices
    print(f"\n[2] Input Device Enumeration:")
    info = p.get_host_api_info_by_index(0)
    numdevices = info.get('deviceCount')
    
    default_input_index = -1
    try:
        default_input = p.get_default_input_device_info()
        default_input_index = default_input['index']
        print(f"    👉 SYSTEM DEFAULT INPUT: [ID: {default_input_index}] {default_input['name']}")
    except IOError:
        print("    ⚠️ NO DEFAULT INPUT DEVICE FOUND!")

    print("\n    Available Input Devices:")
    found_devices = 0
    for i in range(0, numdevices):
        device = p.get_device_info_by_host_api_device_index(0, i)
        if device.get('maxInputChannels') > 0:
            found_devices += 1
            marker = "   "
            if i == default_input_index:
                marker = "-->"
            print(f"    {marker} [ID: {i}] {device.get('name')} (Channels: {device.get('maxInputChannels')})")

    if found_devices == 0:
        print("\n    ❌ CRITICAL: No input devices (microphones) detected via PortAudio!")
        sys.exit(1)

    # 3. Active Recording Test
    print(f"\n[3] Signal Processing Test (Default Device ID: {default_input_index})")
    print("    Attempting to read audio stream for 3 seconds...")
    print("    PLEASE MAKE NOISE (Clap, Speak, Tap Mic)...")
    
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 44100
    
    try:
        stream = p.open(format=FORMAT,
                        channels=CHANNELS,
                        rate=RATE,
                        input=True,
                        frames_per_buffer=CHUNK,
                        input_device_index=default_input_index)
        
        print("    🔴 RECORDING...", end="", flush=True)
        
        max_amplitude = 0
        total_frames = 0
        non_silent_frames = 0
        
        # Record for 3 seconds
        for i in range(0, int(RATE / CHUNK * 3)):
            data = stream.read(CHUNK, exception_on_overflow=False)
            # Calculate amplitude (RMS)
            shorts = struct.unpack("%dh"%(len(data)/2), data)
            sum_squares = 0.0
            for sample in shorts:
                n = sample * (1.0/32768.0)
                sum_squares += n*n
            rms = math.sqrt( sum_squares / len(shorts) )
            
            if rms > max_amplitude:
                max_amplitude = rms
                
            if rms > 0.01: # Silence threshold
                non_silent_frames += 1
            
            total_frames += 1
            
            if i % 10 == 0:
                print(".", end="", flush=True)

        print(" DONE")
        
        stream.stop_stream()
        stream.close()
        
        print(f"\n    📊 SIGNAL ANALYSIS:")
        print(f"    Max Amplitude: {max_amplitude:.4f} (Quiet < 0.01, Loud > 0.1)")
        print(f"    Frames with Audio: {non_silent_frames}/{total_frames}")
        
        if max_amplitude < 0.005:
            print("\n    ❌ RESULT: SILENCE DETECTED.")
            print("       The microphone is open, but no audio data is being received.")
            print("       Possibilities:")
            print("       1. Hardware switch/button mute is ON.")
            print("       2. Windows Privacy Settings > Microphone Access is OFF for Terminal/Python.")
            print("       3. 'Default Device' is virtual/silent (check ID above).")
        else:
            print("\n    ✅ RESULT: AUDIO SIGNAL DETECTED!")
            print("       PyAudio is correctly linked and receiving data.")

    except Exception as e:
        print(f"\n    ❌ ERROR OPENING STREAM: {e}")
        if "Invalid number of channels" in str(e):
             print("       Try changing default input format in Windows Sound Settings to 1 channel (Mono) or 2 channel (Stereo) 16-bit.")

except Exception as e:
    print(f"\n❌ FATAL ERROR: {e}")

finally:
    p.terminate()
    print("\n=================================================================")
