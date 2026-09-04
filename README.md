# UAV Nadir InSAR Studio (Web Application)

Interactive, client-side Web Application for the paper:  
**"3D Radar Imaging from the UAV Nadir"**  
*S. Hamed Javadi, Hichem Sahli, and André Bourdoux* (IMEC / VUB)  
Published in: **IEEE Transactions on Radar Systems**

---

## 🌟 Key Features

1. **3D Point Cloud Studio (Three.js WebGL)**:
   - Full 3D interactive rendering of the DJI Matrice-300 drone in flight, along-track trajectory, across-track virtual antenna array, downward nadir radar beam cone, and reconstructed ground scatterers.
   - Built-in presets:
     - **Pond Flight Experiment**: Reconstructed 3D point cloud of the pond scene from flight data (concrete banks, divider trees, dense foliage canopy, specular water reflection).
     - **Simulation Benchmark**: Configurable target scatterer cube around the SAR Reference Point (SRP) with live Ground Truth vs. Estimated points and 3D residual error vectors.
   - View presets: 3D Perspective Orbit, Bird's-Eye View (BEV Top-Down), Side Nadir Depth ($y-z$), Front Cross-Range ($x-y$).
   - Real-time colormaps: Elevation/Height (Paper Jet colormap: $-2\text{m}$ to $10\text{m}$), Radar SNR, Monochrome Tech.
   - Point size adjustment, auto-orbit, screenshot capture, and CSV export.

2. **Flight & Radar Parameter Studio**:
   - UAV Altitude ($10\text{–}50\text{ m}$)
   - Nominal Velocity ($2\text{–}15\text{ m/s}$)
   - Along-track Velocity Error $v_e$ ($-5\text{ to }+5\text{ m/s}$)
   - Roll Attitude Angle $\rho$ ($-15^\circ\text{ to }+15^\circ$)
   - RaySe Segmentation Threshold slider
   - Toggle Phase Gradient Autofocus (PGA) ON/OFF

3. **InSAR Pipeline & Autofocus Inspector (Chart.js)**:
   - **Quadratic Phase Error vs. PGA Estimation**: Live plot reproducing Fig. 4 showing simulated quadratic phase errors $k\alpha' v_e T_c n^2$ and the PGA phase gradient estimate.
   - **Rayleigh-Based Segmentation (RaySe)**: Amplitude distribution and noise cutoff isolating dominant scatterers.
   - **Multi-Baseline Phase Unwrapping (MBPU)**: Resolving integer ambiguity numbers $k, k'$ between coprime baselines $B = 7\frac{\lambda}{2}$ and $B' = 5\frac{\lambda}{2}$ (Fig. 7).
   - **Image Contrast (IC) Metric**: Live comparison of SAR focus without vs. with PGA compensation matching Fig. 11.

4. **Quantitative Analytics**:
   - Sub-meter 3D RMSE metric.
   - RMSE Performance vs. Number of Scatterers curve (Fig. 8).
   - Table I radar specifications and flight parameters.

5. **Paper Reference & 1-Click BibTeX Citation**:
   - Abstract, affiliations, Horizon Europe Edge AI funding attribution.
   - Complete gallery of high-resolution paper figures (Fig. 1 to Fig. 12).
   - Pre-formatted BibTeX entry with one-click copy.

---

## 🚀 How to Run Locally

### Option 1: Double Click `start_server.ps1`
Run in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\start_server.ps1
```
This opens `http://localhost:8080/` in your browser.

### Option 2: Open Directly in Any Browser
Simply double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari. All dependencies are loaded via high-speed CDNs.

---

## 🌐 Deploy to GitHub Pages

1. Create a GitHub repository (e.g. `uav-nadir-insar`).
2. Push the files in this folder to the repository `main` branch.
3. In GitHub repo settings, go to **Pages** &rarr; Select Branch: **main** / root &rarr; Save.
4. Your web application will be live at `https://<your-username>.github.io/uav-nadir-insar/`!
