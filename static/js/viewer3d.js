/**
 * 3D Viewport Studio (Three.js)
 * Implements real-time progressive point cloud reconstruction as UAV flies
 */

const Viewer3D = (function () {
  let scene, camera, renderer, controls;
  let container;
  let pointCloudMesh = null;
  let uavDrone = null;
  let radarCone = null;
  let radarFootprint = null;
  let gridHelper = null;
  let animId = null;

  let isAutoRotate = true;
  let isDroneFlying = true;
  let currentPointsData = [];
  let sortedPointsData = [];
  let colormapMode = 'height';
  let pointSizeVal = 0.55;

  // Progressive reconstruction state
  let droneSpeed = 0.12;
  let droneStartX = 0;
  let droneEndX = 42;
  let pauseTimer = 0;
  let showAllAlways = false;

  function init(elementId) {
    container = document.getElementById(elementId);
    if (!container) return;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);

    // Camera
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(-25, 24, 35);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.set(18, 4, 0);
      controls.maxDistance = 180;
      controls.minDistance = 3;
    }

    // Grid
    gridHelper = new THREE.GridHelper(70, 35, 0x334155, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Build UAV Drone Model
    buildUAVDrone();

    // Flight Path Track (dashed line)
    buildFlightTrack();

    // Resize handler
    window.addEventListener('resize', onWindowResize);

    // Start loop
    animate();
  }

  function onWindowResize() {
    if (!container || !renderer || !camera) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function buildFlightTrack() {
    const flightPoints = [];
    for (let x = -2; x <= 44; x += 1) {
      flightPoints.push(new THREE.Vector3(x, 18, -13.5));
    }
    const flightGeo = new THREE.BufferGeometry().setFromPoints(flightPoints);
    const flightMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 1.0,
      gapSize: 0.6,
      linewidth: 2
    });
    const line = new THREE.Line(flightGeo, flightMat);
    line.computeLineDistances();
    scene.add(line);
  }

  // Build sleek 3D UAV Drone with Across-Track Antenna Array and CORRECT downward-widening radar beam pyramid
  function buildUAVDrone() {
    uavDrone = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.45, 1.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    uavDrone.add(body);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    armGeo.rotateZ(Math.PI / 4);
    const armMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
    const arm1 = new THREE.Mesh(armGeo, armMat);
    const arm2 = arm1.clone();
    arm2.rotation.y = Math.PI / 2;
    uavDrone.add(arm1);
    uavDrone.add(arm2);

    // Radar Across-Track Antenna Bar (along Z)
    const arrayGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.6, 16);
    arrayGeo.rotateX(Math.PI / 2);
    const arrayMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0369a1, emissiveIntensity: 0.4 });
    const arrayMesh = new THREE.Mesh(arrayGeo, arrayMat);
    arrayMesh.position.y = -0.4;
    uavDrone.add(arrayMesh);

    // NADIR RADAR PYRAMID:
    // Narrow apex at the drone (top radius = 0.18), wide square base at the ground (bottom radius = 8.5)
    const beamHeight = 18.0;
    const pyramidGeo = new THREE.CylinderGeometry(0.18, 8.5, beamHeight, 4, 1, true);
    pyramidGeo.rotateY(Math.PI / 4); // Align faces squarely with along-track (X) and across-track (Z)

    const pyramidMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    radarCone = new THREE.Mesh(pyramidGeo, pyramidMat);
    radarCone.position.y = -beamHeight / 2;
    uavDrone.add(radarCone);

    // Ground illumination footprint rectangle
    const footprintGeo = new THREE.PlaneGeometry(12.0, 12.0);
    footprintGeo.rotateX(-Math.PI / 2);
    const footprintMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.10,
      side: THREE.DoubleSide
    });
    radarFootprint = new THREE.Mesh(footprintGeo, footprintMat);
    radarFootprint.position.y = -beamHeight / 2;
    radarCone.add(radarFootprint);

    // Lighting for drone
    const ambLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 30, 20);
    scene.add(dirLight);

    uavDrone.position.set(droneStartX, 18, -13.5);
    scene.add(uavDrone);
  }

  function getJetColor(h, minH = -1, maxH = 10) {
    let t = (h - minH) / (maxH - minH);
    t = Math.max(0, Math.min(1, t));
    let r = 0, g = 0, b = 0;
    if (t < 0.25) {
      r = 0; g = t * 4; b = 1;
    } else if (t < 0.5) {
      r = 0; g = 1; b = 1 - (t - 0.25) * 4;
    } else if (t < 0.75) {
      r = (t - 0.5) * 4; g = 1; b = 0;
    } else {
      r = 1; g = 1 - (t - 0.75) * 4; b = 0;
    }
    return [r, g, b];
  }

  function createPointTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  // Render Pond Point Cloud sorted by X along-track
  function renderPondPointCloud(points) {
    currentPointsData = points;
    // Sort points by X so we can progressively reveal them with setDrawRange
    sortedPointsData = [...points].sort((a, b) => a.x - b.x);

    clearObjects();

    uavDrone.position.set(droneStartX, 18, -13.5);
    uavDrone.visible = true;

    const N = sortedPointsData.length;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      const p = sortedPointsData[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.height; // Elevation along Y
      positions[i * 3 + 2] = p.z;      // Across-track along Z

      const [r, g, b] = getPointColor(p, colormapMode);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Initially start with first few points
    geo.setDrawRange(0, Math.floor(N * 0.05));

    const mat = new THREE.PointsMaterial({
      size: pointSizeVal,
      vertexColors: true,
      map: createPointTexture(),
      transparent: true,
      alphaTest: 0.08,
      opacity: 0.95
    });

    pointCloudMesh = new THREE.Points(geo, mat);
    scene.add(pointCloudMesh);
  }

  function getPointColor(p, mode) {
    if (mode === 'height') {
      return getJetColor(p.height, -0.5, 10.5);
    } else if (mode === 'snr') {
      const power = p.powerDb || 50;
      const t = Math.max(0, Math.min(1, (power - 40) / 60));
      return [t, t * 0.8, 1.0 - t * 0.5];
    } else {
      return [0.2, 0.75, 0.98];
    }
  }

  function updateColormap(newMode) {
    colormapMode = newMode;
    if (!pointCloudMesh || !sortedPointsData.length) return;
    const colorAttr = pointCloudMesh.geometry.attributes.color;
    const N = sortedPointsData.length;
    for (let i = 0; i < N; i++) {
      const [r, g, b] = getPointColor(sortedPointsData[i], colormapMode);
      colorAttr.setXYZ(i, r, g, b);
    }
    colorAttr.needsUpdate = true;
  }

  function updatePointSize(size) {
    pointSizeVal = size;
    if (pointCloudMesh) {
      pointCloudMesh.material.size = size;
    }
  }

  function clearObjects() {
    if (pointCloudMesh) { scene.remove(pointCloudMesh); pointCloudMesh.geometry.dispose(); pointCloudMesh = null; }
  }

  function setView(viewName) {
    if (!camera || !controls) return;
    switch (viewName) {
      case 'bev':
        camera.position.set(controls.target.x, controls.target.y + 45, controls.target.z + 0.01);
        break;
      case 'side':
        camera.position.set(controls.target.x + 48, controls.target.y, controls.target.z);
        break;
      case 'front':
        camera.position.set(controls.target.x, controls.target.y, controls.target.z + 48);
        break;
      case 'iso':
      default:
        camera.position.set(-25, 24, 35);
        break;
    }
    controls.update();
  }

  function captureScreenshot() {
    if (!renderer) return;
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `uav_nadir_pointcloud_${Date.now()}.png`;
    a.href = dataUrl;
    a.click();
  }

  function exportPointsCSV() {
    if (!currentPointsData || currentPointsData.length === 0) return;
    let csv = 'x_along_track_m,y_depth_m,z_across_track_m,height_m,power_db,type\n';
    currentPointsData.forEach(p => {
      csv += `${p.x},${p.y},${p.z},${p.height},${p.powerDb || 0},${p.type}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `uav_insar_points_${Date.now()}.csv`;
    a.href = url;
    a.click();
  }

  function replayFlight() {
    if (uavDrone) {
      uavDrone.position.x = droneStartX;
      pauseTimer = 0;
    }
    showAllAlways = false;
  }

  function toggleShowAllPoints() {
    showAllAlways = !showAllAlways;
    if (pointCloudMesh && sortedPointsData.length) {
      if (showAllAlways) {
        pointCloudMesh.geometry.setDrawRange(0, sortedPointsData.length);
      }
    }
    return showAllAlways;
  }

  // Animation render loop
  function animate() {
    animId = requestAnimationFrame(animate);

    // Drone flight & progressive point cloud reconstruction
    if (isDroneFlying && uavDrone && pointCloudMesh && sortedPointsData.length) {
      if (pauseTimer > 0) {
        pauseTimer--;
        if (pauseTimer === 0) {
          // Restart flight pass
          uavDrone.position.x = droneStartX;
        }
      } else {
        uavDrone.position.x += droneSpeed;

        if (!showAllAlways) {
          // Find how many points are behind/under the current drone position (+ swath margin of 4m)
          const currentX = uavDrone.position.x + 4.5;
          let visibleCount = 0;
          const totalN = sortedPointsData.length;
          while (visibleCount < totalN && sortedPointsData[visibleCount].x <= currentX) {
            visibleCount++;
          }
          pointCloudMesh.geometry.setDrawRange(0, visibleCount);

          // Update point count HUD
          const ptHud = document.getElementById('hud-point-count');
          if (ptHud) {
            ptHud.innerText = `${visibleCount.toLocaleString()} / ${totalN.toLocaleString()} points`;
          }
        }

        if (uavDrone.position.x >= droneEndX) {
          // Pause at end for ~3.5 seconds (210 frames at 60fps)
          pauseTimer = 210;
        }
      }
    }

    if (controls) {
      controls.autoRotate = isAutoRotate;
      controls.autoRotateSpeed = 0.8;
      controls.update();
    }

    renderer.render(scene, camera);
  }

  return {
    init,
    renderPondPointCloud,
    updateColormap,
    updatePointSize,
    setView,
    captureScreenshot,
    exportPointsCSV,
    replayFlight,
    toggleShowAllPoints,
    toggleAutoRotate: (val) => { isAutoRotate = val; },
    toggleDroneFlight: (val) => { isDroneFlying = val; }
  };
})();
