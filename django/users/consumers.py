import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import CustomUser

class OnlineStatusConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		my_username = self.scope['user'].username
		self.roomGroupName = 'online_status'

		await self.channel_layer.group_add(
			self.roomGroupName,
			self.channel_name
		)

		await self.update_user_incr(my_username)
		await self.channel_layer.group_send(
            self.roomGroupName, {
				"type": "online_update",
				"username" : self.scope['user'].username,
                "online":  True,
            }
        )
		await self.accept()

	async def disconnect(self, close_code):
		await self.update_user_decr(self.scope['user'].username)
		await self.channel_layer.group_send(
            self.roomGroupName, {
				"type": "online_update",
				"username" : self.scope['user'].username,
                "online": False,
            }
        )
		await self.channel_layer.group_discard(
            self.roomGroupName,
            self.channel_name
        )

	async def online_update(self, event):
		username = event['username']
		online = event['online']
		# online_friends = event['online_friends']
		await self.send(text_data = json.dumps({"username": username, "online": online}))
		# await self.send(text_data = json.dumps({"username": username, "online": online, "online_friends": online_friends}))

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