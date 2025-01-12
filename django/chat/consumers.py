from channels.consumer import AsyncConsumer, StopConsumer
import datetime
import asyncio
import json

class ChatConsumer(AsyncConsumer):
    async def websocket_connect(self, event):
        self.room_group_name = "test"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.send({
            "type": "websocket.accept"
        });
    async def websocket_disconnect(self, event):
        self.end = True
        raise StopConsumer()
    async def websocket_receive(self, event):
        data = json.loads(event["text"])
        print(data)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_msg",
                "message": {
                    'time_stamp': str(datetime.datetime.now(datetime.timezone.utc)),
                    'success': True,
                    'type': 'chat',
                    'sender': self.scope['user'].username,
                    'message': data['message']
                }
            }
        );
    async def chat_msg(self, event):
        msg = event['message']
        await self.send({
            "type": "websocket.send",
            "text": json.dumps({
                'success': True,
                'type': 'ack'
            }) if msg['sender'] == self.scope['user'].username else json.dumps(msg)
        });
