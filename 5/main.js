import {
  fromDefaults,
  renderer,
  camera,
  controls,
  render,
  running,
  clock,
} from "common";
import GUI from "gui";
import {
  Scene,
  Mesh,
  Color,
  AmbientLight,
  HemisphereLight,
  Box3,
  Group,
  ExtrudeGeometry,
  DirectionalLight,
  FloatType,
  EquirectangularReflectionMapping,
  MeshStandardMaterial,
  PCFShadowMap,
  PlaneGeometry,
  ShadowMaterial,
  Shape,
} from "three";
import { effectRAF } from "modules/reactive.js";
import { letters as l1 } from "./letters1.js";
import { letters as l2 } from "./letters2.js";
import { letters as l3 } from "./letters3.js";
import { UltraHDRLoader } from "third_party/UltraHDRLoader.js";

const alphabets = [
  { letters: l1, width: 5, height: 7 },
  { letters: l2, width: 7, height: 7 },
  { letters: l3, width: 5, height: 5 },
];
const alphabetOptions = [
  [0, "LEtter1"],
  [1, "LEtters2"],
  [2, "LEtter3"],
];

const rainbow = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
  "#f43f5e",
];

const defaults = {
  seed: 1337,
  alphabet: 0,
  spacing: 1,
  lineSpacing: 1,
  roughness: 0.2,
  metalness: 0.5,
  color: 3,
};

const params = fromDefaults(defaults);

const gui = new GUI(
  "5. Write “Genuary”. Avoid using a font.",
  document.querySelector("#gui-container")
);
gui.addSelect("Alphabet", params.alphabet, alphabetOptions);
gui.addSlider("Horiz. padding", params.spacing, -2, 2, 1);
gui.addSlider("Vert. padding", params.lineSpacing, -2, 2, 1);
gui.addSlider(
  "Roughness",
  params.roughness,
  0,
  1,
  0.01,
  (r) => (material.roughness = r)
);
gui.addSlider(
  "Metalness",
  params.metalness,
  0,
  1,
  0.01,
  (m) => (material.metalness = m)
);
gui.addButton("Random", randomize);
gui.addSeparator();
gui.addText(
  "<p>Press R to shuffle the objects.</p><p>Press Space to toggle rotation.</p><p>Press Tab to toggle this GUI.</p>"
);
gui.show();

const backgroundColor = rainbow[rainbow.length - 1];
renderer.setClearColor(new Color(backgroundColor));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;

const scene = new Scene();
const group = new Group();
scene.add(group);

function darken(color) {
  const hsl = {};
  const c = new Color(color);
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, hsl.l - 0.1);
  return c;
}

const ground = new Mesh(
  new PlaneGeometry(10, 10),
  new ShadowMaterial({ color: darken(backgroundColor) })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const ambientLight = new AmbientLight(backgroundColor);
scene.add(ambientLight);

const light = new DirectionalLight(0xffffff, 3);
light.position.set(-3, 6, -3);
light.castShadow = true;
light.shadow.camera.top = 3;
light.shadow.camera.bottom = -3;
light.shadow.camera.right = 3;
light.shadow.camera.left = -3;
// light.shadow.camera.near = 0.001;
// light.shadow.camera.far = 100;
light.shadow.mapSize.set(4096, 4096);
scene.add(light);

const hemiLight = new HemisphereLight(0xffffff, 0xffffff, 2);
hemiLight.color.setHSL(0.6, 1, 0.6);
hemiLight.groundColor.setHSL(0.095, 1, 0.75);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

function createThickPath(points, thickness) {
  const halfWidth = thickness / 2;
  const leftSide = [];
  const rightSide = [];

  const sub = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];
  const add = (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]];
  const scale = (v, s) => [v[0] * s, v[1] * s];
  const normalize = (v) => {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    return len === 0 ? [0, 0] : [v[0] / len, v[1] / len];
  };
  const perpendicular = (v) => [-v[1], v[0]];
  const dot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1];

  for (let i = 0; i < points.length; i++) {
    const current = points[i];

    let dir1, dir2;

    if (i === 0) {
      const next = points[i + 1];
      dir2 = normalize(sub(next, current));
      dir1 = dir2;
    } else if (i === points.length - 1) {
      const prev = points[i - 1];
      dir1 = normalize(sub(current, prev));
      dir2 = dir1;
    } else {
      const prev = points[i - 1];
      const next = points[i + 1];
      dir1 = normalize(sub(current, prev));
      dir2 = normalize(sub(next, current));
    }

    const n1 = perpendicular(dir1);
    const n2 = perpendicular(dir2);

    let miter = normalize(add(n1, n2));

    const miterLength = halfWidth / dot(miter, n1);

    const offset = scale(miter, miterLength);

    leftSide.push(add(current, offset));
    rightSide.push(sub(current, offset));
  }

  return [...leftSide, ...rightSide.reverse()];
}

