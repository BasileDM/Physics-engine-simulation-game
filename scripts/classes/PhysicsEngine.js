// Imported and instanciated once in Particle.js
export class PhysicsEngine {
    #gravity;

    constructor(gravity) {
        this.gravity = gravity;
    }

    get gravity(){
        return this.#gravity;
    }
    set gravity(vector) {
            this.#gravity = vector;
    }
}