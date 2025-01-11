// import router from "./router.js";

(async function(){
	try {
        const response = await fetch("/api/v2/logout/", {
            method: "POST",
            credentials: "include",
        });

        if (!response.ok) {
            console.error(`Logout failed: ${response.status}`);
            alert("Failed to log out. Please try again.");
            return;
        }

		console.log("Logged out successfully.");
		
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
			handle_location();
		}
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
		};
		redirect("/home/")
	} catch (e) {
		console.error(e);
	}
})();
