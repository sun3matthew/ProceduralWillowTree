import * as THREE from 'three';

export class LeafParticles {
    constructor(scene) {
        this.scene = scene;
        this.particleCount = 300; // Number of leaves
        this.particles = new THREE.Group();
        this.groundLevel = 0; // Set ground level
        this.initParticles();

        // Prewarm for a smoother start
        const prewarm = 1000;
        for (let i = 0; i < prewarm; i++) {
            this.update();
        }
    }

    initParticles() {
        const leafGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const texture = new THREE.TextureLoader().load('/textures/leaf.png');
        texture.encoding = THREE.sRGBEncoding; // Adjust brightness correction

        for (let i = 0; i < this.particleCount; i++) {
            const leafMaterial = new THREE.MeshStandardMaterial({
                map: texture,
                transparent: true,
                opacity: 0, // Start fully transparent
                side: THREE.DoubleSide,
                depthWrite: false,
            });

            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.set(
                (Math.random() - 0.5) * 0.2, // Random X
                Math.random() * 5 + 5, // Start above scene
                (Math.random() - 0.5) * 0.2 // Random Z
            );
            leaf.rotation.z = Math.random() * Math.PI;
            leaf.hash = Math.random() * 100; // Random hash for unique motion
            leaf.fadeProgress = 0; // Start fade progress at 0
            leaf.stopped = false; // Flag to check if it should stop
            leaf.fadeOutProgress = 1; // Controls fade-out effect

            this.particles.add(leaf);
        }

        this.scene.add(this.particles);
    }

    update() {
        this.particles.children.forEach((leaf) => {
            if (!leaf.stopped) {
                leaf.position.y -= 0.01; // Falling speed
                leaf.position.x += Math.sin(leaf.position.y + leaf.hash) * 0.01; // Drift motion
                leaf.position.z += Math.cos(leaf.position.y + leaf.hash * 12) * 0.01; // Drift motion
                leaf.position.x += 0.005; // Drift to the right
                leaf.rotation.z += 0.01; // Rotate slightly

                // Fade in effect while falling
                if (leaf.fadeProgress < 1) {
                    leaf.material.opacity = Math.min(1, leaf.fadeProgress);
                    leaf.fadeProgress += 0.01;
                }

                // Stop when it hits the ground
                if (leaf.position.y <= this.groundLevel) {
                    leaf.position.y = this.groundLevel; // Snap to ground
                    leaf.stopped = true; // Mark as stopped
                }
            } else {
                // Leaves on the ground still drift slightly
                leaf.position.x += Math.sin(leaf.hash) * 0.002; // Small drifting motion

                // Fade out effect after stopping
                if (leaf.fadeOutProgress > 0) {
                    leaf.material.opacity = leaf.fadeOutProgress;
                    leaf.fadeOutProgress -= 0.005; // Slow fade-out
                }

                // Reset leaf when fully faded
                if (leaf.fadeOutProgress <= 0) {
                    this.resetLeaf(leaf);
                }
            }
        });
    }

    resetLeaf(leaf) {
        leaf.position.y = Math.random() * 5 + 3;
        leaf.position.x = (Math.random() - 0.5) * 10;
        leaf.position.z = (Math.random() - 0.5) * 10;
        leaf.fadeProgress = 0;
        leaf.fadeOutProgress = 1;
        leaf.material.opacity = 0;
        leaf.stopped = false;
    }
}
