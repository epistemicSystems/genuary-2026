import { RoundedCylinderGeometry } from "modules/rounded-cylinder-geometry.js";
import { Mesh, Vector3, MeshStandardMaterial } from "three";
import { Easings } from "easings";

const vertexShader = `

uniform float start;
uniform float end;
uniform float scale;
uniform float meshLength;
uniform vec3 pathPoint0;
uniform vec3 pathPoint1;
uniform vec3 pathPoint2;
uniform vec3 pathPoint3;

const int INTEGRATION_STEPS = 25; 

vec3 getBezierPoint(float t, vec3 p0, vec3 p1, vec3 p2, vec3 p3) {
  float u = 1.0 - t;
  float tt = t * t;
  float uu = u * u;
  float uuu = uu * u;
  float ttt = tt * t;

  vec3 p = uuu * p0; 
  p += 3.0 * uu * t * p1; 
  p += 3.0 * u * tt * p2; 
  p += ttt * p3;
  return p;
}

vec3 getBezierTangent(float t, vec3 p0, vec3 p1, vec3 p2, vec3 p3) {
  float u = 1.0 - t;
  return normalize(3.0 * u * u * (p1 - p0) + 
                    6.0 * u * t * (p2 - p1) + 
                    3.0 * t * t * (p3 - p2));
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
    myT = clamp(myT, 0.0, 1.0);

    vec3 currentPos = getBezierPoint(0.0, pathPoint0, pathPoint1, pathPoint2, pathPoint3);
    vec3 T = getBezierTangent(0.0, pathPoint0, pathPoint1, pathPoint2, pathPoint3);
    
    vec3 up = vec3(0.0, 1.0, 0.0);
    
    if (abs(dot(T, up)) > 0.999) up = vec3(0.0, 0.0, 1.0);
    
    vec3 B = normalize(cross(T, up));
    vec3 N = normalize(cross(B, T));

    if (myT > 0.0001) {
        float dt = myT / float(INTEGRATION_STEPS);
        
        for (int i = 1; i <= INTEGRATION_STEPS; i++) {
            float t_next = float(i) * dt;
            
            vec3 T_next = getBezierTangent(t_next, pathPoint0, pathPoint1, pathPoint2, pathPoint3);
            
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
        
        currentPos = getBezierPoint(myT, pathPoint0, pathPoint1, pathPoint2, pathPoint3);
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
    this.minLength = Maf.randomInRange(0.01, 0.03);
    this.scale =
      Maf.map(700, 1300, 0, 1, this.time) * Maf.randomInRange(0.9, 1.1);

    this.uniforms = {
      start: { value: 0.0 },
      end: { value: 1.0 },
      scale: { value: 1.0 },
      pathPoint0: { value: new Vector3(-1, 0, 0) },
      pathPoint1: { value: new Vector3(-0.5, 1.5, 0) },
      pathPoint2: { value: new Vector3(2, 1.5, 0) },
      pathPoint3: { value: new Vector3(1, 0, 0) },
      meshLength: { value: 100.0 },
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
      shader.uniforms.pathPoint0 = this.uniforms.pathPoint0;
      shader.uniforms.pathPoint1 = this.uniforms.pathPoint1;
      shader.uniforms.pathPoint2 = this.uniforms.pathPoint2;
      shader.uniforms.pathPoint3 = this.uniforms.pathPoint3;
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
      new RoundedCylinderGeometry(0.2, 100, 0.01, 5, 32, 100),
      this.material
    );
    this.mesh.geometry.rotateX(Math.PI / 2);
  }

  randomize(target) {
    const mid = new Vector3(
      Maf.randomInRange(-1, 1),
      Maf.randomInRange(-1, 1),
      Maf.randomInRange(-1, 1)
    )
      .normalize()
      .multiplyScalar(Maf.randomInRange(0.5, 1.5));

    this.uniforms.pathPoint0.value.copy(this.uniforms.pathPoint3.value);
    this.uniforms.pathPoint1.value.copy(this.uniforms.pathPoint2.value);

    let f =
      Math.random() > 0.5
        ? Maf.randomInRange(0.1, 0.7)
        : Maf.randomInRange(1.3, 2.9);
    this.uniforms.pathPoint2.value.copy(target).multiplyScalar(f);
    this.uniforms.pathPoint3.value.copy(target);

    this.minLength = Maf.randomInRange(0.01, 0.03);
    this.progress = -Maf.randomInRange(0, 300);
  }

  update(dt) {
    this.progress += dt * 1000;

    const factor = Math.max(0, Math.min(1, this.progress / this.time));
    const t = Easings.OutBounce(factor);
    const minLength = this.minLength;
    const length = Math.max(minLength, Maf.parabola(t, 1) * 0.25);

    const scale = 1 - this.scale * Maf.parabola(Easings.InOutCubic(t), 0.1);
    const start = t * (1 - minLength);
    const end = t + length;

    this.uniforms.start.value = start;
    this.uniforms.end.value = end;
    this.uniforms.scale.value = scale * this.globalScale;
  }
}

export { Boing };
