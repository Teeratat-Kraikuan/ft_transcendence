document.getElementById('loginForm').addEventListener('submit', function(event) {
	event.preventDefault();
	makeLogin();
});
function makeLogin() {
	const formData = new FormData(document.getElementById('loginForm'));
	formData.append('submit', 'sign-in');

	const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
	fetch('/login/', {
		method: 'POST',
		headers: {
			'X-CSRFToken': csrftoken,
			'Accept': 'application/json' // Expect a JSON response
		},
		body: formData
	})
	.then(response => response.json())
	.then(data => {
		if (data.success) {
            // Handle successful login
            console.log("Login successful");
            // Update the page content with the new HTML
			swapApp('/');
            connectWebSocket();
        } else {
            // Handle login failure
            console.log("Login failed: " + data.error);
			swapApp('/login');
        }
	})
	.catch(error => console.log(error));
}

document.getElementById('registerForm').addEventListener('submit', function(event) {
	event.preventDefault();
	makeRegister();
});
function makeRegister() {
	const formData = new FormData(document.getElementById('registerForm'));
	formData.append('submit', 'sign-up');

	const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
	fetch('/login/', {
		method: 'POST',
		headers: {
			'X-CSRFToken': csrftoken,
			'Accept': 'application/json' // Expect a JSON response
		},
		body: formData
	})
	.then(response => response.json())
	.then(data => {
		if (data.success) {
            // Handle successful login
            console.log("Register successful");
            // Update the page content with the new HTML
			swapApp('/login');
        } else {
            // Handle login failure
            console.log("Register failed: " + data.error);
			swapApp('/login');
        }
	})
	.catch(error => console.log(error));
}