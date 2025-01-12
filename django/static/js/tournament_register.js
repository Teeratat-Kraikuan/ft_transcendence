console.log('tournament_register.js loaded');

function checkInputs() {
    console.log('tournament_register.js checkInputs()');
    const inputs = document.querySelectorAll('input[type="text"]');
    const joinButton = document.getElementById('joinButton');
    const allFilled = Array.from(inputs).every(input => input.value.trim() !== '');
    console.log('allFilled:', allFilled);
    if (allFilled) {
        joinButton.classList.remove('disabled');
        joinButton.removeAttribute('disabled');
    } else {
        joinButton.classList.add('disabled');
        joinButton.setAttribute('disabled', true);
    }
}

// click event listener for joinButton
(function() {
    console.log('tournament_register.js click event listener');
    const joinButton = document.getElementById('joinButton');
    joinButton.addEventListener('click', () => {
        console.log('tournament_register.js joinButton click');
        submitTournamentRegistration();
    });
})();

async function submitTournamentRegistration() {
    console.log('Submit tournament registration');
    input = document.querySelectorAll('input[type="text"]');
    members = Array.from(input).map(member => member.value.trim());
    console.log('members:', members);
    const response = await fetch('/api/v1/tournament/create/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            members: members,
        }),
    });
    if (response.ok) {
        console.log('Tournament registration successful');

        data = await response.json();
        console.log('data:', data);
        tournamentId = data.tournament_id;
        redirect(`/tournament/room/${tournamentId}/`);
        // tournamentId = data.tournament_id;
    }
}

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