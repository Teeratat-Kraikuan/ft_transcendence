document.getElementById('loginForm').addEventListener('submit', function(event) {
	event.preventDefault();
	makeLogin();
});
function makeLogin() {
	console.log("loging in");
	const formData = new FormData(document.getElementById('loginForm'));
	formData.append('submit', 'sign-in');
	const username = formData.get('username');
	const password = formData.get('password');
	const submit = formData.get('submit');

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