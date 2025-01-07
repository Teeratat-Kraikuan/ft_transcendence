import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';

export class Box{
// Create the paddles
    constructor(boxSizeX = 1, boxSizeY = 1, boxSizeZ = 0.5){
        this.boxSizeX = boxSizeX;
        this.boxSizeY = boxSizeY;
        this.boxSizeZ = boxSizeZ;
    const boxGeometry = new THREE.BoxGeometry(this.boxSizeX, this.boxSizeY, this.boxSizeZ);
    let boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    this.bgm = new THREE.Mesh(boxGeometry, boxMaterial);
    this.bgm.position.x = 0;
    this.bgm.position.y = 0;
    }
}