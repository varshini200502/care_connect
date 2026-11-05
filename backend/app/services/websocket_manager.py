import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("websocket_manager")

class ConnectionManager:
    def __init__(self):
        # conversation_id -> list of active WebSocket connections
        self.chat_rooms: Dict[int, List[WebSocket]] = {}
        # user_id -> list of active WebSocket notification connections
        self.user_notifications: Dict[int, List[WebSocket]] = {}

    # --- Chat Connections ---
    async def connect_chat(self, conversation_id: int, websocket: WebSocket):
        await websocket.accept()
        if conversation_id not in self.chat_rooms:
            self.chat_rooms[conversation_id] = []
        self.chat_rooms[conversation_id].append(websocket)
        logger.info(f"WebSocket joined chat room {conversation_id}. Total in room: {len(self.chat_rooms[conversation_id])}")

    def disconnect_chat(self, conversation_id: int, websocket: WebSocket):
        if conversation_id in self.chat_rooms:
            if websocket in self.chat_rooms[conversation_id]:
                self.chat_rooms[conversation_id].remove(websocket)
            if not self.chat_rooms[conversation_id]:
                del self.chat_rooms[conversation_id]
        logger.info(f"WebSocket left chat room {conversation_id}")

    async def broadcast_chat(self, conversation_id: int, message_data: dict):
        if conversation_id in self.chat_rooms:
            payload = json.dumps(message_data)
            dead_sockets = []
            for connection in self.chat_rooms[conversation_id]:
                try:
                    await connection.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error sending to chat socket: {e}")
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                self.disconnect_chat(conversation_id, dead)

    # --- User Notification Connections ---
    async def connect_notifications(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.user_notifications:
            self.user_notifications[user_id] = []
        self.user_notifications[user_id].append(websocket)
        logger.info(f"User {user_id} connected to notification stream")

    def disconnect_notifications(self, user_id: int, websocket: WebSocket):
        if user_id in self.user_notifications:
            if websocket in self.user_notifications[user_id]:
                self.user_notifications[user_id].remove(websocket)
            if not self.user_notifications[user_id]:
                del self.user_notifications[user_id]
        logger.info(f"User {user_id} disconnected from notification stream")

    async def send_user_notification(self, user_id: int, notification_data: dict):
        if user_id in self.user_notifications:
            payload = json.dumps(notification_data)
            dead_sockets = []
            for connection in self.user_notifications[user_id]:
                try:
                    await connection.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error sending notification to user {user_id}: {e}")
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                self.disconnect_notifications(user_id, dead)

ws_manager = ConnectionManager()
