(function() {
    const switch2FA = document.getElementById('switchCheck2FA');
    const doneButton = document.getElementById('doneButton');
    let change2FA = false;

    if (!switch2FA || !doneButton) return;

    switch2FA.addEventListener('change', () => {
        doneButton.disabled = change2FA;
        change2FA = !change2FA;
    });

    doneButton.addEventListener('click', () => {
        if (switch2FA.checked) {
            const modal = new bootstrap.Modal(document.getElementById('AuthAppModal'));
            modal.show();
        }
        console.log('2FA switch:', switch2FA.checked);
        submit2fa();
    });

    // const modalElement = document.getElementById('AuthAppModal');
    // if (modalElement) {
    //     modalElement.addEventListener('hidden.bs.modal', () => {
    //         const modalBackdrop = document.querySelector('.modal-backdrop');
    //         if (modalBackdrop) {
    //             modalBackdrop.remove();
    //         }
    //     });
    // }

    async function submit2fa(){
        const csrftoken = getCookie('csrftoken');
        const response = await fetch('/api/v1/change-2fa/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                enable: switch2FA.checked,
            }),
        });

        const data = await response.json();

        if (response.status === 200) {
            // alert(data.message);
            // Optionally, update the UI to reflect the 2FA change
        } else {
            alert(`Error: ${data.message}`);
        }
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