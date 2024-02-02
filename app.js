import { Particle } from "./scripts/classes/Particle.js";

// Variables
let particles = [];

// Functions
function createParticle(event) {
    let mousePositionX = event.clientX;
    let mousePositionY = event.clientY;
    let newParticle = new Particle(mousePositionX, mousePositionY);
    particles.push(newParticle);
    newParticle.spawn();
}

function mainLoop() {
    for(let i = 0; i < particles.length; i++) {
        let currentParticle = particles[i];
        currentParticle.update();
        currentParticle.render();

        for (let j = 0; j < particles.length; j++) {
            // i != j to avoid collision with itself
            if (i != j) {
                let checkedParticle = particles[j];

                // Distance check from stackoverflow https://stackoverflow.com/questions/45439503/distance-function-returning-the-wrong-thing
                let distanceX = currentParticle.positionX - checkedParticle.positionX;
                let distanceY = currentParticle.positionY - checkedParticle.positionY;
                let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
                if (distance < 10) {
                    console.log(`${i} and ${j} are colliding.`);
                    console.log(particles);
                    currentParticle.velocity -= 0.15;
                }
            }
        }   
        
        if (currentParticle.positionY > 500) {
            currentParticle.destroy();
            particles.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(mainLoop);
}

//Main code
document.getElementById("playground").addEventListener("click", createParticle);
requestAnimationFrame(mainLoop);
