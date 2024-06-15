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
		console.log("logout function");
		onlineSocket.close();
	}
	// Add other paths and their corresponding scripts if needed
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

window.swapApp = swapApp;
window.updateApp = updateApp;