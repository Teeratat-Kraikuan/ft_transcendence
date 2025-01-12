import { updateFromServer, waitingP1Div } from './pong-game/client_render.js';

(function() {
	"use strict";

	const matchIdContainer = document.getElementById('matchId-variable');
	const matchId = matchIdContainer ? matchIdContainer.dataset.matchId : null;

	const usernameContainer = document.getElementById('username-variable');
	const username = usernameContainer ? usernameContainer.dataset.username : null;

	const avatarContainer = document.getElementById('avatar-variable');
	const avatar = avatarContainer ? avatarContainer.dataset.avatar : null;

	let myPlayerId = null;
  
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	const wsUrl = `${protocol}//${window.location.host}/ws/match/${matchId}/`;
	
	const socket = new WebSocket(wsUrl);
  
	socket.onopen = () => {
		console.log("WebSocket connected to match:", matchId);
		socket.send(JSON.stringify({
			action: "JOIN_MATCH",
			match_id: matchId,
			username: username,
			avatar: avatar
		}));
	};
  
	socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		// console.log("Message from server:", data);

		if (data.game_started !== undefined) {
            if (data.game_started) {
                if (waitingP1Div && waitingP1Div.parentNode) {
                    waitingP1Div.parentNode.removeChild(waitingP1Div);
                }
            }
        }

		if (data.player1_username !== undefined && data.player2_username !== undefined) {
			document.getElementById('player1').textContent = data.player1_username || "Waiting...";
			document.getElementById('player2').textContent = data.player2_username || "Waiting...";

			document.getElementById('player1Top').textContent = data.player1_username || "Waiting...";
			document.getElementById('player2Top').textContent = data.player2_username || "Waiting...";

			const player1AvatarElem = document.getElementById('player1Avatar');
			const player2AvatarElem = document.getElementById('player2Avatar');

			if (player1AvatarElem) {
				const avatarUrl1 = data.player1_avatar || '/media/default/default_avatar.png';
				player1AvatarElem.style.backgroundImage = `url(${avatarUrl1})`;
			}

			if (player2AvatarElem) {
				const avatarUrl2 = data.player2_avatar || '/media/default/default_avatar.png';
				player2AvatarElem.style.backgroundImage = `url(${avatarUrl2})`;
			}
		}
		// check player ready
		if (data.player1_ready !== undefined && data.player2_ready !== undefined) {
			if (data.player1_ready) {
				const readyElem = document.getElementById('player1Ready');
				if (readyElem) {
					readyElem.style.display = 'block';
				}
			}
			if (data.player2_ready) {
				const readyElem = document.getElementById('player2Ready');
				if (readyElem) {
					readyElem.style.display = 'block';
				}
			}
		}
		// check player id
		if (data.player1_username !== undefined && data.player2_username !== undefined) {
			if (username == data.player1_username) {
				myPlayerId = 1;
			} else if (username == data.player2_username) {
				myPlayerId = 2;
			}
		}
		if (data.ball_x !== undefined) {
			updateFromServer(data);
		}
	};
  
	socket.onclose = () => {
	  console.log("WebSocket connection closed");
	};

	document.addEventListener("keydown", (evt) => {
		if (!myPlayerId) return;
		if (evt.key === "ArrowUp") {
			socket.send(JSON.stringify({
				action: "MOVE_PADDLE",
				paddle_id: myPlayerId,
				direction: "UP"
			}));
		} else if (evt.key === "ArrowDown") {
			socket.send(JSON.stringify({
				action: "MOVE_PADDLE",
				paddle_id: myPlayerId,
				direction: "DOWN"
			}));
		} else if (evt.key === " ") {
			socket.send(JSON.stringify({
				action: "READY",
				player_id: myPlayerId
			}));
		}
	});
  })();