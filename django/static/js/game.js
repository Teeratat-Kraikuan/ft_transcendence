document.getElementById('singlePButton').addEventListener('click', function() {
	document.getElementById('multiPCard').classList.remove('active');
	document.getElementById('singlePCard').classList.toggle('active');
});
	
document.getElementById('multiPButton').addEventListener('click', function() {
	document.getElementById('singlePCard').classList.remove('active');
	document.getElementById('multiPCard').classList.toggle('active');
});

if (typeof submissionType === 'undefined') {
	let submissionType = '';
}

document.getElementById('createRoomBtn').addEventListener('click', function() {
    submissionType = this.value;
});

document.getElementById('joinRoomBtn').addEventListener('click', function() {
    submissionType = this.value;
});

document.getElementById('multiPlayerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('multiPlayerForm'));
    formData.append('type', submissionType);  // Manually add the type to the FormData object
    const type = formData.get('type');
	window.history.pushState({}, '', '/game/pong/');
    if (type === 'create') {
		console.log("creating room");
    } else if (type === 'join') {
		console.log("joining room");
    }
	updateAppPost('/game/pong/', formData);
});