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

		await self.channel_layer.group_add(
			self.roomGroupName,
			self.channel_name
		)
		await self.accept()

	async def disconnect(self, close_code):
		await self.delete_room()
		await self.channel_layer.group_send(
            self.roomGroupName, {
                "type": "game_update",
				"username" : self.username,
                "score": 0,
				"start_point": False,
				"exit": True,
				"moving": "no",
				"ball": False,
				"ballX": 0,
				"ballY": 0,
            }
        )
		await self.channel_layer.group_discard(
            self.roomGroupName,
            self.channel_name
        )

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		score = text_data_json["score"]
		start_point = text_data_json["start_point"]
		moving = text_data_json["moving"]
		ball = text_data_json["ball"]
		ballX = 0
		ballY = 0
		if (ball):
			ballX = text_data_json["ballX"]
			ballY = text_data_json["ballY"]

		await self.channel_layer.group_send(
            self.roomGroupName, {
                "type": "game_update",
				"username" : self.username,
                "score": score,
				"start_point": start_point,
				"exit": False,
				"moving": moving,
				"ball": ball,
				"ballX": ballX,
				"ballY": ballY,
            }
        )

	async def game_update(self, event):
		username = event['username']
		score = event['score']
		start_point = event['start_point']
		moving = event['moving']
		is_exit = True if event['exit'] else False
		ball = event['ball']
		ballX = event['ballX']
		ballY = event['ballY']
		await self.send(text_data = json.dumps({"username": username,
										  		"score": score,
												"start_point": start_point,
												"exit": is_exit,
												"moving": moving,
												"ball": ball, "ballX": ballX, "ballY": ballY}))

	@sync_to_async
	def delete_room(self):
		try:
			PongGame.objects.get(room_code=self.room_code).delete()
		except:
			pass

class QueueManager(AsyncWebsocketConsumer):
	pass