import { Vector } from "./Vector.js";
import { gravity } from "../app.js";

export class Particle {
   hasGravity;
   
   constructor(
      positionXParam,
      positionYParam,
      shape,
      hasGravity,
      isMovable
   ) {
      this.element = document.createElement("div");
      this.positionVector = new Vector(positionXParam, positionYParam);
      this.shape = shape;
      this.color = "white";

      this.acceleration = new Vector(0, 0);
      this.velocity = new Vector(0, 0);

      this.diameter = "23px";
      this.radius = parseInt(this.diameter)/2;
      this.area = Math.PI * this.radius * this.radius;

      this.elasticity = 1.7; // 2 max for now or it adds more energy to the system and 1 min for no elasticity
      this.density = 1000; // mass units per area (akin to kg/m^3) 
      this.mass = this.density * this.area;

      // Equation for quadratic drag force : 
      // 0.5 * dragCoef * cross-sectional area of the object * density of medium (air) * velocity squared
      this.dragCoef = 0.47;
      this.dragForce = 0.5 * this.dragCoef * this.area * 1.225 * this.velocity.dot(this.velocity);
      
      this.isColliding = false;
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

   get hasGravity() {
      return this.hasGravity;
   }
   set hasGravity(bool) {
      this.hasGravity = bool;
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

   update() {
      if (this.isColliding) {
         this.setColor("red");
      }
      if (this.hasGravity) {
         let dragForceDirection = new Vector (-this.velocity.normalize().x, -this.velocity.normalize().y);
         console.log(dragForceDirection);
         console.log(`Dot : ${this.velocity.dot(this.velocity)}`); // Calculate magnitude first -----------
         let dragForceVector = dragForceDirection.scale(this.dragForce);
         let net_force = gravity + this.dragForce
         this.velocity = this.velocity.add(gravity);
      }
      if (this.isMovable) {
         this.positionVector = this.positionVector.add(this.velocity);
      }

      // Collisions with floor and walls :
      //
      // Function to calculate the impulse with each floor/wall collision normal
      function getImpulse(collisionNormal, velocity, elasticity, mass) {
         let relativeVelocityAlongNormal = velocity.dot(collisionNormal);
         let impulse = elasticity * relativeVelocityAlongNormal / (1 / mass); 
         // Mass of the walls = Infinity which equates to zero, so it's not factored in here...
         // ... compared to sphere to sphere collision calculations in the app.js
         return impulse;
      }

      // Floor
      const floorTop = document.getElementById("floor").getBoundingClientRect().top;
      if (this.positionVector.y + parseInt(this.diameter) > floorTop) {
         let collisionNormal = new Vector(0, -1); // Floor collision normal (could be a const but I want it scoped to the if block)
         let impulse = getImpulse(collisionNormal, this.velocity, this.elasticity, this.mass);

         this.positionVector.y = floorTop - parseInt(this.diameter);
         this.velocity = this.velocity.subtract(collisionNormal.scale(impulse / this.mass));
      }
      // Left wall
      const leftWallX = document.getElementById("left-wall").getBoundingClientRect().right;
      if (this.positionVector.x < leftWallX) {
         let collisionNormal = new Vector(1, 0); // Left wall collision normal (could be a const but I want it scoped to the if block)
         let impulse = getImpulse(collisionNormal, this.velocity, this.elasticity, this.mass);

         this.positionVector.x = leftWallX;
         this.velocity = this.velocity.subtract(collisionNormal.scale(impulse / this.mass));
      }
      // Right wall
      const rightWallX = document.getElementById("right-wall").getBoundingClientRect().left;
      if (this.positionVector.x + parseInt(this.diameter) > rightWallX) {
         let collisionNormal = new Vector(-1, 0); // Right wall collision normal (could be a const but I want it scoped to the if block)
         let impulse = getImpulse(collisionNormal, this.velocity, this.elasticity, this.mass);

         this.positionVector.x = rightWallX - parseInt(this.diameter);
         this.velocity = this.velocity.subtract(collisionNormal.scale(impulse / this.mass));
      }
      // Ceiling
      const ceilingBot = document.getElementById("ceiling").getBoundingClientRect().bottom;
      if (this.positionVector.y < ceilingBot) {
         let collisionNormal = new Vector(0, 1); // Ceiling collision normal (could be a const but I want it scoped to the if block)
         let impulse = getImpulse(collisionNormal, this.velocity, this.elasticity, this.mass);

         this.positionVector.y = ceilingBot;
         this.velocity = this.velocity.subtract(collisionNormal.scale(impulse / this.mass));
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
      
      this.render();
   }
   render() {
      let element = this.getElement();
      element.style.left = `${this.positionVector.x}px`;
      element.style.top = `${this.positionVector.y}px`;
      element.style.zIndex = -10;
   }
}
