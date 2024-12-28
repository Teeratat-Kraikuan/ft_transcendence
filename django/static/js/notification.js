// document.addEventListener('DOMContentLoaded', function() {
// 	console.log("pain")
//     const notificationContainer = document.querySelector('.notification-container'); // Container from template

//     // A helper function to get CSRF token if needed
//     function getCookie(name) {
//         let cookieValue = null;
//         if (document.cookie && document.cookie !== '') {
//             const cookies = document.cookie.split(';');
//             for (let i = 0; i < cookies.length; i++) {
//                 const cookie = cookies[i].trim();
//                 // Does this cookie string begin with the name we want?
//                 if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                     cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                     break;
//                 }
//             }
//         }
//         return cookieValue;
//     }

//     const csrfToken = getCookie('csrftoken');

//     // Fetch notifications from your notification API
//     fetch('/api/v1/notifications/', {
//         method: 'GET',
//         headers: {
//             'X-Requested-With': 'XMLHttpRequest'
//         }
//     })
//     .then(response => response.json())
//     .then(data => {
// 		// console.log(data)
//         // Clear existing notifications
//         notificationContainer.innerHTML = data.length > 0 ? '' : `
//             <div class="d-flex card-ff p-3 pt-2 font-75 w-100 align-items-start">
//                 There is no notification, at the moment.
//                 <a class="border-0 bg-transparent text-decoration-none">
//                     <i class="notification fa-solid fa-check font-150 text-light z-0"></i>
//                 </a>
//             </div>
//         `;

//         // Iterate over fetched notifications and render them
//         data.forEach(notification => {
// 			// console.log(notification)
//             const notifElement = document.createElement('div');
//             notifElement.className = 'd-flex card-ff p-3 pt-2 font-75 w-100 align-items-start';

//             // Profile picture placeholder
//             const pfpDiv = document.createElement('div');
//             pfpDiv.className = 'h-auto';
//             const pfpInnerDiv = document.createElement('div');
//             pfpInnerDiv.className = 'pfp-3 my-auto mx-2 float-start';
//             pfpDiv.appendChild(pfpInnerDiv);
//             notifElement.appendChild(pfpDiv);

//             // Message container
//             const messageContainer = document.createElement('div');
//             messageContainer.className = 'w-100';

//             if (notification.notification_type === 'tournament_update') {
//                 const boldSpan = document.createElement('span');
//                 boldSpan.className = 'd-block fw-bold';
//                 boldSpan.textContent = 'Tournament';
//                 messageContainer.appendChild(boldSpan);

//                 const msgSpan = document.createElement('span');
//                 msgSpan.className = 'd-block';
//                 msgSpan.textContent = notification.message;
//                 messageContainer.appendChild(msgSpan);
//                 notifElement.appendChild(messageContainer);
//             } else if (notification.notification_type === 'friend_request') {
// 				const msgSpan = document.createElement('span');
//                 msgSpan.className = 'd-block';
//                 msgSpan.textContent = notification.message;
//                 messageContainer.appendChild(msgSpan);
//                 console.log(messageContainer)

//                 // Assume the notification includes sender_username
//                 const senderUsername = notification.sender_username; // Make sure your API returns this

//                 // Add Accept button
//                 const acceptButton = document.createElement('button');
//                 acceptButton.className = 'btn btn-primary px-2 py-0 float-end';
//                 acceptButton.textContent = 'Accept';
//                 acceptButton.addEventListener('click', function() {
//                     // POST to accept_friend_request endpoint
//                     // We will send sender_username in the request body
//                     const formData = new FormData();
//                     formData.append('sender_username', senderUsername);

