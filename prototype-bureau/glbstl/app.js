import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

// Application State
let scene, camera, renderer, controls;
let currentModelGroup = null; // Holds the loaded model and its helpers
let loadedModel = null;       // Reference to original loaded hierarchy
let currentMaterial = null;
let currentViewMode = 'solid';
let currentFilamentColor = '#3b82f6';
let modelMetadata = {
  originalVolume: 0,
  volume: 0,
  weight: 0,
  dims: { x: 0, y: 0, z: 0 }
};

// DOM Elements
const canvasContainer = document.getElementById('canvas-container');
const canvasLoader = document.getElementById('canvas-loader');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const loadedFileName = document.getElementById('loaded-file-name');

// Control elements
const btnCenterGround = document.getElementById('btn-center-ground');
const btnRotX = document.getElementById('btn-rot-x');
const btnRotY = document.getElementById('btn-rot-y');
const btnRotZ = document.getElementById('btn-rot-z');
const scaleRange = document.getElementById('scale-range');
const scaleValue = document.getElementById('scale-value');
const btnScaleFit = document.getElementById('btn-scale-fit');
const btnScaleReset = document.getElementById('btn-scale-reset');

const btnViewSolid = document.getElementById('btn-view-solid');
const btnViewWire = document.getElementById('btn-view-wire');
const btnViewGhost = document.getElementById('btn-view-ghost');
const filamentPalette = document.getElementById('filament-palette');

const valDimX = document.getElementById('val-dim-x');
const valDimY = document.getElementById('val-dim-y');
const valDimZ = document.getElementById('val-dim-z');
const valVolume = document.getElementById('val-volume');
const valWeight = document.getElementById('val-weight');
const densitySelect = document.getElementById('density-select');
const infillRange = document.getElementById('infill-range');
const infillValue = document.getElementById('infill-value');

const btnExportStl = document.getElementById('btn-export-stl');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize WebGL Scene
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#060608');
  
  // Camera
  camera = new THREE.PerspectiveCamera(45, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
  camera.position.set(150, 150, 150);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  canvasContainer.appendChild(renderer.domElement);
  
  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.01; // Don't go below ground
  controls.minDistance = 10;
  controls.maxDistance = 500;
  
  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);
  
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight1.position.set(100, 200, 100);
  dirLight1.castShadow = true;
  scene.add(dirLight1);
  
  const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.35); // Subtle purple highlight
  dirLight2.position.set(-100, 100, -100);
  scene.add(dirLight2);
  
  const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.3); // Subtle blue fill
  fillLight.position.set(0, -50, 100);
  scene.add(fillLight);
  
  // Grid / Build Plate Visualizer (220x220 mm bed size typical of desktop printers)
  const bedSize = 220;
  const gridHelper = new THREE.GridHelper(bedSize, 22, 0x3b82f6, 0x1f2937);
  gridHelper.position.y = 0;
  scene.add(gridHelper);
  
  // Custom build plate rim / print volume wireframe
  const volumeGeometry = new THREE.BoxGeometry(bedSize, 220, bedSize);
  const edges = new THREE.EdgesGeometry(volumeGeometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.2 }));
  line.position.y = 110; // Center height
  scene.add(line);
  
  // Base model container group
  currentModelGroup = new THREE.Group();
  scene.add(currentModelGroup);
  
  // Resize handler
  window.addEventListener('resize', onWindowResize);
  
  // Default Filament Material
  currentMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(currentFilamentColor),
    roughness: 0.4,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  
  // Load initial model from workspace (if possible) or show drop message
  loadInitialModel();
  
  // Start animate loop
  animate();
}

