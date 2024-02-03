import { Particle } from "./scripts/classes/Particle.js";

// Variables
let particles = []; // Array of all Particle object instances

// Functions
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

                // Pythagorian distance check from stackoverflow https://stackoverflow.com/questions/45439503/distance-function-returning-the-wrong-thing
                let distanceX = currentParticle.positionX - checkedParticle.positionX;
                let distanceY = currentParticle.positionY - checkedParticle.positionY;
                let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
                if (distance < 12) {
                    // console.log(`${i} and ${j} are colliding.`);
                    // console.log(particles);
                    currentParticle.setColliding(true);
                    currentParticle.velocity = 0;
                }
            }
        }
        currentParticle.update();
        
        // Destroy a particle if it falls below the playground area
        if (currentParticle.positionY > 3*window.innerHeight/4) {
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
