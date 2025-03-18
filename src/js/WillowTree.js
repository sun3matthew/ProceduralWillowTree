import * as THREE from 'three';
import { HermiteSpline } from './HermiteSpline.js';
import { Vine } from './Vine.js';
import { Swing } from './Swing.js';

export class WillowTree {
    constructor(scene) {
        const textureLoader = new THREE.TextureLoader();
        this.baseColor = textureLoader.load('/tree/textures/Tree_Trunk_Mat_baseColor.jpeg');
        this.metallicRoughness = textureLoader.load('/tree/textures/Tree_Trunk_Mat_metallicRoughness.png');
        this.normalMap = textureLoader.load('/tree/textures/Tree_Trunk_Mat_normal.png');
        this.material = new THREE.MeshStandardMaterial({
            map: this.baseColor,
            metalnessMap: this.metallicRoughness,
            roughnessMap: this.metallicRoughness,
            normalMap: this.normalMap,
            // normalScale: new THREE.Vector2(0.5, 0.5)
        });

        this.scene = scene;
        this.num_branches = 16;
        this.branches = [];
        this.vine_points = [];
        this.vines = [];
        this.swings = [];
        this.initTree();
    }

    initTree() {

        // Every branch originates from the trunk
        let default_trunk_points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1*Math.random(), 2, 0.1*Math.random())];
        
        // Each branch will spurt away from the trunk in some x, y, z direction.
        // This array stores those starting directions for 1/4 of the total branches.
        // For the sake of symmetry, we replicate the remaining branches by reflecting across the x y and z axes
        let branch_starting_directions = []

        let starting_y_directions = [0.5*Math.abs(Math.random()), 0.5*Math.abs(Math.random()) + 0.5, 0.25*Math.abs(Math.random()) + 1, 0.5*Math.abs(Math.random()) + 1]

        // Initialize first entries (in this case, 2 branches)
        for (let i = 0; i < Number(this.num_branches/4); i++) {
            branch_starting_directions.push(new THREE.Vector3(0.5*(Math.random()-0.5), starting_y_directions[i], 0.5*(Math.random()-0.5)));
        }

        // Concatenate two times over to get list of length 8
        branch_starting_directions = branch_starting_directions.concat(branch_starting_directions)
        branch_starting_directions = branch_starting_directions.concat(branch_starting_directions)
        branch_starting_directions.push(new THREE.Vector3(0.1*(Math.random()-0.5), 0.5*Math.abs(Math.random())+0.2, 0.1*(Math.random()-0.5)))

        let symmetry_x_multiplier = 1;
        let symmetry_z_multiplier = 1;

        for (let i = 0; i < this.num_branches + 1; i++) {

            // A little strategy for reflection chicanery
            if (i%Number(this.num_branches/4) == 0 && i != 0) {
                symmetry_x_multiplier *= -1;
            }
            if (i%Number(this.num_branches/2) == 0 && i != 0) {
                symmetry_z_multiplier *= -1;
            }

            // We initialize the branch directions as the entry stored in the array, and reflected accordingly across x and z
            let x_direction = branch_starting_directions[i].x*symmetry_x_multiplier;
            let y_direction = branch_starting_directions[i].y;
            let z_direction = branch_starting_directions[i].z*symmetry_z_multiplier;

            // Branches are given random thickness
            let start_thickness = 0.2*Math.random()+0.1;

            // All branches ultimately have a length of "8"
            let remaining_branch_length = 8

            // Recursively add branches
            let branch_points = [default_trunk_points[0], default_trunk_points[1]];
            branch_points = this.addBranch(branch_points, remaining_branch_length, x_direction, y_direction, z_direction, 1, start_thickness);

            if (i == 0) {
                this.swings.push(new Swing(this.scene, branch_points[branch_points.length - 2]));
            }
        }
        
    }

    addBranch(branch_points, remaining_branch_length, x_direction, y_direction, z_direction, root_index, start_thickness) {
        // Root point where branch diverges
        let prev_branch_point = new THREE.Vector3(branch_points[root_index].x + x_direction, branch_points[root_index].y + y_direction, branch_points[root_index].z + z_direction);
        
        // We decide the remaining branch points by slightly perturbing the x, y, z directions
        for (let j = 0; j < remaining_branch_length; j++) {
            // We scale to shorten branches as they taper off at the ends
            let scaler = 0.05*((remaining_branch_length - j - 1)/remaining_branch_length)+0.95;

            //let new_branch_point = new THREE.Vector3(prev_branch_point.x + x_direction + 0.3*(Math.random() - 0.5), Math.pow(scaler, 2)*(prev_branch_point.y + y_direction + 0.3*(Math.random() - 0.5)), (prev_branch_point.z + z_direction + 0.3*(Math.random() - 0.5)));
            let new_branch_point = new THREE.Vector3(prev_branch_point.x + x_direction, prev_branch_point.y + y_direction, prev_branch_point.z + z_direction);

            // Finally, scale once again to control for height
            new_branch_point.x = scaler*(new_branch_point.x + 0.3*(Math.random() - 0.5));
            new_branch_point.y = Math.pow(scaler, 4)*(new_branch_point.y + 0.3*(Math.random() - 0.5));
            new_branch_point.z = scaler*(new_branch_point.z + 0.3*(Math.random() - 0.5));
            
            branch_points.push(new_branch_point);

            prev_branch_point.x = new_branch_point.x;
            prev_branch_point.y = new_branch_point.y;
            prev_branch_point.z = new_branch_point.z;
        }
        
        // Draw branch
        let branch = this.drawBranch(branch_points, start_thickness, remaining_branch_length);
        this.branches.push(branch);

        // Do not create divergence if end of branch is reached
        if (remaining_branch_length == 1) {
            return branch_points;
        }

        // New Branch - diverges at random point along primary branch
        let divergence_point = Math.min(Math.floor(Math.random()*(remaining_branch_length))+1, remaining_branch_length-(1+Math.floor(Math.random()*2)));
        let new_branch_points = [new THREE.Vector3(branch_points[divergence_point].x, branch_points[divergence_point].y, branch_points[divergence_point].z)]
        let new_thickness = start_thickness* Math.exp(-1* 2 * (divergence_point/remaining_branch_length));
        
        // We slightly perturb the direction of the new branch
        let new_x_direction = 0.9*x_direction + 0.1*(Math.random()-0.5)+0.1*Math.sign(x_direction);
        let new_y_direction = 0.8*y_direction + (Math.random()-0.5)/Math.max(branch_points[divergence_point].y, 1);
        let new_z_direction = 0.9*z_direction + 0.1*(Math.random()-0.5)+0.1*Math.sign(z_direction);

        // Make a new branch
        let diverged_branch_points = this.addBranch(new_branch_points, remaining_branch_length - divergence_point, new_x_direction, new_y_direction, new_z_direction, 0, new_thickness);
        this.vine_points.push(diverged_branch_points[diverged_branch_points.length - 1])

        // this.vines.push(new Vine(this.scene, diverged_branch_points[diverged_branch_points.length - 1]))
        // this.vines.push(new Vine(this.scene, diverged_branch_points[(remaining_branch_length - divergence_point)*Math.floor(Math.random())]))
        // this.addVines(diverged_branch_points);

        return branch_points;
    }

    // addVines(branch_points) {
    //     const numVines = 10;
    //     for (let i = 0; i < numVines; i++) {
    //         let vine_point = branch_points[Math.floor(Math.random() * branch_points.length)];
    //         this.vines.push(new Vine(this.scene, vine_point));
    //     }
    // }

    drawBranch(branch_points, start_thickness, remaining_branch_length) {
        // Create new spline with 200 drawable points
        let spline = new HermiteSpline();
        const numPoints = 10;
        
        // Add branch points and tangents to spline
        for (let i = 0; i < branch_points.length; i++) {
            const point = branch_points[i];
            spline.addPoint(point.x, point.y, point.z, 0, 0, 0);
            if (i > 1 && i < branch_points.length - 1) {
                const prev_point = branch_points[i - 1];
                const next_point = branch_points[i + 1];
                const t_x = next_point.x - prev_point.x;
                const t_y = next_point.y - prev_point.y;
                const t_z = next_point.z - prev_point.z;
                spline.setTangent(i, t_x, t_y, t_z);
            }
        }
        
        // Interpolate between control points and draw branches
        let prevPoint = spline.getPoint(0);
        let prevThickness = start_thickness;
        
        for (let i = 1; i <= numPoints; i++) {
            let t = i / numPoints;
            let point = spline.getPoint(t);
            let thickness = start_thickness * Math.exp(-2 * t);

            if (i == numPoints) {
                thickness = 0;
            }
            
            // Compute direction vector
            let direction = new THREE.Vector3().subVectors(point, prevPoint).normalize();
            let midPoint = new THREE.Vector3().addVectors(point, prevPoint).multiplyScalar(0.5);
            let height = prevPoint.distanceTo(point) + 0.03; //! bad code, adjust to "close" gaps
            
            // Create cylinder geometry
            let cylinderGeometry = new THREE.CylinderGeometry(thickness, prevThickness, height, 8);
            let cylinder = new THREE.Mesh(cylinderGeometry, this.material);
            
            // Align cylinder with the branch direction
            let quaternion = new THREE.Quaternion();
            let up = new THREE.Vector3(0, 1, 0);
            quaternion.setFromUnitVectors(up, direction);
            
            cylinder.position.copy(midPoint);
            cylinder.setRotationFromQuaternion(quaternion);
            
            this.scene.add(cylinder);
            
            // Update previous point and thickness
            prevPoint = point;
            prevThickness = thickness;

            
            if (remaining_branch_length < 7){
                this.vines.push(new Vine(this.scene, point));
            }
                
        }
        
        return spline;
    }
    
}
