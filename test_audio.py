import pyaudio
import sys

print("------------------------------------------------------------------")
print("   PYAUDIO DIAGNOSTIC TOOL")
print("------------------------------------------------------------------")

try:
    p = pyaudio.PyAudio()
    print(f"✅ PyAudio version: {pyaudio.get_portaudio_version_text()}")
    print(f"✅ PyAudio instance created successfully.")
    
    info = p.get_host_api_info_by_index(0)
    numdevices = info.get('deviceCount')
    
    print(f"\n🎧 Found {numdevices} audio devices:")
    
    input_devices = []
    for i in range(0, numdevices):
        device = p.get_device_info_by_host_api_device_index(0, i)
        if device.get('maxInputChannels') > 0:
            print(f"   [ID: {i}] Input Device: {device.get('name')}")
            input_devices.append(i)
        else:
             print(f"   [ID: {i}] Output Device: {device.get('name')}")

    if not input_devices:
        print("\n❌ NO INPUT DEVICES FOUND!")
        sys.exit(1)
        
    print(f"\n🎤 Testing Default Input Device (ID: {p.get_default_input_device_info()['index']})...")
    
    try:
        stream = p.open(format=pyaudio.paInt16,
                        channels=1,
                        rate=44100,
                        input=True,
                        frames_per_buffer=1024)
        print("✅ Successfully opened audio input stream!")
        stream.stop_stream()
        stream.close()
        print("✅ Microphone check PASSED.")
    except Exception as e:
        print(f"❌ Failed to open audio stream: {e}")

    p.terminate()

except ImportError:
    print("❌ ERROR: PyAudio is not installed or not found.")
except Exception as e:
    print(f"❌ ERROR: {e}")

print("------------------------------------------------------------------")
