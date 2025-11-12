"""
WebSocket Server with ESP32 Physical Button Support
Handles both Autonics weight data and ESP32 physical button states
"""

import asyncio
import websockets
import json
import logging
from typing import Set
from datetime import datetime

logger = logging.getLogger(__name__)

class WebSocketServerWithESP32:
    def __init__(self, config, scale_reader, modbus_controller):
        self.config = config
        self.scale_reader = scale_reader
        self.modbus_controller = modbus_controller
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.esp32_client = None  # Track ESP32 client separately
        
    async def handle_client(self, websocket, path):
        """Handle WebSocket client connections"""
        # Register client
        self.clients.add(websocket)
        client_type = "HMI" if path == "/" else "ESP32"
        logger.info(f"✅ {client_type} client connected from {websocket.remote_address}")
        
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"❌ {client_type} client disconnected")
        finally:
            self.clients.discard(websocket)
            if websocket == self.esp32_client:
                self.esp32_client = None
                
    async def handle_message(self, websocket, message: str):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')
            
            if msg_type == 'physical_button_state':
                # Message from ESP32 - broadcast to HMI clients
                await self.handle_physical_button(data)
                
            elif msg_type == 'relay_control':
                # Message from HMI - control relay via Modbus
                await self.handle_relay_control(data)
                
            elif msg_type == 'get_status':
                # Status request from HMI
                await self.handle_get_status(websocket)
                
            elif msg_type == 'emergency_stop':
                # Emergency stop - turn off all relays
                await self.handle_emergency_stop()
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received: {message}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            
    async def handle_physical_button(self, data):
        """Handle physical button state from ESP32 and broadcast to HMI"""
        relay_name = data.get('relay')
        state = data.get('state', False)
        timestamp = data.get('timestamp', datetime.now().timestamp())
        
        logger.info(f"🔘 Physical button: {relay_name} = {'PRESSED' if state else 'RELEASED'}")
        
        # Broadcast to all HMI clients (not ESP32)
        broadcast_msg = {
            'type': 'physical_button_update',
            'relay': relay_name,
            'state': state,
            'timestamp': timestamp,
        }
        
        # Send to all HMI clients
        if self.clients:
            disconnected = set()
            for client in self.clients:
                try:
                    await client.send(json.dumps(broadcast_msg))
                except Exception as e:
                    logger.error(f"Error broadcasting to client: {e}")
                    disconnected.add(client)
            
            # Remove disconnected clients
            self.clients -= disconnected
            
    async def handle_relay_control(self, data):
        """Control relay via Modbus"""
        relay_name = data.get('relay')
        state = data.get('state', False)
        gpio_pin = data.get('gpio_pin')  # Actually Modbus coil address
        
        if not relay_name or gpio_pin is None:
            logger.error("Invalid relay control message")
            return
            
        logger.info(f"🔌 Relay control: {relay_name} = {'ON' if state else 'OFF'} (Coil {gpio_pin})")
        
        try:
            # Control relay via Modbus
            success = self.modbus_controller.write_coil(gpio_pin, state)
            if not success:
                logger.error(f"Failed to control relay {relay_name}")
        except Exception as e:
            logger.error(f"Error controlling relay: {e}")
            
    async def handle_get_status(self, websocket):
        """Send current relay status to client"""
        try:
            # Read all relay statuses from Modbus
            statuses = {}
            for coil in range(16):  # Read first 16 coils
                status = self.modbus_controller.read_coil(coil)
                statuses[f"coil_{coil}"] = status
                
            response = {
                'type': 'status_update',
                'statuses': statuses,
                'timestamp': datetime.now().isoformat(),
            }
            
            await websocket.send(json.dumps(response))
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            
    async def handle_emergency_stop(self):
        """Turn off all relays"""
        logger.warning("🚨 EMERGENCY STOP - Turning off all relays")
        
        try:
            for coil in range(16):
                self.modbus_controller.write_coil(coil, False)
                await asyncio.sleep(0.05)  # Small delay between commands
                
            logger.info("✅ All relays turned off")
        except Exception as e:
            logger.error(f"Error during emergency stop: {e}")
            
    async def broadcast_weights(self):
        """Broadcast weight data from scale reader to all clients"""
        while True:
            try:
                await asyncio.sleep(0.5)  # 2Hz update rate
                
                if not self.clients:
                    continue
                    
                # Get weights from scale reader
                weights = self.scale_reader.get_weights()
                
                message = {
                    'type': 'weight_update',
                    'timestamp': datetime.now().timestamp(),
                    'weights': weights,
                }
                
                # Broadcast to all clients
                disconnected = set()
                for client in self.clients:
                    try:
                        await client.send(json.dumps(message))
                    except Exception as e:
                        logger.error(f"Error sending to client: {e}")
                        disconnected.add(client)
                
                # Remove disconnected clients
                self.clients -= disconnected
                
            except Exception as e:
                logger.error(f"Error broadcasting weights: {e}")
                await asyncio.sleep(1)
                
    async def start_server(self):
        """Start WebSocket server and weight broadcasting"""
        host = self.config.get('websocket', {}).get('host', '0.0.0.0')
        port = self.config.get('websocket', {}).get('port', 8765)
        
        logger.info(f"🚀 Starting WebSocket server on {host}:{port}")
        
        async with websockets.serve(self.handle_client, host, port):
            logger.info(f"✅ WebSocket server running on ws://{host}:{port}")
            
            # Start broadcasting weights
            await self.broadcast_weights()
            
    def start(self):
        """Run the server"""
        try:
            asyncio.run(self.start_server())
        except KeyboardInterrupt:
            logger.info("\n🛑 Server stopped by user")


# Example usage
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Load configuration
    import json
    with open('config_autonics.json', 'r') as f:
        config = json.load(f)
    
    # Initialize scale reader and modbus controller
    from scale_reader import ScaleReader
    from modbus_controller import ModbusController
    
    scale_reader = ScaleReader(config)
    modbus_controller = ModbusController(config)
    
    # Start scale reader
    scale_reader.start()
    
    # Start WebSocket server
    server = WebSocketServerWithESP32(config, scale_reader, modbus_controller)
    server.start()
