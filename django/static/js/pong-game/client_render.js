import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
import { Ball } from './ball.js';
import { Paddle } from './paddle.js';
import { Box } from './box.js';
import { AudioPlayer } from './audio.js';
import { Input } from './input.js';

// Paths for images and sounds
const grassImagePath = "/static/js/pong-game/imgs/football_grass.jpg";
const sound4Path      = "/static/js/pong-game/mp3/game-countdown.mp3";
const sound6Path      = "/static/js/pong-game/mp3/win.mp3";

// We keep these exports so the structure is similar to your original code
export let finalScore = 2;
export let p1Score = 0;
export let p2Score = 0;
export let audioPlayer = new AudioPlayer();

// "Global" references
let scene, camera, renderer;
let gameCanvas;

// 3D objects
let paddleLeft, paddleRight;
let ball;
let wallUp, wallDown;

// State flags
let isGameStarted = false;
let gameOver = false;
let waitingPlayersDisplayed = false;

/** 
 * This function replaces your old local game logic with a purely render-based approach.
 * You can call `window.game_main('single')` or `window.game_main('multi')` from the HTML.
 */
window.game_main = function() {
    
    // Initialize Three.js scene
    setupScene();

    // Initialize scoreboard display
    window.updateScoreDisplay = updateScoreDisplay;
    updateScoreDisplay();

    // Create 3D objects (paddles, ball, walls, floor, lights)
    createGameObjects();

    // Start the checkReadyState loop (waiting for user input or server).
    checkReadyState();

    // Return an object that might be useful externally
    return Object.freeze({
        resetGame,
        audioPlayer,
        updateFromServer, // <-- new function to sync with server logic
    });
};

/**
 * 1) Create and configure the scene, camera, renderer.
 */
function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    gameCanvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: gameCanvas });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    camera.position.z = 8;
}

/**
 * 2) Create the paddles, ball, walls, and other 3D objects,
 *    but do NOT do any local collision logic.
 */
function createGameObjects() {
    // Floor (grass)
    const grassTextureLoader = new THREE.TextureLoader();
    const grass = grassTextureLoader.load(grassImagePath);
    grass.wrapS = THREE.RepeatWrapping;
    grass.wrapT = THREE.RepeatWrapping;
    grass.repeat.set(3, 3);

    const floorPlaneGeometry = new THREE.PlaneGeometry(20, 12);
    const floorPlaneMaterial = new THREE.MeshLambertMaterial({ map: grass });
    const floorMesh = new THREE.Mesh(floorPlaneGeometry, floorPlaneMaterial);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-12, -12, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Paddles
    paddleLeft = new Paddle();
    paddleRight = new Paddle();
    paddleLeft.pgm.position.x = -8;
    paddleRight.pgm.position.x = 8;

    // Ball
    ball = new Ball();
    ball.castShadow = true;

    // Walls
    wallUp = new Box(20, 1, 0.5);
    wallDown = new Box(20, 1, 0.5);
    wallUp.bgm.position.y = 5.7;
    wallDown.bgm.position.y = -5.7;
    wallUp.castShadow = true;
    wallDown.castShadow = true;

    // Add objects to scene
    scene.add(paddleLeft.pgm, paddleRight.pgm);
    scene.add(ball.ball);
    scene.add(wallUp.bgm, wallDown.bgm);

    // Start rendering loop
    requestAnimationFrame(renderLoop);
}

/**
 * The render loop simply draws the scene each frame.
 * We do NOT update ball/paddle positions here (that’s from the server).
 */
function renderLoop() {
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
}

/**
 * 3) A new function that receives game state from the server,
 *    then updates the 3D objects accordingly, instead of local collisions.
 *
 * Example state data from the server:
 *  {
 *    ball_x: 1.2, ball_y: 0.4,
 *    left_paddle_y: 1.0,
 *    right_paddle_y: -1.5,
 *    p1_score: 1,
 *    p2_score: 2,
 *    game_over: false
 *  }
 */
function updateFromServer(gameState) {
    // 1) Update ball position
    if (ball && ball.ball) {
        ball.ball.position.x = gameState.ball_x || 0;
        ball.ball.position.y = gameState.ball_y || 0;
    }

    // 2) Update paddle positions
    if (paddleLeft && paddleLeft.pgm) {
        paddleLeft.pgm.position.y = gameState.left_paddle_y || 0;
    }
    if (paddleRight && paddleRight.pgm) {
        paddleRight.pgm.position.y = gameState.right_paddle_y || 0;
    }

    // 3) Update scores
    if (typeof gameState.p1_score !== 'undefined') {
        p1Score = gameState.p1_score;
    }
    if (typeof gameState.p2_score !== 'undefined') {
        p2Score = gameState.p2_score;
    }
    updateScoreDisplay();

    // If the server sets finalScore or game_over, handle it
    if (typeof gameState.final_score !== 'undefined') {
        finalScore = gameState.final_score;
    }
    if (gameState.game_over) {
        gameOver = true;
        gameOverMessage();
    }
}

