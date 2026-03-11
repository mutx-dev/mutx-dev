"""Telegram notification service for MUTX."""

import os
import httpx
from typing import Optional


class TelegramService:
    def __init__(self, bot_token: Optional[str] = None):
        self.bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN")
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}"
    
    async def send_message(self, chat_id: str, text: str, parse_mode: str = "Markdown") -> dict:
        """Send a message to a Telegram chat."""
        if not self.bot_token:
            return {"ok": False, "error": "TELEGRAM_BOT_TOKEN not set"}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": parse_mode
                }
            )
            return response.json()
    
    async def send_deployment_notification(self, chat_id: str, agent_name: str, status: str, message: str):
        """Send deployment status notification."""
        emoji = "✅" if status == "success" else "❌" if status == "failed" else "🔄"
        text = f"{emoji} *MUTX Deployment Update*\n\n*Agent:* {agent_name}\n*Status:* {status}\n{message}"
        return await self.send_message(chat_id, text)
    
    async def send_error_alert(self, chat_id: str, error: str, context: str = ""):
        """Send error alert."""
        text = f"🚨 *MUTX Error Alert*\n\n*Error:* {error}\n*Context:* {context}"
        return await self.send_message(chat_id, text)
