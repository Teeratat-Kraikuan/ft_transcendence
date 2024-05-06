const onlineSocket = new WebSocket("ws://" + window.location.host + "/ws/users/online/");

onlineSocket.onopen = function (e) {
	console.log("The online status socket connected");
};

onlineSocket.onclose = function (e) {
	console.log("The online status socket disconnected");
};
