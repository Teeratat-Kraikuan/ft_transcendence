export class Input {
    constructor() {
        this.leftPaddleSpeed = 0;
        this.rightPaddleSpeed = 0;
        this.pSpeed = 0.1;
        // Keyboard event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown(event) {
        // Left paddle controls (W and S)
        if (event.key === 'w') {
            this.leftPaddleSpeed = this.pSpeed;  // Move up
        } else if (event.key === 's') {
            this.leftPaddleSpeed = -1 * this.pSpeed; // Move down
        }

        // Right paddle controls (Up and Down Arrow)
        if (event.key === 'ArrowUp') {
            this.rightPaddleSpeed = this.pSpeed;  // Move up
        } else if (event.key === 'ArrowDown') {
            this.rightPaddleSpeed = -1 * this.pSpeed; // Move down
        }
    }

    handleKeyUp(event) {
        // Stop paddle movement when the key is released
        if (event.key === 'w' || event.key === 's') {
            this.leftPaddleSpeed = 0;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            this.rightPaddleSpeed = 0;
        }
    }
}
