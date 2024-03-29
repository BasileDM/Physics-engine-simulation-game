import { Vector } from "./Vector.js";

import { gravity } from "../app.js";
import { airDensity } from "../app.js";
import { frameTime } from "../app.js";

export class Entity {
   #hasGravity;
   #isMovable;
   #element;
   #color;
   #density;
   
   constructor(
      positionVector,
      shape,
      hasGravity = true,
      isMovable = true,
      density = 1000,
      color = "red"
   ) {
      this.#element = document.createElement("div");
      this.positionVector = positionVector;
      this.shape = shape;
      this.#color = color;
      
      this.#density = density; // Default 1000kg/m^3 (density of water)
      
      this.#hasGravity = hasGravity;
      this.#isMovable = isMovable;
   }

   //#region Getters and Setters
   get element() {
      return this.#element;
   }
   set element(element) {
      this.#element = element;
   }
   get color() {
      return this.#color;
   }
   set color(color) {
      this.#color = color;
      this.#element.style.backgroundColor = this.#color;
   }
   get density() {
      return this.#density;
   }
   set density(density) {
      this.#density = density;
   }
   get hasGravity() {
      return this.#hasGravity;
   }
   set hasGravity(bool) {
      this.#hasGravity = bool;
   }
   get isMovable() {
      return this.#isMovable;
   }
   set isMovable(isMovable) {
      this.#isMovable = isMovable;
   }
   //#endregion

   spawn() {
      let newParticle = this.element;
      newParticle.style.position = "absolute";
      newParticle.style.top = `${this.positionVector.x}px`;
      newParticle.style.left = `${this.positionVector.y}px`;
      newParticle.style.backgroundColor = this.color;
      newParticle.style.border = this.border;
      newParticle.style.boxSizing = "border-box";

      if (this.shape == "Sphere") {
         newParticle.style.width = this.diameter;
         newParticle.style.height = this.diameter;
         newParticle.style.borderRadius = "50%";
         newParticle.style.zIndex = "10";
         if (this.image) {
            newParticle.style.boxSizing = "content-box";
            newParticle.style.backgroundImage = `url(${this.image})`;
            newParticle.style.backgroundSize = `107%`;
            newParticle.style.backgroundColor = "transparent";
            newParticle.style.border = "none";
         }
      } else if (this.shape == "Rectangle") {
         newParticle.style.borderRadius = "none";
         newParticle.style.width = `${this.width}px`;
         newParticle.style.height = `${this.height}px`;
         if (this.isDensityZone == true) {
            newParticle.style.zIndex = 1;
            newParticle.style.opacity = "70%";
         }
      } else {
         console.warn("Shape is undefined.");
      }

      document.getElementById("playground").appendChild(newParticle);
   }

   render() {
      let element = this.element;
      element.style.left = `${this.positionVector.x}px`;
      element.style.top = `${this.positionVector.y}px`;
   }

   destroy() {
      let element = this.element;
      element.remove();
   }
}

export class Particle extends Entity {
   #diameter;
   #radius;
   #elasticity;
   #mass;
   #effectList;
   #currentMediumDensity;
   #image;
   constructor(
      positionVector, 
      hasGravity, 
      isMovable, 
      diameter = "30px", 
      elasticity = 0.5, 
      density, 
      color,
      image
   ){
      super(positionVector, "Sphere", hasGravity, isMovable, density, color)
      this.acceleration = new Vector(0, 0);
      this.velocity = new Vector(0, 0);

      this.#elasticity = elasticity; // 2 max for now or it adds more energy to the system and 1 min for no elasticity
      this.border = `${elasticity * 6}px solid #70008F`;

      this.#diameter = diameter; // 1px = 1 Centimeter
      this.#radius = parseInt(this.diameter)/2; // Cm
      this.area = Math.PI * this.radius * this.radius; // Cm²

      this.volume = (4/3) * Math.PI * Math.pow(this.radius, 3); // in cubic centimeters (cm^3)
      
      this.densityInKgPerCm3 = this.density / 1000000;
      this.#mass = this.densityInKgPerCm3 * this.volume; // in kilograms

      // Equation for quadratic drag force : 
      // 0.5 * dragCoef * cross-sectional area of the object * density of medium (air) * velocity squared
      this.dragCoef = 0.47; // Default is 0.47 for real life value approximation
      this.#currentMediumDensity = airDensity;
      this.dragForce = 0.5 * this.dragCoef * this.area * this.#currentMediumDensity * Math.pow(this.velocity.getMagnitude(), 2);
      
      this.#effectList = {
         "Anti-gravity": 0
      };
      this.#image = image;

