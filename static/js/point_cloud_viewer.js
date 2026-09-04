/**
 * 3D Radar Point Cloud Interactive Visualizer
 * Reconstructs the 3D UAV Nadir Radar Point Cloud (Fig. 10b / Fig. 12)
 */

(function () {
  const container = document.getElementById('point-cloud-canvas-container');
  if (!container) return;

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1120); // Dark sleek background

  // Camera
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  // Position camera to match the viewpoint in Fig. 10(b)
  camera.position.set(-28, 26, 38);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Orbit Controls
  let controls;
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(12, 5, 0);
    controls.maxDistance = 150;
    controls.minDistance = 5;
  }

  // Grid & Axes Helper
  const gridHelper = new THREE.GridHelper(60, 30, 0x1e293b, 0x0f172a);
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  // Generate Synthetic Point Cloud resembling Fig. 10(b) Pond & Foliage
  const pointCount = 8500;
  const positions = new Float32Array(pointCount * 3);
  const colors = new Float32Array(pointCount * 3);
  const heights = new Float32Array(pointCount);

  // Colormap function (Jet / Turbo resembling the paper colorbar: -2m to +10m)
  function getJetColor(h, minH = -2, maxH = 10) {
    let t = (h - minH) / (maxH - minH);
    t = Math.max(0, Math.min(1, t));
    
    // Smooth blue -> cyan -> yellow -> red gradient
    let r, g, b;
    if (t < 0.25) {
      r = 0;
      g = t * 4;
      b = 1;
    } else if (t < 0.5) {
      r = 0;
      g = 1;
      b = 1 - (t - 0.25) * 4;
    } else if (t < 0.75) {
      r = (t - 0.5) * 4;
      g = 1;
      b = 0;
    } else {
      r = 1;
      g = 1 - (t - 0.75) * 4;
      b = 0;
    }
    return [r, g, b];
  }

  let idx = 0;

  // 1. Pond Boundaries / Concrete edges (Blue / Low height: h ~ -0.5 to 0.5m)
  for (let i = 0; i < 2200; i++) {
    let x, z, h;
    let edgeChoice = Math.random();
    if (edgeChoice < 0.35) {
      // Bottom/Top boundary along X
      x = Math.random() * 38;
      z = (Math.random() > 0.5 ? 12 : -12) + (Math.random() - 0.5) * 1.5;
    } else if (edgeChoice < 0.7) {
      // Left/Right boundary along Z
      x = (Math.random() > 0.5 ? 0 : 38) + (Math.random() - 0.5) * 1.5;
      z = (Math.random() - 0.5) * 24;
    } else {
      // Middle pond divider
      x = 18 + (Math.random() - 0.5) * 1.8;
      z = (Math.random() - 0.5) * 22;
    }
    h = (Math.random() - 0.5) * 0.8; // around ground level 0m
    
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = h;
    positions[idx * 3 + 2] = z;
    heights[idx] = h;

    const [r, g, b] = getJetColor(h);
    colors[idx * 3] = r;
    colors[idx * 3 + 1] = g;
    colors[idx * 3 + 2] = b;
    idx++;
  }

  // 2. Trees at ends of divider (Cyan tones: h ~ 1 to 4.5m)
  for (let i = 0; i < 1800; i++) {
    let angle = Math.random() * Math.PI * 2;
    let rad = Math.pow(Math.random(), 0.7) * 3.5;
    let isTop = Math.random() > 0.5;
    let centerX = 18 + (Math.random() - 0.5) * 1.5;
    let centerZ = isTop ? 9.5 : -9.5;
    let h = 0.5 + Math.random() * 4.5;

    positions[idx * 3] = centerX + Math.cos(angle) * rad;
    positions[idx * 3 + 1] = h;
    positions[idx * 3 + 2] = centerZ + Math.sin(angle) * rad;
    heights[idx] = h;

    const [r, g, b] = getJetColor(h);
    colors[idx * 3] = r;
    colors[idx * 3 + 1] = g;
    colors[idx * 3 + 2] = b;
    idx++;
  }

  // 3. Tall Forest / Trees Canopy on Right & Upper Shoreline (Yellow/Orange/Red: h ~ 5 to 10.5m)
  for (let i = 0; i < 4500; i++) {
    let x = 24 + Math.random() * 15;
    let z = (Math.random() - 0.5) * 26;
    let h = 3.5 + Math.pow(Math.random(), 0.6) * 7.0; // up to ~10.5m

    positions[idx * 3] = x + (Math.random() - 0.5) * 1.5;
    positions[idx * 3 + 1] = h;
    positions[idx * 3 + 2] = z + (Math.random() - 0.5) * 1.5;
    heights[idx] = h;

    const [r, g, b] = getJetColor(h);
    colors[idx * 3] = r;
    colors[idx * 3 + 1] = g;
    colors[idx * 3 + 2] = b;
    idx++;
  }

  // Geometry & Material
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Generate circle texture for circular radar point scatterers
  function createPointTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  const pointMaterial = new THREE.PointsMaterial({
    size: 0.45,
    vertexColors: true,
    map: createPointTexture(),
    transparent: true,
    alphaTest: 0.1,
    opacity: 0.95
  });

  const pointCloud = new THREE.Points(geometry, pointMaterial);
  scene.add(pointCloud);

  // Add UAV Flight Path & Radar Nadir Cone
  const flightPathGeo = new THREE.BufferGeometry();
  const flightPoints = [];
  for (let x = -5; x <= 45; x += 1) {
    flightPoints.push(new THREE.Vector3(x, 16, -14)); // Y represents altitude
  }
  flightPathGeo.setFromPoints(flightPoints);
  const flightPathMat = new THREE.LineDashedMaterial({
    color: 0x38bdf8,
    dashSize: 1.2,
    gapSize: 0.8,
    linewidth: 2
  });
  const flightLine = new THREE.Line(flightPathGeo, flightPathMat);
  flightLine.computeLineDistances();
  scene.add(flightLine);

  // UAV Drone Marker
  const uavGroup = new THREE.Group();
  const droneBodyGeo = new THREE.BoxGeometry(1.6, 0.4, 1.2);
  const droneBodyMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const droneBody = new THREE.Mesh(droneBodyGeo, droneBodyMat);
  uavGroup.add(droneBody);

  // Radar antenna array (across-track along Z)
  const arrayGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.0, 16);
  arrayGeo.rotateX(Math.PI / 2);
  const arrayMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const antennaArray = new THREE.Mesh(arrayGeo, arrayMat);
  antennaArray.position.y = -0.3;
  uavGroup.add(antennaArray);

  // Nadir radar projection cone
  const coneGeo = new THREE.ConeGeometry(5, 15.7, 4, 1, true);
  coneGeo.rotateX(Math.PI);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });
  const radarBeam = new THREE.Mesh(coneGeo, coneMat);
  radarBeam.position.y = -7.85;
  uavGroup.add(radarBeam);

  uavGroup.position.set(15, 16, -14);
  scene.add(uavGroup);

  // Animation Loop
  let autoRotate = true;
  let animationId;
  let droneSpeed = 0.08;

  function animate() {
    animationId = requestAnimationFrame(animate);

    // UAV moving animation along flight path
    uavGroup.position.x += droneSpeed;
    if (uavGroup.position.x > 38) {
      uavGroup.position.x = 2;
    }

    if (autoRotate && controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.0;
    } else if (controls) {
      controls.autoRotate = false;
    }

    if (controls) controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // UI Button Controls
  const rotateBtn = document.getElementById('btn-toggle-rotate');
  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      autoRotate = !autoRotate;
      rotateBtn.classList.toggle('active', autoRotate);
    });
  }

  const resetBtn = document.getElementById('btn-reset-view');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      camera.position.set(-28, 26, 38);
      if (controls) {
        controls.target.set(12, 5, 0);
        controls.update();
      }
    });
  }

  const pointSizeSlider = document.getElementById('slider-point-size');
  if (pointSizeSlider) {
    pointSizeSlider.addEventListener('input', (e) => {
      pointMaterial.size = parseFloat(e.target.value);
    });
  }

  // Colormap toggle
  const colormapSelect = document.getElementById('select-colormap');
  if (colormapSelect) {
    colormapSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      const colorAttr = geometry.attributes.color;
      for (let i = 0; i < pointCount; i++) {
        let h = heights[i];
        let r, g, b;
        if (mode === 'height') {
          [r, g, b] = getJetColor(h);
        } else if (mode === 'snr') {
          // SNR / power simulation
          let p = (h + 2) / 12.5;
          r = p;
          g = p * 0.8;
          b = 1.0 - p * 0.5;
        } else {
          // Tech cyan monochrome
          r = 0.22;
          g = 0.74;
          b = 0.97;
        }
        colorAttr.setXYZ(i, r, g, b);
      }
      colorAttr.needsUpdate = true;
    });
  }
})();
