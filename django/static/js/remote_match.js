(function() {
	"use strict";

	const matchIdContainer = document.getElementById('matchId-variable');
	const matchId = matchIdContainer ? matchIdContainer.dataset.matchId : null;

	const usernameContainer = document.getElementById('username-variable');
	const username = usernameContainer ? usernameContainer.dataset.username : null;

	const avatarContainer = document.getElementById('avatar-variable');
	const avatar = avatarContainer ? avatarContainer.dataset.avatar : null;

	console.log("avatar", avatar);
  
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
	  console.log("Message from server:", data);

	  if (data.player1_username !== undefined && data.player2_username !== undefined) {
		document.getElementById('player1').textContent = data.player1_username || "Waiting...";
		document.getElementById('player2').textContent = data.player2_username || "Waiting...";

		document.getElementById('player1Top').textContent = data.player1_username || "Waiting...";
		document.getElementById('player2Top').textContent = data.player2_username || "Waiting...";

		const player1AvatarElem = document.getElementById('player1Avatar');
        const player2AvatarElem = document.getElementById('player2Avatar');
  
        if (player1AvatarElem) {
          const avatarUrl1 = data.player1_avatar || '/static/default/default_avatar.png';
          player1AvatarElem.style.backgroundImage = `url(${avatarUrl1})`;
        }
  
        if (player2AvatarElem) {
          const avatarUrl2 = data.player2_avatar || '/static/default/default_avatar.png';
          player2AvatarElem.style.backgroundImage = `url(${avatarUrl2})`;
        }
	  }
	};
  
	socket.onclose = () => {
	  console.log("WebSocket connection closed");
	};

	document.addEventListener("keydown", (evt) => {
		if (evt.key === "ArrowUp") {
			socket.send(JSON.stringify({
			action: "MOVE_PADDLE",
			paddle_id: 2,
			direction: "UP"
			}));
		} else if (evt.key === "ArrowDown") {
			socket.send(JSON.stringify({
			action: "MOVE_PADDLE",
			paddle_id: 2,
			direction: "DOWN"
			}));
		}
	});
  })();