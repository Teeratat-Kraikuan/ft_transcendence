
// Me being overly cautious for prototype pollution exploits lol.
// OoOooOh HaCkA MaN

export default (function (){
	
	"use strict";

	/**
	 * Redirects to a page without refreshing.
	 * @param {string} url URL to be re-directed to within the SPA. If diffrent domain was passed, then it will re-direct to it instead.
	 */

	const redirect = (url) => {
		if (!url || typeof url !== 'string') {
			console.error('Invalid URL:', url);
			return;
		}
		let tmp_url = url;
		if (url[0] === '/')
			tmp_url = `${location.protocol}//${location.host}${url}`;
		
		const fullUrl = new URL(tmp_url, `${location.protocol}//${location.host}`);
	
		if (fullUrl.pathname === location.pathname)
			return;
		
		console.log(`Routing to ${url} ...`);
	
		if (fullUrl.hostname !== location.hostname) {
			if (!confirm(`Potential risk up ahead! Are you sure you want to follow this link?\nURL: ${url}`))
				return console.log("Routing cancelled.");
			location.href = url;
			return;
		}
	
		window.history.pushState({}, "", url);
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
			xhttp.onload = (ev) => {
				if (target.onload)
					target.onload.bind(xhttp)();
				if (xhttp.status == 200 && target.getAttribute('redirect'))
					redirect(target.getAttribute('redirect'));
				else if (xhttp.status != 200 && target.getAttribute('redirect')){
					var response = JSON.parse(xhttp.responseText);
        			alert(response.message);
				}
			};
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
		document.querySelectorAll("*[data-bs-toggle]").forEach(el => {
			const menus = document.querySelectorAll(el.getAttribute("data-bs-target"));
			el.addEventListener("click", ev => {
				menus.forEach(menu => {
					menu.tabIndex = 0;
					menu.focus();
				});
			});
			menus.forEach(menu => menu.addEventListener("focusout", ev => {
				let within = menu.matches(':focus-within');
				if (within)
					return ;
				document.querySelectorAll(".collapse.show").forEach(
					el => {
						menu.removeAttribute("tabindex");
						bootstrap.Collapse.getInstance(el).hide();
					}
				);
			}));
		});
	};
	
	/**
	 * Handles location changes, fetches data.
	 */
	const handle_location = async () => {
		const data = await fetch(window.location.pathname);
		const html = document.createElement("html");
		// Unload game scripts, etc.
		if (typeof window.unload == "function")
		{
			window.unload();
			window.unload = null;
		}
		html.innerHTML = await data.text();
		document.body = html.getElementsByTagName("body")[0];
		// "Unload scripts"
		document.head.querySelectorAll("script[src]").forEach(el => {
			el.remove();
		});
		// Set head to the new one.
		document.head.innerHTML = html.getElementsByTagName("head")[0].innerHTML;
		// Load scripts
		html.querySelectorAll("script[src]").forEach(el => {
			if (el.getAttribute("load-once"))
				return ;
			let script = document.createElement('script');
			script.src = el.src;
			if (el.type)
				script.type = el.type;
			if (el.defer)
				script.setAttribute("defer", el.defer ? "true" : "false");
			document.head.append(script);
		});
		init_event_handler();
		if (typeof window.redirected == "function")
			window.redirected = window.redirected();
	};

	window.addEventListener("popstate", handle_location);
	window.addEventListener("DOMContentLoaded", () => {
		init_event_handler();
		console.info("router: Event handler initialized.");
	});
	// Immutable function output
	// HMMMMMM FUNKSUNAL PRO-GAMING
	return Object.freeze({ redirect, handle_location });

})();
