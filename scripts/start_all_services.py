"""
Launcher script for all 5 SANGAM distributed backend services.
Runs:
- Central Global Coordinator: Port 8000
- Mumbai Local Server: Port 8001
- Bengaluru Local Server: Port 8002
- Kolkata Local Server: Port 8003
- Chennai Local Server: Port 8004
"""
import subprocess
import sys
import time
import os

SERVICES = [
    {"name": "Global Coordinator", "cmd": [sys.executable, "-m", "uvicorn", "global_server.main:app", "--port", "8000", "--host", "127.0.0.1"]},
    {"name": "Mumbai Node", "cmd": [sys.executable, "-m", "uvicorn", "city_servers.mumbai.main:app", "--port", "8001", "--host", "127.0.0.1"]},
    {"name": "Bengaluru Node", "cmd": [sys.executable, "-m", "uvicorn", "city_servers.bengaluru.main:app", "--port", "8002", "--host", "127.0.0.1"]},
    {"name": "Kolkata Node", "cmd": [sys.executable, "-m", "uvicorn", "city_servers.kolkata.main:app", "--port", "8003", "--host", "127.0.0.1"]},
    {"name": "Chennai Node", "cmd": [sys.executable, "-m", "uvicorn", "city_servers.chennai.main:app", "--port", "8004", "--host", "127.0.0.1"]},
]

def main():
    print("=" * 65)
    print("   SANGAM Distributed Multi-City Backend Service Mesh Launcher   ")
    print("=" * 65)
    
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
    processes = []

    try:
        for s in SERVICES:
            print(f"[+] Launching {s['name']}...")
            p = subprocess.Popen(s["cmd"], cwd=backend_dir)
            processes.append((s["name"], p))
            time.sleep(0.5)

        print("\n[SUCCESS] All 5 backend nodes running:")
        print("  - Global Server:    http://127.0.0.1:8000/docs")
        print("  - Mumbai Server:    http://127.0.0.1:8001/docs")
        print("  - Bengaluru Server: http://127.0.0.1:8002/docs")
        print("  - Kolkata Server:   http://127.0.0.1:8003/docs")
        print("  - Chennai Server:   http://127.0.0.1:8004/docs")
        print("\nPress Ctrl+C to terminate all services.")
        
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[-] Shutting down all distributed nodes...")
        for name, p in processes:
            p.terminate()
            p.wait()
        print("[+] All services halted.")

if __name__ == "__main__":
    main()
