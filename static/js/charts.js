/**
 * Charts Module (Chart.js)
 * Scientific interactive plots for phase errors, RaySe segmentation, and RMSE
 */

const ChartsManager = (function () {
  let phaseChart = null;
  let rayseChart = null;
  let rmseChart = null;

  // 1. Render / Update Phase Error & PGA Chart (Matching Fig. 4 in the Paper)
  function renderPhaseErrorChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = [];
    const trueErr = [];
    const pgaEst = [];

    // Fig. 4 has chirps from 0 to 255, centered at ~127.5
    for (let n = 0; n <= 255; n += 5) {
      labels.push(n);
      const t = (n - 127.5) / 127.5;
      // Parabolic curve: 0 at center, 2.88 at edges for True, 2.27 at edges for PGA
      const phi_true = 2.88 * (t * t);
      const phi_pga = 2.27 * (t * t);

      trueErr.push(parseFloat(phi_true.toFixed(3)));
      pgaEst.push(parseFloat(phi_pga.toFixed(3)));
    }

    if (phaseChart) {
      phaseChart.data.labels = labels;
      phaseChart.data.datasets[0].data = pgaEst;
      phaseChart.data.datasets[1].data = trueErr;
      phaseChart.update();
      return;
    }

    phaseChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'PGA phase error',
            data: pgaEst,
            borderColor: '#0284c7', // Blue
            borderWidth: 2.2,
            pointRadius: 0,
            tension: 0.1
          },
          {
            label: 'True phase error',
            data: trueErr,
            borderColor: '#f97316', // Orange
            borderWidth: 2.2,
            pointRadius: 0,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#cbd5e1', font: { family: 'Inter', size: 12, weight: 600 } }
          },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: {
            title: { display: true, text: 'Chirp loop number', color: '#94a3b8', font: { weight: 600 } },
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            min: 0.0,
            max: 3.0,
            title: { display: true, text: 'Phase error (rad)', color: '#94a3b8', font: { weight: 600 } },
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }

  // 2. Render Rayleigh-based Segmentation (RaySe) Histogram
  function renderRaySeChart(canvasId, threshold = 65) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const bins = [];
    const noiseData = [];
    const scattererData = [];

    for (let x = 0; x <= 100; x += 2) {
      bins.push(x);
      const sigma = 18;
      const rayleigh = (x / (sigma * sigma)) * Math.exp(-(x * x) / (2 * sigma * sigma)) * 1200;
      noiseData.push(rayleigh);

      if (x > threshold) {
        scattererData.push(rayleigh + 6 + Math.sin(x) * 4);
      } else {
        scattererData.push(null);
      }
    }

    if (rayseChart) {
      rayseChart.data.datasets[1].data = scattererData;
      rayseChart.data.datasets[1].label = `Isolated Scatterers (Threshold > ${threshold})`;
      rayseChart.update();
      return;
    }

    rayseChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: bins,
        datasets: [
          {
            label: 'Rayleigh Background Noise Amplitude PDF',
            data: noiseData,
            borderColor: '#64748b',
            backgroundColor: 'rgba(100, 116, 139, 0.15)',
            fill: true,
            borderWidth: 1.5,
            pointRadius: 0
          },
          {
            label: `Isolated Scatterers (Threshold > ${threshold})`,
            data: scattererData,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.45)',
            fill: true,
            borderWidth: 2,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 } } }
        },
        scales: {
          x: {
            title: { display: true, text: 'SAR Image Amplitude', color: '#94a3b8' },
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            title: { display: true, text: 'Probability Density / Counts', color: '#94a3b8' },
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }

  // 3. Render RMSE Performance Curve vs. Scatterers (Fig. 8 in the paper)
  function renderRMSEChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const scattererCounts = [2, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30];
    const rmseTrialMeans = [0.55, 0.48, 0.85, 0.62, 1.18, 0.82, 0.76, 1.05, 0.68, 0.72, 1.08, 0.86];

    if (rmseChart) {
      rmseChart.update();
      return;
    }

    rmseChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: scattererCounts,
        datasets: [
          {
            label: 'Reconstruction RMSE (m)',
            data: rmseTrialMeans,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            fill: true,
            borderWidth: 2,
            pointBackgroundColor: '#38bdf8',
            pointRadius: 4,
            tension: 0.15
          },
          {
            label: '1.0 Meter Bounded Threshold',
            data: Array(scattererCounts.length).fill(1.0),
            borderColor: '#ef4444',
            borderDash: [6, 6],
            borderWidth: 1.5,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 } } },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y} m`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Number of Scatterers', color: '#94a3b8' },
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            min: 0,
            max: 1.4,
            title: { display: true, text: 'RMSE (m)', color: '#94a3b8' },
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }

  return {
    renderPhaseErrorChart,
    renderRaySeChart,
    renderRMSEChart
  };
})();
