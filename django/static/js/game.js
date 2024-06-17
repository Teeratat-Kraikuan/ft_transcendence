document.getElementById('multiPButton').addEventListener('click', function() {
	document.getElementById('multiPCard').classList.toggle('active');
});

if (typeof submissionType === 'undefined') {
	let submissionType = '';
}

document.getElementById('createRoomBtn').addEventListener('click', function() {
    submissionType = this.value;
});

document.getElementById('joinRoomBtn').addEventListener('click', function() {
    submissionType = this.value;
});

document.getElementById('multiPlayerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('multiPlayerForm'));
    formData.append('type', submissionType);  // Manually add the type to the FormData object
    const type = formData.get('type');
    const roomCode = formData.get('room_code');
	window.history.pushState({}, '', '/game/pong/');
    // You can also do further processing based on the type value here
    if (type === 'create') {
        createRoom(formData);
    } else if (type === 'join') {
		joinRoom(formData);
    }
});

function createRoom(formData) {
    console.log('Creating a room...');
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    fetch('/game/pong/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
        },
        body: formData
    })
    .then(response => response.text())
    .then(html => {
        document.body.innerHTML = html;
        executeInlineScripts();
    })
    .catch(error => console.error(error));
}

function joinRoom(formData) {
	console.log('Joining a room...');
	const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
	fetch('/game/pong/', {
		method: 'POST',
		headers: {
			'X-CSRFToken': csrftoken,
		},
		body: formData
	})
	.then(response => response.text())
	.then(html => {
		document.body.innerHTML = html;
		executeInlineScripts();
	})
	.catch(error => console.error(error));
}

function executeInlineScripts() {
	// Extract and execute inline scripts from the HTML
	const scripts = document.querySelectorAll("script");
	scripts.forEach(script => {
		if (script.innerHTML) {
			try {
				eval(script.innerHTML);
			} catch (e) {
				console.error("Error executing script: ", e);
			}
		}
	});
}