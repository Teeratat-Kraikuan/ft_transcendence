import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';

const brickImagePath    ="/static/js/pong-game/imgs/brick_wall.jpg";

export class Box{
// Create the paddles
    constructor(boxSizeX = 1, boxSizeY = 1, boxSizeZ = 0.5){
        this.boxSizeX = boxSizeX;
        this.boxSizeY = boxSizeY;
        this.boxSizeZ = boxSizeZ;
    const boxGeometry = new THREE.BoxGeometry(this.boxSizeX, this.boxSizeY, this.boxSizeZ);
    
    const brickTextureLoader = new THREE.TextureLoader();
    const brick = brickTextureLoader.load(brickImagePath);

    brick.wrapS = THREE.RepeatWrapping; // Horizontal wrapping
    brick.wrapT = THREE.RepeatWrapping; // Vertical wrapping

    brick.repeat.set(2.5, 0.2); // More repetitions, making the texture appear smaller

    let boxMaterial = new THREE.MeshBasicMaterial({ map: brick });
    this.bgm = new THREE.Mesh(boxGeometry, boxMaterial);
    this.bgm.position.x = 0;
    this.bgm.position.y = 0;
    }
}