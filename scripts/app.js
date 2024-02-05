import { Particle } from "./classes/Particle.js";
import { Block } from "./classes/Particle.js";

// Variables
let particles = []; // Array of all Particle object instances
let frames = 0;
let mouseDragStartX; // Might wanna use a vector here
let mouseDragStartY;

// Functions
function calculateDistanceToSphere(currentParticle, checkedParticle) {
    // Pythagorean distance check (can be refactored to avoid using Sqrt which is expensive)
    // Can be refactored now that I use vectors for positioning properties
    let distanceX = currentParticle.positionVector.x - checkedParticle.positionVector.x;
    let distanceY = currentParticle.positionVector.y - checkedParticle.positionVector.y;
    let combinedRadius = parseInt(currentParticle.diameter)/2 + parseInt(checkedParticle.diameter)/2;
    let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY) - combinedRadius;
    return distance;
}

function isSphereTouchingRectangle(currentParticle, checkedParticle) {
    let currentParticleRadius = parseInt(currentParticle.diameter)/2;

    if (currentParticle.positionVector.x + currentParticleRadius > checkedParticle.positionVector.x &&
        currentParticle.positionVector.x - currentParticleRadius < checkedParticle.positionVector.x + checkedParticle.width &&
        currentParticle.positionVector.y + currentParticleRadius > checkedParticle.positionVector.y &&
        currentParticle.positionVector.y - currentParticleRadius < checkedParticle.positionVector.y + checkedParticle.height) {
            return 0;
    } else {
        return 1;
    }
    
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
    particles.push(newBlock);
    newBlock.spawn();
}

function mainLoop() {
    // Iterating through all the particles to update and render them
    for(let i = 0; i < particles.length; i++) {
        let currentParticle = particles[i];

        // Only spherical particles will check for collisions
        if (currentParticle.shape === "Sphere") {
            for (let j = 0; j < particles.length; j++) {
    
                // i != j to avoid collision with itself
                if (i != j) {
                    let checkedParticle = particles[j];
                    let distance;
                    if (checkedParticle.shape == "Sphere") {
                        distance = calculateDistanceToSphere(currentParticle, checkedParticle)

                    } else if (checkedParticle.shape == "Rectangle") {
                        distance = isSphereTouchingRectangle(currentParticle, checkedParticle)
                    }
                    if (distance <= 0) {
                        // console.log(`${i} and ${j} are colliding.`);
                        currentParticle.setColliding(true);
                        
                        // Help from chatGPT on how to use my vectors for simple but more realistic collision handling
                        // Vectorial math applying conservation of momentum and energy principles
                        let relativeVelocity = currentParticle.velocity.subtract(checkedParticle.velocity);
                        let collisionNormal = currentParticle.getCollisionNormal(checkedParticle);
                        let relativeVelocityAlongNormal = relativeVelocity.dot(collisionNormal);
    
                        // The first math.max is used to factor in elasticity. Can be removed if not needed
                        // Real elasticity factor is -(1+e) where 0 < e < 1
                        // I just use the biggest e of the two particles for now
                        let impulse = (Math.max(currentParticle.elasticity, checkedParticle.elasticity)) * relativeVelocityAlongNormal / (1 / currentParticle.mass + 1 / checkedParticle.mass);
                        currentParticle.velocity = currentParticle.velocity.subtract(collisionNormal.scale(impulse / currentParticle.mass));
                        checkedParticle.velocity = checkedParticle.velocity.add(collisionNormal.scale(impulse / checkedParticle.mass));
                        
                        // Solution for preventing particles from sinking into each other :
                        // Adding a separation distance along the collision normal
                        const separationDistance = 0.5;
                        currentParticle.positionVector = currentParticle.positionVector.subtract(collisionNormal.scale(separationDistance));
                        checkedParticle.positionVector = checkedParticle.positionVector.add(collisionNormal.scale(separationDistance));
    
                    }
                }
            }

        }
        currentParticle.update();
        
        // Destroy a particle if it falls below the playground area
        if (currentParticle.positionVector.y > 3*window.innerHeight/4) {
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
// document.getElementById("playground").addEventListener("click", createParticle);
document.getElementById("playground").addEventListener("mousedown", startDrag);
document.getElementById("playground").addEventListener("mouseup", createBlock)
document.getElementById("playground").addEventListener("wheel", createParticle)

// Basic FPS counter
setInterval(() => {
    document.getElementById("frameCounter").innerHTML = `${frames} <br> ${particles.length}`;
    frames = 0;
}, 1000);
requestAnimationFrame(mainLoop);
