import { Particle } from "./scripts/classes/Particle.js";

// Variables
// let particle1 = new Particle(20, 20);
let particles = [];

// Functions
function createParticle(event) {
    let mousePositionX = event.clientX;
    let mousePositionY = event.clientY;
    console.log({mousePositionX, mousePositionY});
    let newParticle = new Particle(mousePositionX, mousePositionY);
    newParticle.spawn();
}

function mainLoop() {
    for(let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].render();
    }
    requestAnimationFrame(mainLoop);
}

//Main code
document.getElementById("playground").addEventListener("click", createParticle);
let particle1 = new Particle(50, 50);
let particle2 = new Particle(10, 30);
particles.push(particle1, particle2);
particle1.spawn();
particle2.spawn();
requestAnimationFrame(mainLoop);