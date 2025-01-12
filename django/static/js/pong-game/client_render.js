import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
import { Ball } from './ball.js';
import { Paddle } from './paddle.js';
import { Box } from './box.js';
import { AudioPlayer } from './audio.js';
import { Input } from './input.js';

console.log("game load");

// Paths for images and sounds
const grassImagePath = "/static/js/pong-game/imgs/football_grass.jpg";
const sound4Path      = "/static/js/pong-game/mp3/game-countdown.mp3";
const sound6Path      = "/static/js/pong-game/mp3/win.mp3";

export let finalScore = 5;
export let p1Score = 0;
export let p2Score = 0;
export let audioPlayer = new AudioPlayer();

// "Global" references
let scene, camera, renderer;
let animationId = null;
let resizeHandler = null;
let gameCanvas;

// 3D objects
let paddleLeft, paddleRight;
let ball;
let wallUp, wallDown;

// State flags
let isGameStarted = false;
let gameOver = false;
let waitingPlayersDisplayed = false;

export var waitingP1Div;

window.game_main = function() {
    
    setupScene();
    
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
    
    resizeHandler = function resizeCanvas() {
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
    resizeHandler();
    window.addEventListener('resize', resizeHandler);
    
    camera.position.z = 8;
}

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
    if (!scene || !renderer)
        return;
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
export function updateFromServer(gameState) {
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

    if (typeof gameState.final_score !== 'undefined') {
        finalScore = gameState.final_score;
    }
    if (gameState.game_over) {
        gameOver = true;
        gameOverMessage();
    }
}

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

    player1Scale.setAttribute('aria-valuenow', player1Percent);
    player2Scale.setAttribute('aria-valuenow', player2Percent);
    blankScale.setAttribute('aria-valuenow', blankPercent);
}

function gameOverMessage() {
    const sound = audioPlayer.load("gameOver", sound6Path);

    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = "Done";
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
        redirect('/home/');
    });
}

function checkReadyState() {
    // Just a minimal version: you might wait for keyboard input or the server
    // to say “both players joined.” For now, let’s re-use your “wPress/upPress” approach
    // if you want local triggers.
    if (!scene || !renderer)
        return;

    renderer.render(scene, camera);
    if (!isGameStarted && input.space) {
        document.body.removeChild(waitingP1Div);
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
            fontSize: "2rem",
            color: "white"
        });
        document.body.appendChild(div);
        return div;
    };

    waitingP1Div = createWaitingDiv("press space", "50%", "50%");
    waitingPlayersDisplayed = true;
}

function redirect(url) {
    console.log(`Routing to ${url} ...`);
    // Basic safety check if the URL is external:
    if (new URL(url, document.location).hostname !== location.hostname) {
        if (!confirm(`Potential risk up ahead! Are you sure you want to follow this link?\nURL: ${url}`)) {
            return console.log("Routing cancelled.");
        }
        location.href = url;
        return;
    }
    window.history.pushState({}, "", url);
    handle_location();
}

async function handle_location() {
    // A minimal approach to fetch the new page content and update the DOM
    // same as in your logout.js example.
    const data = await fetch(window.location.pathname, { credentials: "include" });
    const html = document.createElement("html");

    // If there's a global 'unload' function for cleaning up game scripts:
    if (typeof window.unload === "function") {
        window.unload();
        window.unload = null;
    }

    html.innerHTML = await data.text();
    document.body = html.getElementsByTagName("body")[0];
    document.head.innerHTML = html.getElementsByTagName("head")[0].innerHTML;

    // Re-load scripts
    html.querySelectorAll("script[src]").forEach(el => {
        if (el.hasAttribute("load-once")) return;
        let script = document.createElement("script");
        script.src = el.src;
        script.type = el.type || "text/javascript";
        if (el.defer) script.defer = true;
        document.head.appendChild(script);
    });
}

function resetGame() {}

// We can still create a global input if you want local key events:
const input = new Input();

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