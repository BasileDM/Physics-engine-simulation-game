export class Particle {
    constructor(positionXParam, positionYParam) {
        this.element = document.createElement("div");
        this.positionX = positionXParam;
        this.positionY = positionYParam;
        this.width = "10px"
        this.height = "10px"
        this.color = "red";
        this.velocity = 0;
    }

    getElement() {
        return this.element;
    }

    spawn() {
        let newParticle = this.getElement();
        // newParticle.classList.add = ("particle");
        newParticle.style.backgroundColor = this.color;
        newParticle.style.width = this.width;
        newParticle.style.height = this.height;
        newParticle.style.gridColumn = this.positionX;
        newParticle.style.gridRow = this.positionY;
        document.getElementById("playground").appendChild(newParticle);
    }

    update() {
        this.velocity += 0.1;
        this.positionY += this.velocity;
    }

    render() {
        let element = this.getElement();
        element.style.gridColumn = this.positionX;
        element.style.gridRow = this.positionY;
    }
}