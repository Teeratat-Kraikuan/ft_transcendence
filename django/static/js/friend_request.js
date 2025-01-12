// friendRequest.js

// Function to send a friend request
async function sendFriendRequest(friendUsername) {
    try {
        const csrftoken = getCookie('csrftoken');

        const response = await fetch('/api/v1/friend_request/send/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                friend_username: friendUsername,
            }),
        });

        const data = await response.json();

        if (response.status === 200) {
            alert(data.message);
            // Optionally, update the UI to reflect the sent request
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error sending friend request:', error);
    }
}

// Function to accept a friend request
async function acceptFriendRequest(senderUsername) {
    try {
        const csrftoken = getCookie('csrftoken');

        const response = await fetch('/api/v1/friend_request/accept/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                sender_username: senderUsername,
            }),
        });

        const data = await response.json();

        if (response.status === 200) {
            alert(data.message);
			redirect("/community/")
            // Optionally, update the UI to remove the friend request
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
    }
}

// Function to decline a friend request
async function declineFriendRequest(senderUsername) {
    try {
        const csrftoken = getCookie('csrftoken');

        const response = await fetch('/api/v1/friend_request/decline/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                sender_username: senderUsername,
            }),
        });

        const data = await response.json();

        if (response.status === 200) {
            alert(data.message);
            // Optionally, update the UI to remove the friend request
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error declining friend request:', error);
    }
}

// Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const cookieTrimmed = cookie.trim();
            if (cookieTrimmed.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookieTrimmed.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}