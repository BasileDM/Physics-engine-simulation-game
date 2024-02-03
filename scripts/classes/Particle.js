const gravity = 0.05;

export class Particle {
    constructor(positionXParam, positionYParam) {
        this.element = document.createElement("div");
        this.positionX = positionXParam;
        this.positionY = positionYParam;
        this.width = "10px"
        this.height = "10px"
        this.color = "red";
        this.velocity = 0;
        this.isColliding = false;
    }

    getElement() {
        return this.element;
    }

    setColliding(isCollidingParam) {
        this.isColliding = isCollidingParam;
    }

    spawn() {
        let newParticle = this.element;
        newParticle.style.position = "absolute";
        newParticle.style.top = `${this.positionX}px`;
        newParticle.style.left = `${this.positionY}px`;
        newParticle.style.backgroundColor = this.color;
        newParticle.style.width = this.width;
        newParticle.style.height = this.height;
        newParticle.style.border = "1px solid black";
        newParticle.style.borderRadius = "50%";
        document.getElementById("playground").appendChild(newParticle);
    }

    update() { 
        // If not colliding, apply gravity
        if (!this.isColliding) {
            this.velocity += gravity;
            this.positionY += this.velocity;
        }

        const floor = document.getElementById("floor");
        const floorTop = floor.getBoundingClientRect().top;

        if (this.positionY + parseInt(this.height) > floorTop-3.5) {
            this.positionY = floorTop + parseInt(this.height) - 23.5;
            this.velocity = 0;
        }
    }

    render() {
        let element = this.getElement();
        element.style.left = `${this.positionX}px`;
        element.style.top = `${this.positionY}px`;
    }

    destroy() {
        this.setColliding(false);
        let element = this.getElement();
        element.remove();
    }
}