function onWindowResize() {
  camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Volume calculation algorithms (Signed Volume of tetrahedrons)
function getGeometryVolume(geometry) {
  let position = geometry.attributes.position;
  let index = geometry.index;
  let sum = 0;
  let p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();
  
  if (index) {
    let count = index.count;
    for (let i = 0; i < count; i += 3) {
      getVertex(index.getX(i), p1, position);
      getVertex(index.getY(i), p2, position);
      getVertex(index.getZ(i), p3, position);
      sum += signedVolumeOfTriangle(p1, p2, p3);
    }
  } else {
    let count = position.count;
    for (let i = 0; i < count; i += 3) {
      getVertex(i, p1, position);
      getVertex(i+1, p2, position);
      getVertex(i+2, p3, position);
      sum += signedVolumeOfTriangle(p1, p2, p3);
    }
  }
  return Math.abs(sum);
}

function getVertex(index, vector, position) {
  vector.x = position.getX(index);
  vector.y = position.getY(index);
  vector.z = position.getZ(index);
}

function signedVolumeOfTriangle(p1, p2, p3) {
  return p1.dot(p2.cross(p3)) / 6.0;
}

// Calculate the volume and bounding dimensions of the entire loaded group
function calculateStats() {
  if (!loadedModel) return;
  
  let totalVolume = 0;
  
  // Bounding box of current scaled/rotated state
  const bbox = new THREE.Box3().setFromObject(currentModelGroup);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  
  // Store dimensions (representing mm in standard 3D printing workflows)
  modelMetadata.dims = {
    x: Math.round(size.x * 10) / 10,
    y: Math.round(size.y * 10) / 10,
    z: Math.round(size.z * 10) / 10
  };
  
  // Calculate raw unscaled volume if not already calculated
  if (modelMetadata.originalVolume === 0) {
    loadedModel.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Compute volume of local geometry
        const vol = getGeometryVolume(child.geometry);
        // Multiply by local scale factor
        const localScale = child.scale;
        totalVolume += vol * Math.abs(localScale.x * localScale.y * localScale.z);
      }
    });
    modelMetadata.originalVolume = totalVolume;
  }
  
  // Scaled volume = original volume * current scale^3 (since uniform scale is used)
  const currentScale = currentModelGroup.scale.x;
  modelMetadata.volume = modelMetadata.originalVolume * Math.pow(currentScale, 3);
  
  // Display updates
  valDimX.textContent = `${modelMetadata.dims.x} mm`;
  valDimY.textContent = `${modelMetadata.dims.y} mm`;
  valDimZ.textContent = `${modelMetadata.dims.z} mm`;
  
  // Volume in cm3 (1 cm3 = 1000 mm3)
  const volumeCm3 = modelMetadata.volume / 1000;
  valVolume.textContent = `${volumeCm3.toFixed(2)} cm³`;
  
  updateWeightEstimate();
}

// Weight estimation based on material density & infill %
function updateWeightEstimate() {
  const density = parseFloat(densitySelect.value);
  const infillPercent = parseFloat(infillRange.value) / 100;
  
  // Weight estimation formula incorporating standard shell/wall thicknesses
  // Assume a typical slicer setting where 15% of the model's volume is solid shell walls
  const shellRatio = 0.15;
  const infillRatio = infillPercent * (1.0 - shellRatio) + shellRatio;
  
  const volumeCm3 = modelMetadata.volume / 1000;
  const weightGrams = volumeCm3 * density * infillRatio;
  
  valWeight.textContent = `${weightGrams.toFixed(2)} g`;
  infillValue.textContent = `${Math.round(infillPercent * 100)}%`;
}

// Orient/Ground helpers
function centerAndGroundModel() {
  if (!currentModelGroup || !loadedModel) return;
  
  showToast('Aligning model coordinates to bed...');
  
  // 1. Reset position to origin to recalculate bounds cleanly
  currentModelGroup.position.set(0, 0, 0);
  
  // 2. Get local bounding box
  const box = new THREE.Box3().setFromObject(currentModelGroup);
  const center = new THREE.Vector3();
  box.getCenter(center);
  
  // 3. Shift group so its geometry center is at X=0, Y=0
  currentModelGroup.position.x = -center.x;
  currentModelGroup.position.z = -center.z;
  
  // 4. Lay flat on ground (lowest point Z_min = 0, which corresponds to Y in Three.js standard coordinates)
  // Note: Three.js uses Y-up, but 3D printing uses Z-up. 
  // Let's treat Three.js Y-axis as the print bed height.
  currentModelGroup.position.y = -box.min.y;
  
  // 5. Update controls target to center of bed
  controls.target.set(0, sizeYCenter(box), 0);
  
  // Re-calculate stats
  calculateStats();
}

function sizeYCenter(box) {
  const size = new THREE.Vector3();
  box.getSize(size);
  return size.y / 2;
}

// Rotate by 90 degrees
function rotateModel(axis) {
  if (!currentModelGroup) return;
  
  showToast(`Rotating 90° on ${axis.toUpperCase()} axis...`);
  
  if (axis === 'x') {
    currentModelGroup.rotateX(Math.PI / 2);
  } else if (axis === 'y') {
    currentModelGroup.rotateY(Math.PI / 2);
  } else if (axis === 'z') {
    currentModelGroup.rotateZ(Math.PI / 2);
  }
  
  // Re-ground the model immediately to prevent flying/sinking meshes
  centerAndGroundModel();
}

