#!/usr/bin/env python3
"""
Modbus Controller Module
Controls 24 relay outputs via Autonics ARM-DO08P-4S + 2x ARX-DO08P-4S
Using Modbus RTU protocol over RS-485
"""

from pymodbus.client import ModbusSerialClient
from pymodbus.exceptions import ModbusException
import time
from typing import Dict, Optional

class ModbusController:
    def __init__(self, config: dict):
        self.config = config
        self.modbus_config = config['modbus']
        self.relay_mapping = config['relay_mapping']
        self.relay_states = {}
        
        # Initialize Modbus RTU client
        self.client = ModbusSerialClient(
            port=self.modbus_config['port'],
            baudrate=self.modbus_config['baudrate'],
            bytesize=self.modbus_config['bytesize'],
            parity=self.modbus_config['parity'],
            stopbits=self.modbus_config['stopbits'],
            timeout=self.modbus_config['timeout']
        )
        
        # Connect to ARM module
        if not self.client.connect():
            print(f"⚠️  Warning: Could not connect to Modbus on {self.modbus_config['port']}")
        else:
            print(f"✅ Modbus RTU connected on {self.modbus_config['port']} @ {self.modbus_config['baudrate']} baud")
        
        # Initialize all relay states
        for relay_name in self.relay_mapping.keys():
            self.relay_states[relay_name] = False
        
        # Turn all relays OFF on startup
        self.set_all_off()
        
        print(f"✅ Modbus Controller initialized with {len(self.relay_mapping)} relays")
    
    def set_relay(self, relay_name: str, state: bool) -> bool:
        """
        Set relay state via Modbus
        Args:
            relay_name: Name from config (e.g., 'mixer', 'konveyor_atas')
            state: True = ON, False = OFF
        Returns:
            True if successful, False if relay not found or communication error
        """
        if relay_name not in self.relay_mapping:
            print(f"⚠️  Unknown relay: {relay_name}")
            return False
        
        coil_address = self.relay_mapping[relay_name]
        return self.set_relay_by_coil(coil_address, state, relay_name)
    
    def set_relay_by_coil(self, coil_address: int, state: bool, relay_name: str = None) -> bool:
        """
        Set relay by coil address directly
        Args:
            coil_address: Modbus coil address (0-23)
            state: True = ON, False = OFF
            relay_name: Optional name for logging
        Returns:
            True if successful
        """
        if not self.client.is_socket_open():
            print(f"⚠️  Modbus connection closed, attempting reconnect...")
            if not self.client.connect():
                print(f"❌ Modbus reconnection failed")
                return False
        
        try:
            # Write single coil (Function Code 05)
            slave_id = self.modbus_config['arm_slave_id']
            result = self.client.write_coil(coil_address, state, slave=slave_id)
            
            if result.isError():
                print(f"❌ Modbus error writing coil {coil_address}: {result}")
                return False
            
            # Update state tracking
            if relay_name:
                self.relay_states[relay_name] = state
            
            status = "ON" if state else "OFF"
            name_str = f"{relay_name} " if relay_name else ""
            print(f"🔌 Relay {name_str}(Coil {coil_address}) → {status}")
            
            return True
            
        except ModbusException as e:
            print(f"❌ Modbus exception: {e}")
            return False
        except Exception as e:
            print(f"❌ Error setting relay: {e}")
            return False
    
    def set_relay_by_pin(self, coil_address: int, state: bool) -> bool:
        """
        Set relay by coil address (compatibility with GPIO pin interface)
        Args:
            coil_address: Modbus coil address (0-23)
            state: True = ON, False = OFF
        """
        # Find relay name by coil address
        relay_name = None
        for name, addr in self.relay_mapping.items():
            if addr == coil_address:
                relay_name = name
                break
        
        return self.set_relay_by_coil(coil_address, state, relay_name)
    
    def set_all_off(self) -> bool:
        """
        Emergency: Turn all 24 relays OFF
        Uses Write Multiple Coils (FC15) for atomic operation
        """
        print("🚨 EMERGENCY STOP - All relays OFF")
        
        if not self.client.is_socket_open():
            print(f"⚠️  Modbus connection closed")
            return False
        
        try:
            # Write multiple coils (Function Code 15)
            # Turn off coils 0-23 (all 24 relays)
            slave_id = self.modbus_config['arm_slave_id']
            values = [False] * 24
            result = self.client.write_coils(0, values, slave=slave_id)
            
            if result.isError():
                print(f"❌ Modbus error in emergency stop: {result}")
                return False
            
            # Update all state tracking
            for relay_name in self.relay_states.keys():
                self.relay_states[relay_name] = False
            
            print("✅ All 24 relays turned OFF")
            return True
            
        except Exception as e:
            print(f"❌ Error in emergency stop: {e}")
            return False
    
    def get_status(self) -> Dict[str, bool]:
        """
        Get status of all relays by reading from ARM module
        Returns:
            Dictionary of relay_name: state
        """
        if not self.client.is_socket_open():
            print(f"⚠️  Modbus connection closed")
            return self.relay_states.copy()
        
        try:
            # Read coils (Function Code 01)
            slave_id = self.modbus_config['arm_slave_id']
            result = self.client.read_coils(0, 24, slave=slave_id)
            
            if result.isError():
                print(f"⚠️  Modbus error reading status: {result}")
                return self.relay_states.copy()
            
            # Update state tracking from actual hardware
            for relay_name, coil_addr in self.relay_mapping.items():
                if coil_addr < len(result.bits):
                    self.relay_states[relay_name] = result.bits[coil_addr]
            
            return self.relay_states.copy()
            
        except Exception as e:
            print(f"⚠️  Error reading relay status: {e}")
            return self.relay_states.copy()
    
    def get_relay_name_by_coil(self, coil_address: int) -> str:
        """Get relay name from coil address"""
        for name, addr in self.relay_mapping.items():
            if addr == coil_address:
                return name
        return f"unknown_coil_{coil_address}"
    
    def is_connected(self) -> bool:
        """Check if Modbus connection is alive"""
        return self.client.is_socket_open()
    
    def cleanup(self):
        """Cleanup Modbus connection"""
        print("Cleaning up Modbus...")
        self.set_all_off()
        if self.client.is_socket_open():
            self.client.close()
        print("✅ Modbus cleanup complete")

# Test standalone
if __name__ == "__main__":
    import json
    
    with open('config_autonics.json', 'r') as f:
        config = json.load(f)
    
    controller = ModbusController(config)
    
    try:
        print("\nTesting Modbus relay control... (Press Ctrl+C to stop)\n")
        
        # Test each relay
        for relay_name in list(controller.relay_mapping.keys())[:5]:  # Test first 5 relays
            print(f"Testing {relay_name}...")
            controller.set_relay(relay_name, True)
            time.sleep(0.5)
            controller.set_relay(relay_name, False)
            time.sleep(0.3)
        
        print("\nTest complete!")
        
    except KeyboardInterrupt:
        print("\n\nStopping...")
    finally:
        controller.cleanup()
