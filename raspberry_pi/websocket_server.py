#!/usr/bin/env python3
"""
WebSocket Server Module
Handles WebSocket communication with web app
"""

import asyncio
import websockets
import json
import time
from typing import Set

class WebSocketServer:
    def __init__(self, config: dict, scale_reader, modbus_controller):
        self.config = config
        self.scale_reader = scale_reader
        self.modbus_controller = modbus_controller
        self.host = config['websocket_host']
        self.port = config['websocket_port']
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.running = False
        
    async def handle_client(self, websocket, path):
        """Handle individual client connection"""
        client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        print(f"✅ Client connected: {client_id}")
        
        self.clients.add(websocket)
        
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            print(f"❌ Client disconnected: {client_id}")
        finally:
            self.clients.remove(websocket)
    
    async def handle_message(self, websocket, message: str):
        """Handle incoming message from client"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')
            
            if msg_type == 'relay_control':
                # Control relay via Modbus
                relay = data.get('relay', '').lower()
                state = data.get('state', False)
                coil_address = data.get('gpio_pin')  # 'gpio_pin' now contains coil address for compatibility
                
                # Try to set relay
                success = False
                if coil_address is not None:
                    success = self.modbus_controller.set_relay_by_coil(coil_address, state)
                else:
                    success = self.modbus_controller.set_relay(relay, state)
                
                # Send acknowledgment
                response = {
                    'type': 'relay_ack',
                    'relay': relay,
                    'state': state,
                    'success': success
                }
                await websocket.send(json.dumps(response))
                
            elif msg_type == 'get_status':
                # Send current relay status from Modbus
                status = self.modbus_controller.get_status()
                response = {
                    'type': 'status',
                    'relays': status
                }
                await websocket.send(json.dumps(response))
                
            elif msg_type == 'emergency_stop':
                # Emergency stop all relays via Modbus
                self.modbus_controller.set_all_off()
                response = {
                    'type': 'emergency_ack',
                    'message': 'All relays turned OFF'
                }
                await websocket.send(json.dumps(response))
                
        except json.JSONDecodeError:
            print(f"⚠️  Invalid JSON received: {message}")
        except Exception as e:
            print(f"❌ Error handling message: {e}")
    
    async def broadcast_weights(self):
        """Broadcast weight data to all connected clients"""
        update_interval = 1.0 / self.config['update_frequency_hz']
        
        while self.running:
            if self.clients:
                # Get current weights
                weights = self.scale_reader.get_weights()
                
                # Create message
                message = {
                    'type': 'weight_update',
                    'timestamp': int(time.time() * 1000),
                    'weights': weights
                }
                
                # Broadcast to all clients
                disconnected = set()
                for client in self.clients:
                    try:
                        await client.send(json.dumps(message))
                    except:
                        disconnected.add(client)
                
                # Remove disconnected clients
                self.clients -= disconnected
            
            await asyncio.sleep(update_interval)
    
    async def start_server(self):
        """Start WebSocket server"""
        self.running = True
        
        # Start server
        async with websockets.serve(self.handle_client, self.host, self.port):
            print(f"✅ WebSocket server started on ws://{self.host}:{self.port}")
            
            # Start broadcasting weights
            await self.broadcast_weights()
    
    def start(self):
        """Start server (blocking)"""
        try:
            asyncio.run(self.start_server())
        except KeyboardInterrupt:
            print("\\n🛑 WebSocket server stopped")
        finally:
            self.running = False

# Test standalone
if __name__ == "__main__":
    print("WebSocket server test mode")
    print("This module should be run from main.py")
