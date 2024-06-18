import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from users.models import CustomUser
from .models import Room, Message

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name = self.scope['url_route']['kwargs']['roomSlug']
		self.roomGroupName = 'chat_%s' % self.room_name
		
		await self.channel_layer.group_add(
            self.roomGroupName,
            self.channel_name
        )
		await self.accept()

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
            self.roomGroupName,
            self.channel_name
        )

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json["message"]
		username = text_data_json["username"]
		room_name = text_data_json["room_name"]
		is_link = text_data_json["is_link"]
        
		message_ins = await self.save_message(message, username, room_name, is_link)

		await self.channel_layer.group_send(
            self.roomGroupName, {
                "type": "sendMessage",
                "message": message,
                "username": username,
                "room_name": room_name,
				"is_link": is_link,
				"time": message_ins.create_on.strftime("%b %d, %H:%M"),
            }
        )

	async def sendMessage(self, event):
		message = event["message"]
		username = event["username"]
		is_link = event["is_link"]
		time = event["time"]
		await self.send(text_data = json.dumps({"message": message, "username": username, "is_link": is_link, "time": time}))

	@sync_to_async
	def save_message(self, message, username, room_name, is_link):
		user=CustomUser.objects.get(username=username)
		room=Room.objects.get(name=room_name)
		
		return Message.objects.create(user=user,room=room,content=message,is_link=is_link)