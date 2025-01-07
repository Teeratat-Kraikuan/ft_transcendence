import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';

export class Paddle{
// Create the paddles
    constructor(){
        this.paddleSizeX = 0.2;
        this.paddleSizeY = 3;
        this.paddleSizeZ = 0.5;
    const paddleGeometry = new THREE.BoxGeometry(this.paddleSizeX, this.paddleSizeY, this.paddleSizeZ);
    const paddleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.pgm = new THREE.Mesh(paddleGeometry, paddleMaterial);
    }
}