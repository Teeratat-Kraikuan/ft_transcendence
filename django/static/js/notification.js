(function() {

	"use strict";
	const	csrfToken = getCookie('csrftoken');
	let		notifications = { data: null, sender_data: null };
	let		ev_contentloaded;

	function getCookie(key) {
		// Check for undefine
		if (!document.cookie) return null;
		// Use HOF to ETL, and return undefine, when fail.
		const cookies = document.cookie.split(";");
		const cookieValue = cookies
			.map(cookie => cookie.trim())
			.find(cookie => cookie.startsWith(key + '='));
		// Return URI decoded value if found.
		if (cookieValue)
			return decodeURIComponent(cookieValue.substring(key.length + 1));
		return null;
	}
	
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

	function accept_component (notification) {
		const button = html_element({
			tag: 'button',
			attr: { class: "btn btn-primary px-2 py-0 float-end" },
			text: "Accept"
		});
		const parent = container_component ([
			html_element({ tag: "div", attr: {
				class: "pfp-3 my-auto mx-2 float-start",
				style:`background-image: url(${notification.sender_data.avatar})`
			} }),
			html_element({
				tag: 'div',
				attr: { class: "w-100" },
				body: [
					html_element({
						tag: "span", attr: {class: "d-block"},
						text: notification.data.message.replaceAll(/%username%/g, notification.sender_data.username)
					})
				]
			}),
			button
		]);
		button.onclick = async function () {
			const accept = await (await fetch('/api/v1/friend_request/accept/', {
				method: 'POST',
				headers: {
					'X-CSRFToken': csrfToken,
					'X-Requested-With': 'XMLHttpRequest'
				},
				body: JSON.stringify({
					'sender_username': notification.sender_data.username
				})
			})).json();
			if (accept.message === 'Friend request accepted.') {
				const remove = await fetch('/api/v1/notifications/remove/', {
					method: 'POST',
					headers: {
						'X-CSRFToken': csrfToken,
						'X-Requested-With': 'XMLHttpRequest'
					},
					body: JSON.stringify({
						notification_id: notification.data.id
					})
				});
				notifications = { data: null, sender_data: null };;
				load_component();
			}
		};
		return parent;
	}

	function container_component (body) {
		return [html_element({
			tag: 'div',
			attr: { class: "h-auto w-100" },
			body
		})];
	}

	function render_component (notification) {
		const wrapper = body => html_element({
			tag: 'div',
			attr: { class: "d-flex card-ff p-3 pt-2 font-75 w-100 align-items-start" },
			body: notification ? body : undefined,
			text: notification ? undefined : "Looks like there's no notifications, yet!"
		});
		switch (notification?.data.notification_type)
		{
			case "friend_request": return wrapper(accept_component(notification));
			default: return wrapper(accept_component);
		}
	}

	async function fetch_data () {
		if (!getCookie("loggedin"))
			return ;
		// console.log("notification: Fetch notifications...");
		try {
			const notif = await fetch('/api/v1/notifications/', {
				method: 'GET',
				headers: {
					'X-Requested-With': 'XMLHttpRequest'
				}
			})
			const data = await notif.json();
			const sender_data = await Promise.all(data.map(async d =>
				await (await fetch('/api/v1/profile/' + d.sender_username, {
					method: 'GET',
					headers: {
						'X-Requested-With': 'XMLHttpRequest'
					}
				})).json()
			));
			const notofication_status = [ ... document.getElementsByClassName("notification-status") ];
			notifications.data = data;
			notifications.sender_data = sender_data;
			if (data.length)
				notofication_status.map(el => el.classList.remove("d-none") )
			else
				notofication_status.map(el => el.classList.add("d-none") )
			return notifications;
		} catch (e) {
			console.error('notification: ' + e);
			return null;
		}
	}

	async function load_component()
	{
		if (!getCookie("loggedin"))
			return ;
		// console.log("notification: Load component...");
		try {
			if (!notifications.data || notifications.data?.length == 0)
				if (!await fetch_data()) return ;
			const notificationContainer = [
				... document.getElementsByClassName("notification-container")
			];
			notificationContainer.map( async el => {
				el.innerHTML = "";
				if (notifications?.data.length == 0)
					return el.appendChild(render_component (null));
				notifications.data.map((d, indx) => el.appendChild(render_component({
					data: d,
					sender_data: notifications.sender_data[indx]
				})));
			})
		} catch (e) {
			console.error('notification: ' + e);
		}
	}

	function load_self () {
		const notificationButton = [
			... document.querySelectorAll("button[data-bs-target='#notification_menu']")
		];
		notificationButton.map(btn => btn.addEventListener("click", load_component));
		return load_self;
	}

	ev_contentloaded = window.addEventListener("DOMContentLoaded", async () => {
		console.info("notification: Notification daemon started!");

		const notificationButton = [
			... document.querySelectorAll("button[data-bs-target='#notification_menu']")
		];
		notificationButton.map(btn => btn.addEventListener("click", load_component));
		fetch_data();
		setInterval(fetch_data, 15000 - Math.random() * 5);
	});

	window.unload = ev_contentloaded;
	window.redirected = load_self;

})();
