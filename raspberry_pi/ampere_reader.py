#!/usr/bin/env python3
"""
Ampere Meter Reader Module
Reads current (ampere), voltage, and power from PZEM-016 via Modbus RTU
"""

import minimalmodbus
import time
from typing import Optional, Dict

class AmpereReader:
    def __init__(self, config: dict):
        """Initialize ampere meter reader with PZEM-016"""
        self.config = config.get('ampere_meter', {})
        
        # Default values if not configured
        port = self.config.get('port', 'COM6')
        slave_id = self.config.get('slave_id', 10)
        baudrate = self.config.get('baudrate', 9600)
        
        try:
            self.instrument = minimalmodbus.Instrument(port, slave_id)
            self.instrument.serial.baudrate = baudrate
            self.instrument.serial.timeout = 1.0
            self.instrument.serial.bytesize = 8
            self.instrument.serial.parity = minimalmodbus.serial.PARITY_NONE
            self.instrument.serial.stopbits = 1
            
            print(f"✅ PZEM-016 initialized on {port} (Slave ID: {slave_id})")
            
        except Exception as e:
            print(f"⚠️ Failed to initialize PZEM-016: {e}")
            self.instrument = None
        
        # Store last readings
        self.current_ampere = 0.0
        self.voltage = 0.0
        self.power = 0.0
        self.last_update = 0
        
    def read_current(self) -> Optional[float]:
        """Read current in Ampere from register 0x0001"""
        if not self.instrument:
            return None
            
        try:
            # PZEM-016 register 0x0001 = Current (A), 2 decimals
            ampere = self.instrument.read_register(0x0001, numberOfDecimals=2, functioncode=4)
            self.current_ampere = ampere
            self.last_update = time.time()
            return ampere
        except Exception as e:
            print(f"⚠️ Error reading ampere: {e}")
            return None
    
    def read_voltage(self) -> Optional[float]:
        """Read voltage in Volts from register 0x0000"""
        if not self.instrument:
            return None
            
        try:
            # PZEM-016 register 0x0000 = Voltage (V), 1 decimal
            voltage = self.instrument.read_register(0x0000, numberOfDecimals=1, functioncode=4)
            self.voltage = voltage
            return voltage
        except Exception as e:
            print(f"⚠️ Error reading voltage: {e}")
            return None
    
    def read_power(self) -> Optional[float]:
        """Read active power in Watts from register 0x0003"""
        if not self.instrument:
            return None
            
        try:
            # PZEM-016 register 0x0003 = Power (W), 1 decimal
            power = self.instrument.read_register(0x0003, numberOfDecimals=1, functioncode=4)
            self.power = power
            return power
        except Exception as e:
            print(f"⚠️ Error reading power: {e}")
            return None
    
    def get_all_data(self) -> Optional[Dict[str, float]]:
        """Read all available data from PZEM-016"""
        if not self.instrument:
            return None
            
        try:
            # Read voltage (0x0000)
            voltage = self.instrument.read_register(0x0000, numberOfDecimals=1, functioncode=4)
            
            # Read current (0x0001)
            ampere = self.instrument.read_register(0x0001, numberOfDecimals=2, functioncode=4)
            
            # Read power (0x0003)
            power = self.instrument.read_register(0x0003, numberOfDecimals=1, functioncode=4)
            
            # Update internal state
            self.voltage = voltage
            self.current_ampere = ampere
            self.power = power
            self.last_update = time.time()
            
            return {
                'voltage': voltage,
                'ampere': ampere,
                'power': power,
                'timestamp': self.last_update
            }
        except Exception as e:
            print(f"⚠️ Error reading ampere meter data: {e}")
            return None
    
    def get_cached_data(self) -> Dict[str, float]:
        """Get last cached readings (faster, no I/O)"""
        return {
            'voltage': self.voltage,
            'ampere': self.current_ampere,
            'power': self.power,
            'timestamp': self.last_update
        }


# Test standalone
if __name__ == "__main__":
    print("=" * 60)
    print("  PZEM-016 Ampere Meter Test")
    print("=" * 60)
    
    # Test configuration
    test_config = {
        'ampere_meter': {
            'port': 'COM6',
            'slave_id': 10,
            'baudrate': 9600
        }
    }
    
    reader = AmpereReader(test_config)
    
    print("\nReading data from PZEM-016...")
    for i in range(5):
        data = reader.get_all_data()
        if data:
            print(f"\n📊 Reading {i+1}:")
            print(f"  Voltage: {data['voltage']:.1f} V")
            print(f"  Current: {data['ampere']:.2f} A")
            print(f"  Power:   {data['power']:.1f} W")
        else:
            print(f"\n❌ Failed to read data (attempt {i+1})")
        
        time.sleep(1)
    
    print("\n✅ Test complete")
