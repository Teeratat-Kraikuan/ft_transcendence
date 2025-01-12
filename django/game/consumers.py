import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .game_logic import PongGame

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs'].get('match_id')
        self.room_group_name = f"match_{self.match_id}"

        if not hasattr(self.channel_layer, "game_states"):
            self.channel_layer.game_states = {}
        if not hasattr(self.channel_layer, "active_loops"):
            self.channel_layer.active_loops = {}

        if self.room_group_name not in self.channel_layer.game_states:
            self.channel_layer.game_states[self.room_group_name] = PongGame()

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        if self.room_group_name not in self.channel_layer.active_loops:
            self.channel_layer.active_loops[self.room_group_name] = True
            self.game_task = asyncio.create_task(self.game_loop())

        await self.send(text_data=json.dumps({
            "message": f"Connected to match {self.match_id}",
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        game = self.channel_layer.game_states[self.room_group_name]

        if action == "JOIN_MATCH":
            username = data.get("username", "Anonymous")
            avatar = data.get("avatar")

            if game.player1_username is None:
                game.player1_username = username
                game.player1_avatar = avatar
                join_message = f"{username} joined as Player 1"
            elif game.player2_username is None and game.player1_username != username:
                game.player2_username = username
                game.player2_avatar = avatar
                join_message = f"{username} joined as Player 2"
            else:
                join_message = f"{username} attempted to join but the match is full."

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_message",
                    "text": join_message
                }
            )

            # Also broadcast the updated game state
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_state",
                    "state": game.serialize_state(),
                }
            )

        elif action == "MOVE_PADDLE":
            paddle_id = data.get("paddle_id")
            direction = data.get("direction", "UP")
            game.move_paddle(paddle_id, direction)

        else:
            await self.send(text_data=json.dumps({
                "error": f"Unknown action: {action}"
            }))

    async def broadcast_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["text"]
        }))

    async def game_loop(self):
        try:
            while True:
                game = self.channel_layer.game_states[self.room_group_name]

                game.update()

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_state",
                        "state": game.serialize_state(),
                    }
                )

                if game.game_over:
                    break

                await asyncio.sleep(1/60)
        except asyncio.CancelledError:
            pass
        finally:
            self.channel_layer.active_loops[self.room_group_name] = False

    async def broadcast_state(self, event):
        await self.send(text_data=json.dumps(event["state"]))