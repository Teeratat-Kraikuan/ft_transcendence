from channels.generic.websocket import AsyncWebsocketConsumer
import json

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs'].get('match_id')

        self.room_group_name = f'match_{self.match_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'message': 'Hello from PongConsumer!'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "JOIN_MATCH":
            username = data.get("username")
            match_id = data.get("match_id", "NoMatchId")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_message",
                    "text": f"{username} joined match {match_id}"
                }
            )
        else:
            await self.send(text_data=json.dumps({
                'received': data
            }))

    async def broadcast_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event["text"]
        }))