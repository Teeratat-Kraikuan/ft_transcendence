
// Me being overly cautious for prototype pollution exploits lol.
// OoOooOh HaCkA MaN

export default (function (){
	
	"use strict";

	/**
	 * Redirects to a page without refreshing.
	 * @param {string} url URL to be re-directed to within the SPA. If diffrent domain was passed, then it will re-direct to it instead.
	 */

	const redirect = (url) => {
		console.log(`Routing to ${url} ...`);
		if (new URL(url, document.location).hostname != location.hostname)
		{
			if (!confirm(`Potential risk up ahead! Are you sure you want to follow this link?\nURL: ${url}`))
				return console.log("Routing cancelled.");
			location.href = url;
			return ;
		}
		window.history.pushState({}, "", url);
		if (typeof window.unload == "function")
		{
			window.unload();
			window.unload = null;
		}
		handle_location();
	};

	/**
	 * Handles all the request routing. Triggered on events.
	 * @param {EventListenerObject} ev Event listener for links and form.
	 */
	const router = (ev) => {
		const target = ev.target || ev.srcElement || ev;
		const url = target.href || target.action;
		
		ev.preventDefault();
		// Ignore empty url
		if (!url) return;
		// Redirection (links, etc.)
		else if (target.href) redirect(url);
		// Forms (login, signup, 2FA)
		else if (target.action)
		{
			const csrftoken = /csrftoken=(.[^;]*)/ig.exec(document.cookie);
			if (!target.checkValidity())
				return target.reportValidity();
			console.log(`Submitting to ${url}...`);
			var xhttp = new XMLHttpRequest();
			xhttp.open(target.method || "POST", url, true);
			if (csrftoken)
				xhttp.setRequestHeader("X-CSRFToken", csrftoken[1]);
			xhttp.setRequestHeader("Accept", "application/json");
			xhttp.onreadystatechange = target.onreadystatechange;
			xhttp.onload = target.onload;
			xhttp.send(new FormData(target));
		}
	};

	/**
	 * Initializes event listeners to links, and forms.
	 */
	const init_event_handler = () => {
		// Why use addEventListener? It's there to prevent override of event click listener,
		// because it can't be erased without a reference to the event listener object.
		document.querySelectorAll("a:not([no-route])")
				.forEach( el => el.addEventListener('click', router) );
		document.querySelectorAll("form")
				.forEach( el => el.addEventListener('submit', router) );
		// For redirecting a custom element
		document.querySelectorAll("*[class='redirect_spa']")
				.forEach( el => el.addEventListener('click', router) );
	};
	
	/**
	 * Handles location changes, fetches data.
	 */
	const handle_location = async () => {
		const data = await fetch(window.location.pathname);
		const html = document.createElement("html");
		html.innerHTML = await data.text();
		document.body = html.getElementsByTagName("body")[0];
		document.head.querySelectorAll("script[src]").forEach(el => {
			el.remove();
		});
		html.querySelectorAll("script[src]").forEach(el => {
			let script = document.createElement('script');
			script.src = el.src;
			script.type = el.type;
			script.defer = el.defer;
			document.head.append(script);
		});
		init_event_handler();
	};

	window.onpopstate = handle_location;

	init_event_handler();
	// Immutable function output
	// HMMMMMM FUNKSUNAL PRO-GAMING
	return Object.freeze({ redirect, handle_location });

})();
