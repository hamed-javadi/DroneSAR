/**
 * Presets and Datasets for UAV Nadir InSAR Studio
 * Contains ground truth and reconstructed points for:
 * 1. Real Flight Experiment (DJI Matrice-300 over Pond Scene - Fig. 10 & 12)
 * 2. Simulation Benchmark (Point scatterer cube with ground truth - Fig. 6 & 8)
 * 3. Table I Default Radar Parameters
 */

const DefaultRadarParams = {
  fc: 60e9,           // 60 GHz carrier frequency
  bandwidth: 1.442e9,  // 1.442 GHz bandwidth
  Tc: 102.88e-6,      // 102.88 microseconds PRI
  Nc: 255,            // 255 chirps per frame
  Tf: 100e-3,         // 100 ms frame period
  S: 400,             // 400 samples per chirp
  Fs: 8e6,            // 8 MHz receiver sampling frequency
  c: 299792458,       // Speed of light (m/s)
  altitude: 25.0,     // 25 m altitude above ground level
  velocity: 7.0,      // 7 m/s nominal UAV velocity
  b_primary: 7,       // Primary baseline multiplier (7 * lambda / 2)
  b_secondary: 5,     // Secondary baseline multiplier (5 * lambda / 2)
};

// Compute derived physical parameters
function getDerivedParams(p = DefaultRadarParams) {
  const lambda = p.c / p.fc; // ~5 mm wavelength at 60 GHz
  const d_elem = lambda / 2; // 2.5 mm inter-antenna spacing
  const B_primary = p.b_primary * d_elem;   // 17.5 mm
  const B_secondary = p.b_secondary * d_elem; // 12.5 mm
  const rmax = (Math.PI * p.c * p.Fs) / (p.bandwidth / p.Tc);
  const CPI = p.Nc * p.Tc; // ~26.23 ms
  const maxRollRate = (lambda / (B_primary * CPI)) * (180 / Math.PI); // ~624 deg/s

  return {
    lambda,
    d_elem,
    B_primary,
    B_secondary,
    rmax,
    CPI,
    maxRollRate
  };
}

// Generate Flight Experiment Point Cloud (Fig. 10b / Fig. 12)
function generatePondExperimentData() {
  const points = [];

  // Helper to add clustered points
  function addCluster(cx, cy, cz, spreadX, spreadY, spreadZ, count, type, heightBase) {
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const r = Math.sqrt(-2 * Math.log(u));
      const th = 2 * Math.PI * v;
      const x = cx + r * Math.cos(th) * (spreadX / 2);
      const z = cz + r * Math.sin(th) * (spreadZ / 2);
      const h = heightBase + (Math.random() - 0.5) * spreadY;
      const y = 25.0 - h; // y is depth from UAV at 25m

      points.push({
        x: parseFloat(x.toFixed(3)),
        y: parseFloat(y.toFixed(3)), // nadir depth (m)
        z: parseFloat(z.toFixed(3)), // across-track (m)
        height: parseFloat(h.toFixed(3)),
        type: type,
        powerDb: parseFloat((40 + Math.random() * 55 + (type === 'foliage' ? 15 : 0)).toFixed(1))
      });
    }
  }

  // 1. Concrete Pond Edges & Perimeter (z: -14 to +14, x: 0 to 40, height ~0m)
  for (let x = 0; x <= 40; x += 0.35) {
    // Bottom bank
    let h = (Math.random() - 0.5) * 0.4;
    points.push({ x: x + (Math.random()-0.5)*0.2, y: 25 - h, z: -13.5 + (Math.random()-0.5)*0.5, height: h, type: 'edge', powerDb: 55 + Math.random()*25 });
    // Top bank
    h = (Math.random() - 0.5) * 0.4;
    points.push({ x: x + (Math.random()-0.5)*0.2, y: 25 - h, z: 13.5 + (Math.random()-0.5)*0.5, height: h, type: 'edge', powerDb: 54 + Math.random()*24 });
  }

  // Left & Right banks
  for (let z = -13.5; z <= 13.5; z += 0.4) {
    let h = (Math.random() - 0.5) * 0.4;
    points.push({ x: (Math.random()-0.5)*0.5, y: 25 - h, z: z + (Math.random()-0.5)*0.2, height: h, type: 'edge', powerDb: 56 + Math.random()*20 });
    h = (Math.random() - 0.5) * 0.4;
    points.push({ x: 40 + (Math.random()-0.5)*0.5, y: 25 - h, z: z + (Math.random()-0.5)*0.2, height: h, type: 'edge', powerDb: 58 + Math.random()*22 });
  }

  // Central Divider (x ~ 18, z: -12 to 12)
  for (let z = -12; z <= 12; z += 0.3) {
    let h = 0.2 + (Math.random() - 0.5) * 0.4;
    points.push({ x: 18 + (Math.random()-0.5)*0.4, y: 25 - h, z: z, height: h, type: 'divider', powerDb: 62 + Math.random()*20 });
  }

  // 2. Trees at both ends of divider (cyan tones, h ~ 1 to 4.5m)
  addCluster(18, 0, -10.5, 3.5, 2.5, 3.5, 450, 'tree_divider', 2.8);
  addCluster(18, 0, 10.5, 3.5, 2.5, 3.5, 450, 'tree_divider', 2.8);

  // 3. Dense Forest / Tree Foliage on Right Bank (yellow/red, h ~ 5 to 10.5m)
  for (let x = 24; x <= 42; x += 3) {
    for (let z = -14; z <= 14; z += 3.5) {
      const treeH = 5.5 + Math.random() * 4.8;
      addCluster(x, 0, z, 3.0, 3.0, 3.0, 120, 'foliage', treeH);
    }
  }

  return points;
}

// Generate Simulation Benchmark Targets (Fig. 6 & 8)
function generateSimulationTargets(numScatterers = 15) {
  const targets = [];
  // Center around SRP (x=0, y=25, z=0) within a 10m cubic region
  for (let i = 0; i < numScatterers; i++) {
    const xs = parseFloat(((Math.random() - 0.5) * 8.0).toFixed(3));
    const ys = parseFloat((25.0 + (Math.random() - 0.5) * 8.0).toFixed(3)); // 21 to 29m depth
    const zs = parseFloat(((Math.random() - 0.5) * 7.5).toFixed(3)); // -3.75 to +3.75m across-track

    targets.push({
      id: i + 1,
      trueX: xs,
      trueY: ys,
      trueZ: zs,
      sigma: 1.0 + Math.random() * 2.0 // radar cross section
    });
  }
  return targets;
}
