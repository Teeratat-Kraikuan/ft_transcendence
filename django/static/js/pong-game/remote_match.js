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
	};
  
	socket.onclose = () => {
	  console.log("WebSocket connection closed");
	};
  })();