#!/usr/bin/env python3
"""
GPIO Controller Module
Controls 16-channel relay module via Raspberry Pi GPIO pins
Active HIGH relay module (GPIO=1 → Relay ON)
"""

import RPi.GPIO as GPIO
import time
import json
from typing import Dict, List

class GPIOController:
    def __init__(self, config: dict):
        self.config = config
        self.gpio_pins = config['gpio_pins']
        self.relay_states = {}
        
        # Setup GPIO
        GPIO.setmode(GPIO.BCM)  # Use BCM pin numbering
        GPIO.setwarnings(False)
        
        # Initialize all pins as OUTPUT, set LOW (relay OFF)
        for relay_name, pin in self.gpio_pins.items():
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.LOW)
            self.relay_states[relay_name] = False
            
        print(f"✅ GPIO Controller initialized with {len(self.gpio_pins)} pins")
    
    def set_relay(self, relay_name: str, state: bool) -> bool:
        """
        Set relay state
        Args:
            relay_name: Name from config (e.g., 'mixer', 'konveyor_atas')
            state: True = ON, False = OFF
        Returns:
            True if successful, False if relay not found
        """
        if relay_name not in self.gpio_pins:
            print(f"⚠️  Unknown relay: {relay_name}")
            return False
        
        pin = self.gpio_pins[relay_name]
        
        # Active HIGH relay module
        gpio_state = GPIO.HIGH if state else GPIO.LOW
        GPIO.output(pin, gpio_state)
        
        self.relay_states[relay_name] = state
        
        status = "ON" if state else "OFF"
        print(f"🔌 Relay {relay_name} (GPIO {pin}) → {status}")
        
        return True
    
    def set_relay_by_pin(self, gpio_pin: int, state: bool) -> bool:
        """Set relay by GPIO pin number"""
        # Find relay name by pin
        relay_name = None
        for name, pin in self.gpio_pins.items():
            if pin == gpio_pin:
                relay_name = name
                break
        
        if relay_name:
            return self.set_relay(relay_name, state)
        else:
            print(f"⚠️  Unknown GPIO pin: {gpio_pin}")
            return False
    
    def set_all_off(self):
        """Emergency: Turn all relays OFF"""
        print("🚨 EMERGENCY STOP - All relays OFF")
        for relay_name in self.gpio_pins.keys():
            self.set_relay(relay_name, False)
    
    def get_status(self) -> Dict[str, bool]:
        """Get status of all relays"""
        return self.relay_states.copy()
    
    def get_relay_name_by_pin(self, gpio_pin: int) -> str:
        """Get relay name from GPIO pin number"""
        for name, pin in self.gpio_pins.items():
            if pin == gpio_pin:
                return name
        return f"unknown_pin_{gpio_pin}"
    
    def cleanup(self):
        """Cleanup GPIO (turn all OFF and release pins)"""
        print("Cleaning up GPIO...")
        self.set_all_off()
        GPIO.cleanup()
        print("✅ GPIO cleanup complete")

# Test standalone
if __name__ == "__main__":
    with open('config.json', 'r') as f:
        config = json.load(f)
    
    controller = GPIOController(config)
    
    try:
        print("\\nTesting relay control... (Press Ctrl+C to stop)\\n")
        
        # Test each relay
        for relay_name in controller.gpio_pins.keys():
            print(f"Testing {relay_name}...")
            controller.set_relay(relay_name, True)
            time.sleep(0.5)
            controller.set_relay(relay_name, False)
            time.sleep(0.3)
        
        print("\\nTest complete!")
        
    except KeyboardInterrupt:
        print("\\n\\nStopping...")
    finally:
        controller.cleanup()
