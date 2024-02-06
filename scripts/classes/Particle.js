import { Vector } from "./Vector.js";

const gravity = new Vector(0, 0.075);

export class Particle {
   constructor(
      positionXParam,
      positionYParam,
      shape,
      mass,
      hasGravity,
      isMovable
   ) {
      this.element = document.createElement("div");
      this.shape = shape;
      this.positionVector = new Vector(positionXParam, positionYParam);
      this.diameter = "30px";
      this.color = "white";
      this.velocity = new Vector(0, 0);
      this.isColliding = false;
      this.mass = mass;
      this.frictionFactor = 0.99;
      this.elasticity = 2; // 2.25 max for now or it adds more energy to the system
      this.hasGravity = hasGravity;
      this.isMovable = isMovable;
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
      newParticle.style.border = "1px solid black";
      newParticle.style.boxSizing = "border-box";

      if (this.shape == "Sphere") {
         newParticle.style.width = this.diameter;
         newParticle.style.height = this.diameter;
         newParticle.style.borderRadius = "50%";
      } else if (this.shape == "Rectangle") {
         newParticle.style.borderRadius = "none";
         newParticle.style.width = `${this.width}px`;
         newParticle.style.height = `${this.height}px`;
      } else {
         console.warn("Shape is undefined.");
      }

      document.getElementById("playground").appendChild(newParticle);
   }

   update(obstacles) {
      if (this.isColliding) {
         this.setColor("red");
      }
      if (this.hasGravity) {
         this.velocity = this.velocity.add(gravity);
      }
      if (this.isMovable) {
         this.positionVector = this.positionVector.add(this.velocity);
      }

      // Collisions with floor and walls
      const floorTop = document.getElementById("floor").getBoundingClientRect().top;
      // Floor
      if (this.positionVector.y + parseInt(this.diameter) > floorTop) {
         this.positionVector.y = floorTop - parseInt(this.diameter);
         this.velocity = new Vector(
            this.velocity.x * this.frictionFactor,
            -this.velocity.y + 0.99)
      }
      // Left wall
      const leftWallX = document.getElementById("left-wall").getBoundingClientRect().right;
      if (this.positionVector.x < leftWallX) {
         this.positionVector.x = leftWallX;
         this.velocity = new Vector(
            -this.velocity.x,
            this.velocity.y)
      }
      // Right wall
      const rightWallX = document.getElementById("right-wall").getBoundingClientRect().left;
      if (this.positionVector.x + parseInt(this.diameter) > rightWallX) {
         this.positionVector.x = rightWallX - parseInt(this.diameter);
         this.velocity = new Vector(
            -this.velocity.x,
            this.velocity.y)
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

export class Block extends Particle {
   constructor(positionXParam, positionYParam, width, height) {
      super(positionXParam, positionYParam, "Rectangle", 1, false, false); // Shape, mass, hasGravity, isMovable
      this.width = width;
      this.height = height;
      this.color = "blue";
   }
}
