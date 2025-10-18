#!/usr/bin/env python3
"""
RS232 Scale Reader Module
Reads weight data from 4 RS232 indicators in parallel
"""

import serial
import threading
import time
import re
import json
from typing import Dict, Optional

class ScaleReader:
    def __init__(self, config: dict):
        self.config = config
        self.serial_ports = config['serial_ports']
        self.serial_config = config['serial_config']
        self.weights = {
            'pasir': 0.0,
            'batu': 0.0,
            'semen': 0.0,
            'air': 0.0
        }
        self.lock = threading.Lock()
        self.running = False
        self.threads = []
        self.serial_connections = {}
        
    def parse_weight(self, data: str) -> Optional[float]:
        """
        Parse weight from indicator data
        Common formats:
        - "WT:  125.5 kg\\r\\n"
        - "GROSS:340.2KG\\r\\n"
        - "+089.7\\r\\n"
        - "  125.5  \\r\\n"
        """
        try:
            # Remove common prefixes and units
            cleaned = data.upper()
            cleaned = cleaned.replace('WT:', '')
            cleaned = cleaned.replace('GROSS:', '')
            cleaned = cleaned.replace('NET:', '')
            cleaned = cleaned.replace('KG', '')
            cleaned = cleaned.replace('\\r', '')
            cleaned = cleaned.replace('\\n', '')
            cleaned = cleaned.strip()
            
            # Extract floating point number (including negative)
            match = re.search(r'[+-]?\\d+\\.?\\d*', cleaned)
            if match:
                weight = float(match.group())
                # Sanity check
                if -10000 <= weight <= 10000:
                    return weight
            return None
        except Exception as e:
            print(f"Error parsing weight from '{data}': {e}")
            return None
    
    def read_scale(self, scale_name: str, port: str):
        """Read from a single scale continuously"""
        print(f"Starting reader for {scale_name} on {port}")
        
        try:
            # Open serial connection
            ser = serial.Serial(
                port=port,
                baudrate=self.serial_config['baudrate'],
                bytesize=self.serial_config['bytesize'],
                parity=self.serial_config['parity'],
                stopbits=self.serial_config['stopbits'],
                timeout=self.serial_config['timeout']
            )
            
            self.serial_connections[scale_name] = ser
            print(f"✅ Connected to {scale_name} indicator at {port}")
            
            buffer = ""
            
            while self.running:
                try:
                    # Read data from serial port
                    if ser.in_waiting > 0:
                        data = ser.read(ser.in_waiting).decode('ascii', errors='ignore')
                        buffer += data
                        
                        # Process complete lines
                        while '\\n' in buffer:
                            line, buffer = buffer.split('\\n', 1)
                            weight = self.parse_weight(line)
                            
                            if weight is not None:
                                with self.lock:
                                    self.weights[scale_name] = weight
                                    
                    time.sleep(0.01)  # 10ms sleep
                    
                except serial.SerialException as e:
                    print(f"Serial error on {scale_name}: {e}")
                    time.sleep(1)
                    
        except Exception as e:
            print(f"❌ Failed to connect to {scale_name} at {port}: {e}")
            print(f"   Make sure the device is connected and you have permission")
            
        finally:
            if scale_name in self.serial_connections:
                self.serial_connections[scale_name].close()
                del self.serial_connections[scale_name]
    
    def start(self):
        """Start reading from all scales"""
        self.running = True
        
        # Start a thread for each scale
        for scale_name, port in self.serial_ports.items():
            thread = threading.Thread(
                target=self.read_scale,
                args=(scale_name, port),
                daemon=True
            )
            thread.start()
            self.threads.append(thread)
            
        print(f"✅ Scale reader started with {len(self.threads)} threads")
    
    def stop(self):
        """Stop all reading threads"""
        print("Stopping scale reader...")
        self.running = False
        
        # Close all serial connections
        for ser in self.serial_connections.values():
            try:
                ser.close()
            except:
                pass
        
        # Wait for threads to finish
        for thread in self.threads:
            thread.join(timeout=2)
            
        print("✅ Scale reader stopped")
    
    def get_weights(self) -> Dict[str, float]:
        """Get current weights (thread-safe)"""
        with self.lock:
            return self.weights.copy()

# Test standalone
if __name__ == "__main__":
    # Try both old and new config files
    try:
        with open('config_autonics.json', 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        with open('config.json', 'r') as f:
            config = json.load(f)
    
    reader = ScaleReader(config)
    reader.start()
    
    try:
        print("\\nReading weights... (Press Ctrl+C to stop)\\n")
        while True:
            weights = reader.get_weights()
            print(f"\\rPasir: {weights['pasir']:7.1f} kg | "
                  f"Batu: {weights['batu']:7.1f} kg | "
                  f"Semen: {weights['semen']:7.1f} kg | "
                  f"Air: {weights['air']:7.1f} kg", end='')
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\\n\\nStopping...")
    finally:
        reader.stop()
