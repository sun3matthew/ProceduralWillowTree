import { HermiteSpline } from './HermiteSpline.js';
import { MassSpringSystem } from './MassSpringSys.js';

import * as THREE from 'three';
import { WillowTree } from './WillowTree.js';
import { mx_bilerp_0 } from 'three/src/nodes/materialx/lib/mx_noise.js';

export class Vine {
    constructor(scene, vine_point) {
        console.log(vine_point)
        // Initialize spline and mass spring system
        this.scene = scene;
        this.spline = new HermiteSpline();
        this.particle_system = new MassSpringSystem(true);

        // Number of particles tied to the height of the vine; the higher the viner, the more points we have
        this.num_particles = 4+4*(Math.floor(vine_point.y*Math.random())+2);
        // this.num_vine_leaves = 6*this.num_particles;
        this.num_vine_leaves = this.num_particles / 4;

        // Spring stuff
        const mass = 0.01;
        const damping = 500+500*Math.random();
        const elasticity = 25+25*Math.random();
        const rest_length = 0.1;

        // const mass = 0.01;
        // const damping = 1000;
        // const elasticity = 100;

        // const rest_length = 0;

        // Spheres to draw vine
        this.vine_leaves = []

        this.particle_system.createParticles(this.num_particles);
        let prev_branch_point = new THREE.Vector3(vine_point.x, vine_point.y, vine_point.z);

        // Add initial point to both spline and particle system
        this.spline.addPoint(vine_point.x, vine_point.y, vine_point.z, new THREE.Vector3(0, 0, 0));
        this.particle_system.setParticle(0, mass, vine_point, new THREE.Vector3(0, 0, 0));

        for (let i = 1; i < this.num_particles; i++) {
            // We initialize each vine as going straight down with some perturbation
            let new_branch_point = new THREE.Vector3(prev_branch_point.x + 0.05*(Math.random()-0.5), prev_branch_point.y - 0.1, prev_branch_point.z + 0.05*(Math.random()-0.5));
            this.spline.addPoint(new_branch_point.x, new_branch_point.y, new_branch_point.z, new THREE.Vector3(0, 0, 0));
            this.particle_system.setParticle(i, mass, new_branch_point, new THREE.Vector3(0, 0, 0));

            prev_branch_point.x = new_branch_point.x;
            prev_branch_point.y = new_branch_point.y;
            prev_branch_point.z = new_branch_point.z;
        }

        // Link each particle together via a spring
        this.particle_system.createSprings(this.num_particles-1);
        for (let i = 0; i < this.num_particles - 1; i++) {
            this.particle_system.linkSpring(i, i, i + 1, elasticity, damping, rest_length);
        }

        let color_choices = [0x1E5515, 0x1E5615, 0x1E5415, 0x1E6515, 0x1E4615, 0x1E7415, 0x1E6515, 0x1E2415, 0x1E8815]

        // // Add all vine leaves to the scene
        // for (let i = 0; i < this.num_vine_leaves; i++) {
        //     let point = new THREE.Vector3(0, 0, 0);
            
        //     let torusGeometry = new THREE.TorusGeometry(
        //         0.0125 + 0.00625 * Math.random(), // Radius
        //         0.005, // Tube radius (thickness)
        //         2, // Radial segments
        //         4 // Tubular segments
        //     );

        //     let color = color_choices[Math.floor(Math.random() * 6)];
        //     let material = new THREE.MeshStandardMaterial({ color: color });

        //     let torus = new THREE.Mesh(torusGeometry, material);
        //     torus.position.copy(point);
            
        //     torus.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            
        //     this.scene.add(torus);
        //     this.vine_leaves.push(torus);
        // }

        const textureLoader = new THREE.TextureLoader();

        const texturePaths = [
            '/textures/willow/Layer 1.png',
            '/textures/willow/Layer 2.png',
            '/textures/willow/Layer 3.png',
            '/textures/willow/Layer 4.png',
            '/textures/willow/Layer 5.png'
        ];
        
        this.textures = texturePaths.map(path => textureLoader.load(path));

        for (let i = 0; i < this.num_vine_leaves; i++) {
            let point = new THREE.Vector3(0, 0, 0);
            let texture = this.textures[Math.floor(Math.random() * this.textures.length)];

            let material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                alphaTest: 0.5,
                side: THREE.DoubleSide
            });

            let quadGeometry = new THREE.PlaneGeometry(0.1 * 4, 0.2 * 4);
            let quad1 = new THREE.Mesh(quadGeometry, material);
            let quad2 = new THREE.Mesh(quadGeometry, material);

            quad2.rotation.y = Math.PI / 2;

            let vineGroup = new THREE.Group();
            vineGroup.add(quad1);
            vineGroup.add(quad2);

            vineGroup.position.copy(point);
            this.scene.add(vineGroup);
            this.vine_leaves.push(vineGroup);
        }
        
    }

    update() {
        this.particle_system.integrate();

        for (let i = 0; i < this.num_particles; i++) {
            // Set spline control point positions
            let position = this.particle_system.particles[i].position;
            this.spline.setPoint(i, position.x, position.y, position.z)
            
            // Assign tangents to hermite spline points
            try {
              const position_i_minus_1 = this.particle_system.particles[i-1].position;
              const position_i_plus_1 = this.particle_system.particles[i+1].position;
              const t_x = position_i_plus_1.x - position_i_minus_1.x;
              const t_y = position_i_plus_1.y - position_i_minus_1.y;
              const t_z = position_i_plus_1.z - position_i_minus_1.z;
              this.spline.setTangent(i,  t_x, t_y, t_z);
            } catch {
                this.spline.setTangent(i,  0, 0, 0);
            }
        }
                
        // // Finally, draw the spline in real time
        // for (let i = 0; i < this.num_vine_leaves; i++) {
        //     let t = i / this.num_vine_leaves;
        //     let point = this.spline.getPoint(t);
        //     this.vine_leaves[i].position.copy(point);    
        // }

        let lastPoint = this.spline.getPoint(0);
        for (let i = 1; i < this.num_vine_leaves ; i++) {
            let currentPoint = this.spline.getPoint(i / this.num_vine_leaves);

            let direction = new THREE.Vector3().subVectors(lastPoint, currentPoint).normalize();
            let up = new THREE.Vector3(0, 1, 0);
            
            let quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
            this.vine_leaves[i].position.copy(currentPoint);
            this.vine_leaves[i].quaternion.copy(quaternion);
        }

        // Handle the last leaf separately (no next point available)
        // if (this.num_vine_leaves > 0) {
        //     let lastPoint = this.particle_system.particles[this.num_vine_leaves - 1].position;
        //     this.vine_leaves[this.num_vine_leaves - 1].position.copy(lastPoint);
        // }
    }
}