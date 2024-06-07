//board
let board;
let boardWidth = 500;
let boardHeight = 500;
let context;

//players
let playerWidth = 10;
let playerHeight = 50;
let playerVelocityY = 0;

let player1 = {
	x : 10,
	y : boardHeight/2,
	width : playerWidth,
	height : playerHeight,
	velocityY : playerVelocityY
}

let player2 = {
	x : boardWidth - playerWidth - 10,
	y : boardHeight/2,
	width : playerWidth,
	height : playerHeight,
	velocityY : playerVelocityY
}

//ball
let ballWidth = 10;
let ballHeight = 10;
let ball = {
	x : boardWidth / 2,
	y : boardHeight / 2,
	width : ballWidth,
	height : ballHeight,
	velocityX : 3,
	velocityY : 4
}

let player1Score = 0;
let plyaer2Score = 0;

window.onload = function() {
	board = document.getElementById("board");
	board.height = boardHeight;
	board.width = boardWidth;
	context = board.getContext("2d"); // used for drawing on the board

	//draw initial player1
	context.fillStyle = "skyblue";
	context.fillRect(player1.x, player1.y, player1.width, player1.height);

	//draw initial player2
	context.fillStyle = "skyblue";
	context.fillRect(player2.x, player2.y, player2.width, player2.height);
}

function update() {
	animationId = requestAnimationFrame(update);
	context.clearRect(0, 0, board.width, board.height);

	//plyaer 1
	context.fillStyle = "skyblue";
	// player1.y += player1.velocityY;
	let nextPlayer1Y = player1.y + player1.velocityY;
	if (!outOfBounds(nextPlayer1Y)) {
		player1.y = nextPlayer1Y;
	}
	context.fillRect(player1.x, player1.y, player1.width, player1.height);

	//player 2
	context.fillStyle = "skyblue";
	// player2.y += player2.velocityY;
	let nextPlayer2Y = player2.y + player2.velocityY;
	if (!outOfBounds(nextPlayer2Y)) {
		player2.y = nextPlayer2Y;
	}
	context.fillRect(player2.x, player2.y, player2.width, player2.height);

	// ball
	context.fillStyle = "white";
	if (playerNo == 1) {
		ball.x += ball.velocityX;
		ball.y += ball.velocityY;
		pongSocket.send(JSON.stringify({ score: userScore, start_point: false, moving: "no", ball: true, ballX: ball.x, ballY: ball.y }));
	}
	context.fillRect(ball.x, ball.y, ball.width, ball.height);

	// if ball touches top or bottom of canvas
	if (ball.y <= 0 || ball.y + ball.height >= boardHeight) {
		ball.velocityY *= -1; // reverse direction
	}

	// bounce the ball back
	if (detectCollision(ball, player1)) {
		if (ball.x <= player1.x + player1.height) {
			// left side of ball touches right side of player1
			ball.velocityX *= -1 // flip x direction
		}
	}
	else if (detectCollision(ball, player2)) {
		if (ball.x + ballWidth >= player2.x) {
			// right side of ball touches left side of player2
			ball.velocityX *= -1 // flip x direction
		}
	}

	// game over
	if (ball.x < 0) {
		if (playerNo == 2)
			increaseScore();
		resetGame(1);
	}
	else if (ball.x + ballWidth > boardWidth) {
		if (playerNo == 1)
			increaseScore();
		resetGame(-1);
	}

	// draw dotted line down the middle
	for (let i = 10; i < board.height; i += 25) {
		// i = starting y position, draw a sqaure every 25 pixels down
		//  (x position = half of boardwidth - 10), i = y position
		context.fillRect(board.width/2 - 10, i, 5, 5);
	}
}

function outOfBounds(yPosition) {
	return (yPosition < 0 || yPosition + playerHeight > boardHeight);
}

function movePlayer(e) {
	if (e.code == "ArrowUp" || e.code == "KeyW") {
		if (playerNo == 1)
			player1.velocityY = -5;
		else if (playerNo == 2)
			player2.velocityY = -5;
		pongSocket.send(JSON.stringify({ score: userScore, start_point: false, moving: "up", ball: false }));
	}
	else if (e.code == "ArrowDown" || e.code == "KeyS") {
		if (playerNo == 1)
			player1.velocityY = 5;
		else if (playerNo == 2)
			player2.velocityY = 5;
		pongSocket.send(JSON.stringify({ score: userScore, start_point: false, moving: "down", ball: false }));
	}
}

function moveOpponent(direction) {
	if (direction == "up") {
		if (playerNo == 1)
			player2.velocityY = -5;
		else if (playerNo == 2)
			player1.velocityY = -5;
	}
	else if (direction == "down") {
		if (playerNo == 1)
			player2.velocityY = 5;
		else if (playerNo == 2)
			player1.velocityY = 5;
	}
	else if (direction == "stop") {
		if (playerNo == 1)
			player2.velocityY = 0;
		else if (playerNo == 2)
			player1.velocityY = 0;
	}
}

function stopPlayer(e) {
	if (playerNo == 1)
		player1.velocityY = 0;
	else if (playerNo == 2)
		player2.velocityY = 0;
	pongSocket.send(JSON.stringify({ score: userScore, start_point: false, moving: "stop", ball: false }));
}

function detectCollision(a, b) {
	return a.x < b.x + b.width && // a's top left corner doesn't reach b's top right corner
			a.x + a.width > b.x && // a's top right corner passes b's top left corner
			a.y < b.y + b.height && // a's top left corner doesn't reach b's bottom left corner
			a.y + a.height > b.y; // a's bottom left corner passes b's top left corner
}

function resetGame(direction) {
	ball = {
		x : boardWidth / 2,
		y : boardHeight / 2,
		width : ballWidth,
		height : ballHeight,
		velocityX : direction * 2,
		velocityY : 4
	}
}