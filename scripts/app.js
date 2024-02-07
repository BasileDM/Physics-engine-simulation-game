import { Particle } from "./classes/Particle.js";
import { Block } from "./classes/Particle.js";
import { Vector } from "./classes/Vector.js";

// Variables
let particles = []; // Array of all "Particle" class instances
let obstacles = []; 
let frames = 0;
let mouseDragStartX; // Might wanna use a vector here
let mouseDragStartY;

let gravityY = 0.2 // Used for toggle gravity
export let gravity = new Vector(0, gravityY);

// Functions

function getDistanceSphereToSphere(currentParticle, checkedParticle) {
    // Pythagorean distance check (can be refactored to avoid using Sqrt which is expensive but I'll do it later)
    let distanceVector = currentParticle.positionVector.subtract(checkedParticle.positionVector);
    let combinedRadius = parseInt(currentParticle.diameter)/2 + parseInt(checkedParticle.diameter)/2;
    let distance = distanceVector.getMagnitude() - combinedRadius;
    return distance;
}

function createParticle(event) {
    let mousePositionX = event.clientX;
    let mousePositionY = event.clientY;
    let newParticle = new Particle(
        mousePositionX, 
        mousePositionY,
        "Sphere",
        1,
        true,
        true);
    particles.push(newParticle);
    newParticle.spawn();
    newParticle.element.addEventListener("mouseenter", function(){
    let randomVelocity = new Vector(2, 2);
    newParticle.velocity = randomVelocity; 
    })
}

function startDrag(event) {
    mouseDragStartX = event.clientX;
    mouseDragStartY = event.clientY;
}

function createBlock(event) {
    let mouseDragEndX = event.clientX;
    let mouseDragEndY = event.clientY;
    let newBlock = new Block(
        Math.min(mouseDragStartX, mouseDragEndX),
        Math.min(mouseDragStartY, mouseDragEndY),
        Math.abs(mouseDragStartX - mouseDragEndX),
        Math.abs(mouseDragStartY - mouseDragEndY));
    obstacles.push(newBlock);
    newBlock.spawn();
    newBlock.update();
    newBlock.render();
}

function mainLoop() {
    // Iterating through all the particles to update and render them
    for(let i = 0; i < particles.length; i++) {
        let currentParticle = particles[i];

        for (let j = 0; j < particles.length; j++) {
            // i != j to avoid collision with itself
            if (i != j) {
                let checkedParticle = particles[j];
                let distance = getDistanceSphereToSphere(currentParticle, checkedParticle);

                if (distance <= 0)  {
                    currentParticle.setColliding(true);
                    
                    // Help from chatGPT on how to use my vectors for simple but more realistic collision handling
                    // Vectorial math applying conservation of momentum and energy principles
                    let relativeVelocity = currentParticle.velocity.subtract(checkedParticle.velocity);
                    let collisionNormal = checkedParticle.positionVector.subtract(currentParticle.positionVector).normalize();
                    let relativeVelocityAlongNormal = relativeVelocity.dot(collisionNormal);

                    // The first math.max is used to factor in elasticity. Can be removed if not needed
                    // Real elasticity factor is -(1+e) where 0 < e < 1
                    // I just use the biggest e of the two particles for now
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
                        currentParticle.positionVector = currentParticle.positionVector.subtract(collisionNormal.scale(separationDistance));
                    }
                    if (checkedParticle.isMovable) {
                        checkedParticle.positionVector = checkedParticle.positionVector.add(collisionNormal.scale(separationDistance));
                    }
                }
            }
        }
        currentParticle.update(obstacles);
        
        // Destroy a particle if it falls below the playground area
        if (currentParticle.positionVector.y > window.innerHeight) {
            currentParticle.destroy();
            particles.splice(i, 1);
            i--;
        }
        // Render the particle after all the checks
        currentParticle.render();
    }
    frames++;
    requestAnimationFrame(mainLoop);
}

//Main code
// Mouse events
document.getElementById("playground").addEventListener("mousedown", startDrag);
document.getElementById("playground").addEventListener("mouseup", createBlock)
document.getElementById("playground").addEventListener("wheel", createParticle)

// Button events
document.getElementById("gravityButton").addEventListener("click", function() {
    gravity.getMagnitude() == 0 ? gravity.y = gravityY : gravity.y = 0;
})

// Basic FPS counter
setInterval(() => {
    document.getElementById("frameCounter").innerHTML = `${frames} <br> ${particles.length}`;
    frames = 0;
}, 1000);
requestAnimationFrame(mainLoop);