// Scale operations
function handleScaleSlider(value) {
  if (!currentModelGroup) return;
  const scaleFactor = value / 100;
  currentModelGroup.scale.setScalar(scaleFactor);
  scaleValue.textContent = `${value}%`;
  
  // Ground it again in case scaling changes the bottom coordinate
  const box = new THREE.Box3().setFromObject(currentModelGroup);
  currentModelGroup.position.y = -box.min.y;
  
  calculateStats();
}

function autoFitToBed() {
  if (!currentModelGroup || !loadedModel) return;
  
  showToast('Auto-scaling model to fit build plate...');
  
  // Find model bounding size
  const box = new THREE.Box3().setFromObject(currentModelGroup);
  const size = new THREE.Vector3();
  box.getSize(size);
  
  const maxModelDim = Math.max(size.x / currentModelGroup.scale.x, size.y / currentModelGroup.scale.y, size.z / currentModelGroup.scale.z);
  
  // Target a comfortable print size: max dimension of 150mm (leaves safety margins on a 220mm bed)
  const targetDim = 150;
  const targetScale = targetDim / maxModelDim;
  const targetPercent = Math.min(Math.max(Math.round(targetScale * 100), 10), 500);
  
  scaleRange.value = targetPercent;
  handleScaleSlider(targetPercent);
  centerAndGroundModel();
}

// Material settings
function setViewMode(mode) {
  currentViewMode = mode;
  btnViewSolid.classList.toggle('active', mode === 'solid');
  btnViewWire.classList.toggle('active', mode === 'wireframe');
  btnViewGhost.classList.toggle('active', mode === 'ghost');
  
  updateMaterials();
}

function updateMaterials() {
  if (!loadedModel) return;
  
  loadedModel.traverse((child) => {
    if (child.isMesh) {
      if (currentViewMode === 'solid') {
        child.material = currentMaterial;
        currentMaterial.wireframe = false;
        currentMaterial.transparent = false;
        currentMaterial.opacity = 1.0;
      } else if (currentViewMode === 'wireframe') {
        child.material = currentMaterial;
        currentMaterial.wireframe = true;
        currentMaterial.transparent = false;
      } else if (currentViewMode === 'ghost') {
        child.material = currentMaterial;
        currentMaterial.wireframe = false;
        currentMaterial.transparent = true;
        currentMaterial.opacity = 0.25;
        currentMaterial.depthWrite = false;
      }
    }
  });
}

// Toast Notifications
function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, duration);
}

// Load Model Hook
function setupLoadedModel(gltf) {
  // Clear any existing children in currentModelGroup
  while (currentModelGroup.children.length > 0) {
    currentModelGroup.remove(currentModelGroup.children[0]);
  }
  
  loadedModel = gltf.scene;
  
  // Reset scales & state
  currentModelGroup.scale.setScalar(1.0);
  currentModelGroup.rotation.set(0, 0, 0);
  currentModelGroup.position.set(0, 0, 0);
  scaleRange.value = 100;
  scaleValue.textContent = '100%';
  
  modelMetadata.originalVolume = 0; // Trigger recalculation
  
  // Apply our custom filament material
  updateMaterials();
  
  // Add to rendering group
  currentModelGroup.add(loadedModel);
  
  // Fit camera to the model initially
  centerAndGroundModel();
  
  // Fit camera zoom
  const box = new THREE.Box3().setFromObject(currentModelGroup);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.set(maxDim * 1.5, maxDim * 1.5, maxDim * 1.5);
  controls.target.set(0, size.y / 2, 0);
  controls.update();
  
  canvasLoader.classList.remove('active');
}

// Fetch Initial File or Load parameter URL
function loadInitialModel() {
  canvasLoader.classList.add('active');
  
  // Check URL query parameters for model (e.g. ?glb=https://...)
  const urlParams = new URLSearchParams(window.location.search);
  const glbUrl = urlParams.get('glb');
  
  const loader = new GLTFLoader();
  
  if (glbUrl) {
    let fileName = glbUrl.substring(glbUrl.lastIndexOf('/') + 1);
    if (fileName.includes('?')) {
      fileName = fileName.substring(0, fileName.indexOf('?'));
    }
    loadedFileName.textContent = decodeURIComponent(fileName);
    showToast('Loading model from URL parameters...');
    loader.load(
      glbUrl,
      (gltf) => setupLoadedModel(gltf),
      (xhr) => {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        showToast(`Loading: ${percent}%`);
      },
      (error) => {
        console.error('Error loading URL GLB:', error);
        showToast('Failed to load model from URL.');
        loadedFileName.textContent = 'no model loaded. drop one below!';
        canvasLoader.classList.remove('active');
      }
    );
  } else {
    loadedFileName.textContent = 'no model loaded. drop one below!';
    canvasLoader.classList.remove('active');
  }
}

