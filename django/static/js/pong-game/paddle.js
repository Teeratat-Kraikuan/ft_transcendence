import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';

const padImagePath      = "/static/js/pong-game/imgs/metal.jpg";

export class Paddle{
// Create the paddles
    constructor(speed){
        this.paddleSizeX = 0.2;
        this.paddleSizeY = 2;
        this.paddleSizeZ = 0.5;
        this.speed = speed;

        const padTextureLoader = new THREE.TextureLoader();
        const pad = padTextureLoader.load(padImagePath);

        pad.wrapS = THREE.RepeatWrapping;
        pad.wrapT = THREE.RepeatWrapping;
        
        pad.repeat.set(1, 1);

        const paddleGeometry = new THREE.BoxGeometry(this.paddleSizeX, this.paddleSizeY, this.paddleSizeZ);
        const paddleMaterial = new THREE.MeshBasicMaterial({ map: pad });
        this.pgm = new THREE.Mesh(paddleGeometry, paddleMaterial);
    }
    up(speed_multiply=1)
    {
        if (this.pgm.position.y + this.paddleSizeY / 2 < 5.5)
            this.pgm.position.y += this.speed * speed_multiply;
        else
            this.pgm.position.y = 4.5;
    }
    down(speed_multiply=1)
    {
        if (this.pgm.position.y - this.paddleSizeY / 2 > -5.5)
            this.pgm.position.y -= this.speed * speed_multiply;
        else
            this.pgm.position.y = -4.5;
    }
}