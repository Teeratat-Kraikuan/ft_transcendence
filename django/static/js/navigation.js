let chatSocket;

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
		chatSocket.close();
	}
	if (window.cleanupPongAI) {
		window.cleanupPongAI();
	}

	fetch(path, { headers: { "X-Requested-With": "XMLHttpRequest" } })
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

window.swapApp = swapApp;
window.updateApp = updateApp;