// File Drag & Drop Handlers - Listen globally on window to prevent browser tab navigations
// and allow dropping files anywhere on screen.
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleUploadedFile(file);
});

// Prevent default drag/drop behaviors globally to prevent browser opening files
window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
}, false);

window.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
}, false);

window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  // Only remove class if we are leaving the window completely
  if (e.clientX === 0 && e.clientY === 0) {
    dropZone.classList.remove('dragover');
  }
}, false);

window.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) {
    handleUploadedFile(file);
  }
}, false);

// Specific dropZone listeners to visual visual overlay feedback
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleUploadedFile(file);
});

function handleUploadedFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (extension !== 'glb' && extension !== 'gltf') {
    showToast('Invalid file format. Please upload a GLB or GLTF file.', 4000);
    return;
  }
  
  canvasLoader.classList.add('active');
  loadedFileName.textContent = file.name;
  showToast(`Loading ${file.name}...`);
  
  // Use URL.createObjectURL for 100% reliable local model parsing
  const objectURL = URL.createObjectURL(file);
  const loader = new GLTFLoader();
  
  loader.load(
    objectURL,
    (gltf) => {
      setupLoadedModel(gltf);
      showToast('Import completed!');
      URL.revokeObjectURL(objectURL); // Revoke url to free memory
    },
    undefined,
    (error) => {
      console.error('Error parsing GLB data:', error);
      showToast('Error parsing model geometry.', 4000);
      canvasLoader.classList.remove('active');
      URL.revokeObjectURL(objectURL);
    }
  );
}

// Binary STL Export Logic
function exportToStl() {
  if (!currentModelGroup || !loadedModel) {
    showToast('No model loaded to export.', 3000);
    return;
  }
  
  showToast('Exporting STL file...');
  
  // 1. Temporarily center and ground the model relative to export scene
  // Note: STLExporter exports elements relative to the world coordinates.
  // Because we shifted/scaled/rotated currentModelGroup, the output STL will preserve
  // all offsets we configured, which is exactly what a 3D printing workflow needs!
  const exporter = new STLExporter();
  
  // 2. Parse the group. Pass binary: true for compact 3D printing slicing efficiency
  // This contains the exact transforms
  const data = exporter.parse(currentModelGroup, { binary: true });
  
  // 3. Create blob and download
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // Generate download name based on loaded file name
  let exportName = 'model_print.stl';
  const rawName = loadedFileName.textContent;
  if (rawName && rawName.includes('.')) {
    exportName = rawName.substring(0, rawName.lastIndexOf('.')) + '_print.stl';
  }
  
  link.href = URL.createObjectURL(blob);
  link.download = exportName;
  link.click();
  
  document.body.removeChild(link);
  
  // Slobberdog confirmation popup
  showToast('From the workbench of SLOBBERDOG: STL Export Ready!', 4000);
}

// Event Listeners setup
btnCenterGround.addEventListener('click', centerAndGroundModel);
btnRotX.addEventListener('click', () => rotateModel('x'));
btnRotY.addEventListener('click', () => rotateModel('y'));
btnRotZ.addEventListener('click', () => rotateModel('z'));

scaleRange.addEventListener('input', (e) => handleScaleSlider(e.target.value));
btnScaleFit.addEventListener('click', autoFitToBed);
btnScaleReset.addEventListener('click', () => {
  scaleRange.value = 100;
  handleScaleSlider(100);
});

btnViewSolid.addEventListener('click', () => setViewMode('solid'));
btnViewWire.addEventListener('click', () => setViewMode('wireframe'));
btnViewGhost.addEventListener('click', () => setViewMode('ghost'));

densitySelect.addEventListener('change', updateWeightEstimate);
infillRange.addEventListener('input', updateWeightEstimate);

btnExportStl.addEventListener('click', exportToStl);

// Color swatch listeners
if (filamentPalette) {
  filamentPalette.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-swatch')) {
      // Remove active state
      document.querySelectorAll('.color-swatch').forEach(sw => sw.classList.remove('active'));
      // Set active
      e.target.classList.add('active');
      
      currentFilamentColor = e.target.getAttribute('data-color');
      currentMaterial.color = new THREE.Color(currentFilamentColor);
      
      showToast(`Filament set: ${e.target.getAttribute('title')}`);
    }
  });
}

// Run Init
window.addEventListener('load', initScene);
