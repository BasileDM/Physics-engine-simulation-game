import { Vector } from "./Vector.js";

import { gravity } from "../app.js";
import { airDensity } from "../app.js";
import { frameTime } from "../app.js";

export class Particle {
   hasGravity;
   
   constructor(
      positionXParam,
      positionYParam,
      shape,
      hasGravity,
      isMovable,
      diameter,
      elasticity,
      density,
      color,
      borderColor
   ) {
      this.element = document.createElement("div");
      this.positionVector = new Vector(positionXParam, positionYParam);
      this.shape = shape;
      this.color = color;
      this.borderColor = borderColor;

      this.acceleration = new Vector(0, 0);
      this.velocity = new Vector(0, 0);

      this.elasticity = elasticity; // 2 max for now or it adds more energy to the system and 1 min for no elasticity
      
      this.diameter = diameter; // 1px = 1 Centimeter
      this.radius = parseInt(this.diameter)/2; // Cm
      this.area = Math.PI * this.radius * this.radius; // Cm²

      this.volume = (4/3) * Math.PI * Math.pow(this.radius, 3); // in cubic centimeters (cm^3)
      this.density = density; // Default 1000kg/m^3 (density of water)
      this.densityInKgPerCm3 = this.density / 1000000;
      this.mass = this.densityInKgPerCm3 * this.volume; // in kilograms

      // Equation for quadratic drag force : 
      // 0.5 * dragCoef * cross-sectional area of the object * density of medium (air) * velocity squared
      this.dragCoef = 0.47; // Default is 0.47 for real life value approximation
      this.dragForce = 0.5 * this.dragCoef * this.area * airDensity * Math.pow(this.velocity.getMagnitude(), 2);
      
      this.hasGravity = hasGravity;
      this.isMovable = isMovable;
   }

   getElement() {
      return this.element;
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
      newParticle.style.border = this.borderColor;
      newParticle.style.boxSizing = "border-box";
      newParticle.style.zIndex = "10";

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
      let scaledVelocity = new Vector(0, 0);
      // Update drag force according to current velocity
      this.dragForce =  0.5 * this.dragCoef * this.area * airDensity * Math.pow(this.velocity.getMagnitude(), 2);
      // dragForceDirection is the opposite of the current direction (normalized velocity)
      let dragForceDirection = this.velocity.normalize().scale(-1);
      // Make drag force a vector with the raw force * normalized direction
      let dragForceVector = dragForceDirection.scale(this.dragForce);
      let net_force;

      if (this.hasGravity) {
         // Scale gravity to the mass of the object
         let gravityForce = gravity.scale(this.mass);
         let buoyantForce = gravity.scale(-this.volume*airDensity);
         net_force = gravityForce.add(dragForceVector).add(buoyantForce);
         // net_force = gravity.add(dragForceVector); // No gravity scaling to the mass
         // this.velocity = this.velocity.add(gravity); // OLD basic velocity addition
      } else {
         net_force = dragForceVector;
      }

      this.acceleration = new Vector (net_force.x / this.mass, net_force.y / this.mass);
      let scaledAcceleration = this.acceleration.scale(frameTime); // frametime is 16,6ms per frame for 60 FPS, around 7 for 144 FPS
      this.velocity = this.velocity.add(scaledAcceleration);
      scaledVelocity = this.velocity.scale(frameTime);

      if (this.isMovable) {
         this.positionVector = this.positionVector.add(scaledVelocity);
      }

      // Collisions with floor and walls :
      //
      // Function to calculate the impulse with each floor/wall collision normal
      function getImpulse(collisionNormal, velocity, elasticity, mass) {
         let relativeVelocityAlongNormal = velocity.dot(collisionNormal);
         let impulse = (1 + elasticity) * relativeVelocityAlongNormal / (1 / mass); 
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
      element.style.zIndex = 0;
   }
}
