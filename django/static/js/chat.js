(function() {

	"use strict";

	window.main = function () {
		console.log(`Connecting to wss://${location.host}/ws/chat/...`);
		const ws = new WebSocket(`wss://${location.host}/ws/chat/`);
		const submit = document.querySelector('#message-form');
		const input = submit.querySelector("input[name='message']");
		const button = submit.querySelector("button");
		const chat_room_container = document.getElementById("chat-room-container");
		const chat_room = document.getElementById("chat-room");
		let message_send;

		function html_element (data) {
			const el = document.createElement(data.tag);
			if (data.attr)
				Object.keys(data.attr).map(a => { el.setAttribute(a, data.attr[a]) })
			if (data.text)
				el.innerText = data.text;
			if (data.body)
				data.body.map( e => el.appendChild(e) );
			return el;
		}

		function friend_component(data)
		{
			const date = new Date(data.time_stamp);
			return [html_element({
				tag: "div",
				attr: {
					class: "d-inline-block w-100 pt-2"
				},
				body: [
					html_element({
						tag: "span",
						attr: {
							class: "float-end font-75"
						},
						text: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
					}),
					html_element({
						tag: "div",
						attr: {class: "d-inline-block float-start"},
						body: [
							html_element({
								tag: "div", attr:{ class: "pfp-2 float-start m-2 mb-0" }
							}),
							html_element({
								tag: "div", attr:{ class: "card bg-body-secondary float-start h-100 mt-2 px-2 py-1"},
								text: data.message
							})
						]
					})
				]
			})];
		}

		function message_component(data)
		{
			const date = new Date(data.time_stamp);
			return [html_element({
				tag: "div",
				attr: {
					class: "d-inline-block w-100 pt-2"
				},
				body: [
					html_element({
						tag: "span",
						attr: {
							class: "float-end font-75"
						},
						text: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
					}),
					html_element({
						tag: "div",
						attr: {class: "d-inline-block float-end"},
						body: [
							html_element({
								tag: "div", attr:{ class: "pfp-2 float-end m-2 mb-0" }
							}),
							html_element({
								tag: "div", attr:{ class: "card bg-body-secondary float-end h-100 mt-2 px-2 py-1"},
								text: data.message
							})
						]
					})
				]
			})];
		}

		ws.onopen = function() {
			console.log(`Chat application started!`);
		}
		ws.onmessage = function(ev) {
			let data = JSON.parse(ev.data);
			let scroll_bottom = chat_room_container.scrollTop + chat_room_container.offsetHeight > chat_room_container.scrollHeight - 20;
			input.removeAttribute("disabled");
			button.removeAttribute("disabled");
			if (data.success === false)
				return alert(data.message);
			if (data.type === "ack")
			{
				input.focus();
				chat_room.appendChild(message_component(message_send)[0]);
				chat_room_container.scrollTop = chat_room_container.scrollHeight;
				return input.value = "";
			}
			chat_room.appendChild(friend_component(data)[0]);
			if (scroll_bottom)
				chat_room_container.scrollTop = chat_room_container.scrollHeight;
		}
		submit.onsubmit = function (ev) {
			message_send = {
				message: input.value,
				time_stamp: new Date().toUTCString()
			};
			ev.preventDefault();
			if (!input.value)
				return ;
			ws.send(JSON.stringify(message_send));
			input.setAttribute("disabled", true);
			button.setAttribute("disabled", true);
		}
	};

	window.unload = function () {
		delete window.main;
	}

	if (window["main"] != undefined)
		window.main();

})();

/*
// Friend
<div class="d-inline-block w-100 pt-2">
	<span class="float-end font-75">12:08</span>
	<div class="d-inline-block float-start">
		<div class="pfp-2 float-start m-2 mb-0"></div>
		<div class="card bg-body-secondary float-start h-100 mt-2 px-2 py-1">Hello!</div>
	</div>
</div>
// You
<div class="d-inline-block w-100 pt-2">
	<span class="float-end font-75">12:08</span>
	<div class="d-inline-block float-end">
		<div class="pfp-2 float-end m-2 mb-0"></div>
		<div class="card bg-body-secondary float-end h-100 mt-2 px-2 py-1">Ayyyyyyyyy!</div>
	</div>
</div>
*/