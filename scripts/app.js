import { Particle } from "./classes/Particle.js";

// Variables
let particles = []; // Array of all Particle object instances

// Functions
function calculateDistance(currentParticle, checkedParticle) {
    // Pythagorean distance check
    // Can be refactored now that I use vectors for positioning properties
    let distanceX = currentParticle.positionVector.x - checkedParticle.positionVector.x;
    let distanceY = currentParticle.positionVector.y - checkedParticle.positionVector.y;
    let combinedRadius = parseInt(currentParticle.diameter)/2 + parseInt(checkedParticle.diameter)/2;
    let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY) - combinedRadius;
    return distance;
}

function createParticle(event) {
    let mousePositionX = event.clientX;
    let mousePositionY = event.clientY;
    let newParticle = new Particle(mousePositionX, mousePositionY);
    particles.push(newParticle);
    newParticle.spawn();
}

function mainLoop() {
    // Iterating through all the particles to update and render them
    for(let i = 0; i < particles.length; i++) {
        let currentParticle = particles[i];

        // Collision check
        for (let j = 0; j < particles.length; j++) {

            // i != j to avoid collision with itself
            if (i != j) {
                let checkedParticle = particles[j];
                let distance = calculateDistance(currentParticle, checkedParticle)
                if (distance <= 0) {
                    // console.log(`${i} and ${j} are colliding.`);
                    currentParticle.setColliding(true);
                    
                    // Help from chatGPT on how to use my vectors for simple but more realistic collision handling
                    // Vectorial math applying conservation of momentum and energy principles
                    let relativeVelocity = currentParticle.velocity.substract(checkedParticle.velocity);
                    let collisionNormal = checkedParticle.positionVector.substract(currentParticle.positionVector).normalize();
                    let relativeVelocityAlongNormal = relativeVelocity.dot(collisionNormal);
                    let impulse = relativeVelocityAlongNormal * 2 / (1 / currentParticle.mass + 1 / checkedParticle.mass);
                    currentParticle.velocity = currentParticle.velocity.substract(collisionNormal.scale(impulse / currentParticle.mass));
                    checkedParticle.velocity = checkedParticle.velocity.add(collisionNormal.scale(impulse / checkedParticle.mass));
                    
                    // Solution for preventing particles from sinking into each other :
                    // Adding a separation distance along the collision normal
                    const separationDistance = 0.5;
                    currentParticle.positionVector = currentParticle.positionVector.substract(collisionNormal.scale(separationDistance / 2));
                    checkedParticle.positionVector = checkedParticle.positionVector.add(collisionNormal.scale(separationDistance / 2));

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
    requestAnimationFrame(mainLoop);
}

//Main code
document.getElementById("playground").addEventListener("click", createParticle);
requestAnimationFrame(mainLoop);
