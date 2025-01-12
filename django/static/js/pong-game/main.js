import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
import { Ball } from './ball.js';
import { Input } from './input.js';
import { Paddle } from './paddle.js';
import { Box } from './box.js';
import { AudioPlayer } from './audio.js';

// Pong v.2

console.log("game load");

const grassImagePath    = "/static/js/pong-game/imgs/football_grass.jpg";
const sound4Path        = "/static/js/pong-game/mp3/game-countdown.mp3";
const sound6Path        = "/static/js/pong-game/mp3/win.mp3";

export let finalScore = 5;
export let p1Score = 0;
export let p2Score = 0;
export let audioPlayer = new AudioPlayer();

export function addScoreP1() {
    p1Score += 1;
    console.log('p1 add = ' + p1Score);
    window.updateScoreDisplay();
}

export function addScoreP2() {
    p2Score += 1;
    console.log('p2 add = ' + p2Score);
    window.updateScoreDisplay();
}

let scene, camera, renderer;
let animationId = null;
let resizeHandler = null;

window.game_main = function ()
{
    const valContainer = document.getElementById('mode-variable');
    const mode = valContainer ? valContainer.dataset.mode : null;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const gameCanvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: gameCanvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    window.updateScoreDisplay = updateScoreDisplay;
    updateScoreDisplay();

    function updateScoreDisplay() {
        const player1ScoreElement = document.getElementById('player1Score');
        const player2ScoreElement = document.getElementById('player2Score');
        
        if (!player1ScoreElement || !player2ScoreElement)
            return ;

        player1ScoreElement.textContent = p1Score;
        player2ScoreElement.textContent = p2Score;

        updateScale();
    }

    function updateScale() {
        const maxScore = (finalScore * 2) - 1;
        const player1Scale = document.getElementById('player1Scale');
        const player2Scale = document.getElementById('player2Scale');
        const blankScale = document.getElementById('blankScale');

        if (!player1Scale || !player2Scale || !blankScale)
            return ;

        const player1Percent = (p1Score / maxScore) * 100;
        const player2Percent = (p2Score / maxScore) * 100;
        const blankPercent = 100 - player1Percent - player2Percent;

        player1Scale.style.width = `${player1Percent}%`;
        player2Scale.style.width = `${player2Percent}%`;
        blankScale.style.width = `${blankPercent}%`;

        player1Scale.setAttribute('aria-valuenow', player1Percent);
        player2Scale.setAttribute('aria-valuenow', player2Percent);
        blankScale.setAttribute('aria-valuenow', blankPercent);
    }

    resizeHandler = function resizeCanvas() {
        const canvasContainer = gameCanvas.parentElement.getBoundingClientRect();
        let canvasWidth = canvasContainer.width;
        const maxCanvasWidth = window.innerWidth - 100;
        if (canvasWidth > maxCanvasWidth) {
            canvasWidth = maxCanvasWidth;
        }

        const canvasHeight = canvasWidth * (3 / 5); // Maintain the aspect ratio (5:3)

        gameCanvas.width = canvasWidth;
        gameCanvas.height = canvasHeight;

        renderer.setSize(canvasWidth, canvasHeight);

        camera.aspect = canvasWidth / canvasHeight;
        camera.updateProjectionMatrix();
    }

    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    //-------------------floor-------------------------
    const grassTextureLoader = new THREE.TextureLoader();
    const grass = grassTextureLoader.load(grassImagePath);

    grass.wrapS = THREE.RepeatWrapping; // Horizontal wrapping
    grass.wrapT = THREE.RepeatWrapping; // Vertical wrapping

    grass.repeat.set(3, 3);

    const floorPlaneGeometry = new THREE.PlaneGeometry(20, 12);
    const floorPlaneMaterial = new THREE.MeshLambertMaterial({ map: grass});
    const floorMesh = new THREE.Mesh(floorPlaneGeometry, floorPlaneMaterial);
    scene.add(floorMesh);
    floorMesh.position.set(0, 0, 0);
    floorMesh.receiveShadow = true;
    //-------------------floor------------------------


    //-------------------light-------------------------

    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // White light, intensity 0.5
    // scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light, intensity 1
    directionalLight.position.set(-12, -12, 10); // Set the light position
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    //-------------------light-------------------------


    //-------------------gameOverMessage-------------------------


    function gameOverMessage() {
        const sound = audioPlayer.load("gameOver", sound6Path);
        const gameOverDiv = document.createElement('div');
        gameOverDiv.textContent = `GAME OVER`;
        gameOverDiv.style.position = "absolute";
        gameOverDiv.style.top = "45%";
        gameOverDiv.style.left = "50%";
        gameOverDiv.style.transform = "translate(-50%, -50%)";
        gameOverDiv.style.fontSize = "1rem";
        gameOverDiv.style.color = "white";
        document.body.appendChild(gameOverDiv);

        const scoreDiv = document.createElement('div');
        scoreDiv.textContent = `${p1Score} : ${p2Score}`;
        scoreDiv.style.position = "absolute";
        scoreDiv.style.top = "40%";
        scoreDiv.style.left = "50%";
        scoreDiv.style.transform = "translate(-50%, -50%)";
        scoreDiv.style.fontSize = "3rem";
        scoreDiv.style.color = "white";
        document.body.appendChild(scoreDiv);

        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = "Play Again";
        playAgainButton.style.position = "absolute";
        playAgainButton.style.top = "55%";
        playAgainButton.style.left = "50%";
        playAgainButton.style.transform = "translate(-50%, -50%)";
        playAgainButton.style.padding = "10px 20px";
        playAgainButton.style.fontSize = "1rem";
        playAgainButton.style.cursor = "pointer";
        playAgainButton.classList.add('btn', 'btn-primary');

        console.log("Adding event listener to play again button");
        
        playAgainButton.addEventListener('click', () => {
            console.log("Play again button clicked");
            document.body.removeChild(gameOverDiv);
            document.body.removeChild(scoreDiv);
            document.body.removeChild(playAgainButton);
            resetGame();
        });
        document.body.appendChild(playAgainButton);
        
        sound.play();
    }

    function resetGame() {
        console.log("Resetting the game...");
        p1Score = 0;
        p2Score = 0;
        waitingPlayersDisplayed = false;
        gameOver = false;
        isGameStarted = false;

        paddleLeft.pgm.position.y = 0;
        paddleRight.pgm.position.y = 0;

        cancelAnimationFrame(animate);
        updateScoreDisplay();
        checkReadyState();
    }

    //-------------------gameOverMessage-------------------------

    
    // Create Input handler
    const input = new Input();
    // create paddle
    const paddleLeft = new Paddle(input.pSpeed);
    const paddleRight = new Paddle(input.pSpeed);
    // Create the ball
    const ball = new Ball();
    ball.castShadow = true;

    // Create the box
    const wallUp = new Box(20, 1, 0.5);
    const wallDown = new Box(20, 1, 0.5);
    wallUp.castShadow = true;
    wallDown.castShadow = true;

    wallUp.bgm.position.y = 5.7;
    wallDown.bgm.position.y = -5.7;

    // Camera position
    camera.position.z = 8;

    paddleLeft.pgm.position.x = -8;
    paddleRight.pgm.position.x = 8;

    scene.add(paddleLeft.pgm, paddleRight.pgm);
    scene.add(ball.ball); 
    // scene.add(box.bgm); 
    scene.add(wallUp.bgm, wallDown.bgm); 

    let gameOver = false;

    // function botControl() {
    //     const botSpeed = 0.07;
    //     if (ball.ball.position.y > paddleLeft.pgm.position.y) {
    //         paddleLeft.pgm.position.y += botSpeed;
    //     } else if (ball.ball.position.y < paddleLeft.pgm.position.y) {
    //         paddleLeft.pgm.position.y -= botSpeed;
    //     }
    // }

    function botControl() {
        // Bot parameters
        const botSpeed = 0.1;
        const predictionPrecision = 0.7;
        const reactionThreshold = 5;
        const smallErrorMargin = 0.4;

        // Check if the ball is on the bot's side and within reaction range
        if (ball.ball.position.x < -0.2 && Math.abs(ball.ball.position.x - paddleLeft.pgm.position.x) < reactionThreshold) {
            // Predict the ball's Y position with a small margin of error
            const predictedBallY = ball.ball.position.y * predictionPrecision + 
                                (Math.random() * smallErrorMargin - smallErrorMargin / 2);

            // Move the bot paddle towards the predicted Y position
            if (paddleLeft.pgm.position.y < predictedBallY) {
                paddleLeft.up();
            } else if (paddleLeft.pgm.position.y > predictedBallY) {
                paddleLeft.down();
            }
        } else if (ball.ball.position.x <= 0) {
            // Add subtle delay or distraction when the ball is on the opponent's side
            // Math.random() * 0.05 - 0.01
            paddleLeft.up(Math.random() * .8 - 0.1);
        }
    }

    // Game loop
    function animate() {
        animationId = requestAnimationFrame(animate);

        // arrow key control
        if (input.upPress)
            paddleRight.up();
        else if (input.dnPress)
            paddleRight.down();

        // w s key control
        if (mode === 'multi') {
            if (input.wPress && paddleLeft.pgm.position.y + paddleLeft.paddleSizeY / 2 < 5.5) {
                paddleLeft.pgm.position.y += input.leftPaddleSpeed;
            } else if (input.sPress && paddleLeft.pgm.position.y - paddleLeft.paddleSizeY / 2 > -5.5) {
                paddleLeft.pgm.position.y -= input.leftPaddleSpeed;
            }
        } else if (mode === 'single') {
            botControl();
        }

        // Update ball position
        if (!gameOver)
            ball.update();
        // Check for collisions with paddles
        ball.checkPaddleCollision(paddleLeft);
        ball.checkPaddleCollision(paddleRight);
        
        // Render the scene
        renderer.render(scene, camera);
        // update score
        
        if(gameOver == true)
        {
                // show gameOVermessage
                gameOverMessage();
                cancelAnimationFrame(animationId);
                return;
        }
        if (p1Score >= finalScore || p2Score >= finalScore)
        {
            gameOver = true;
        }
        
    }

    // animate();

    let isGameStarted = false;

    function startCountdown() {
        const sound = audioPlayer.load("countDown", sound4Path);
        const countdownDiv = document.createElement('div');
        countdownDiv.style.position = "absolute";
        countdownDiv.style.top = "50%";
        countdownDiv.style.left = "50%";
        countdownDiv.style.transform = "translate(-50%, -50%)";
        countdownDiv.style.fontSize = "3rem";
        countdownDiv.style.color = "white";
        document.body.appendChild(countdownDiv);

        let countdown = 3;
        countdownDiv.textContent = countdown;

        sound.play();
        const countdownInterval = setInterval(() => {
            if (!document.body.contains(countdownDiv))
            {
                clearInterval(countdownInterval);
                return ;
            }
            countdown -= 1;
            if (countdown > 0) {
                countdownDiv.textContent = countdown;
            } else {
                clearInterval(countdownInterval);
                document.body.removeChild(countdownDiv);
                isGameStarted = true;
                animate();
            }
        }, 1000);
    }


    let waitingP1Div;
    let waitingP2Div;

    let waitingPlayersDisplayed = false;

    function waitingForPlayers() {
        if (waitingPlayersDisplayed) return;

        console.log("Waiting for players..., creating waitingP1Div and waitingP2Div");

        const createWaitingDiv = (text, top, left) => {
            const div = document.createElement('div');
            div.textContent = text;
            div.style.position = "absolute";
            div.style.top = top;
            div.style.left = left;
            div.style.transform = "translate(-50%, -50%)";
            div.style.fontSize = "1rem";
            div.style.color = "white";
            document.body.appendChild(div);
            return div;
        };

        if (mode == "multi") {
            waitingP1Div = createWaitingDiv("press w", "50%", "40%");
        }
        waitingP2Div = createWaitingDiv("press ↑", "50%", "60%");

        waitingPlayersDisplayed = true;
    }

    function checkReadyState() {

        if (!scene || !renderer)
            return;

        renderer.render(scene, camera);
        
        if (mode == 'multi' && input.wPress == true && document.body.contains(waitingP1Div)) {
            console.log("left ready, removing waitingP1Div");
            document.body.removeChild(waitingP1Div);
        }
        if (input.upPress == true && document.body.contains(waitingP2Div)) {
            console.log("right ready, removing waitingP2Div");
            document.body.removeChild(waitingP2Div);
        }

        if (!isGameStarted && input.upPress && mode == "single" || (mode == "multi" && input.wPress && input.upPress)) {
            console.log("Both players are ready. Starting countdown...");
            startCountdown();
        } else {
            waitingForPlayers();
            requestAnimationFrame(checkReadyState);
        }
    }

    checkReadyState();

    return Object.freeze({
        resetGame,
        audioPlayer
    });

}

window.unloadGameMain = function() {
    console.log("Unloading the Pong Game...");

    // 1. Cancel the animation loop
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // 2. Remove event listeners
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }

    // 3. Dispose of Three.js objects
    if (scene) {
        scene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }
    if (renderer) {
        renderer.dispose();
    }

    // 4. Remove any dynamic DOM elements created by the game
    const dynamicElements = document.querySelectorAll('.gameOverDiv, .waitingP1Div, .waitingP2Div, #countdownDiv');
    dynamicElements.forEach(el => el.remove());

    // 5. Reset global variables
    scene        = null;
    camera       = null;
    renderer     = null;
    p1Score      = 0;
    p2Score      = 0;
    audioPlayer.unloadAll();  // if you want to unload all sounds
    console.log("All game resources disposed.");

    // // 6. (Optional) Delete window.game_main if you want to completely remove it
    // delete window.game_main;
    // delete window.unloadGameMain;
};