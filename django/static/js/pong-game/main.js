import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
import { Ball } from './ball.js';
import { Input } from './input.js';
import { Paddle } from './paddle.js';
import { Box } from './box.js';

// Pong v.2

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const gameCanvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: gameCanvas });
renderer.setSize(window.innerWidth, window.innerHeight);

export let finalScore = 11;
export let p1Score = 0;
export let p2Score = 0;

function updateScoreDisplay() {
    const player1ScoreElement = document.getElementById('player1Score');
    const player2ScoreElement = document.getElementById('player2Score');
    
    player1ScoreElement.textContent = p1Score;
    player2ScoreElement.textContent = p2Score;

    updateScale();
}

function updateScale() {
    const maxScore = (finalScore * 2) - 1;
    const player1Scale = document.getElementById('player1Scale');
    const player2Scale = document.getElementById('player2Scale');
    const blankScale = document.getElementById('blankScale');

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

export function addScoreP1() {
    p1Score += 1;
    console.log('p1 add = ' + p1Score);
    updateScoreDisplay();
}

export function addScoreP2() {
    p2Score += 1;
    console.log('p2 add = ' + p2Score);
    updateScoreDisplay();
}

updateScoreDisplay();

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


function gameOverMessage()
{
    const messageDiv = document.createElement('div');
    messageDiv.textContent = "GAME OVER score[" + p1Score + ":" + p2Score + "]";
    messageDiv.style.position = "absolute";
    messageDiv.style.top = "50%";
    messageDiv.style.left = "50%";
    messageDiv.style.transform = "translate(-50%, -50%)";
    messageDiv.style.fontSize = "2rem";
    messageDiv.style.color = "red";
    document.body.appendChild(messageDiv);
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

animate();
