// Main interactive functionalities for UAV Nadir InSAR Project Page

document.addEventListener('DOMContentLoaded', () => {
  // 1. Image Comparison Slider
  initComparisonSlider();

  // 2. Pipeline Step Tabs
  initPipelineTabs();

  // 3. Scroll to top button
  initScrollToTop();
});

// Image Comparison Slider logic
function initComparisonSlider() {
  const container = document.querySelector('.comparison-container');
  if (!container) return;

  const overlay = container.querySelector('.comparison-overlay');
  const handle = container.querySelector('.comparison-handle');
  let isDragging = false;

  function setSliderPosition(x) {
    const rect = container.getBoundingClientRect();
    let posX = x - rect.left;
    posX = Math.max(0, Math.min(posX, rect.width));
    const percentage = (posX / rect.width) * 100;

    overlay.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
  }

  // Mouse Events
  handle.addEventListener('mousedown', () => (isDragging = true));
  window.addEventListener('mouseup', () => (isDragging = false));
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    setSliderPosition(e.clientX);
  });

  // Touch Events for Mobile
  handle.addEventListener('touchstart', () => (isDragging = true), { passive: true });
  window.addEventListener('touchend', () => (isDragging = false));
  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    setSliderPosition(e.touches[0].clientX);
  }, { passive: true });

  // Click anywhere on container to move slider
  container.addEventListener('click', (e) => {
    setSliderPosition(e.clientX);
  });
}

// Pipeline Tabs logic
function initPipelineTabs() {
  const tabButtons = document.querySelectorAll('.pipeline-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      // Update active button
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active pane
      tabPanes.forEach((pane) => {
        pane.classList.toggle('active', pane.id === targetId);
      });
    });
  });
}

// BibTeX Copy Function
function copyBibTeX() {
  const bibtexCode = document.getElementById('bibtex-code').innerText;
  const copyBtn = document.getElementById('copy-bibtex-btn');
  const copyIcon = copyBtn.querySelector('i');
  const copyText = copyBtn.querySelector('.copy-text');

  navigator.clipboard.writeText(bibtexCode).then(() => {
    copyBtn.classList.add('copied');
    copyIcon.className = 'fas fa-check';
    copyText.innerText = 'Copied!';

    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyIcon.className = 'fas fa-copy';
      copyText.innerText = 'Copy';
    }, 2500);
  }).catch((err) => {
    console.error('Failed to copy: ', err);
  });
}

// Scroll To Top
function initScrollToTop() {
  const scrollBtn = document.querySelector('.scroll-to-top');
  if (!scrollBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollBtn.classList.add('show');
    } else {
      scrollBtn.classList.remove('show');
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
