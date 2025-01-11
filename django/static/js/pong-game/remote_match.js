(function() {
	"use strict";
  
	const matchId = remoteData.match_id;
	const username = remoteData.username;
  
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	const wsUrl = `${protocol}//${window.location.host}/ws/match/${matchId}/`;
	
	const socket = new WebSocket(wsUrl);
  
	socket.onopen = () => {
	  console.log("WebSocket connected to match:", matchId);
	  socket.send(JSON.stringify({
		action: "JOIN_MATCH",
		match_id: matchId,
		username: username
	  }));
	};
  
	socket.onmessage = (event) => {
	  const data = JSON.parse(event.data);
	  console.log("Message from server:", data);
  
	  // If it's a game state broadcast, e.g. has "ball_x" property:
	  if (data.ball_x !== undefined) {
		// Update your local Three.js or DOM drawing with data
		// e.g. position your 3D ball at data.ball_x, data.ball_y
		// data.p1_score, data.p2_score, etc.
		// ...
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