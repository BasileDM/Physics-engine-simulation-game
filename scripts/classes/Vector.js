export class Vector {
   constructor(x, y) {
      this.x = x;
      this.y = y;
   }

   getMagnitude() {
    let magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    return magnitude;
   }

   add(otherVector) {
      return new Vector(this.x + otherVector.x, this.y + otherVector.y);
   }

   substract(otherVector) {
    return new Vector(this.x - otherVector.x, this.y - otherVector.y)
   }

   normalize() {
    let magnitude = this.getMagnitude();
    // Avoid division by 0 and return empty vector instead
    if (magnitude === 0) {
        return new Vector(0, 0);
    }
    return new Vector(this.x / magnitude, this.y / magnitude);
   }

   dot(otherVector) {
    return this.x * otherVector.x + this.y * otherVector.y;
   }

   scale(value) {
    return new Vector(this.x * value, this.y * value);
   }
}