      this.spawn();
      this.render();
   }
   
   //#region Getters and Setters
   get diameter() {
      return this.#diameter;
   }
   set diameter(diameter) {
      this.#diameter = diameter;
   }
   get radius() {
      return this.#radius;
   }
   set radius(radius) {
      this.#radius = radius;
   }
   get elasticity() {
      return this.#elasticity;
   }
   set elasticity(elasticity) {
      this.#elasticity = elasticity;
   }
   get mass() {
      return this.#mass;
   }
   set mass(mass) {
      this.#mass = mass;
   }
   get effectList() {
      return this.#effectList;
   }
   set effectList(effectList) {
      this.#effectList = effectList;
   }
   get currentMediumDensity() {
      return this.#currentMediumDensity;
   }
   set currentMediumDensity(density) {
      this.#currentMediumDensity = density;
   }
   get image() {
      return this.#image;
   }
   set image(image) {
      this.#image = image;
   }
   //#endregion

   addEffect(effectName) {
      this.effectList[effectName] += 1;
   }
   removeEffect(effectName) {
      this.effectList[effectName] -= 1;
   }
   checkAppliedEffects() {
      this.effectList["Anti-gravity"] === 0 ? this.hasGravity = true : this.hasGravity = false;
   }
   changeMedium(mediumDensity) {
      this.currentMediumDensity = mediumDensity;
   }

   update() {
      let scaledVelocity = new Vector(0, 0);
      // Update drag force according to current velocity
      this.dragForce =  0.5 * this.dragCoef * this.area * this.#currentMediumDensity * Math.pow(this.velocity.getMagnitude(), 2);
      // dragForceDirection is the opposite of the current direction (normalized velocity)
      let dragForceDirection = this.velocity.normalize().scale(-1);
      // Make drag force a vector with the raw force * normalized direction
      let dragForceVector = dragForceDirection.scale(this.dragForce);
      let net_force;

      if (this.hasGravity) {
         // Scale gravity to the mass of the object
         let gravityForce = gravity.scale(this.mass);
         let buoyantForce = gravity.scale(-this.volume*this.#currentMediumDensity);
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
      const leftWallX = document.getElementById("left-wall").getBoundingClientRect().right;
      const rightWallX = document.getElementById("right-wall").getBoundingClientRect().left;
      const ceilingBot = document.getElementById("ceiling").getBoundingClientRect().bottom;

      if (this.positionVector.y + parseInt(this.diameter) > floorTop) {
         let collisionNormal = new Vector(0, -1); // Floor collision normal (could be a const but I want it scoped to the if block)
         let impulse = getImpulse(collisionNormal, this.velocity, this.elasticity, this.mass);

         this.positionVector.y = floorTop - parseInt(this.diameter);
         this.velocity = this.velocity.subtract(collisionNormal.scale(impulse / this.mass));
      }
      // Left wall
      if (this.positionVector.x < leftWallX) {
         let collisionNormal = new Vector(1, 0); // Left wall collision normal (could be a const but I want it scoped to the if block)
         let impulse = getImpulse(collisionNormal, this.velocity, this.elasticity, this.mass);

         this.positionVector.x = leftWallX;
         this.velocity = this.velocity.subtract(collisionNormal.scale(impulse / this.mass));
      }
      // Right wall
      if (this.positionVector.x + parseInt(this.diameter) > rightWallX) {
         let collisionNormal = new Vector(-1, 0); // Right wall collision normal (could be a const but I want it scoped to the if block)
         let impulse = getImpulse(collisionNormal, this.velocity, this.elasticity, this.mass);

         this.positionVector.x = rightWallX - parseInt(this.diameter);
         this.velocity = this.velocity.subtract(collisionNormal.scale(impulse / this.mass));
      }
      // Ceiling
      if (this.positionVector.y < ceilingBot) {
         let collisionNormal = new Vector(0, 1); // Ceiling collision normal (could be a const but I want it scoped to the if block)
         let impulse = getImpulse(collisionNormal, this.velocity, this.elasticity, this.mass);

         this.positionVector.y = ceilingBot;
         this.velocity = this.velocity.subtract(collisionNormal.scale(impulse / this.mass));
      }
      this.checkAppliedEffects();
   }
}

export class Zone extends Entity {
   #width;
   #height;
   #affectedParticles;
   #effect;
   #isDensityZone;
   constructor(positionVector, width, height, isDensityZone, effect = "Anti-gravity", color, density) {
      super(positionVector, "Rectangle", false, false, density, color);
      this.#width = width;
      this.#height = height;
      this.#effect = effect;
      this.#isDensityZone = isDensityZone;
      this.#affectedParticles = [];
      this.spawn();
      this.render();
   }

   //#region Getters and Setters
   get width() {
      return this.#width;
   }
   set width(width) {
      this.#width = width;
   }
   get height() {
      return this.#height;
   }
   set height(height) {
      this.#height = height;
   }
   get effect() {
      return this.#effect;
   }
   set effect(effect) {
      this.#effect = effect;
   }
   get affectedParticles() {
      return this.#affectedParticles;
   }
   set affectedParticles(affectedParticles) {
      this.#affectedParticles = affectedParticles;
   }
   get isDensityZone() {
      return this.#isDensityZone;
   }
   set isDensityZone(isDensityZone) {
      this.#isDensityZone = isDensityZone;
   }
   //#endregion

   addToAffectedParticles(newParticle) {
      this.affectedParticles = [...this.affectedParticles, newParticle];
   }

   addEffectToParticle(particle) {
      particle.addEffect(this.effect);
   }
   removeEffectFromParticle(particle) {
      particle.removeEffect(this.effect);
   }
}
