import { Particle } from "./classes/Particle.js";
import { Block } from "./classes/Particle.js";
import { Vector } from "./classes/Vector.js";

// Variables
let gravityY = 0.002 // Default : 0.002 Used for toggle gravity
export let gravity = new Vector(0, gravityY);
export const airDensity = 1.225 / 1000000; // Default : 1.225 (/1000000 to convert to kg/cm^3)

let frames = 0;
export let frameTime = 0; // 1000ms divided by frames per second

let particles = []; // Array of all "Particle" class instances
let hasDragStarted = false;
let mouseDragStart = new Vector(0, 0);

// Functions
//
function getCollisionResponse(currentParticle, checkedParticle) {
    let distance = getDistanceSphereToSphere(currentParticle, checkedParticle);
                
    if (checkedParticle.shape == "Rectangle") {
        if (isSphereTouchingRectangle(currentParticle, checkedParticle)) {
            currentParticle.hasGravity = false;
        } else {
            currentParticle.hasGravity = true;
        };
    }

    if (distance <= 0 && checkedParticle.shape != "Rectangle")  {
        currentParticle.setColliding(true);
        
        let currentParticleCenter = currentParticle.positionVector.add(new Vector(currentParticle.radius, currentParticle.radius));
        let checkedParticleCenter = checkedParticle.positionVector.add(new Vector(checkedParticle.radius, checkedParticle.radius));
        
        // Help from chatGPT on how to use my vectors for simple but more realistic collision handling
        // Vectorial math applying conservation of momentum and energy principles
        let relativeVelocity = currentParticle.velocity.subtract(checkedParticle.velocity);
        let collisionNormal = checkedParticleCenter.subtract(currentParticleCenter).normalize();
        let relativeVelocityAlongNormal = relativeVelocity.dot(collisionNormal);

        // The first math.max is used to factor in elasticity. Can be removed if not needed.
        // Real elasticity(e) factor is -(1+e) where 0 < e < 1 ...
        // ... but I just use the biggest elasticity of the two particles for now
        let impulse = (Math.max(currentParticle.elasticity, checkedParticle.elasticity)) * relativeVelocityAlongNormal / (1 / currentParticle.mass + 1 / checkedParticle.mass);
        // Change particles velocity according to the impulse 
        if (currentParticle.isMovable) {
            currentParticle.velocity = currentParticle.velocity.subtract(collisionNormal.scale(impulse / currentParticle.mass));
        }
        if (checkedParticle.isMovable) {
            checkedParticle.velocity = checkedParticle.velocity.add(collisionNormal.scale(impulse / checkedParticle.mass));
        }
        
        // Solution for preventing particles from sinking into each other :
        // Adding a separation distance along the collision normal
        const separationDistance = 0.5;
        if (currentParticle.isMovable) {
            currentParticle.positionVector = currentParticleCenter.subtract(collisionNormal.scale(separationDistance * Math.abs(distance))).subtract(new Vector(currentParticle.radius, currentParticle.radius));
        }
        if (checkedParticle.isMovable) {
            checkedParticle.positionVector = checkedParticleCenter.add(collisionNormal.scale(separationDistance * Math.abs(distance))).subtract(new Vector(checkedParticle.radius, checkedParticle.radius));
        }
    }
}

function getDistanceSphereToSphere(currentParticle, checkedParticle) {
    let currentParticleCenter = currentParticle.positionVector.add(new Vector(currentParticle.radius, currentParticle.radius));
    let checkedParticleCenter = checkedParticle.positionVector.add(new Vector(checkedParticle.radius, checkedParticle.radius));

    // Pythagorean distance check (can be refactored to avoid using Sqrt which is expensive but I'll do it later)
    let distanceVector = currentParticleCenter.subtract(checkedParticleCenter);
    let combinedRadius = currentParticle.radius + checkedParticle.radius;
    let distance = distanceVector.getMagnitude() - combinedRadius;
    return distance;
}

function isSphereTouchingRectangle(sphereParticle, rectangleParticle) {
    let sphereParticleRadius = parseInt(sphereParticle.diameter)/2;
    if (sphereParticle.positionVector.x + sphereParticleRadius > rectangleParticle.positionVector.x &&
        sphereParticle.positionVector.x + sphereParticleRadius < rectangleParticle.positionVector.x + rectangleParticle.width &&
        sphereParticle.positionVector.y + sphereParticleRadius > rectangleParticle.positionVector.y &&
        sphereParticle.positionVector.y + sphereParticleRadius < rectangleParticle.positionVector.y + rectangleParticle.height) {
        return true;
    } else {
        return false;
    }
}

