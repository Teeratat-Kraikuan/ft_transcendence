import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from users.models import CustomUser
from .models import PongGame

class PongConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_code = self.scope['url_route']['kwargs']['room_code']
		self.roomGroupName = 'pong_%s' % self.room_code
		self.username = self.scope['user'].username if self.scope['user'].is_authenticated else 'guest'
		self.image = self.scope['user'].profile_image.url if self.scope['user'].is_authenticated else '/media/profile_pics/default_profile_image.png'

		await self.update_room_incr(self.room_code)

		await self.channel_layer.group_add(
			self.roomGroupName,
			self.channel_name
		)
		await self.accept()

	async def disconnect(self, close_code):
		await self.update_room_decr(self.room_code)

		if await self.get_room_user(self.room_code) == 0:
			await self.delete_room()

		await self.channel_layer.group_discard(
            self.roomGroupName,
            self.channel_name
        )

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		self.current_game_state = text_data_json
		await self.update_game_state()
		player1score = text_data_json['player1score']
		player2score = text_data_json['player2score']
		start_point = text_data_json["start_point"]

		await self.channel_layer.group_send(
            self.roomGroupName, {
                "type": "game_update",
				"username" : self.username,
				"profile_image": self.image,
                "player1score": player1score,
                "player2score": player2score,
				"start_point": start_point,
            }
        )

	async def game_update(self, event):
		username = event['username']
		image = event['profile_image']
		player1score = event['player1score']
		player2score = event['player2score']
		start_point = event['start_point']
		await self.send(text_data = json.dumps({"username": username,
										  		"profile_image": image,
												"player1score": player1score,
												"player2score": player2score,
												"start_point": start_point,}))

	@sync_to_async
	def delete_room(self):
		try:
			PongGame.objects.get(room_code=self.room_code).delete()
		except:
			pass

	@sync_to_async
	def update_game_state(self):
		# Retrieve or create the game session
		pongGame, created = PongGame.objects.get_or_create(room_code=self.room_code)
        # Update the game state
		pongGame.game_state = json.dumps(self.current_game_state)
		pongGame.save()

	@sync_to_async
	def update_room_incr(self, room_code):
		room = PongGame.objects.get(room_code=room_code)
		room.plyaer_in_room += 1
		room.save()

	@sync_to_async
	def update_room_decr(self, room_code):
		room = PongGame.objects.get(room_code=room_code)
		room.plyaer_in_room -= 1
		room.save()

	@sync_to_async
	def get_room_user(self, room_code):
		room = PongGame.objects.get(room_code=room_code)
		return room.plyaer_in_room