import * as THREE from 'three';

export class HermiteSpline {
  constructor() {
      this.points = [];
      this.tangents = [];
  }

  addPoint(x, y, z, sx, sy, sz) {
      this.points.push(new THREE.Vector3(x, y, z));
      this.tangents.push(new THREE.Vector3(sx, sy, sz));
      this.arcLengthTable = [];
  }

  setPoint(index, x, y, z) {
      if (index >= 0 && index < this.points.length) {
          this.points[index].set(x, y, z);
      }
  }

  setTangent(index, sx, sy, sz) {
      if (index >= 0 && index < this.tangents.length) {
          this.tangents[index].set(sx, sy, sz);
      }
  }

  hermiteBasis(t) {
      let h1 = 2 * t ** 3 - 3 * t ** 2 + 1;
      let h2 = -2 * t ** 3 + 3 * t ** 2;
      let h3 = t ** 3 - 2 * t ** 2 + t;
      let h4 = t ** 3 - t ** 2;
      return [h1, h2, h3, h4];
  }

  getPoint(t) {
    let numSegments = this.points.length - 1;
    let segment = Math.min(Math.floor(t * numSegments), numSegments - 1);
    let localT = (t * numSegments) - segment;

    let p0 = this.points[segment];
    let p1 = this.points[segment + 1];
    let m0 = this.tangents[segment];
    let m1 = this.tangents[segment + 1];

    let [h1, h2, h3, h4] = this.hermiteBasis(localT);

    let scale = 1 / numSegments;

    return new THREE.Vector3(
        h1 * p0.x + h2 * p1.x + h3 * m0.x * scale + h4 * m1.x * scale,
        h1 * p0.y + h2 * p1.y + h3 * m0.y * scale + h4 * m1.y * scale,
        h1 * p0.z + h2 * p1.z + h3 * m0.z * scale + h4 * m1.z * scale
    );
  }

  computeArcLength(numSamples = 100) {
    this.arcLengthTable = [];
    let length = 0;
    let prev = this.getPoint(0);
    this.arcLengthTable.push({ t: 0, length: 0 });

    for (let i = 1; i <= numSamples; i++) {
        let t = i / numSamples;
        let curr = this.getPoint(t);
        length += curr.distanceTo(prev);
        this.arcLengthTable.push({ t, length });
        prev = curr;
    }
  }

  getArcLength(t) {
    if (t <= 0) return 0;
    if (t >= 1) return this.arcLengthTable[this.arcLengthTable.length - 1].length;

    // Binary search
    let low = 0, high = this.arcLengthTable.length - 1;
    while (low < high) {
        let mid = Math.floor((low + high) / 2);
        if (this.arcLengthTable[mid].t < t) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }

    // Interpolate between the closest values
    let entry1 = this.arcLengthTable[low - 1];
    let entry2 = this.arcLengthTable[low];

    let t1 = entry1.t, t2 = entry2.t;
    let s1 = entry1.length, s2 = entry2.length;

    let interpS = s1 + ((t - t1) / (t2 - t1)) * (s2 - s1);
    return interpS;
  }
}
