import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
// import { Paddle } from './paddle.js';
import { addScoreP1 } from './main.js';
import { addScoreP2 } from './main.js';

export class Ball {
    constructor() {
        this.ballspeed = 0.09;
        this.radius = 0.15;

        const ballTextureLoader = new THREE.TextureLoader();
        const ballT = ballTextureLoader.load('./imgs/steel_ball.jpg');

        this.geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        this.material = new THREE.MeshBasicMaterial({ map: ballT });
        this.ball = new THREE.Mesh(this.geometry, this.material);
        this.ball.position.set(0, 0, 0);
        this.velocity = new THREE.Vector3(this.ballspeed, this.ballspeed, 0);
        this.collisionSound1 = new Audio('./mp3/bounce_b2.mp3'); 
        this.collisionSound2 = new Audio('./mp3/pad2.mp3'); 
        this.collisionSound3 = new Audio('./mp3/get-score2.mp3'); 
    }

    update() {
        // Move the ball
        this.ball.position.add(this.velocity);

        // Bounce off top and bottom walls
        if (this.ball.position.y > 5 || this.ball.position.y < -5) {
            this.collisionSound1.play();
            this.velocity.y = -this.velocity.y;
        }

        // Reset ball if it goes past left or right paddles
        if (this.ball.position.x > 10 || this.ball.position.x < -10) {
            if (this.ball.position.x > 10)
            {
                // set score
                addScoreP1();
                this.collisionSound3.play();
                this.ball.position.set(0, 0, 0);
                this.velocity.set(-1 * (this.ballspeed), this.ballspeed, 0); // Reset velocity
            }
            else if(this.ball.position.x < -10)
            {
                 // set score
                 addScoreP2();
                 this.collisionSound3.play();
                this.ball.position.set(0, 0, 0);
                this.velocity.set(this.ballspeed, this.ballspeed, 0); // Reset velocity
            }
        }
    }

    checkPaddleCollision(paddle) {
        let corner1X = paddle.pgm.position.x - (paddle.paddleSizeX / 2);
        let corner2X = paddle.pgm.position.x + (paddle.paddleSizeX / 2);
        let corner1Y = paddle.pgm.position.y - (paddle.paddleSizeY / 2);
        let corner2Y = paddle.pgm.position.y + (paddle.paddleSizeY / 2);
        let dx1 = this.ball.position.x - corner1X;
        let dx2 = this.ball.position.x - corner2X;
        let dy1 = this.ball.position.y - corner1Y;
        let dy2 = this.ball.position.y - corner2Y;
        // Simple AABB collision detection
        if ((this.ball.position.x - this.radius) <= paddle.pgm.position.x + (paddle.paddleSizeX / 2) && (this.ball.position.x + this.radius) >= paddle.pgm.position.x - (paddle.paddleSizeX / 2) &&
            this.ball.position.y <= paddle.pgm.position.y + (paddle.paddleSizeY / 2) && this.ball.position.y >= paddle.pgm.position.y - (paddle.paddleSizeY / 2)) 
            {
                this.collisionSound2.play();
                this.velocity.x = -this.velocity.x; // Bounce the ball to x.axis
            }
        else if((this.ball.position.y - this.radius) <= paddle.pgm.position.y + (paddle.paddleSizeY / 2) && (this.ball.position.y + this.radius) >= paddle.pgm.position.y - (paddle.paddleSizeY / 2) && 
            (this.ball.position.x) <= paddle.pgm.position.x + (paddle.paddleSizeX / 2) && (this.ball.position.x) >= paddle.pgm.position.x - (paddle.paddleSizeX / 2))
            {
                this.collisionSound2.play();
                this.velocity.y = -this.velocity.y; // Bounce the ball to y.axis
            }
        else if(this.radius >= Math.sqrt((dx1 * dx1) + (dy1 * dy1)) || this.radius >= Math.sqrt((dx1 * dx1) + (dy2 * dy2)) || this.radius >= Math.sqrt((dx2 * dx2) + (dy1 * dy1)) || this.radius >= Math.sqrt((dx2 * dx2) + (dy2 * dy2)))
            {
                //this case ball is collision on paddle edge.
                this.collisionSound2.play();
                this.velocity.x = -this.velocity.x; // Bounce the ball oposite to x.axis
                this.velocity.y = -this.velocity.y; // Bounce the ball oposite to y.axis    
            }
    }
}
