function checkConfirmation(email) {
    const input = document.getElementById('confirmInput').value;
    const doneButton = document.getElementById('doneButton');

    console.log("input: " + input);
    console.log("email: " + email);
    console.log("-----------------")
    if (input === email) {
        doneButton.classList.remove('disabled');
        doneButton.removeAttribute('disabled');
    } else {
        doneButton.classList.add('disabled');
        doneButton.setAttribute('disabled', true);
    }
}

(function() {
    const doneButton = document.getElementById('doneButton');

    doneButton.addEventListener('click', () => {
        console.log('Delete account : click');
        submitDeleteAccount();
    });

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
    async function submitDeleteAccount(){
        console.log('Delete account : send request');
        const csrftoken = getCookie('csrftoken');
        await fetch('/api/v1/delete_account/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                confirm: true,
            }),
        });
        redirect("/home/")
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