document.getElementById('joinTournamentForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('joinTournamentForm'));
	updateAppPost('/game/tournament_waiting/', formData);
});