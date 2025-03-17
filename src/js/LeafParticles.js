import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

export class LeafParticles {
    constructor(scene) {
        this.scene = scene;
        this.particleCount = 500;
        this.particles = new THREE.Group();
        this.groundLevel = 0;
        this.gravity = -9.81 * 0.001; // Scaled gravity
        this.airResistance = 0.02;
        this.windStrength = 0.01;
        this.noise = new SimplexNoise(); // Perlin-style noise
        this.time = 0;

        this.initParticles();

        // Prewarm
        const prewarm = 1000;
        for (let i = 0; i < prewarm; i++) {
            this.update();
        }
    }

    initParticles() {
        const leafGeometry = new THREE.PlaneGeometry(0.1, 0.1);
        const texture = new THREE.TextureLoader().load('/textures/leaf.png');
        texture.encoding = THREE.sRGBEncoding;

        for (let i = 0; i < this.particleCount; i++) {
            const leafMaterial = new THREE.MeshStandardMaterial({
                map: texture,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
                depthWrite: false,
            });

            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

            // leaf.position = new THREE.Vector3(0, 0, 0); // Position vector
            leaf.velocity = new THREE.Vector3(0, 0, 0); // Velocity vector
            this.resetLeaf(leaf);

            leaf.rotationVelocity = Math.random() * 0.02 - 0.01;
            leaf.hash = Math.random() * 100;
            leaf.fadeProgress = 0;
            leaf.stopped = false;
            leaf.fadeOutProgress = 1;

            this.particles.add(leaf);
        }

        this.scene.add(this.particles);
    }

    update(deltaTime = 0.016) {
        this.time += deltaTime;
        
        this.particles.children.forEach((leaf) => {
            if (!leaf.stopped) {
                // Gravity force
                leaf.velocity.y += this.gravity * deltaTime;

                // Wind force using Perlin noise
                const windX = this.windStrength * this.noise.noise(leaf.hash, this.time * 0.2);
                const windZ = this.windStrength * this.noise.noise(leaf.hash + 100, this.time * 0.2);
                leaf.velocity.x += windX * deltaTime;
                leaf.velocity.z += windZ * deltaTime;

                // Air resistance (drag)
                leaf.velocity.multiplyScalar(1 - this.airResistance * deltaTime);

                // Apply velocity
                leaf.position.add(leaf.velocity);
                leaf.rotation.z += leaf.rotationVelocity;

                // Fade in effect
                if (leaf.fadeProgress < 1) {
                    leaf.material.opacity = Math.min(1, leaf.fadeProgress);
                    leaf.fadeProgress += 0.01;
                }

                // Stop on ground
                if (leaf.position.y <= this.groundLevel) {
                    leaf.position.y = this.groundLevel;
                    leaf.stopped = true;
                }
            } else {
                // Small drifting motion after landing
                leaf.position.x += Math.sin(leaf.hash) * 0.002;

                // Fade out effect
                if (leaf.fadeOutProgress > 0) {
                    leaf.material.opacity = leaf.fadeOutProgress;
                    leaf.fadeOutProgress -= 0.05;
                }

                // Reset leaf when fully faded
                if (leaf.fadeOutProgress <= 0) {
                    this.resetLeaf(leaf);
                }
            }
        });
    }

    resetLeaf(leaf) {
        leaf.position.set((Math.random() - 0.5) * 5, Math.random() * 3 + 0.5, (Math.random() - 0.5) * 5);
        leaf.velocity.set(0, 0, 0);
        leaf.fadeProgress = 0;
        leaf.fadeOutProgress = 1;
        leaf.material.opacity = 0;
        leaf.stopped = false;
        leaf.rotationVelocity = Math.random() * 0.02 - 0.01;
    }
}
