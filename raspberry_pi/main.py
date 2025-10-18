#!/usr/bin/env python3
"""
Batch Plant Controller - Main Entry Point
PC Controller for Batch Plant HMI using Autonics ARM/ARX modules

Features:
- Reads 4 RS232 weight indicators (PCI Express Serial Card)
- Controls 24 relay outputs via Modbus RTU (ARM-DO08P-4S + 2x ARX-DO08P-4S)
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
from modbus_controller import ModbusController
from websocket_server import WebSocketServer
from utils.logger import setup_logger

class BatchPlantController:
    def __init__(self, config_file='config_autonics.json'):
        print("=" * 60)
        print("  BATCH PLANT CONTROLLER - Autonics System")
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
        self.modbus_controller = ModbusController(self.config)
        self.websocket_server = WebSocketServer(
            self.config,
            self.scale_reader,
            self.modbus_controller
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
        self.scale_reader.stop()
        
        # Turn off all relays
        print("🔌 Turning off all relays...")
        self.modbus_controller.set_all_off()
        
        # Cleanup Modbus
        self.modbus_controller.cleanup()
        
        print("✅ Shutdown complete\\n")

def main():
    """Main entry point"""
    
    print("✅ Starting Batch Plant Controller (Autonics System)")
    
    # Create and start controller
    controller = BatchPlantController()
    controller.start()

if __name__ == "__main__":
    main()
