let onlineSocket;

function connectWebSocket() {
	onlineSocket = new WebSocket("wss://" + window.location.host + "/ws/users/online/");

	onlineSocket.onopen = function (e) {
		console.log("The online status socket connected");
	};

	onlineSocket.onclose = function (e) {
		console.log("The online status socket disconnected");
	};

	onlineSocket.onerror = function (e) {
		console.error("WebSocket error:", e);
	};

	onlineSocket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		alert(data.message);
	}
}