let hasGravity = true;
let isMovable = true;
let diameter = "30px";
let elasticity = 1.4;
let density = 1000;
function createParticle(event) {
    let mousePositionX = event.clientX;
    let mousePositionY = event.clientY;
    let newParticle = new Particle(
        mousePositionX, 
        mousePositionY,
        "Sphere",
        hasGravity,
        isMovable,
        diameter,
        elasticity,
        density);
    particles.push(newParticle);
    newParticle.spawn();
    console.log(newParticle);
    newParticle.element.addEventListener("mouseenter", function(){
        let randomVelocity = new Vector((Math.random()-0.5)*2, Math.random()*-5);
        newParticle.velocity = randomVelocity;
    })
}

function startDrag(event) {
    hasDragStarted = true;
    mouseDragStart = new Vector(event.clientX, event.clientY);
}

function createBlock(event) {
    if (hasDragStarted) {
        let mouseDragEnd = new Vector(event.clientX, event.clientY);
        let newBlock = new Block(
            Math.min(mouseDragStart.x, mouseDragEnd.x),
            Math.min(mouseDragStart.y, mouseDragEnd.y),
            Math.abs(mouseDragStart.x - mouseDragEnd.x),
            Math.abs(mouseDragStart.y - mouseDragEnd.y));
        particles.push(newBlock);
        newBlock.spawn();
        newBlock.update();
        newBlock.render();
    }
    hasDragStarted = false;
}

function mainLoop() {

    // Iterating through all the particles to update and render them
    for(let i = 0; i < particles.length; i++) {
        let currentParticle = particles[i];

        for (let j = 0; j < particles.length; j++) {

            // i != j to avoid collision with itself
            if (i != j && currentParticle.shape != "Rectangle") {
                let checkedParticle = particles[j];
                getCollisionResponse(currentParticle, checkedParticle);
            }
        }
        currentParticle.update();
        
        // Destroy a particle if it falls below the playground area
        if (currentParticle.positionVector.y > window.innerHeight) {
            currentParticle.destroy();
            particles.splice(i, 1);
            i--;
        }
        currentParticle.render();
    }
    frames++;
    requestAnimationFrame(mainLoop);
}

// // # Main code
//
// // Mouse events
document.getElementById("playground").addEventListener("mousedown", startDrag);
document.getElementById("playground").addEventListener("mouseup", createBlock)
document.getElementById("playground").addEventListener("wheel", createParticle)

// // Button events
// Gravity toggle
document.getElementById("gravityButton").addEventListener("click", function() {
    gravity.getMagnitude() == 0 ? gravity.y = gravityY : gravity.y = 0;
})

// // Tools
// Particle tool
let particleToolButton = document.getElementById("particleCreatorButton");
let particleTool = document.getElementById("particleTool");
particleToolButton.addEventListener("click", function() {
    particleTool.style.visibility == "hidden" ? 
    particleTool.style.visibility = "visible" : 
    particleTool.style.visibility = "hidden";
})
 
document.getElementById("particleToolApply").addEventListener("click", function() {
    diameter = `${document.getElementById("size").value}px`;
    elasticity = document.getElementById("elasticity").value;
    density = document.getElementById("density").value;
})


// Fullscreen button
let isFullscreen = false;
let fullscreenButton = document.getElementById("fullscreen");
fullscreenButton.addEventListener("click", function() {
    if (!isFullscreen) {
        document.body.requestFullscreen();
        isFullscreen = true;
        fullscreenButton.textContent = "Exit fullscreen"
    } else {
        document.exitFullscreen();
        isFullscreen = false;
        fullscreenButton.textContent = "Go fullscreen"
    }
})

// Modal window for tutorial
const dialog = document.querySelector("dialog");
document.querySelector("#tutorial").addEventListener("click", () => {dialog.showModal()});
document.querySelector("dialog button").addEventListener("click", () => {dialog.close()});


// FPS, frametime, and entities counter
setInterval(() => {
    frameTime = 1000/frames;
    document.getElementById("frameCounter").innerHTML = `${frames} fps <br>${Math.round(frameTime*100)/100} ms <br>${particles.length} entities`;
    frames = 0;
}, 1000);

// Main loop initialization
requestAnimationFrame(mainLoop);
