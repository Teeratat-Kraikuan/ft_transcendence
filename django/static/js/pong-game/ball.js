import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
// import { Paddle } from './paddle.js';
import { addScoreP1, addScoreP2, audioPlayer } from './main.js';

const ballImagePath     = "/static/js/pong-game/imgs/steel_ball.jpg";
const sound1Path        = "/static/js/pong-game/mp3/bounce_b2.mp3";
const sound2Path        = "/static/js/pong-game/mp3/pad2.mp3";
const sound3Path        = "/static/js/pong-game/mp3/get-score2.mp3";
// const sound5Path        ="/static/js/pong-game/mp3/good.mp3";

export class Ball {
    constructor() {
        this.ballspeed = 0.09;
        this.radius = 0.15;

        const ballTextureLoader = new THREE.TextureLoader();
        const ballT = ballTextureLoader.load(ballImagePath);

        this.geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        this.material = new THREE.MeshBasicMaterial({ map: ballT });
        this.ball = new THREE.Mesh(this.geometry, this.material);
        this.ball.position.set(0, 0, 0);
        this.velocity = new THREE.Vector3(this.ballspeed, this.ballspeed, 0);
        this.collided = false;
        audioPlayer.load("collisionSound1", sound1Path);
        audioPlayer.load("collisionSound2", sound2Path);
        audioPlayer.load("collisionSound3", sound3Path);
    }

    update() {
        // Move the ball
        this.ball.position.add(this.velocity);

        // Bounce off top and bottom walls
        if (this.ball.position.y > 5 || this.ball.position.y < -5) {
            audioPlayer.play("collisionSound1");
            this.velocity.y = -this.velocity.y;
        }

        // Reset ball if it goes past left or right paddles
        if (this.ball.position.x > 10 || this.ball.position.x < -10) {
            if (this.ball.position.x > 10)
            {
                // set score
                addScoreP1();
                audioPlayer.play("collisionSound3");
                this.ball.position.set(0, 0, 0);
                this.velocity.set(-1 * (this.ballspeed), this.ballspeed, 0); // Reset velocity
            }
            else if(this.ball.position.x < -10)
            {
                 // set score
                 addScoreP2();
                 audioPlayer.play("collisionSound3");
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
                if (!this.collided)
                {
                    audioPlayer.play("collisionSound2");
                    this.velocity.x = -this.velocity.x; // Bounce the ball to x.axis
                    this.ball.position.x += this.velocity.x;
                    this.collided = true;
                }
            }
        // else if((this.ball.position.y - this.radius) <= paddle.pgm.position.y + (paddle.paddleSizeY / 2) && (this.ball.position.y + this.radius) >= paddle.pgm.position.y - (paddle.paddleSizeY / 2) && 
        //     (this.ball.position.x) <= paddle.pgm.position.x + (paddle.paddleSizeX / 2) && (this.ball.position.x) >= paddle.pgm.position.x - (paddle.paddleSizeX / 2))
        //     {
        //         if (!this.collided)
        //         {
        //             audioPlayer.play("collisionSound2");
        //             this.velocity.y = -this.velocity.y; // Bounce the ball to y.axis
        //             this.ball.position.y += this.velocity.y;
        //             this.collided = true;
        //         }
        //     }
            // else if(this.radius >= Math.sqrt((dx1 * dx1) + (dy1 * dy1)) || this.radius >= Math.sqrt((dx1 * dx1) + (dy2 * dy2)) || this.radius >= Math.sqrt((dx2 * dx2) + (dy1 * dy1)) || this.radius >= Math.sqrt((dx2 * dx2) + (dy2 * dy2)))
            //     {
            //         if (!this.collided)
            //         {
            //             audioPlayer.play("collisionSound2");
            //             //this case ball is collision on paddle edge.
            //             this.velocity.x = -this.velocity.x; // Bounce the ball oposite to x.axis
            //             this.velocity.y = -this.velocity.y; // Bounce the ball oposite to y.axis    
            //             // console.log("\nradius = " + this.radius + "= ( " + Math.sqrt((dx1 * dx1) + (dy1 * dy1)) + ")");
            //             // console.log("radius = " + this.radius + "= ( " + Math.sqrt((dx2 * dx2) + (dy1 * dy1)) + ")");
            //             // console.log("radius = " + this.radius + "= ( " + Math.sqrt((dx1 * dx1) + (dy2 * dy2)) + ")");
            //             // console.log("radius = " + this.radius + "= ( " + Math.sqrt((dx2 * dx2) + (dy2 * dy2)) + ")\n");
            //             this.ball.position.x += this.velocity.x + this.radius;
            //             this.ball.position.y += this.velocity.y + this.radius;
            //             this.collided = true;
        //         }
        //     }
        else if (this.collided === true)
            this.collided = false;
    }
}
