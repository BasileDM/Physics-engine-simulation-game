import { Vector } from "./Vector.js";

const gravity = new Vector(0, 0.05);

export class Particle {
   constructor(positionXParam, positionYParam) {
      this.element = document.createElement("div");
      this.positionVector = new Vector(positionXParam, positionYParam);
      this.diameter = "40px";
      this.color = "white";
      this.velocity = new Vector(0, 0);
      this.isColliding = false;
      this.mass = 1;
      this.frictionFactor = 0.99;
      this.elasticity = 2; // 2.25 max for now or it adds more energy to the system
   }

   getElement() {
      return this.element;
   }

   setColliding(isCollidingParam) {
      this.isColliding = isCollidingParam;
   }

   setColor(color) {
      this.color = color;
      this.element.style.backgroundColor = this.color;
   }

   spawn() {
      let newParticle = this.element;
      newParticle.style.position = "absolute";
      newParticle.style.top = `${this.positionVector.x}px`;
      newParticle.style.left = `${this.positionVector.y}px`;
      newParticle.style.backgroundColor = this.color;
      newParticle.style.width = this.diameter;
      newParticle.style.height = this.diameter;
      newParticle.style.border = "1px solid black";
      newParticle.style.boxSizing = "border-box";
      newParticle.style.borderRadius = "50%";
      document.getElementById("playground").appendChild(newParticle);
   }

   update() {
      if (this.isColliding) {
         this.setColor("red");
      }
      this.velocity = this.velocity.add(gravity);
      this.positionVector = this.positionVector.add(this.velocity);

      const floor = document.getElementById("floor");
      const floorTop = floor.getBoundingClientRect().top;

      // Collision with floor
      if (this.positionVector.y + parseInt(this.diameter) > floorTop - 3) {
         this.positionVector.y = floorTop - parseInt(this.diameter) - 3;
         this.velocity = new Vector(this.velocity.x*this.frictionFactor, - this.velocity.y + 0.99);
      }
   }

   render() {
      let element = this.getElement();
      element.style.left = `${this.positionVector.x}px`;
      element.style.top = `${this.positionVector.y}px`;
   }

   destroy() {
      this.setColliding(false);
      let element = this.getElement();
      element.remove();
   }
}
