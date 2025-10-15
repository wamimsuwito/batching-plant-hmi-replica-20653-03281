#!/usr/bin/env python3
"""
Batch Plant Controller - Main Entry Point
Raspberry Pi 5 Controller for Batch Plant HMI

Features:
- Reads 4 RS232 weight indicators
- Controls 16-channel relay module via GPIO
- WebSocket server for web app communication
- Safety monitoring and watchdog timer
"""

import json
import time
import signal
import sys
import os

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from scale_reader import ScaleReader
from gpio_controller import GPIOController
from websocket_server import WebSocketServer
from utils.safety import SafetyMonitor
from utils.logger import setup_logger

class BatchPlantController:
    def __init__(self, config_file='config.json'):
        print("=" * 60)
        print("  BATCH PLANT CONTROLLER - Raspberry Pi 5")
        print("=" * 60)
        
        # Load configuration
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        print(f"✅ Configuration loaded from {config_file}")
        
        # Setup logger
        self.logger = setup_logger('BatchPlant', 'batch_plant.log')
        
        # Initialize modules
        print("\\nInitializing modules...")
        
        self.scale_reader = ScaleReader(self.config)
        self.gpio_controller = GPIOController(self.config)
        self.safety_monitor = SafetyMonitor(self.config, self.gpio_controller)
        self.websocket_server = WebSocketServer(
            self.config,
            self.scale_reader,
            self.gpio_controller
        )
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        print("✅ All modules initialized")
        
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print("\\n\\n🛑 Shutdown signal received")
        self.shutdown()
        sys.exit(0)
    
    def start(self):
        """Start all modules"""
        print("\\nStarting Batch Plant Controller...\\n")
        
        try:
            # Start scale reader
            self.scale_reader.start()
            time.sleep(1)  # Give scales time to initialize
            
            # Start safety monitor
            self.safety_monitor.start()
            
            # Start WebSocket server (blocking)
            print("\\n" + "=" * 60)
            print("  SYSTEM READY")
            print("=" * 60)
            print(f"  Web App URL: ws://{self.config['websocket_host']}:{self.config['websocket_port']}")
            print("  Press Ctrl+C to stop")
            print("=" * 60 + "\\n")
            
            self.websocket_server.start()
            
        except Exception as e:
            print(f"❌ Error starting controller: {e}")
            self.shutdown()
            raise
    
    def shutdown(self):
        """Gracefully shutdown all modules"""
        print("\\nShutting down Batch Plant Controller...")
        
        # Stop all modules
        self.websocket_server.running = False
        self.safety_monitor.stop()
        self.scale_reader.stop()
        
        # Turn off all relays
        print("🔌 Turning off all relays...")
        self.gpio_controller.set_all_off()
        
        # Cleanup GPIO
        self.gpio_controller.cleanup()
        
        print("✅ Shutdown complete\\n")

def main():
    """Main entry point"""
    
    # Check if running on Raspberry Pi
    try:
        with open('/proc/device-tree/model', 'r') as f:
            model = f.read()
            if 'Raspberry Pi' not in model:
                print("⚠️  Warning: Not running on Raspberry Pi")
    except:
        print("⚠️  Warning: Could not detect Raspberry Pi")
    
    # Create and start controller
    controller = BatchPlantController()
    controller.start()

if __name__ == "__main__":
    main()
