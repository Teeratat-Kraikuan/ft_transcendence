(async function() {
    "use strict";

    // Wait until the DOM is ready

	const createBtn = document.getElementById("createMatchBtn");
	const joinBtn = document.getElementById("joinMatchBtn");
	const matchCodeInput = document.getElementById("matchCodeInput");

	createBtn.addEventListener("click", onCreateMatch);
	joinBtn.addEventListener("click", onJoinMatch);

    // --- 3) Define our event handlers ---
    async function onCreateMatch() {
        try {
			const csrftoken = getCookie('csrftoken');
            const response = await fetch("/api/v1/create_matchroom/", {
                method: "POST",
                credentials: "include",  // If you're using session auth
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken,  // if needed
                },
                body: JSON.stringify({}) // If your endpoint doesn't require extra data
            });

            if (!response.ok) {
                console.error(`Failed to create match: HTTP ${response.status}`);
                const err = await response.json().catch(() => ({}));
                alert("Failed to create match: " + (err.message || JSON.stringify(err)));
                return;
            }

            const data = await response.json();
            console.log("Match created successfully:", data);

            // The API should return { "match_id": "XXXX" }
            if (!data.match_id) {
                alert("No match_id returned from server.");
                return;
            }

            redirect(`/match/remote/${data.match_id}/`);

        } catch (error) {
            console.error("Error creating match:", error);
            alert("Error creating match: " + error.message);
        }
    }

    async function onJoinMatch() {
        try {
			const csrftoken = getCookie('csrftoken');
            const code = matchCodeInput?.value?.trim();
            if (!code) {
                alert("Please enter a match code first.");
                return;
            }

            const response = await fetch("/api/v1/join_matchroom/", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken,
                },
                body: JSON.stringify({ match_id: code })
            });

            if (!response.ok) {
                console.error(`Failed to join match: HTTP ${response.status}`);
                const err = await response.json().catch(() => ({}));
                alert("Failed to join match: " + (err.message || JSON.stringify(err)));
                return;
            }

            const data = await response.json();
            console.log("Joined match successfully:", data);

            if (!data.match_id) {
                alert("No match_id returned from server.");
                return;
            }

            redirect(`/match/remote/${data.match_id}/`);

        } catch (error) {
            console.error("Error joining match:", error);
            alert("Error joining match: " + error.message);
        }
    }

    // --- 4) Reuse the "redirect()" and "handle_location()" approach from logout.js ---
    // This logic ensures a single-page-app style navigation, if that’s how your project is set up.
    // If you prefer a simple full-page reload, you can just do `window.location.href = url;`

    function redirect(url) {
        console.log(`Routing to ${url} ...`);
        // Basic safety check if the URL is external:
        if (new URL(url, document.location).hostname !== location.hostname) {
            if (!confirm(`Potential risk up ahead! Are you sure you want to follow this link?\nURL: ${url}`)) {
                return console.log("Routing cancelled.");
            }
            location.href = url;
            return;
        }
        window.history.pushState({}, "", url);
        handle_location();
    }

    async function handle_location() {
        // A minimal approach to fetch the new page content and update the DOM
        // same as in your logout.js example.
        const data = await fetch(window.location.pathname, { credentials: "include" });
        const html = document.createElement("html");

        // If there's a global 'unload' function for cleaning up game scripts:
        if (typeof window.unload === "function") {
            window.unload();
            window.unload = null;
        }

        html.innerHTML = await data.text();
        document.body = html.getElementsByTagName("body")[0];
        document.head.innerHTML = html.getElementsByTagName("head")[0].innerHTML;

        // Re-load scripts
        html.querySelectorAll("script[src]").forEach(el => {
            if (el.hasAttribute("load-once")) return;
            let script = document.createElement("script");
            script.src = el.src;
            script.type = el.type || "text/javascript";
            if (el.defer) script.defer = true;
            document.head.appendChild(script);
        });
    }

	function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const cookieTrimmed = cookie.trim();
                if (cookieTrimmed.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookieTrimmed.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
})();