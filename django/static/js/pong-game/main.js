import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
import { Ball } from './ball.js';
import { Input } from './input.js';
import { Paddle } from './paddle.js';
import { Box } from './box.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const gameCanvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: gameCanvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const paddleLeft = new Paddle();
const paddleRight = new Paddle();

const ball = new Ball();

const wallUp = new Box(20, 1, 0.5);
const wallDown = new Box(20, 1, 0.5);

wallUp.bgm.position.y = 5.7;
wallDown.bgm.position.y = -5.7;

camera.position.z = 8;

const input = new Input();

paddleLeft.pgm.position.x = -8;
paddleRight.pgm.position.x = 8;

export let p1Score = 0;
export let p2Score = 0;

function updateScoreDisplay() {
    const player1ScoreElement = document.getElementById('player1Score');
    const player2ScoreElement = document.getElementById('player2Score');
    
    player1ScoreElement.textContent = p1Score;
    player2ScoreElement.textContent = p2Score;
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

scene.add(paddleLeft.pgm, paddleRight.pgm);
scene.add(ball.ball);
scene.add(wallUp.bgm, wallDown.bgm);

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

function animate() {
    paddleLeft.pgm.position.y += input.leftPaddleSpeed;
    paddleRight.pgm.position.y += input.rightPaddleSpeed;
    ball.update();
    ball.checkPaddleCollision(paddleLeft);
    ball.checkPaddleCollision(paddleRight);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);