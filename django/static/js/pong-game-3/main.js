import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
import { Ball } from './ball.js';
import { Input } from './input.js';
import { Paddle } from './paddle.js';
import { Box } from './box.js';


// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enable = true;
document.body.appendChild(renderer.domElement);
///////
const startButton = document.getElementById('startButton');
///////
//------------------------------score------------
// Create a canvas for text
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 512;
canvas.height = 256;

export let p1Score = 0;
export let p2Score = 0;
export function addScoreP1()
{
    p1Score += 1;
    console.log('p1 add = '+ p1Score);
}

export function addScoreP2()
{
    p2Score += 1;
    console.log('p2 add = '+ p2Score);
}
// Draw text on the canvas
function drawScore(){
    context.clearRect(0,0, canvas.width, canvas.height);

    context.fillStyle = 'white';
    context.font = '25px Arial';
    context.fillText('PLAYER1: '+ p1Score + '   |   PLAYER2: ' + p2Score, 100, 200);
}

// Create a texture from the canvas
const texture = new THREE.CanvasTexture(canvas);

// Apply the texture to a plane
const planeGeometry = new THREE.PlaneGeometry(10, 5);
const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

// Add the text plane to the scene
scene.add(planeMesh);
planeMesh.position.set(0, 11, -5);
//------------------------------score------------

//-------------------floor-------------------------
const grassTextureLoader = new THREE.TextureLoader();
const grass = grassTextureLoader.load('./imgs/football_grass.jpg');

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
camera.position.z = 12;
// Create Input handler
const input = new Input();

paddleLeft.pgm.position.x = -8;
paddleRight.pgm.position.x = 8;

scene.add(paddleLeft.pgm, paddleRight.pgm);
scene.add(ball.ball); 
// scene.add(box.bgm); 
scene.add(wallUp.bgm, wallDown.bgm); 

let gameOver = false;
let gameStarted = false;
// Game loop
function animate() {
    if(!gameStarted){return;}
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
    drawScore();
    texture.needsUpdate = true;
    
    if(gameOver == true)
    {
            // show gameOVermessage
            gameOverMessage();
            return;
    }
    if (p1Score >= 5 || p2Score >= 5)
        {gameOver = true;}
    requestAnimationFrame(animate);
}
//////
startButton.addEventListener('click', () => {
            gameStarted = true;
            startButton.style.display = 'none'; // Hide the button
////////
animate();
/////// 
}); //////

//resize window
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
