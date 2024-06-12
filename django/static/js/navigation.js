addEventListener("DOMContentLoaded", function() {
	updateApp(window.location.pathname)
	window.addEventListener("popstate", function(event) {
        updateApp(window.location.pathname);
    });
});

function updateApp(path) {
	fetch(path, { headers: { "X-Requested-With": "XMLHttpRequest" } })
	 .then(response => response.text())
	 .then(html => {
		document.body.innerHTML = html;
	 })
	 .catch(error => console.error(error));
}

function swapApp(path) {
	console.log(path);
	window.history.pushState({}, '', path);
	updateApp(path);
}