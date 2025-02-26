# CS 174C Final Project

Procedural Willow Tree Animation

![Version 1](images/version-1.png)

## Getting Started

clone with
```
git clone https://github.com/sun3matthew/ProceduralWillowTree.git
```

install dependencies with
```
npm install
```

start the server with
```
npx vite
```

# Overview
This project aims to create a detailed animation of a willow tree swaying in the wind, surrounded by other objects governed by physics such as swinging vines, floating butterflies and falling leaves. The tree will be suspended in a reflective body of water. 
## Willow Tree - Spline Interpolation
The branches of the willow tree will be generated using spline interpolation, and constructed using a recursive generation algorithm. We will use Catmull-Rom splines to define the curvature of the branches. Branches will be generated at random upon program initiation, where each branch is represented by a vector of points originating at the trunk and spreading outward. The width of the branches will taper as a function of distance from the trunk, terminating as a point. Branches will occasionally bifurcate, in which case the secondary branch will be modeled as another spline rooted at the divergence point.
## Falling Leaves - Particle Physics System
Leaves falling from the tree will be simulated using a particle system, governed by the following forces:
Gravity: F = mg
Wind: A random or Perlin-noise-driven lateral force, solely in the x-z coordinate system. Determined at program initiation.
Air Resistance: Fd = -kv2
Euler integration will be used to update the velocity and position of each leaf over time. Leaves will interact with the water surface using simple collision detection, where they will disappear on impact and generate a simple ripple animation.
## Butterflies - Parametric Motion Curves
Butterflies will be animated using parametric equations to define a natural, fluid flight path. The wings will oscillate using a simple sine function: θ(t) = Asin(ωt), Where A controls amplitude and ω determines the speed of the wing flaps. A combination of sinusoidal and Bezier curve paths will be used for smooth motion.
## Vines & Tire Swing - Mass-Spring System Physics
The vines hanging from the tree (and potentially a tire swing) will be simulated using mass-spring dynamics to achieve chain-like physics. We will model this via Hooke’s Law for Spring Forces: 
F = -k(x - x0) - bv, where  is the spring constant (stiffness of the vine), is the displacement from equilibrium, and  is the damping coefficient (to prevent excessive oscillation). Each vine will be modeled as a series of connected mass points, creating a rope-like behavior.