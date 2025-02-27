import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .game_logic import PongGame
from asgiref.sync import sync_to_async
from .models import MatchHistory
from user.models import User
from django.utils.timezone import now

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs'].get('match_id')
        self.room_group_name = f"match_{self.match_id}"

        # Initialize shared dictionaries on the channel_layer if they don't exist.
        if not hasattr(self.channel_layer, "game_states"):
            self.channel_layer.game_states = {}
        if not hasattr(self.channel_layer, "active_loops"):
            self.channel_layer.active_loops = {}
        if not hasattr(self.channel_layer, "active_connections"):
            self.channel_layer.active_connections = {}

        # Create a new game state if one doesn't exist.
        if self.room_group_name not in self.channel_layer.game_states:
            self.channel_layer.game_states[self.room_group_name] = PongGame()
        
        # Initialize or increment the connection counter.
        if self.room_group_name not in self.channel_layer.active_connections:
            self.channel_layer.active_connections[self.room_group_name] = 0
        self.channel_layer.active_connections[self.room_group_name] += 1

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Start the game loop if not already running.
        if self.room_group_name not in self.channel_layer.active_loops:
            self.channel_layer.active_loops[self.room_group_name] = True
            self.game_task = asyncio.create_task(self.game_loop())

        await self.send(text_data=json.dumps({
            "message": f"Connected to match {self.match_id}",
        }))

    async def disconnect(self, close_code):
        # Remove this connection from the group.
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # Decrement the active connection count for this room.
        if (hasattr(self.channel_layer, "active_connections") and 
            self.room_group_name in self.channel_layer.active_connections):
            self.channel_layer.active_connections[self.room_group_name] -= 1

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
            elif username == game.player2_username or (game.player2_username is None and game.player1_username != username):
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

            # Also broadcast the updated game state.
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_state",
                    "state": game.serialize_players(),
                }
            )

        elif action == "READY":
            player_id = data.get("player_id")
            game.set_ready(player_id)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_state",
                    "state": game.serialize_players()
                }
            )

        elif action == "MOVE_PADDLE":
            paddle_id = data.get("paddle_id")
            direction = data.get("direction", "UP")
            game.move_paddle(paddle_id, direction)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_state",
                    "state": game.serialize_state(),
                }
            )

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
                if (hasattr(self.channel_layer, "active_connections") and 
                    self.channel_layer.active_connections.get(self.room_group_name, 0) <= 0):
                    break

                game = self.channel_layer.game_states[self.room_group_name]

                if game.game_started:
                    game.update()

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_state",
                        "state": game.serialize_state(),
                    }
                )

                if game.game_over:
                    await self.record_match_history(game)
                    break

                await asyncio.sleep(1 / 120)
        except asyncio.CancelledError:
            pass
        finally:
            self.channel_layer.active_loops[self.room_group_name] = False

    async def broadcast_state(self, event):
        await self.send(text_data=json.dumps(event["state"]))

    @sync_to_async
    def record_match_history(self, game):
        print("Recording match history... (sync)")
        if hasattr(game, "player1_username") and hasattr(game, "player2_username"):
            player1 = User.objects.get(username=game.player1_username)
            player2 = User.objects.get(username=game.player2_username)
            print("Recording match history...")
            MatchHistory.objects.create(
                player1=player1,
                player2=player2,
                player1_score=game.p1_score,
                player2_score=game.p2_score,
                game_type="42Pong",
                end_time=now()
            )
            print("Match history recorded.")
        else:
            pass