/**
 * 4) Scoreboard UI updates, same as your original code,
 *    but we do NOT increment p1Score/p2Score locally.
 */
function updateScoreDisplay() {
    const player1ScoreElement = document.getElementById('player1Score');
    const player2ScoreElement = document.getElementById('player2Score');
    if (!player1ScoreElement || !player2ScoreElement) return;

    player1ScoreElement.textContent = p1Score;
    player2ScoreElement.textContent = p2Score;

    updateScale();
}

function updateScale() {
    const maxScore = (finalScore * 2) - 1;
    const player1Scale = document.getElementById('player1Scale');
    const player2Scale = document.getElementById('player2Scale');
    const blankScale = document.getElementById('blankScale');
    if (!player1Scale || !player2Scale || !blankScale) return;

    const player1Percent = (p1Score / maxScore) * 100;
    const player2Percent = (p2Score / maxScore) * 100;
    const blankPercent = 100 - player1Percent - player2Percent;

    player1Scale.style.width = `${player1Percent}%`;
    player2Scale.style.width = `${player2Percent}%`;
    blankScale.style.width = `${blankPercent}%`;
}

/**
 * 5) Resize the canvas whenever the window changes size.
 */
function resizeCanvas() {
    const canvasContainer = gameCanvas.parentElement.getBoundingClientRect();
    let canvasWidth = canvasContainer.width;
    const maxCanvasWidth = window.innerWidth - 100;
    if (canvasWidth > maxCanvasWidth) {
        canvasWidth = maxCanvasWidth;
    }
    const canvasHeight = canvasWidth * (3 / 5); // Maintain (5:3) ratio

    gameCanvas.width = canvasWidth;
    gameCanvas.height = canvasHeight;
    renderer.setSize(canvasWidth, canvasHeight);

    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
}

/**
 * 6) “Game Over” overlay. You can still call this if the server says game_over = true.
 */
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
    document.body.appendChild(playAgainButton);

    sound.play();
    playAgainButton.addEventListener('click', () => {
        document.body.removeChild(gameOverDiv);
        document.body.removeChild(scoreDiv);
        document.body.removeChild(playAgainButton);
        resetGame();
    });
}

/**
 * 7) Reset game visuals; you might also ask the server to reset.
 *    But locally, we’ll just reset scores, flags, etc.
 */
function resetGame() {
    p1Score = 0;
    p2Score = 0;
    waitingPlayersDisplayed = false;
    gameOver = false;
    isGameStarted = false;

    // Move paddles back to center
    if (paddleLeft)  paddleLeft.pgm.position.y = 0;
    if (paddleRight) paddleRight.pgm.position.y = 0;

    updateScoreDisplay();
    checkReadyState();
}

/**
 * 8) The “waiting for players” logic, or “start countdown” logic,
 *    but we remove all local collisions. We only handle the countdown
 *    and then let the server run the actual game logic.
 */
function checkReadyState() {
    // Just a minimal version: you might wait for keyboard input or the server
    // to say “both players joined.” For now, let’s re-use your “wPress/upPress” approach
    // if you want local triggers.

    renderer.render(scene, camera);
    if (!isGameStarted && input.upPress) {
        console.log("Both players are ready. Starting countdown...");
        startCountdown();
    } else {
        waitingForPlayers();
        requestAnimationFrame(checkReadyState);
    }
}

function waitingForPlayers() {
    if (waitingPlayersDisplayed) return;
    console.log("Waiting for players...");

    const createWaitingDiv = (text, top, left) => {
        const div = document.createElement('div');
        div.textContent = text;
        Object.assign(div.style, {
            position: "absolute",
            top,
            left,
            transform: "translate(-50%, -50%)",
            fontSize: "1rem",
            color: "white"
        });
        document.body.appendChild(div);
        return div;
    };

    createWaitingDiv("press w", "50%", "40%");
    createWaitingDiv("press ↑", "50%", "60%");
    waitingPlayersDisplayed = true;
}

function startCountdown() {
    const sound = audioPlayer.load("countDown", sound4Path);
    const countdownDiv = document.createElement('div');
    Object.assign(countdownDiv.style, {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "3rem",
        color: "white"
    });
    document.body.appendChild(countdownDiv);

    let countdown = 3;
    countdownDiv.textContent = countdown;
    sound.play();

    const countdownInterval = setInterval(() => {
        if (!document.body.contains(countdownDiv)) {
            clearInterval(countdownInterval);
            return;
        }
        countdown--;
        if (countdown > 0) {
            countdownDiv.textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            document.body.removeChild(countdownDiv);
            isGameStarted = true;
            // No local animate() call that moves ball or checks collisions!
            // We rely on the server to send positions. (But if you still want
            // a local "requestAnimationFrame" for something else, you can do it.)
        }
    }, 1000);
}

// We can still create a global input if you want local key events:
const input = new Input();