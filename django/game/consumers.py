import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .game_logic import PongGame

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract match_id from the URL route
        self.match_id = self.scope['url_route']['kwargs'].get('match_id')
        self.room_group_name = f"match_{self.match_id}"

        # Initialize the in-memory store on the channel_layer if it doesn't exist
        if not hasattr(self.channel_layer, "game_states"):
            self.channel_layer.game_states = {}
        if not hasattr(self.channel_layer, "active_loops"):
            self.channel_layer.active_loops = {}

        # If there's no PongGame yet for this room, create one
        if self.room_group_name not in self.channel_layer.game_states:
            self.channel_layer.game_states[self.room_group_name] = PongGame()

        # Add this channel to the group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Possibly start the game loop if it's not running yet
        if self.room_group_name not in self.channel_layer.active_loops:
            # Mark loop as active
            self.channel_layer.active_loops[self.room_group_name] = True
            # Kick off a background task
            self.game_task = asyncio.create_task(self.game_loop())

        # Send a welcome message
        await self.send(text_data=json.dumps({
            "message": f"Connected to match {self.match_id}",
        }))

    async def disconnect(self, close_code):
        # Remove from group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Optionally, you could detect if no one else is in the room
        # then set self.channel_layer.active_loops[self.room_group_name] = False
        # But we'll skip that for now.

    async def receive(self, text_data):
        """
        Handle messages from the client.
        Example JSON:
        {
          "action": "JOIN_MATCH",
          "match_id":  "123",
          "username":  "Alice"
        }
        or
        {
          "action": "MOVE_PADDLE",
          "paddle_id": 1,
          "direction": "UP"
        }
        """
        data = json.loads(text_data)
        action = data.get("action")

        # Get the game instance for this room
        game = self.channel_layer.game_states[self.room_group_name]

        if action == "JOIN_MATCH":
            username = data.get("username", "Anonymous")
            match_id = data.get("match_id", "???")

            # Broadcast to the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_message",
                    "text": f"{username} joined match {match_id}"
                }
            )

        elif action == "MOVE_PADDLE":
            # Example: { "action": "MOVE_PADDLE", "paddle_id": 1, "direction": "UP" }
            paddle_id = data.get("paddle_id")
            direction = data.get("direction", "UP")
            game.move_paddle(paddle_id, direction)

        else:
            # Unknown action
            await self.send(text_data=json.dumps({
                "error": f"Unknown action: {action}"
            }))

    async def broadcast_message(self, event):
        """
        Handler for 'group_send' with type='broadcast_message'.
        Just passes the text to the client.
        """
        await self.send(text_data=json.dumps({
            "message": event["text"]
        }))

    async def game_loop(self):
        """Continuously update the game ~60 times/sec, broadcast state to all players."""
        try:
            while True:
                # Grab the current game state from memory
                game = self.channel_layer.game_states[self.room_group_name]

                # Update the game (move ball, etc.)
                game.update()

                # Broadcast the new state to all clients in this room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_state",
                        "state": game.serialize_state(),
                    }
                )

                # If the game is over, we could break or do something else
                if game.game_over:
                    break

                # Sleep ~16ms => ~60 fps
                await asyncio.sleep(1/60)
        except asyncio.CancelledError:
            pass
        finally:
            # Mark loop as inactive
            self.channel_layer.active_loops[self.room_group_name] = False

    async def broadcast_state(self, event):
        """
        All players in the group receive the updated state.
        The front-end will need to handle this to update visuals.
        """
        await self.send(text_data=json.dumps(event["state"]))