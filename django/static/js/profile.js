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
