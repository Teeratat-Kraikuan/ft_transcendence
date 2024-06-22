import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import CustomUser

class OnlineStatusConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.my_username = self.scope['user'].username
		self.roomGroupName = 'online_status'

		await self.channel_layer.group_add(
			self.roomGroupName,
			self.channel_name
		)

		await self.update_user_incr(self.my_username)

		await self.accept()

	async def disconnect(self, close_code):
		await self.update_user_decr(self.scope['user'].username)

		await self.channel_layer.group_discard(
            self.roomGroupName,
            self.channel_name
        )

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		action = text_data_json['action']
		if action == 'ready':
			await self.channel_layer.group_send(
				self.roomGroupName, {
					"type": "alert",
					'receiver': text_data_json['receiver'],
					'message': text_data_json['message'],
				}
			)
			
	async def alert(self, event):
		receiver = event['receiver']
		message = event['message']
		
		# Assuming you have access to self.scope['user'].username
		if self.scope['user'].username == receiver:
			await self.send(text_data=json.dumps({
				'action': 'alert',
				'message': message,
				'receiver': receiver
			}))

	@sync_to_async
	def update_user_incr(self, username):
		user=CustomUser.objects.get(username=username)
		user.active += 1
		user.save()

	@sync_to_async
	def update_user_decr(self, username):
		user=CustomUser.objects.get(username=username)
		user.active -= 1
		user.save()