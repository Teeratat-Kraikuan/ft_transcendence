function showEdit() {
	document.getElementById("popUpEdit").style.display = 'block';
}
function doneEdit() {
	document.getElementById("popUpEdit").style.display = 'none';
}
function showFriendManage() {
	document.getElementById("popUpFriend").style.display = 'block';
}
function doneFriendManage() {
	document.getElementById("popUpFriend").style.display = 'none';
}

function unblock(username) {
	console.log("unblocking "+username);
	document.getElementById('block_button').style.visibility = 'hidden';
	fetch('/users/unblock/' + username + '/', {
        method: 'GET',
    })
    .then(async response => {
		if (!response.ok) {
            const text = await response.text();
			throw new Error('Network response was not ok: ' + text);
        }
		return response.json();
	})
    .then(data => {
        if (data.status === 'success') {
            console.log('User unblocked successfully');
        } else {
            console.log('Failed to unblock user');
            document.getElementById('block_button').style.visibility = 'visible';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('block_button').style.visibility = 'visible';
    });
}

function submitEditForm() {
    const form = document.getElementById('editProfileForm');
    if (!form) {
        console.error("Form element not found");
        return;
    }

    const formData = new FormData(form);
	formData.append('submit', 'edit');
    const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(form.action, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            doneEdit();
			swapApp(window.location.pathname);
        } else {
            console.error('Error:', data.errors);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
