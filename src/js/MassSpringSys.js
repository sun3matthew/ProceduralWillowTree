import * as THREE from 'three';

class Particle {
    constructor(mass, position, velocity) {
        this.mass = mass;
        this.position = position;
        this.velocity = velocity;
        this.force = new THREE.Vector3(0, 0, 0);
    }
}
  
class Spring {
    constructor(p1, p2, ks, kd, restLength) {
        this.p1 = p1;
        this.p2 = p2;
  
        this.ks = ks;
        this.kd = kd;
  
        this.restLength = restLength;
    }
}
  
export class MassSpringSystem {
    constructor(isChain) {
      this.isChain = isChain;
  
      this.particles = [];
      this.springs = [];
  
      this.timeStep = 0.01;
      this.time = 0;
  
      this.gravity = new THREE.Vector3(0, -9.81, 0);
      this.groundKs = 1000;
      this.groundKd = 50;
  
      this.integrationMethod = 'verlet';
    }
  
    createParticles(numParticles) {
      let mass = 1.0;
      let position = new THREE.Vector3(0, 0, 0);
      let velocity = new THREE.Vector3(0, 0, 0);
  
      for (let i = 0; i < numParticles; i++) {
        this.particles.push(new Particle(mass, position, velocity));
    }
    }
  
    setParticle(index, mass, pos, vel) {
        if (index >= 0 && index < this.particles.length) {
            this.particles[index].mass = mass;
            this.particles[index].position = pos;
            this.particles[index].velocity = vel;
        }
    }
  
    setAllVelocities(vel) {
      for (let p of this.particles) {
      p.velocity = vel;
    }
    }
  
    createSprings(numSprings) {
      this.springs = new Array(numSprings);
    }
  
    linkSpring(index, p1, p2, ks, kd, length) {
        if (p1 < this.particles.length && p2 < this.particles.length) {
          let restLength;
      
          if (length >= 0) {
              restLength = length;
          } else {
            let d = this.particles[p1].position.clone().sub(this.particles[p2].position);
            restLength = d.length(); // `length()`, not `norm()`            
          }
  
          this.springs[index] = new Spring(p1, p2, ks, kd, restLength);
        }
    }
  
    computeForces() {
      for (let p of this.particles) {
        p.force.set(0, 0, 0).add(this.gravity.clone().multiplyScalar(p.mass)).add(new THREE.Vector3(0.01, 0, 0));

      }
  
      for (let s of this.springs) {
          let p1 = this.particles[s.p1];
          let p2 = this.particles[s.p2];
  
          let d = p2.position.clone().sub(p1.position);
          let dist = d.length();
  
          if (dist < 1e-6) {
            return;
          }
  
          let direction = d.clone().normalize();
  
          let springForce = direction.clone().multiplyScalar(s.ks * (dist - s.restLength));
          let relVelocity = p2.velocity.clone().sub(p1.velocity);
          let dampingForce = direction.clone().multiplyScalar((relVelocity.dot(direction))*(-s.kd));
  
          p1.force.add(springForce).add(dampingForce);
          p2.force.add(springForce.clone().add(dampingForce).multiplyScalar(-1));
      }
  
      for (let p of this.particles) {
          if (p.position[1] < 0) {
              let penetration = -p.position[1];
              let normalForce = new THREE.Vector3(0, this.groundKs * penetration, 0);
              let dampingForce = new THREE.Vector3(0, -this.groundKd * p.velocity[1], 0);
              p.force = p.force.add(normalForce.add(dampingForce));
          }
      }
  
    }
  
    integrate() {
        this.computeForces();
  
        if (this.isChain) {
          this.particles[0].velocity.set(0, 0, 0); // Prevent unwanted movement
          this.particles[0].force.set(0, 0, 0); // Prevent unwanted movement
          this.time += this.timeStep;
      }
  
        if (this.integrationMethod === "euler") {
          for (let p of this.particles) {
            p.position.add(p.velocity.clone().multiplyScalar(this.timeStep));
            let acceleration = p.force*(1.0 / p.mass);
            p.velocity = p.velocity.add(acceleration*(this*tep));
          }
        } else if (this.integrationMethod === "symplectic") {
          for (let p of this.particles) {
            let acceleration = p.force*(1.0 / p.mass);
            p.velocity.add(acceleration.clone().multiplyScalar(this.timeStep));
            p.position = p.position.add(p.velocity*(this.timeStep));
          }
        } else if (this.integrationMethod === "verlet") {
          for (let p of this.particles) {
            if (!p.previousPosition) {
              p.previousPosition = p.position.clone().sub(p.velocity.clone().multiplyScalar(this.timeStep));
            }
            let acceleration = p.force.clone().multiplyScalar(1.0 / p.mass);
            let newPosition = p.position.clone().multiplyScalar(2).sub(p.previousPosition).add(acceleration.clone().multiplyScalar(this.timeStep ** 2));

            p.previousPosition.copy(p.position);
            p.position.copy(newPosition);
          }
        }
    }
  
    setIntegrationMethod(method, timeStep) {
        this.integrationMethod = method;
        this.timeStep = timeStep;
    }
  
    setGroundProperties(ks, kd) {
      this.groundKs = ks;
      this.groundKd = kd;
  }
  
  setGravity(g) {
      this.gravity = new THREE.Vector3(0, g, 0);
  }
}