//                     fetch('/api/v1/friend_request/accept/', {
//                         method: 'POST',
//                         headers: {
//                             'X-CSRFToken': csrfToken,
//                             'X-Requested-With': 'XMLHttpRequest'
//                         },
//                         body: formData
//                     })
//                     .then(response => response.json())
//                     .then(result => {
//                         if (result.message === 'Friend request accepted.') {
// 							// Optionally remove the notification element from the DOM
//                             notificationContainer.removeChild(notifElement);
// 							// fetch to remove notification
// 							fetch('/api/v1/notifications/remove/', {
// 								method: 'POST',
// 								headers: {
// 									'X-CSRFToken': csrfToken,
// 									'X-Requested-With': 'XMLHttpRequest'
// 								},
// 								body: {
// 									notification_id: notification.id
// 								}
// 							})
//                         } else {
//                             console.log('Error accepting friend request:', result.message);
//                         }
//                     })
//                     .catch(error => {
//                         console.error('Error:', error);
//                     });
//                 });
//                 notifElement.appendChild(messageContainer);
//                 notifElement.appendChild(acceptButton);
//             } else {
//                 // Default handling
//                 const msgSpan = document.createElement('span');
//                 msgSpan.className = 'd-block';
//                 msgSpan.textContent = notification.message;
//                 messageContainer.appendChild(msgSpan);
//                 notifElement.appendChild(messageContainer);
//             }
//             notificationContainer.appendChild(notifElement);
//         });
//     })
//     .catch(error => {
//         console.error('Error fetching notifications:', error);
//     });
// });

(function() {

	"use strict";

	let ev_contentloaded;
	let interval_pull;

	function getCookie(key) {
		// Check for undefine
		if (!document.cookie) return null;
		// Use HOF to ETL, and return undefine, when fail.
		const cookies = document.cookie.split(";");
		const cookieValue = cookies
			.map(cookie => cookie.trim())
			.find(cookie => cookie.startsWith(key + '='));
		// Return URI decoded value if found.
		if (cookieValue) return decodeURIComponent (
			cookieValue.substring(key.length + 1)
		);
		return null;
	}

	ev_contentloaded = window.addEventListener("DOMContentLoaded", async () => {
		const csrfToken = getCookie('csrftoken');
		console.info("notification: Notification daemon started!");

		function accept_component (notification) {
            const message = document.createTextNode(notification.data.message);
			return container_component (`
                <div class="pfp-3 my-auto mx-2 float-start" style="background-image: url(${notification.sender_data.avatar})"></div>
                <div class="w-100">
                    <span class="d-block"></span>
                </div>
                <button class="btn btn-primary px-2 py-0 float-end">Accept</button>
			`);
		}

		function container_component (body) {
			return `
				<div class="h-auto">
                    ${body}
                </div>
			`;
		}

		function render_component (notification) {
            const wrapper = body => `
                <div class="d-flex card-ff p-3 pt-2 font-75 w-100 align-items-start">
                    ${body}
                </div>
            `;
            if (!notification)
            {
                return wrapper(`
                    Looks like there's no notifications, yet!
                `);
            }
            switch (notification.data.notification_type)
            {
                case "friend_request": return wrapper(`
                    ${accept_component(notification)}
                `);
            }
		}

		async function fetch_data () {
			const notificationContainer = [
				... document.getElementsByClassName("notification-container")
			];
			const data = await (await fetch('/api/v1/notifications/', {
				method: 'GET',
				headers: {
					'X-Requested-With': 'XMLHttpRequest'
				}
			})).json();
            const sender_data = await Promise.all(data.map(async d =>
                await (await fetch('/api/v1/profile/' + d.sender_username, {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })).json()
            ));
            notificationContainer.map( async el => {
                el.innerHTML = "";
                if (data.length == 0)
                    return el.innerHTML = render_component (null);
				data.map((d, indx) => el.innerHTML += render_component({
                    data: d,
                    sender_data: sender_data[indx]
                }));
			})
		}
		try {
			interval_pull = setInterval(fetch_data, 10000 - Math.random() * 5);
			fetch_data();
		} catch (e) {
			console.error('notification: ' + e);
		}
	});

	window.unload = function () {
		removeEventListener('DOMContentLoaded', ev_contentloaded);
	}

})();
