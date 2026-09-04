/**
 * UAV Nadir InSAR Studio - Main Controller (Scroll-Mode)
 */

const App = (function () {
  const state = {
    altitude: 25.0,
    velocity: 7.0,
    velocityError: 2.5,
    rollDeg: 0.0,
    applyPGA: true,
    rayseThreshold: 65
  };

  function init() {
    // 1. Initialize 3D Viewport with Pond Scene
    Viewer3D.init('point-cloud-canvas-container');
    const pondPoints = generatePondExperimentData();
    Viewer3D.renderPondPointCloud(pondPoints);

    // 2. Setup ScrollSpy & Navigation Links
    initScrollNavigation();

    // 3. Setup Image Comparison Slider
    initComparisonSlider();

    // 4. Setup Lightbox Modal for Figures
    initLightbox();

    // 5. Setup UI event listeners
    bindControls();

    // 6. Render charts
    ChartsManager.renderPhaseErrorChart('chart-phase-error');
    ChartsManager.renderRaySeChart('chart-rayse', state.rayseThreshold);
    ChartsManager.renderRMSEChart('chart-rmse');
  }

  // Smooth scroll and active link highlight as user scrolls (ScrollSpy)
  function initScrollNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.app-section');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetSection = document.querySelector(href);
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    // ScrollSpy observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              navLinks.forEach(l => l.classList.remove('active'));
              link.classList.add('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-15% 0px -70% 0px'
    });

    sections.forEach(sec => observer.observe(sec));
  }

  // Before / After Comparison Slider Logic (Pixel Perfect Alignment)
  function initComparisonSlider() {
    const container = document.getElementById('autofocus-slider-container');
    if (!container) return;

    const overlay = document.getElementById('comparison-overlay');
    const overlayImg = document.getElementById('comparison-overlay-img');
    const handle = document.getElementById('comparison-handle');
    let isDragging = false;

    function updateOverlayWidth() {
      if (overlayImg && container) {
        overlayImg.style.width = container.clientWidth + 'px';
      }
    }

    function setSliderPosition(clientX) {
      const rect = container.getBoundingClientRect();
      let posX = clientX - rect.left;
      posX = Math.max(0, Math.min(posX, rect.width));
      const percentage = (posX / rect.width) * 100;

      overlay.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    }

    // Set initial size
    updateOverlayWidth();
    window.addEventListener('resize', updateOverlayWidth);

    // Mouse drag
    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      e.preventDefault();
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      setSliderPosition(e.clientX);
    });

    // Touch drag for mobile / tablets
    handle.addEventListener('touchstart', () => {
      isDragging = true;
    }, { passive: true });
    window.addEventListener('touchend', () => { isDragging = false; });
    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      setSliderPosition(e.touches[0].clientX);
    }, { passive: true });

    // Direct click anywhere on container
    container.addEventListener('click', (e) => {
      setSliderPosition(e.clientX);
    });
  }

  // Lightbox Modal logic for full-size figure viewing
  function initLightbox() {
    const modal = document.getElementById('image-lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    const modalCaption = document.getElementById('lightbox-caption');

    window.openLightbox = function (src, caption) {
      if (!modal) return;
      modalImg.src = src;
      modalCaption.innerText = caption;
      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    };

    window.closeLightbox = function () {
      if (!modal) return;
      modal.classList.remove('is-active');
      document.body.style.overflow = 'auto';
    };

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // Add click event to all gallery images
    document.querySelectorAll('.zoomable-img, .gallery-card img, .pipeline-hero-img').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        const caption = img.getAttribute('alt') || '';
        openLightbox(img.src, caption);
      });
    });
  }

  function bindControls() {
    // Altitude Slider
    const altSlider = document.getElementById('slider-altitude');
    const altVal = document.getElementById('val-altitude');
    if (altSlider) {
      altSlider.addEventListener('input', (e) => {
        state.altitude = parseFloat(e.target.value);
        if (altVal) altVal.innerText = `${state.altitude} m`;
      });
    }

    // Velocity Slider
    const velSlider = document.getElementById('slider-velocity');
    const velVal = document.getElementById('val-velocity');
    if (velSlider) {
      velSlider.addEventListener('input', (e) => {
        state.velocity = parseFloat(e.target.value);
        if (velVal) velVal.innerText = `${state.velocity} m/s`;
      });
    }

    // Velocity Error Slider (v_e)
    const veSlider = document.getElementById('slider-ve');
    const veVal = document.getElementById('val-ve');
    if (veSlider) {
      veSlider.addEventListener('input', (e) => {
        state.velocityError = parseFloat(e.target.value);
        if (veVal) veVal.innerText = `${state.velocityError > 0 ? '+' : ''}${state.velocityError} m/s`;
      });
    }

    // Roll Angle Slider (rho)
    const rollSlider = document.getElementById('slider-roll');
    const rollVal = document.getElementById('val-roll');
    if (rollSlider) {
      rollSlider.addEventListener('input', (e) => {
        state.rollDeg = parseFloat(e.target.value);
        if (rollVal) rollVal.innerText = `${state.rollDeg}\u00B0`;
      });
    }

    // PGA Toggle Checkbox
    const pgaToggle = document.getElementById('toggle-pga');
    if (pgaToggle) {
      pgaToggle.addEventListener('change', (e) => {
        state.applyPGA = e.target.checked;
      });
    }

    // RaySe Threshold Slider
    const rayseSlider = document.getElementById('slider-rayse');
    const rayseVal = document.getElementById('val-rayse');
    if (rayseSlider) {
      rayseSlider.addEventListener('input', (e) => {
        state.rayseThreshold = parseInt(e.target.value);
        if (rayseVal) rayseVal.innerText = state.rayseThreshold;
        ChartsManager.renderRaySeChart('chart-rayse', state.rayseThreshold);
      });
    }

    // Run Pipeline / Replay Scan Button
    const runBtn = document.getElementById('btn-run-pipeline');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        Viewer3D.replayFlight();
      });
    }

    // Replay Scan Button on Floating Toolbar
    const replayBtn = document.getElementById('btn-replay-scan');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        Viewer3D.replayFlight();
      });
    }

    // Show All Points Toggle Button on Floating Toolbar
    const showAllBtn = document.getElementById('btn-show-all-points');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => {
        const isAll = Viewer3D.toggleShowAllPoints();
        showAllBtn.classList.toggle('active', isAll);
      });
    }

    // View Preset Buttons
    document.querySelectorAll('.btn-view-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-view-preset').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const view = btn.getAttribute('data-view');
        Viewer3D.setView(view);
      });
    });

    // Colormap Select
    const colormapSel = document.getElementById('select-colormap');
    if (colormapSel) {
      colormapSel.addEventListener('change', (e) => {
        Viewer3D.updateColormap(e.target.value);
      });
    }

    // Point Size Slider
    const pSizeSlider = document.getElementById('slider-point-size');
    if (pSizeSlider) {
      pSizeSlider.addEventListener('input', (e) => {
        Viewer3D.updatePointSize(parseFloat(e.target.value));
      });
    }

    // Auto Rotate Toggle
    const rotateBtn = document.getElementById('btn-toggle-rotate');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        rotateBtn.classList.toggle('active');
        Viewer3D.toggleAutoRotate(rotateBtn.classList.contains('active'));
      });
    }

    // Export CSV & Screenshot
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) exportBtn.addEventListener('click', () => Viewer3D.exportPointsCSV());

    const shotBtn = document.getElementById('btn-screenshot');
    if (shotBtn) shotBtn.addEventListener('click', () => Viewer3D.captureScreenshot());

    // BibTeX Copy
    const copyBibBtn = document.getElementById('copy-bibtex-btn');
    if (copyBibBtn) copyBibBtn.addEventListener('click', copyBibTeX);
  }

  function copyBibTeX() {
    const code = document.getElementById('bibtex-code').innerText;
    const btn = document.getElementById('copy-bibtex-btn');
    navigator.clipboard.writeText(code).then(() => {
      btn.classList.add('copied');
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '<i class="fas fa-copy"></i> Copy BibTeX';
      }, 2000);
    });
  }

  return {
    init
  };
})();

// Bootstrap on DOM load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