function generateStem(points) {
  const pts = createThickPath(points, 1);
  const shape = new Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length; i++) {
    const pt = pts[i];
    shape.lineTo(pt[0], pt[1]);
  }
  const geometry = new ExtrudeGeometry(shape, {
    bevelThickness: 0.2,
    bevelOffset: 0,
    bevelEnabled: true,
    bevelSteps: 1,
    curveSegments: 1,
    bevelSegments: 1,
    bevelSize: 0.1,
  });
  return geometry;
}

const loader = new UltraHDRLoader();
loader.setDataType(FloatType);
let envMap;
let material;

function loadEnvironment(resolution = "2k", type = "HalfFloatType") {
  return new Promise((resolve, reject) => {
    loader.load(
      `../assets/spruit_sunrise_${resolution}.hdr.jpg`,
      function (texture) {
        texture.mapping = EquirectangularReflectionMapping;
        texture.needsUpdate = true;

        resolve(texture);
      }
    );
  });
}

function generate() {
  while (group.children.length) {
    const mesh = group.children[0];
    mesh.geometry.dispose();
    group.remove(mesh);
  }
  const alphabet = alphabets[params.alphabet()];
  const letters = alphabet.letters;
  let offset = 0;
  const bounds = new Box3();
  const word = [
    ["g", [0, 0]],
    ["e", [1, 0]],
    ["n", [0, 1]],
    ["u", [1, 1]],
    ["a", [0, 2]],
    ["r", [1, 2]],
    ["y", [0, 3]],
    ["*", [1, 3]],
  ];
  group.rotation.x = -Math.PI / 2;
  const spacing = params.spacing();
  const lineSpacing = params.lineSpacing();
  for (const letter of word) {
    for (const stem of letters[letter[0]]) {
      const mesh = new Mesh(generateStem(stem), material);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.geometry.scale(0.1, 0.1, 0.1);
      mesh.rotation.x = Math.PI;
      mesh.position.set(
        (letter[1][0] * (alphabet.width + spacing)) / 10,
        ((-letter[1][1] + 2) * (alphabet.height + lineSpacing)) / 10,
        0
      );
      group.add(mesh);
      bounds.expandByObject(mesh);
    }
    offset = bounds.max.x - bounds.min.x + 0.1;
  }
  group.position.x = -offset / 2;
  group.position.y = 0.1;
  scene.add(group);
}

async function init() {
  envMap = await loadEnvironment();
  material = new MeshStandardMaterial({
    color: rainbow[params.color()],
    roughness: params.roughness(),
    metalness: params.metalness(),
    envMap,
    envMapIntensity: 1,
  });

  generate();
}

init();

effectRAF(() => {
  generate();
});

camera.position.set(0.15, 0.91, 0.37).multiplyScalar(6.6);
camera.lookAt(0, 0, 0);

function randomize() {
  const color = Maf.randomElement(rainbow);
  material.color.set(color);
  params.alphabet.set(Maf.randomElement(alphabetOptions)[0]);
  // params.spacing.set(Maf.intRandomInRange(-1, 1));
  // params.lineSpacing.set(Maf.intRandomInRange(-1, 1));
  params.color.set(Maf.randomElement(rainbow));
}

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyR") {
    randomize();
  }
});
document.querySelector("#randomize-button")?.addEventListener("click", () => {
  randomize();
});

render(() => {
  controls.update();

  const dt = clock.getDelta();

  renderer.render(scene, camera);
});
