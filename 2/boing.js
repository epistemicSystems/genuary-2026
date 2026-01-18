import { RoundedCylinderGeometry } from "modules/rounded-cylinder-geometry.js";
import { Mesh, Vector3, MeshStandardMaterial } from "three";
import { Easings } from "easings";

const vertexShader = `

uniform float start;
uniform float end;
uniform float scale;
uniform float meshLength;

const int INTEGRATION_STEPS = 25; 
const float TAU = 6.28318530718;
const float knotScale = 1.;

// vec3 getBezierPoint(float t, vec3 p0, vec3 p1, vec3 p2, vec3 p3) {
//   float u = 1.0 - t;
//   float tt = t * t;
//   float uu = u * u;
//   float uuu = uu * u;
//   float ttt = tt * t;

//   vec3 p = uuu * p0; 
//   p += 3.0 * uu * t * p1; 
//   p += 3.0 * u * tt * p2; 
//   p += ttt * p3;
//   return p;
// }

// vec3 getBezierTangent(float t, vec3 p0, vec3 p1, vec3 p2, vec3 p3) {
//   float u = 1.0 - t;
//   return normalize(3.0 * u * u * (p1 - p0) + 
//                     6.0 * u * t * (p2 - p1) + 
//                     3.0 * t * t * (p3 - p2));

// }

vec3 getTrefoilPoint(float t) {
  float angle = t * TAU;
  float x = sin(angle) + 2.0 * sin(2.0 * angle);
  float y = cos(angle) - 2.0 * cos(2.0 * angle);
  float z = -sin(3.0 * angle);
  return vec3(x, y, z) * knotScale;
}

vec3 getTrefoilTangent(float t) {
  float angle = t * TAU;
  float dx = cos(angle) + 4.0 * cos(2.0 * angle);
  float dy = -sin(angle) + 4.0 * sin(2.0 * angle);
  float dz = -3.0 * cos(3.0 * angle);
  return normalize(vec3(dx, dy, dz));
}


mat3 axisAngleMatrix(vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    float t = 1.0 - c;
    
    return mat3(
        t * axis.x * axis.x + c,           t * axis.x * axis.y - axis.z * s,  t * axis.x * axis.z + axis.y * s,
        t * axis.x * axis.y + axis.z * s,  t * axis.y * axis.y + c,           t * axis.y * axis.z - axis.x * s,
        t * axis.x * axis.z - axis.y * s,  t * axis.y * axis.z + axis.x * s,  t * axis.z * axis.z + c
    );
}

void calculate(in vec3 position, out vec3 newPos, out vec3 newNormal) {
    
    float myT = (position.z / meshLength) + 0.5;
    myT = (end - start) * myT + start;
    myT = mod(myT, 1.0);
    // myT = clamp(myT, 0.0, 1.0);

    vec3 currentPos = getTrefoilPoint(0.0);
    vec3 T = getTrefoilTangent(0.0);
    
    vec3 up = vec3(0.0, 1.0, 0.0);
    
    if (abs(dot(T, up)) > 0.999) up = vec3(0.0, 0.0, 1.0);
    
    vec3 B = normalize(cross(T, up));
    vec3 N = normalize(cross(B, T));

    if (myT > 0.0001) {
        float dt = myT / float(INTEGRATION_STEPS);
        
        for (int i = 1; i <= INTEGRATION_STEPS; i++) {
            float t_next = float(i) * dt;
            
            vec3 T_next = getTrefoilTangent(t_next);
            
            vec3 axis = cross(T, T_next);
            float len = length(axis);
            
            if (len > 0.00001) {
                axis = normalize(axis);
                float dotVal = clamp(dot(T, T_next), -1.0, 1.0);
                float angle = acos(dotVal);
                
                mat3 rotMat = axisAngleMatrix(axis, angle);
                
                N = rotMat * N;
                B = rotMat * B;
            }

            N = N - dot(N, T_next) * T_next;
            N = normalize(N);            
            B = cross(T_next, N);
            
            T = T_next;
        }
        
        currentPos = getTrefoilPoint(myT);
    }

    newPos = currentPos + (N * position.x * scale) + (B * position.y * scale);

    mat3 frameRotation = mat3(N, B, T);
    newNormal = normalMatrix * (frameRotation * normal);
}
  
void modify(in vec3 position, out vec3 newPos, out vec3 normal) {
  calculate(position, newPos, normal);
}
  `;

class Boing {
  constructor(envMap, color) {
    this.globalScale = 1;
    this.progress = 0;
    this.time = Maf.randomInRange(700, 1300);
    this.minLength = 0.005;
    this.scale = Maf.randomInRange(0.8, 1.2);
    this.start = 0;
    this.length = 0.5;
    this.speed = Maf.randomInRange(0.8, 1.2);
    this.elapsedTime = 0;

    this.uniforms = {
      start: { value: 0.0 },
      end: { value: 1.0 },
      scale: { value: 1.0 },
      meshLength: { value: 1.0 },
    };

    this.material = new MeshStandardMaterial({
      color,
      metalness: 0.2,
      roughness: 0.2,
      envMap: envMap,
      envMapIntensity: 1.0,
    });

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.start = this.uniforms.start;
      shader.uniforms.end = this.uniforms.end;
      shader.uniforms.scale = this.uniforms.scale;
      shader.uniforms.meshLength = this.uniforms.meshLength;
      shader.vertexShader = vertexShader + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        `#include <beginnormal_vertex>`,
        `
    #include <beginnormal_vertex>

    vec3 newPosition;
    modify(position, newPosition, objectNormal);
    `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
    #include <begin_vertex>

    transformed = newPosition;
    `
      );
    };

    this.mesh = new Mesh(
      new RoundedCylinderGeometry(0.2, 1, 0.1, 5, 32, 25),
      this.material
    );
    this.mesh.geometry.rotateX(Math.PI / 2);

    this.randomize();
  }

  randomize() {
    this.progress = -Maf.randomInRange(0, 300);
    this.start = this.start + this.length;
    this.length = Maf.randomInRange(0.1, 0.3);
    this.time = Maf.randomInRange(700, 1300);
    this.elapsedTime = 0;
  }

  update(dt) {
    this.elapsedTime += dt;
    if (this.elapsedTime > (2 * this.time) / 1000) {
      this.randomize();
    }

    this.progress += dt * 1000;
    this.start += (dt * this.speed) / 100;

    const factor = Math.max(0, Math.min(1, this.progress / this.time));

    const t = Easings.OutBounce(factor);
    const minLength = this.minLength;
    const length = Math.max(minLength, Maf.parabola(t, 2) * 0.1);

    const scale =
      this.scale - 0.9 * this.scale * Maf.parabola(Easings.InOutCubic(t), 0.1);
    const start = this.start + t * this.length;
    const end = start + length;

    this.uniforms.start.value = start;
    this.uniforms.end.value = end;
    this.uniforms.scale.value = scale * this.scale * this.globalScale;
  }
}

export { Boing };
