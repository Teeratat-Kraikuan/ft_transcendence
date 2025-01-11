(function() {
    const switchHideData = document.getElementById('switchHideData');

    if (!switchHideData) {
        console.error('switchHideData not found');
        return;
    }
    switchHideData.addEventListener('change', () => {
        submitAnonymize();
    });

    async function submitAnonymize(){
        const csrftoken = getCookie('csrftoken');
        await fetch('/api/v1/anonymize_data/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                enable: switchHideData.checked,
            }),
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