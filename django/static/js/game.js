var settingCard = document.getElementById('settingCard');
// var singlePCard = document.getElementById('singlePCard');
var multiPCard = document.getElementById('multiPCard');

document.getElementById('settingButton').addEventListener('click', function() {
	// singlePCard.classList.remove('active');
	multiPCard.classList.remove('active');
	settingCard.classList.toggle('active');
});

// document.getElementById('singlePButton').addEventListener('click', function() {
// 	settingCard.classList.remove('active');
// 	multiPCard.classList.remove('active');
// 	singlePCard.classList.toggle('active');
// });

document.getElementById('multiPButton').addEventListener('click', function() {
	settingCard.classList.remove('active');
	// singlePCard.classList.remove('active');
	multiPCard.classList.toggle('active');
});