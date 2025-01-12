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
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                enable: switch2FA.checked,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.message === '2FA enabled' && data.qr_code) {
                generateQRCode(data.qr_code);

                const secret = extractSecretFromURL(data.config_url);
                if (secret) {
                    const secretKeyText = document.getElementById('secretKeyText');
                    if (secretKeyText) {
                        secretKeyText.textContent = secret;
                    }
                }
            }
        } else {
            alert(`Error: ${data.message}`);
        }
    }

    function generateQRCode(qrCode) {
        const qrCodeUrl = `data:image/png;base64,${qrCode}`;
        
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        if (qrCodeContainer) {
            qrCodeContainer.innerHTML = '';
            const img = document.createElement('img');
            img.src = qrCodeUrl;
            img.width = 180;
            img.height = 180;
            qrCodeContainer.appendChild(img);
        }
    }

    function extractSecretFromURL(otpUrl) {
        try {
            const urlObj = new URL(otpUrl);
            if (urlObj.searchParams) {
                return urlObj.searchParams.get('secret');
            }
        } catch (err) {
            const match = otpUrl.match(/[?&]secret=([^&]+)/);
            if (match) return match[1];
        }
        return null;
    }

    const copyKeyButton = document.getElementById('copyKeyButton');
    if (copyKeyButton) {
        copyKeyButton.addEventListener('click', () => {
            const secretKeyText = document.getElementById('secretKeyText');
            if (secretKeyText) {
                navigator.clipboard.writeText(secretKeyText.textContent.trim());
            }
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