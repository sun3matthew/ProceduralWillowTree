import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'three/src/loaders/TextureLoader.js';

import { LeafParticles } from './LeafParticles.js';
import { ButterflyScene } from './ButterflyScene.js';
import { WillowTree } from './WillowTree.js';
import { Vine } from './Vine.js';


import waterVertexShader from '../glsl/water.vert?raw';
import waterFragmentShader from '../glsl/water.frag?raw';



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const skybox = new THREE.CubeTextureLoader().load([
    '/cloud/right.jpg',  // Positive X
    '/cloud/left.jpg',   // Negative X
    '/cloud/top.jpg',    // Positive Y
    '/cloud/bottom.jpg', // Negative Y
    '/cloud/front.jpg',  // Positive Z
    '/cloud/back.jpg'    // Negative Z
]);

scene.background = skybox; // Set skybox as scene background

const loader = new GLTFLoader();
loader.load('/tree/scene.gltf', (gltf) => {
    const tree = gltf.scene;
    tree.position.set(0, 0, 0); // Adjust position
	const scale = 0.01;
    tree.scale.set(scale, scale, scale); // Adjust scale

	tree.traverse((child) => {
        if (child.isMesh) {
            child.material.depthWrite = true;  // Ensures depth is written correctly
            child.material.depthTest = true;   // Enables proper depth testing
            
            // Fix transparency issues
            if (child.material.transparent) {
                child.material.alphaTest = 0.5; // Prevents sorting issues for transparent textures
                child.material.side = THREE.DoubleSide; // Ensures leaves are visible from both sides
            }
        }
    });

    //scene.add(tree);
}, undefined, (error) => {
    console.error('Error loading the tree model:', error);
});

// Water - Infinite Reflector Plane
const normalMap = new TextureLoader().load('/textures/water-remap.jpg');
normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping; // Seamless tiling

const customReflectionShader = Reflector.ReflectorShader;
customReflectionShader.vertexShader = waterVertexShader;
customReflectionShader.fragmentShader = waterFragmentShader;
customReflectionShader.uniforms.tNormal = { value: normalMap };
customReflectionShader.uniforms.time = { value: 0.0 };

const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
const water = new Reflector(waterGeometry, {
    shader: customReflectionShader,
	color: 0x889999,
    metalness: 0.9, // Higher metalness makes it more reflective
    roughness: 0.05, // Lower roughness makes it shinier
    envMap: skybox, // Use the skybox as the reflection source
    envMapIntensity: 1.0
});

// console.log(customReflectionShader);


water.rotation.x = -Math.PI / 2;
water.position.y = 0;
scene.add(water);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Softens reflections
scene.add(ambientLight);


// Camera Position
camera.position.set(2, 2, 5);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3, 0);  // Set the center of rotation
controls.enableDamping = true;

const leaves = new LeafParticles(scene);

// const butterflyScene = new ButterflyScene(scene);
const butterflies = [];
butterflies.push(new ButterflyScene(scene, new THREE.Vector3(0, 3, 0), 3.4));
butterflies.push(new ButterflyScene(scene, new THREE.Vector3(0, 2, 0), 2.6));
butterflies.push(new ButterflyScene(scene, new THREE.Vector3(0, 1, 0), 2.5));
butterflies.push(new ButterflyScene(scene, new THREE.Vector3(0, 2, 0), 3.7));
butterflies.push(new ButterflyScene(scene, new THREE.Vector3(0, 2, 0), 4.7));
butterflies.push(new ButterflyScene(scene, new THREE.Vector3(0, 1, 0), 6.7));
butterflies.push(new ButterflyScene(scene, new THREE.Vector3(0, 1, 0), 5.7));

const willowTree = new WillowTree(scene);
scene.add(willowTree);

const vines = willowTree.vines; //[];
//willowTree.vine_points.forEach(vine_point => vines.push(new Vine(scene, vine_point)));

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    water.material.uniforms.time.value += 0.1;

    leaves.update();
    butterflies.forEach(butterfly => butterfly.update());
    // butterflyScene.update();

    vines.forEach(vine => vine.update());

    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
