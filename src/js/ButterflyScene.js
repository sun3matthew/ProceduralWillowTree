import * as THREE from 'three';
import { HermiteSpline } from './HermiteSpline.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ButterflyScene {
    constructor(scene, position, scale) {
        this.scene = scene;
        this.spline = new HermiteSpline();
        this.butterfly = null;
        this.butterflyMixer = null;
        this.flightProgress = Math.random(); // Start at a random position on the path
        this.clock = new THREE.Clock();
        
        this.createRandomizedSpline(position, scale);
        this.initButterfly();
    }

    // Generate a randomized circular spline centered at 'center' with radius 'scale'
    createRandomizedSpline(center, scale) {
        const variation = scale * 0.3; // Amount of randomness in path points
        this.spline.addPoint(center.x, center.y, center.z, this.rand(-20, 20), 0, this.rand(-20, 20));
        this.spline.addPoint(center.x, center.y + this.rand(-1, 1), center.z + scale, this.rand(-20, 20), 0, this.rand(-20, 20));
        this.spline.addPoint(center.x + scale + this.rand(-variation, variation), center.y, center.z + scale, this.rand(-20, 20), 0, this.rand(-20, 20));
        this.spline.addPoint(center.x + scale, center.y + this.rand(-1, 1), center.z, this.rand(-20, 20), 0, this.rand(-20, 20));
        this.spline.addPoint(center.x, center.y, center.z, this.rand(-20, 20), 0, this.rand(-20, 20));
    }

    // Load the butterfly model and start its animation
    initButterfly() {
        const loader = new GLTFLoader();
        loader.load('/butterfly/scene.gltf', (gltf) => {
            this.butterfly = gltf.scene;
            this.butterfly.position.set(0, 5, 0);
            this.butterfly.scale.set(0.1, 0.1, 0.1);

            const randomHue = Math.random() * 360; // Full hue range
            const color = new THREE.Color().setHSL(randomHue / 360, 1.0, 0.5); // Full saturation, mid-lightness

            this.butterfly.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material = child.material.clone(); // Clone material to avoid affecting other butterflies
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.color.set(color));
                    } else {
                        child.material.color.set(color);
                    }
                }
            });

            this.scene.add(this.butterfly);

            // Handle animations
            if (gltf.animations.length > 0) {
                this.butterflyMixer = new THREE.AnimationMixer(this.butterfly);
                const action = this.butterflyMixer.clipAction(gltf.animations[0]);
                action.play();
            }
        }, undefined, (error) => {
            console.error('Error loading the butterfly model:', error);
        });
    }

    // Update function to animate the butterfly along the spline
    update() {
        const delta = this.clock.getDelta();

        if (this.butterflyMixer) {
            this.butterflyMixer.update(delta);
        }

        if (this.butterfly) {
            this.flightProgress += delta * 0.1; // Adjust speed
            if (this.flightProgress > 1) {
                this.flightProgress = 0;
            }

            const position = this.spline.getPoint(this.flightProgress);
            this.butterfly.position.set(position.x, position.y, position.z);

            // Orient the butterfly along the path
            const nextT = Math.min(this.flightProgress + 0.01, 1);
            const nextPosition = this.spline.getPoint(nextT);
            const direction = new THREE.Vector3().subVectors(nextPosition, position).normalize();
            this.butterfly.lookAt(nextPosition);
            this.butterfly.rotateY(Math.PI);
        }
    }

    // Utility function to generate random values in a range
    rand(min, max) {
        return Math.random() * (max - min) + min;
    }
}
