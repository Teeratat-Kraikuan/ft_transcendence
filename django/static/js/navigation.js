let chatSocket;
let pongSocket;

document.addEventListener('DOMContentLoaded', function() {
	updateApp(window.location.pathname);
	if (document.body.dataset.userAuthenticated === 'true') {
		connectWebSocket();
	}
	window.addEventListener('popstate', function(event) {
		updateApp(window.location.pathname);
	});
});

function updateApp(path) {
	if (chatSocket) {
		console.log("closing chat socket")
		chatSocket.close();
		chatSocket = null;
	}
	if (pongSocket) {
		console.log("closing pong socket")
		pongSocket.close();
		pongSocket = null;
	}

	fetch(path, { headers: { "X-Requested-With": "XMLHttpRequest" } })
	 .then(response => response.text())
	 .then(html => {
		document.body.innerHTML = html;
		loadScripts(path);
	 })
	 .catch(error => console.error(error));
}

function updateAppPost(path, formData) {
	// const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    fetch(path, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: formData
    })
    .then(response => response.text())
    .then(html => {
        document.body.innerHTML = html;
        loadScripts(path);
    })
    .catch(error => console.error(error));
}

function swapApp(path) {
	console.log(path);
	window.history.pushState({}, '', path);
	updateApp(path);
}

function loadScripts(path) {
	removeOldScripts();

	if (path.includes('/login')) {
		loadScript('/static/js/login.js');
	}
	else if (path.includes('/logout')) {
		onlineSocket.close();
	}
	else if (path.includes('/users') && !(path.includes('/friend'))) {
		loadScript('/static/js/profile.js');
	}
	else if (path.includes('/chat') && path !== '/chat/') {
		executeInlineScripts();
	}
	else if (path === '/game/') {
		loadScript('/static/js/game.js');
	}
	else if (path.includes('/pong-ai')) {
		loadScript('/static/js/pong-ai.js');
	}
	else if (path.includes('/pong-local')) {
		loadScript('/static/js/pong-local.js');
	}
	else if (path === '/game/pong/') {
		console.log("/game/pong/ executing")
		executeInlineScripts();
	}
}

function loadScript(src) {
	const existingScript = document.querySelector(`script[src="${src}"]`);
	if (!existingScript) {
		const script = document.createElement('script');
		script.src = src;
		script.onload = () => console.log(`${src} loaded successfully.`);
		script.onerror = () => console.error(`Error loading ${src}`);
		document.body.appendChild(script);
	} else {
		console.log(`${src} is already loaded.`);
	}
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
function removeOldScripts() {
    const scriptsToRemove = [
        '/static/js/pong-ai.js',
        '/static/js/pong-local.js'
        // Add more scripts to remove as needed
    ];

    const scriptElements = document.querySelectorAll('script');
    scriptElements.forEach(script => {
        if (scriptsToRemove.includes(script.src)) {
            script.remove();
            console.log(`Removed script: ${script.src}`);
        }
    });
}

function playGame(room_code) {
	console.log("joining room " + room_code);
	const formData = new FormData();
	formData.append('type', 'join');
	formData.append('room_code', room_code);
	updateAppPost('/game/pong/', formData);
}

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

window.swapApp = swapApp;
window.updateApp = updateApp;
window.updateAppPost = updateAppPost;
window.playGame = playGame;
window.getCookie = getCookie;