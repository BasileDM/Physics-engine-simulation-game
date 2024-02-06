import { Particle } from "./classes/Particle.js";
import { Block } from "./classes/Particle.js";
import { Vector } from "./classes/Vector.js";

// Variables
let particles = []; // Array of all Particle object instances
let frames = 0;
let mouseDragStartX; // Might wanna use a vector here
let mouseDragStartY;

// Functions
function getDistanceSphereToSphere(currentParticle, checkedParticle) {
    // Pythagorean distance check (can be refactored to avoid using Sqrt which is expensive)
    let distanceVector = currentParticle.positionVector.subtract(checkedParticle.positionVector);
    let combinedRadius = parseInt(currentParticle.diameter)/2 + parseInt(checkedParticle.diameter)/2;
    let distance = distanceVector.getMagnitude() - combinedRadius;
    return distance;
}

function getDistanceBlockToSphere(blockParticle, sphereParticle) {
    // Calculate the closest point on the rectangle to the sphere
    let closestX = Math.max(blockParticle.positionVector.x, 
        Math.min(sphereParticle.positionVector.x, blockParticle.positionVector.x + blockParticle.width));
    let closestY = Math.max(blockParticle.positionVector.y, 
        Math.min(sphereParticle.positionVector.y, blockParticle.positionVector.y + blockParticle.height));
    
    // Calculate the distance between the sphere and the closest point on the block
    let distanceVector = new Vector(closestX, closestY).subtract(sphereParticle.positionVector);
    let distance = distanceVector.getMagnitude();

    // Subtract the radius of the sphere to get the actual distance between surfaces
    distance -= parseInt(sphereParticle.diameter) / 2;

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

        for (let j = 0; j < particles.length; j++) {

            // i != j to avoid collision with itself
            if (i != j) {
                let checkedParticle = particles[j];
                let distance;

                if (checkedParticle instanceof Block) {
                    distance = getDistanceBlockToSphere(checkedParticle, currentParticle);
                    console.log(distance);
                } else if (currentParticle instanceof Block) { 
                    distance = getDistanceBlockToSphere(currentParticle, checkedParticle);
                    console.log(distance);
                } else {
                    distance = getDistanceSphereToSphere(currentParticle, checkedParticle);
                }

                if (distance <= 0) {
                    // console.log(`${i} and ${j} are colliding.`);
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
