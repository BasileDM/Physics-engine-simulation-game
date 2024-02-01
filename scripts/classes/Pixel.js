export class Pixel {
    constructor(positionXParam, positionYParam) {
        this.positionX = positionXParam;
        this.positionY = positionYParam;
        this.width = "20px"
        this.height = "20px"
        this.color = "red";
    }

    spawn() {
        let newPixel = document.createElement("div");
        newPixel.classList.add = ("newPixel");
        newPixel.style.backgroundColor = this.color;
        newPixel.style.width = this.width;
        newPixel.style.height = this.height;
        newPixel.style.gridColumn = this.positionX;
        newPixel.style.gridRow = this.positionY;
        document.getElementById("playground").appendChild(newPixel);
    }
}