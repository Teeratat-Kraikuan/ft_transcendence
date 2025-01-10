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

export let finalScore = 2;
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

window.game_main = function ()
{

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const gameCanvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: gameCanvas });
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

function resizeCanvas() {
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

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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
    document.body.appendChild(playAgainButton);

    sound.play();
    playAgainButton.addEventListener('click', () => {
        document.body.removeChild(gameOverDiv);
        document.body.removeChild(scoreDiv);
        document.body.removeChild(playAgainButton);
        resetGame();
    });
}

function resetGame() {
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


// create paddle
const paddleLeft = new Paddle();
const paddleRight = new Paddle();
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
// Create Input handler
const input = new Input();

paddleLeft.pgm.position.x = -8;
paddleRight.pgm.position.x = 8;

scene.add(paddleLeft.pgm, paddleRight.pgm);
scene.add(ball.ball); 
// scene.add(box.bgm); 
scene.add(wallUp.bgm, wallDown.bgm); 

let gameOver = false;

// Game loop
function animate() {

    // Update paddle positions based on input
    if(input.upPress == true && ((paddleRight.pgm.position.y + (paddleRight.paddleSizeY / 2)) < 5.5))
    {
        paddleRight.pgm.position.y += input.rightPaddleSpeed;
    }
    else if(input.dnPress == true && (paddleRight.pgm.position.y - (paddleRight.paddleSizeY / 2) > -5.5))
    {
        paddleRight.pgm.position.y -= input.rightPaddleSpeed;
    }

    if(input.wPress == true && ((paddleLeft.pgm.position.y + (paddleLeft.paddleSizeY / 2)) < 5.5))
    {
        paddleLeft.pgm.position.y += input.leftPaddleSpeed;
    }
    else if(input.sPress == true && ((paddleLeft.pgm.position.y - (paddleLeft.paddleSizeY / 2)) > -5.5))
    {
        paddleLeft.pgm.position.y -= input.leftPaddleSpeed;
    }

    // Update ball position
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
            return;
    }
    if (p1Score >= finalScore || p2Score >= finalScore)
    {
        gameOver = true;
    }
    requestAnimationFrame(animate);
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

    waitingP1Div = createWaitingDiv("press w", "50%", "40%");
    waitingP2Div = createWaitingDiv("press ↑", "50%", "60%");

    waitingPlayersDisplayed = true;
}

function checkReadyState() {
    renderer.render(scene, camera);
    if (input.wPress == true && document.body.contains(waitingP1Div)) {
        console.log("left ready, removing waitingP1Div");
        document.body.removeChild(waitingP1Div);
    }
    if (input.upPress == true && document.body.contains(waitingP2Div)) {
        console.log("right ready, removing waitingP2Div");
        document.body.removeChild(waitingP2Div);
    }

    if (!isGameStarted && input.wPress && input.upPress) {
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
