#!/usr/bin/env python3
# /// script
# dependencies = [
#   "pandas",
# ]
# ///

import subprocess
import sys
import os
from pathlib import Path
import webbrowser
import time

def main():
    # First, generate the config from CSVs
    print("Generating config from CSV files...")
    subprocess.run([sys.executable, "generate_config.py"], check=True)
    print("Config generated successfully!")

    # Start a simple HTTP server to serve the visualizer
    visualizer_path = Path("visualizer")

    if not visualizer_path.exists():
        print("Error: visualizer directory not found!")
        sys.exit(1)

    # Change to visualizer directory
    os.chdir(visualizer_path)

    print("\n" + "="*50)
    print("Starting local web server...")
    print("Access the visualizer at: http://localhost:8000")
    print("Press Ctrl+C to stop the server")
    print("="*50 + "\n")

    # Open browser after a short delay
    time.sleep(1)
    webbrowser.open("http://localhost:8000")

    # Start the server
    try:
        subprocess.run([sys.executable, "-m", "http.server", "8000"])
    except KeyboardInterrupt:
        print("\n\nServer stopped.")

if __name__ == "__main__":
    main()