(function() {
	// Pong game variables
	let canvas, ctx;
	let ballX, ballY, ballSpeedX, ballSpeedY;
	let paddle1Y, paddle2Y;
	const PADDLE_HEIGHT = 100;
	const PADDLE_WIDTH = 10;
	const BALL_RADIUS = 10;
	const PADDLE_SPEED = 10; // adjust paddle movement speed
	let player1Score = 0, player2Score = 0;
	let showingWinScreen = false;
	let gameInterval;
	
	// Initialize game
	function gameInit() {
		canvas = document.getElementById('pongCanvas');
		ctx = canvas.getContext('2d');
	
		// Initial positions
		paddle1Y = canvas.height / 2 - PADDLE_HEIGHT / 2;
		paddle2Y = canvas.height / 2 - PADDLE_HEIGHT / 2;
		ballReset();
	
		// Game loop
		let framesPerSecond = 30;
		gameInterval = setInterval(function() {
			moveEverything();
			drawEverything();
		}, 1000 / framesPerSecond);
	
		// Event listeners for player movement
		document.addEventListener('keydown', handleKeyDown);
	}
	
	function handleKeyDown(event) {
		if (event.key === 'w') {
			paddle1Y -= PADDLE_SPEED;
		} else if (event.key === 's') {
			paddle1Y += PADDLE_SPEED;
		}
		if (event.key === 'ArrowUp') {
			paddle2Y -= PADDLE_SPEED;
		} else if (event.key === 'ArrowDown') {
			paddle2Y += PADDLE_SPEED;
		}
	}
	
	function ballReset() {
		if (player1Score >= 10 || player2Score >= 10) {
			showingWinScreen = true;
		}
	
		ballX = canvas.width / 2;
		ballY = canvas.height / 2;
		ballSpeedX = 5; // initial speed of the ball
		ballSpeedY = 0; // reset to zero
	}
	
	function moveEverything() {
		if (showingWinScreen) {
			return;
		}
	
		ballX += ballSpeedX;
		ballY += ballSpeedY;
	
		if (ballX < 0) {
			if (ballY > paddle1Y && ballY < paddle1Y + PADDLE_HEIGHT) {
				ballSpeedX = -ballSpeedX;
	
				let deltaY = ballY - (paddle1Y + PADDLE_HEIGHT / 2);
				ballSpeedY = deltaY * 0.35;
			} else {
				player2Score++; // must be before ballReset()
				ballReset();
				changeScale();
			}
		}
		if (ballX > canvas.width) {
			if (ballY > paddle2Y && ballY < paddle2Y + PADDLE_HEIGHT) {
				ballSpeedX = -ballSpeedX;
	
				let deltaY = ballY - (paddle2Y + PADDLE_HEIGHT / 2);
				ballSpeedY = deltaY * 0.35;
			} else {
				player1Score++; // must be before ballReset()
				ballReset();
				changeScale();
			}
		}
		if (ballY < 0) {
			ballSpeedY = -ballSpeedY;
		}
		if (ballY > canvas.height) {
			ballSpeedY = -ballSpeedY;
		}
	}
	
	function drawEverything() {
		// draw board
		colorRect(0, 0, canvas.width, canvas.height, 'black');
	
		if (showingWinScreen) {
			ctx.fillStyle = 'white';
	
			if (player1Score >= 3) {
				ctx.fillText("Player 1 Won!", 350, 200);
			} else if (player2Score >= 3) {
				ctx.fillText("Player 2 Won!", 350, 200);
			}
	
			ctx.fillText("click to continue", 350, 500);
			return;
		}
	
		// draw left player paddle
		colorRect(0, paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');
	
		// draw right player paddle
		colorRect(canvas.width - PADDLE_WIDTH, paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');
	
		// draw ball
		colorCircle(ballX, ballY, BALL_RADIUS, 'white');
	
		// draw scores
		// ctx.fillText(player1Score, 100, 100);
		// ctx.fillText(player2Score, canvas.width - 100, 100);
		document.getElementById("player1Score").innerHTML = player1Score;
		document.getElementById("player2Score").innerHTML = player2Score;
	}
	
	function colorCircle(centerX, centerY, radius, drawColor) {
		ctx.fillStyle = drawColor;
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
		ctx.fill();
	}
	
	function colorRect(leftX, topY, width, height, drawColor) {
		ctx.fillStyle = drawColor;
		ctx.fillRect(leftX, topY, width, height);
	}
	
	function changeScale() {
		document.getElementById("player2Scale").style.width = player2Score * 5 + "%";
		document.getElementById("player1Scale").style.width = player1Score * 5 + "%";
		document.getElementById("blankScale").style.width = (20 - player1Score - player2Score) * 5 + "%";
	}
	
	function cleanup() {
		clearInterval(gameInterval);
		document.removeEventListener('keydown', handleKeyDown);
		canvas = null;
		ctx = null;
		// console.log("Cleaned up pong-local.js");
	}
	
	// Start the game
	gameInit();
	
	// Expose cleanup function
	window.cleanupPongAI = cleanup;
	})();
	