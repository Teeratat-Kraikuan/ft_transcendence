export class Input {
    constructor() {
        this.pSpeed = 0.1;
        this.leftPaddleSpeed = this.pSpeed;
        this.rightPaddleSpeed = this.pSpeed;
        // Keyboard event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        this.upPress = false;
        this.dnPress = false;
        this.wPress = false;
        this.sPress = false;
    }

    handleKeyDown(event) {
        if (event.key === 'w') {
            this.wPress = true;
        } else if (event.key === 's') {
            this.sPress = true;
        }

        if (event.key === 'ArrowUp') {
            this.upPress = true;
        } else if (event.key === 'ArrowDown') {
            this.dnPress = true;
        }

        if (event.key === ' ') {
            this.space = true;
        }
    }

    handleKeyUp(event) {
        if (event.key === 'w') {
            this.wPress = false;
        }
        if (event.key === 's') {
            this.sPress = false;
        }

        if (event.key === 'ArrowUp') {
            this.upPress = false;
        }
        if (event.key === 'ArrowDown') {
            this.dnPress = false;
        }
        if (event.key === ' ') {
            this.space = false;
        }
    }
}