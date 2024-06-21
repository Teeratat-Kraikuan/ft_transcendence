import json
import asyncio
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

		self.user1Up = False
		self.user1Down = False
		self.user2Up = False
		self.user2Down = False

		await self.update_room_incr(self.room_code)
		print('player added')

		await self.channel_layer.group_add(
			self.roomGroupName,
			self.channel_name
		)
		await self.accept()

		await self.game_start()

	async def disconnect(self, close_code):
		await self.update_room_decr(self.room_code)

		if await self.get_room_user(self.room_code) <= 0:
			await self.delete_room()

		await self.channel_layer.group_discard(
            self.roomGroupName,
            self.channel_name
        )
		if hasattr(self, 'game_loop_task'):
			self.game_loop_task.cancel()

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)

		if 'action' in text_data_json:
			action = text_data_json['action']
			if action == 'move_paddle':
				action_type = text_data_json['type']
				direction = text_data_json['direction']
				player = text_data_json['player']
				if player == 1:
					if action_type == 'keydown' and direction == 'up':
						self.user1Up = True
					elif action_type == 'keydown' and direction == 'down':
						self.user1Down = True
					elif action_type == 'keyup' and direction == 'up':
						self.user1Up = False
					elif action_type == 'keyup' and direction == 'down':
						self.user1Down = False
				elif player == 2:
					if action_type == 'keydown' and direction == 'up':
						self.user2Up = True
					elif action_type == 'keydown' and direction == 'down':
						self.user2Down = True
					elif action_type == 'keyup' and direction == 'up':
						self.user2Up = False
					elif action_type == 'keyup' and direction == 'down':
						self.user2Down = False
		else:
			ball_x = text_data_json['ball_x']
			ball_y = text_data_json['ball_y']
			paddle1_y = text_data_json['paddle1_y']
			paddle2_y = text_data_json['paddle2_y']
			player1score = text_data_json['player1score']
			player2score = text_data_json['player2score']
			start_point = text_data_json["start_point"]

			if not hasattr(self, 'game_loop_task'):
				self.game_loop_task = asyncio.create_task(self.game_loop())

			await self.channel_layer.group_send(
				self.roomGroupName, {
					"type": "game_update",
					"username" : self.username,
					"profile_image": self.image,
					"ball_x": ball_x,
					"ball_y": ball_y,
					"paddle1_y": paddle1_y,
					"paddle2_y": paddle2_y,
					"player1score": player1score,
					"player2score": player2score,
					"start_point": start_point,
				}
			)

	async def game_update(self, event):
		username = event['username']
		image = event['profile_image']
		ball_x = event['ball_x']
		ball_y = event['ball_y']
		paddle1_y = event['paddle1_y']
		paddle2_y = event['paddle2_y']
		player1score = event['player1score']
		player2score = event['player2score']
		start_point = event['start_point']
		await self.send(text_data = json.dumps({"username": username,
										  		"profile_image": image,
												"ball_x": ball_x,
												"ball_y": ball_y,
												"paddle1_y": paddle1_y,
												"paddle2_y": paddle2_y,
												"player1score": player1score,
												"player2score": player2score,
												"start_point": start_point,}))

	@sync_to_async
	def delete_room(self):
		try:
			PongGame.objects.get(room_code=self.room_code).delete()
		except PongGame.DoesNotExist:
			pass

	async def game_start(self):
		if await self.get_room_user(self.room_code) >= 2:
			self.game_loop_task = asyncio.create_task(self.game_loop())

	async def game_loop(self):
		try:
			while True:
				pongGame, created = await sync_to_async(PongGame.objects.get_or_create)(room_code=self.room_code)
				if pongGame.player1_score >= 10 or pongGame.player2_score >= 10:
					break
				await self.update_game_state(pongGame)
				await asyncio.sleep(1/60)
		except asyncio.CancelledError:
			print("Game loop task cancelled")
		except Exception as e:
			print(f"Error in game loop: {e}")

	async def update_game_state(self, pongGame):
		await self.update_paddle_positions(pongGame)
		await self.update_ball_position(pongGame)
		await self.send_game_state_to_clients(pongGame)

	@sync_to_async
	def update_paddle_positions(self, pongGame):
		if self.user1Up and pongGame.paddle1_y > 0:
			pongGame.paddle1_y -= pongGame.paddleSpeed
		elif self.user1Down and pongGame.paddle1_y < 300:
			pongGame.paddle1_y += pongGame.paddleSpeed

		if self.user2Up and pongGame.paddle2_y > 0:
			pongGame.paddle2_y -= pongGame.paddleSpeed
		elif self.user2Down and pongGame.paddle2_y < 300:
			pongGame.paddle2_y += pongGame.paddleSpeed

		pongGame.save()

	@sync_to_async
	def update_ball_position(self, pongGame):
		pongGame.ball_x += pongGame.ballSpeedX
		pongGame.ball_y += pongGame.ballSpeedY

		# Collision detection with walls
		if pongGame.ball_y - pongGame.ballSize < 0 or pongGame.ball_y + pongGame.ballSize > 400:
			pongGame.ballSpeedY = -pongGame.ballSpeedY

		# Collision detection with paddles
		if pongGame.ball_x - pongGame.ballSize < pongGame.paddleWidth:
			if pongGame.ball_y > pongGame.paddle1_y and pongGame.ball_y < pongGame.paddle1_y + pongGame.paddleHeight:
				pongGame.ballSpeedX = -pongGame.ballSpeedX
			else:
				pongGame.player2_score += 1
				self.resetBall(pongGame)
		if pongGame.ball_x + pongGame.ballSize > 800 - pongGame.paddleWidth:
			if pongGame.ball_y > pongGame.paddle2_y and pongGame.ball_y < pongGame.paddle2_y + pongGame.paddleHeight:
				pongGame.ballSpeedX = -pongGame.ballSpeedX
			else:
				pongGame.player1_score += 1
				self.resetBall(pongGame)

		pongGame.save()

	async def send_game_state_to_clients(self, pongGame):
		await self.channel_layer.group_send(
			self.roomGroupName,
			{
				'type': 'game_update',
				"username" : self.username,
				"profile_image": self.image,
				'ball_x': pongGame.ball_x,
				'ball_y': pongGame.ball_y,
				'paddle1_y': pongGame.paddle1_y,
				'paddle2_y': pongGame.paddle2_y,
				'player1score': pongGame.player1_score,
				'player2score': pongGame.player2_score,
				'start_point': False,
			}
		)

	def resetBall(self, pongGame):
		pongGame.ball_x = 400
		pongGame.ball_y = 200
		pongGame.ballSpeedX = -pongGame.ballSpeedX

	@sync_to_async
	def update_room_incr(self, room_code):
		room = PongGame.objects.get(room_code=room_code)
		room.player_in_room += 1
		room.save()

	@sync_to_async
	def update_room_decr(self, room_code):
		room = PongGame.objects.get(room_code=room_code)
		room.player_in_room -= 1
		room.save()

	@sync_to_async
	def get_room_user(self, room_code):
		room = PongGame.objects.get(room_code=room_code)
		return room.player_in_room