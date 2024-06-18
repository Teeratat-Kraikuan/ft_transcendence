// var settingCard = document.getElementById('settingCard');
// var multiPCard = document.getElementById('multiPCard');

// document.getElementById('multiPButton').addEventListener('click', function() {
// 	multiPCard.classList.toggle('active');
// 	document.getElementById('multiPCard').classList.toggle('active');
// 	});
	
document.getElementById('singlePButton').addEventListener('click', function() {
	document.getElementById('multiPCard').classList.remove('active');
	document.getElementById('singlePCard').classList.toggle('active');
});
	
document.getElementById('multiPButton').addEventListener('click', function() {
	document.getElementById('singlePCard').classList.remove('active');
	document.getElementById('multiPCard').classList.toggle('active');
});
	