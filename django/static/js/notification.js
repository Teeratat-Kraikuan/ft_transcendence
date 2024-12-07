document.addEventListener('DOMContentLoaded', function() {
    const notificationContainer = document.querySelector('.h-max-200px.overflow-auto'); // Container from template

    // A helper function to get CSRF token if needed
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrfToken = getCookie('csrftoken');

    // Fetch notifications from your notification API
    fetch('/api/v1/notifications/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Clear existing notifications
        notificationContainer.innerHTML = '';

        // Iterate over fetched notifications and render them
        data.forEach(notification => {
            const notifElement = document.createElement('div');
            notifElement.className = 'd-flex card-ff p-3 pt-2 font-75 w-100 align-items-start';

            // Profile picture placeholder
            const pfpDiv = document.createElement('div');
            pfpDiv.className = 'h-auto';
            const pfpInnerDiv = document.createElement('div');
            pfpInnerDiv.className = 'pfp-3 my-auto mx-2 float-start';
            pfpDiv.appendChild(pfpInnerDiv);
            notifElement.appendChild(pfpDiv);

            // Message container
            const messageContainer = document.createElement('div');
            messageContainer.className = 'w-100';

            if (notification.notification_type === 'tournament_update') {
                const boldSpan = document.createElement('span');
                boldSpan.className = 'd-block fw-bold';
                boldSpan.textContent = 'Tournament';
                messageContainer.appendChild(boldSpan);

                const msgSpan = document.createElement('span');
                msgSpan.className = 'd-block';
                msgSpan.textContent = notification.message;
                messageContainer.appendChild(msgSpan);
                notifElement.appendChild(messageContainer);
            } else if (notification.notification_type === 'friend_request') {
                const msgSpan = document.createElement('span');
                msgSpan.className = 'd-block';
                msgSpan.textContent = notification.message;
                messageContainer.appendChild(msgSpan);

                // Assume the notification includes sender_username
                const senderUsername = notification.sender_username; // Make sure your API returns this

                // Add Accept button
                const acceptButton = document.createElement('button');
                acceptButton.className = 'btn btn-primary px-2 py-0 float-end';
                acceptButton.textContent = 'Accept';
                acceptButton.addEventListener('click', function() {
                    // POST to accept_friend_request endpoint
                    // We will send sender_username in the request body
                    const formData = new FormData();
                    formData.append('sender_username', senderUsername);

                    fetch('/api/v1/friend_request/accept/', {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: formData
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.message === 'Friend request accepted.') {
                            // Optionally remove the notification element from the DOM
                            notificationContainer.removeChild(notifElement);
							// fetch to remove notification
							fetch('/api/v1/notifications/remove/', {
								method: 'POST',
								headers: {
									'X-CSRFToken': csrfToken,
									'X-Requested-With': 'XMLHttpRequest'
								},
								body: {
									notification_id: notification.id
								}
							})
                        } else {
                            console.log('Error accepting friend request:', result.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                });
                notifElement.appendChild(messageContainer);
                notifElement.appendChild(acceptButton);
            } else {
                // Default handling
                const msgSpan = document.createElement('span');
                msgSpan.className = 'd-block';
                msgSpan.textContent = notification.message;
                messageContainer.appendChild(msgSpan);
                notifElement.appendChild(messageContainer);
            }

            notificationContainer.appendChild(notifElement);
        });
    })
    .catch(error => {
        console.error('Error fetching notifications:', error);
    });
});