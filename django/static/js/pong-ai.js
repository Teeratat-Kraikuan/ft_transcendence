(function() {
    const canvas = document.getElementById("pongCanvas");
    const context = canvas.getContext("2d");

    // Ball properties
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = 5;
    let ballSpeedY = 5;
    const ballSize = 10;

    // Paddle properties
    const paddleWidth = 10;
    const paddleHeight = 100;
    let paddle1Y = canvas.height / 2 - paddleHeight / 2;
    let paddle2Y = canvas.height / 2 - paddleHeight / 2;
    const paddleSpeed = 5; // Adjusted speed for the bot

    // Scores
    let player1Score = 0;
    let player2Score = 0;
    const winningScore = 10;

    // Keyboard controls
    let upPressed = false;
    let downPressed = false;
    let spacePressed = false; // Track spacebar press for pause and restart

    // Pause state
    let paused = false;

    // Game over state
    let gameOver = false;

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    function keyDownHandler(event) {
        if (event.key === "ArrowUp" || event.key === "w") {
            upPressed = true;
        } else if (event.key === "ArrowDown" || event.key === "s") {
            downPressed = true;
        } else if (event.key === " ") { // Spacebar for pause and restart
            spacePressed = true;
            if (gameOver) {
                restartGame();
            } else {
                paused = !paused; // Toggle pause state
            }
        }
    }

    function keyUpHandler(event) {
        if (event.key === "ArrowUp" || event.key === "w") {
            upPressed = false;
        } else if (event.key === "ArrowDown" || event.key === "s") {
            downPressed = false;
        } else if (event.key === " ") {
            spacePressed = false;
        }
    }

    function draw() {
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw paddles
        context.fillStyle = "white";
        context.fillRect(0, paddle1Y, paddleWidth, paddleHeight);
        context.fillRect(canvas.width - paddleWidth, paddle2Y, paddleWidth, paddleHeight);

        // Draw ball
        context.beginPath();
        context.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
        context.fillStyle = "white";
        context.fill();
        context.closePath();

        // Draw scores
        context.font = "20px Arial";
        context.fillStyle = "white";
        context.fillText("Player 1: " + player1Score, 100, 50);
        context.fillText("Player 2: " + player2Score, canvas.width - 200, 50);

        // Draw pause or game over text
        if (paused && !gameOver) {
            context.fillStyle = "white";
            context.font = "30px Arial";
            context.fillText("PAUSED", canvas.width / 2 - 50, canvas.height / 2);
        } else if (gameOver) {
            context.fillStyle = "white";
            context.font = "30px Arial";
            context.fillText("GAME OVER", canvas.width / 2 - 80, canvas.height / 2);
            context.fillText("Press Spacebar to Restart", canvas.width / 2 - 170, canvas.height / 2 + 40);
        }
    }

    function update() {
        if (!paused && !gameOver) {
            // Move paddles based on keyboard input for player 1
            if (upPressed && paddle1Y > 0) {
                paddle1Y -= paddleSpeed;
            } else if (downPressed && paddle1Y < canvas.height - paddleHeight) {
                paddle1Y += paddleSpeed;
            }

            // AI for player 2 (bot)
            // Calculate where the ball will hit and move paddle2Y towards that point
            if (ballSpeedX > 0) { // Only move if the ball is moving towards the bot's side
                const framesToCollision = Math.abs((ballX - canvas.width + paddleWidth) / ballSpeedX);
                const predictedBallY = ballY + ballSpeedY * framesToCollision;

                if (paddle2Y + paddleHeight / 2 < predictedBallY && paddle2Y < canvas.height - paddleHeight) {
                    paddle2Y += paddleSpeed;
                } else if (paddle2Y + paddleHeight / 2 > predictedBallY && paddle2Y > 0) {
                    paddle2Y -= paddleSpeed;
                }
            }

            // Move ball
            ballX += ballSpeedX;
            ballY += ballSpeedY;

            // Collision detection with walls
            if (ballY - ballSize < 0 || ballY + ballSize > canvas.height) {
                ballSpeedY = -ballSpeedY;
            }

            // Collision detection with paddles
            if (ballX - ballSize < paddleWidth) {
                if (ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
                    ballSpeedX = -ballSpeedX;
                } else {
                    player2Score++;
                    updateScore();
                    checkGameOver();
                    resetBall();
                }
            }

            if (ballX + ballSize > canvas.width - paddleWidth) {
                if (ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
                    ballSpeedX = -ballSpeedX;
                } else {
                    player1Score++;
                    updateScore();
                    checkGameOver();
                    resetBall();
                }
            }
        }
    }

    function resetGame() {
        player1Score = 0;
        player2Score = 0;
        updateScore();
        resetBall();
        paddle1Y = canvas.height / 2 - paddleHeight / 2;
        paddle2Y = canvas.height / 2 - paddleHeight / 2;
        paused = false;
        gameOver = false;
    }

    function restartGame() {
        resetGame();
        gameLoop();
    }

    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX;
    }

    function checkGameOver() {
        if (player1Score >= winningScore || player2Score >= winningScore) {
            gameOver = true;
        }
    }

    function gameLoop() {
        update();
        draw();
        if (gameOver) {
            // Stop game loop if game is over
            return;
        }
        requestAnimationFrame(gameLoop);
    }

    gameLoop();

    function updateScore() {
        document.getElementById("player1Score").innerHTML = player1Score;
		document.getElementById("player2Score").innerHTML = player2Score;

        document.getElementById("player2Scale").style.width = player2Score * 5 + "%";
        document.getElementById("player1Scale").style.width = player1Score * 5 + "%";
        document.getElementById("blankScale").style.width = (20 - player1Score - player2Score) * 5 + "%";
    }
})();
