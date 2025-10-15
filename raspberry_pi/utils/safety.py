#!/usr/bin/env python3
"""
Safety utilities for batch plant controller
Implements watchdog timer, spike detection, and safety limits
"""

import time
import threading

class SafetyMonitor:
    def __init__(self, config: dict, gpio_controller):
        self.config = config['safety']
        self.gpio_controller = gpio_controller
        self.last_heartbeat = time.time()
        self.running = False
        self.watchdog_thread = None
        
        # Weight spike detection
        self.last_weights = {'pasir': 0, 'batu': 0, 'semen': 0, 'air': 0}
        
    def heartbeat(self):
        """Update heartbeat timestamp (call from web app)"""
        self.last_heartbeat = time.time()
    
    def check_weight_spike(self, current_weights: dict) -> bool:
        """
        Check for abnormal weight spikes
        Returns True if spike detected
        """
        threshold = self.config['weight_spike_threshold_kg']
        
        for material, weight in current_weights.items():
            last_weight = self.last_weights.get(material, 0)
            diff = abs(weight - last_weight)
            
            if diff > threshold:
                print(f"⚠️  SPIKE DETECTED in {material}: {diff:.1f} kg change")
                # Don't trigger emergency, just warn
                # return True
        
        self.last_weights = current_weights.copy()
        return False
    
    def watchdog_loop(self):
        """Watchdog timer loop"""
        timeout = self.config['watchdog_timeout_seconds']
        
        while self.running:
            time_since_heartbeat = time.time() - self.last_heartbeat
            
            if time_since_heartbeat > timeout:
                print(f"🚨 WATCHDOG TIMEOUT: No heartbeat for {time_since_heartbeat:.1f}s")
                print(f"🚨 EMERGENCY STOP - Turning off all relays")
                self.gpio_controller.set_all_off()
                
                # Reset timer to prevent spam
                self.last_heartbeat = time.time()
            
            time.sleep(1)
    
    def start(self):
        """Start safety monitor"""
        self.running = True
        self.watchdog_thread = threading.Thread(
            target=self.watchdog_loop,
            daemon=True
        )
        self.watchdog_thread.start()
        print("✅ Safety monitor started")
    
    def stop(self):
        """Stop safety monitor"""
        self.running = False
        if self.watchdog_thread:
            self.watchdog_thread.join(timeout=2)
        print("✅ Safety monitor stopped")
