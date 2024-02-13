import { Particle } from "./classes/Particle.js";
import { Zone } from "./classes/Particle.js";
import { Vector } from "./classes/Vector.js";

// Variables
let gravityY = 0.002 // Default : 0.002 Used for the gravity toggle button
export let gravity = new Vector(0, gravityY);
export let airDensity = 1.225 / 1000000; // Default : 1.225 (/1000000 to convert to kg/cm^3)

let frames = 0;
export let frameTime = 0; // 1000ms divided by frames per second

let particles = []; // Array of all "Particle" class instances

let playground = document.getElementById("playground");
let hasDragStarted = false;
let mouseDragStart = new Vector(0, 0);

// Functions
//
function getCollisionResponse(currentParticle, checkedParticle) {
    let distance = getDistanceSphereToSphere(currentParticle, checkedParticle);
                
    if (checkedParticle.shape == "Rectangle") {
        if (isParticleInsideZone(currentParticle, checkedParticle) && !isParticleInZoneArray(currentParticle, checkedParticle)) {
            checkedParticle.addToAffectedParticles(currentParticle);
            checkedParticle.addEffectToParticle(currentParticle);
            currentParticle.element.classList.toggle("underwaterParticle");
            if (checkedParticle.isDensityZone) currentParticle.changeMedium(checkedParticle.density);


        } else if (!isParticleInsideZone(currentParticle, checkedParticle) && isParticleInZoneArray(currentParticle, checkedParticle)) {
            
            let currentParticleIndex = checkedParticle.affectedParticles.findIndex(
                (element) => element == currentParticle);
            checkedParticle.affectedParticles.splice(currentParticleIndex, 1);
            checkedParticle.removeEffectFromParticle(currentParticle);
            currentParticle.changeMedium(airDensity);
            currentParticle.element.classList.toggle("underwaterParticle");
        };
    }
    
    if (distance <= 0 && checkedParticle.shape != "Rectangle")  {
        let currentParticleCenter = currentParticle.positionVector.add(new Vector(currentParticle.radius, currentParticle.radius));
        let checkedParticleCenter = checkedParticle.positionVector.add(new Vector(checkedParticle.radius, checkedParticle.radius));
        
        // Using vectors for simple but more realistic collision handling
        // Vectorial math applying conservation of momentum and energy principles
        let relativeVelocity = currentParticle.velocity.subtract(checkedParticle.velocity);
        let collisionNormal = checkedParticleCenter.subtract(currentParticleCenter).normalize();
        let relativeVelocityAlongNormal = relativeVelocity.dot(collisionNormal);

        // Elasticity (e) factor is (1+e) where 0 < e < 1
        let impulse = (1 + currentParticle.elasticity) * relativeVelocityAlongNormal / (1 / currentParticle.mass + 1 / checkedParticle.mass);
        // Change particles velocity according to the impulse 
        if (currentParticle.isMovable) {
            currentParticle.velocity = currentParticle.velocity.subtract(collisionNormal.scale(impulse / currentParticle.mass));
        }
        if (checkedParticle.isMovable) {
            checkedParticle.velocity = checkedParticle.velocity.add(collisionNormal.scale(impulse / checkedParticle.mass));
        }
        
        // Solution to prevent particles from sinking into each other :
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

    // Pythagorean distance check (can be refactored to avoid using Sqrt which is expensive)
    let distanceVector = currentParticleCenter.subtract(checkedParticleCenter);
    let combinedRadius = currentParticle.radius + checkedParticle.radius;
    let distance = distanceVector.getMagnitude() - combinedRadius;
    return distance;
}

function isParticleInsideZone(sphereParticle, rectangleParticle) {
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

function isParticleInZoneArray(currentParticle, checkedParticle) {
    return checkedParticle.affectedParticles.findIndex((element) => element == currentParticle) >= 0;
}

function changePlaygroundTool(tool) {
    switch(tool){
        case null:
            playground.removeEventListener("mousedown", startDrag);
            playground.removeEventListener("mouseup", createZone);
            playground.style.cursor = "default";
            break;
        case 'zoneTool': 
            playground.addEventListener("mousedown", startDrag);
            playground.addEventListener("mouseup", createZone);
            playground.style.cursor = "crosshair";
            break;
    }
}

let hasGravity;
let isMovable;
let diameter;
let elasticity;
let density;
let color;
function createParticle(event) {
    let mousePositionVector = new Vector (event.clientX, event.clientY);
    let newParticle = new Particle(
        mousePositionVector,
        hasGravity,
        isMovable,
        diameter,
        elasticity,
        density,
        color);
    particles.push(newParticle);
    console.log(newParticle);
    // Mouse push on hover
    newParticle.element.addEventListener("mouseenter", function(){
        let randomVelocity = new Vector((Math.random()-0.5)*2, Math.random()*-2);
        newParticle.velocity = randomVelocity;
    });
}

function startDrag(event) {
    hasDragStarted = true;
    mouseDragStart = new Vector(event.clientX, event.clientY);
}


let isDensityZone;
let zoneName;
let zoneColor;
let zoneDensity;
function createZone(event) {
    if (hasDragStarted) {
        let mouseDragEnd = new Vector(event.clientX, event.clientY);
        let newZone = new Zone(
            new Vector (Math.min(mouseDragStart.x, mouseDragEnd.x), Math.min(mouseDragStart.y, mouseDragEnd.y)),
            Math.abs(mouseDragStart.x - mouseDragEnd.x),
            Math.abs(mouseDragStart.y - mouseDragEnd.y),
            isDensityZone, // isDensityZone
            zoneName, // effect (name of zone is also name of effect)
            zoneColor,
            zoneDensity); // color
            
        particles.push(newZone);
        console.log(newZone);
    }
    hasDragStarted = false;
}

let particleTool = document.getElementById("particleTool");
let zoneTool = document.getElementById("zoneTool");
let objectTool = document.getElementById("objectTool");
let inspectorTool = document.getElementById("inspectorTool");
let pusherTool = document.getElementById("pusherTool");
function displayToolMenu(tool) {
    particleTool.style.display != "flex" && particleTool == tool ? 
    particleTool.style.display = "flex" :
    particleTool.style.display = "none";

    zoneTool.style.display != "flex" && zoneTool == tool ? 
    zoneTool.style.display = "flex" :
    zoneTool.style.display = "none";

    objectTool.style.display != "flex" && objectTool == tool ? 
    objectTool.style.display = "flex" :
    objectTool.style.display = "none";

    inspectorTool.style.display != "flex" && inspectorTool == tool ? 
    inspectorTool.style.display = "flex" :
    inspectorTool.style.display = "none";

    pusherTool.style.display != "flex" && pusherTool == tool ? 
    pusherTool.style.display = "flex" :
    pusherTool.style.display = "none";

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
        if (currentParticle instanceof Particle) {
            currentParticle.update();
        }
        
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
playground.addEventListener("wheel", createParticle);
changePlaygroundTool(null);

// // Button events
// Gravity toggle
document.getElementById("gravityButton").addEventListener("click", function() {
    gravity.getMagnitude() == 0 ? gravity.y = gravityY : gravity.y = 0;
})
// Global variables apply button
document.getElementById("variablesApplyButton").addEventListener("click", function() {
    gravityY = 0.002 * document.getElementById("gravityFactor").value;
    gravity = new Vector(0, gravityY);
    airDensity =  parseFloat(document.getElementById("airDensity").value) / 1000000;
})

// Tools
document.getElementById("particleCreatorButton").addEventListener("click", function() {
    displayToolMenu(particleTool);
    changePlaygroundTool(null);
    playground.style.cursor = "default"
})
document.getElementById("zoneCreatorButton").addEventListener("click", function() {
    displayToolMenu(zoneTool);
})
document.getElementById("objectCreatorButton").addEventListener("click", function() {
    displayToolMenu(objectTool);
})
document.getElementById("inspectorToolButton").addEventListener("click", function() {
    displayToolMenu(inspectorTool);
})
document.getElementById("pusherToolButton").addEventListener("click", function() {
    displayToolMenu(pusherTool);
})

//#region Particle creator tool
// Particle properties apply button
document.getElementById("particleToolApply").addEventListener("click", function() {
    diameter = `${document.getElementById("size").value}px`;
    elasticity = parseFloat(document.getElementById("elasticity").value);
    density = document.getElementById("density").value;
    color = document.getElementById("insideColor").value;
    isMovable = document.getElementById("isMovable").checked;
    hasGravity = document.getElementById("hasGravity").checked;
})

let materialList = [
    {"Name": "Helium", "Density": 0.18, "Color": "#A6B7C5"},
    {"Name": "Air", "Density": 1.225, "Color": "#f5f5f5"},
    {"Name": "Chestnut wood", "Density": 575, "Color": "#CDAC79"},
    {"Name": "Water", "Density": 1000, "Color": "#6495ed"},
    {"Name": "Steel", "Density": 7850, "Color": "#6C6C6C"},
    {"Name": "Osmium", "Density": 22590, "Color": "#9090A3"}
];

// Creating material cards HTML
let materialsColumn = document.querySelector("#materialsColumn");

materialList.forEach(function (material) {
    materialsColumn.innerHTML +=
        `<div class="materialContainer" id="${material.Name}" title="${material.Name} &#013;Density : ${material.Density}kg/m³">
            <div class="material" alt="${material.Name}" style="background-color: ${material.Color};"></div>
            <p>${material.Name}</p>
        </div>`;
});

// Adding event listeners to each of the materials to change input content
materialList.forEach(function (material) {
    document.getElementById(`${material.Name}`).addEventListener("click", () => {
        document.getElementById("density").value = material.Density;
        document.getElementById("insideColor").value = material.Color;
        document.getElementById('mass').value = Math.round(((4/3) * Math.PI * Math.pow((parseInt(document.getElementById("size").value)/2), 3) * (parseFloat(material.Density)/ 1000000)) * 1000) / 1000;
    });
});
//#endregion

//#region Zone creator tool
// Display density zones cards
let densityZonesColumn = document.getElementById("densityZonesColumn");
materialList.forEach(function (material) {
    densityZonesColumn.innerHTML +=
        `<div class="materialContainer" id="zone${material.Name}" title="${material.Name} &#013;Density : ${material.Density}kg/m³ &#013;Makes the density of the air inside the zone the same as the selected material.">
            <div id="material${material.Name}" class="zoneMaterial" alt="${material.Name}" style="background-color: ${material.Color};"></div>
            <p>${material.Name}</p>
        </div>`;
});

// Density zones cards event listeners
materialList.forEach(function (material) {
    document.getElementById(`zone${material.Name}`).addEventListener("click", () => {
        zoneName = `DensityZone`;
        zoneColor = material.Color;
        isDensityZone = true;
        zoneDensity = material.Density / 1000000;
        changePlaygroundTool('zoneTool')
    });
});

// Effect zones list
let effectZonesList = [
    {"Name": "Anti-gravity", "Color": "blue", "isDensityZone": false, "Description": "Particles in the zone will no longer be affected by gravity."},
    {"Name": "Color change", "Color": "red", "isDensityZone": false, "Description": "Particles in the zone will change color."}
];
// Display effect zones cards
let effectZonesColumn = document.getElementById("effectZonesColumn");
effectZonesList.forEach(function (effectZone) {
    effectZonesColumn.innerHTML +=
        `<div class="materialContainer" id="${effectZone.Name}" title="${effectZone.Name} zone : &#013;${effectZone.Description}">
            <div id="material${effectZone.Name}" class="zoneMaterial" alt="${effectZone.Name}" style="background-color: ${effectZone.Color};"></div>
            <p>${effectZone.Name}</p>
        </div>`;
});
// Effect zones cards event listeners
effectZonesList.forEach(function (effectZone) {
    document.getElementById(`${effectZone.Name}`).addEventListener("click", () => {
        zoneName = effectZone.Name;
        zoneColor = effectZone.Color;
        isDensityZone = false;
        changePlaygroundTool('zoneTool');
        console.log(zoneName);
        console.log(zoneColor);
    });
});
//#endregion

//#region Object spawner tool
let objectsList = [
    {"Name": "Basket Ball", "Diameter": "24px", "Density": 83, "Elasticity":0.8, "Image": "../images/basket-ball.png"},
    {"Name": "Air ballon", "Diameter": "30px", "Density": 1.28, "Elasticity":0.74, "Image": "../images/rubber-balloon.png"}
];
let objectsListColumn = document.getElementById("objectsList");
objectsList.forEach(function (object) {
    objectsListColumn.innerHTML +=
        `<div class="materialContainer" id="${object.Name}" title="${object.Name} &#013;Density : ${object.Density}kg/m³ &#013;">
            <div id="material${object.Name}" class="material objectsMaterial" alt="${object.Name}" style="background-image: url('${object.Image}'); background-size: 40px;"></div>
            <p>${object.Name}</p>
        </div>`;
});
objectsList.forEach(function (object) {
    document.getElementById(`${object.Name}`).addEventListener("click", () => {
        diameter = object.Diameter;
        density = object.Density;
        elasticity = object.Elasticity;
    });
});
//#endregion

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

// Clear button
document.getElementById("clearPlayground").addEventListener("click", function() {
    for (let particle of particles) {
        particle.destroy();
    }
    particles = [];
})

// Modal window for tutorial
const dialog = document.querySelector("dialog");
dialog.showModal()
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
