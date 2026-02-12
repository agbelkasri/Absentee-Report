const COLORS = {
  planned: '#2563eb',
  unplanned: '#ef4444',
  palette: ['#2563eb', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4']
};

function setupCanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

function drawRoundedRect(ctx, x, y, w, h, radii) {
  if (w <= 0 || h <= 0) return;
  const r = typeof radii === 'number' ? [radii, radii, radii, radii] : radii;
  const [tl, tr, br, bl] = r;
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

export function renderBarChart(canvas, data, options = {}) {
  const {
    width = canvas.parentElement.clientWidth || 600,
    height = 240,
    barGap = 2,
    paddingLeft = 40,
    paddingBottom = 30,
    paddingTop = 20,
    paddingRight = 10,
    showValues = true,
    stacked = false
  } = options;

  const ctx = setupCanvas(canvas, width, height);
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value
  let maxVal = 0;
  data.forEach(d => {
    if (stacked && d.segments) {
      const total = d.segments.reduce((s, seg) => s + seg.value, 0);
      if (total > maxVal) maxVal = total;
    } else {
      if (d.value > maxVal) maxVal = d.value;
    }
  });
  if (maxVal === 0) maxVal = 1;

  // Draw Y axis grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';

  const ySteps = Math.min(5, maxVal);
  for (let i = 0; i <= ySteps; i++) {
    const y = paddingTop + chartHeight - (i / ySteps) * chartHeight;
    const val = Math.round((i / ySteps) * maxVal);

    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillText(val, paddingLeft - 8, y + 4);
  }

  // Draw bars
  const barWidth = Math.max(4, (chartWidth / data.length) - barGap);

  data.forEach((d, i) => {
    const x = paddingLeft + i * (barWidth + barGap) + barGap / 2;

    if (stacked && d.segments) {
      let yOffset = 0;
      d.segments.forEach(seg => {
        const barHeight = (seg.value / maxVal) * chartHeight;
        const y = paddingTop + chartHeight - yOffset - barHeight;

        ctx.fillStyle = seg.color;
        ctx.beginPath();
        drawRoundedRect(ctx, x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();

        yOffset += barHeight;
      });
    } else {
      const barHeight = (d.value / maxVal) * chartHeight;
      const y = paddingTop + chartHeight - barHeight;

      ctx.fillStyle = d.color || COLORS.planned;
      ctx.beginPath();
      drawRoundedRect(ctx, x, y, barWidth, Math.max(1, barHeight), [2, 2, 0, 0]);
      ctx.fill();

      if (showValues && d.value > 0 && barHeight > 15) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.value, x + barWidth / 2, y + 12);
      }
    }

    // X labels
    if (d.label) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, height - 8);
    }
  });
}

export function renderDonutChart(canvas, segments, options = {}) {
  const {
    size = 180,
    lineWidth = 28,
    centerText = ''
  } = options;

  const ctx = setupCanvas(canvas, size, size);
  const center = size / 2;
  const radius = (size - lineWidth) / 2;

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    // Empty state
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data', center, center);
    return;
  }

  let startAngle = -Math.PI / 2;

  segments.forEach((seg, i) => {
    const sliceAngle = (seg.value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = seg.color || COLORS.palette[i % COLORS.palette.length];
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';
    ctx.stroke();

    startAngle = endAngle;
  });

  // Center text
  if (centerText) {
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(centerText, center, center);
  }
}

export function renderLineChart(canvas, datasets, options = {}) {
  const {
    width = canvas.parentElement.clientWidth || 600,
    height = 200,
    paddingLeft = 40,
    paddingBottom = 30,
    paddingTop = 20,
    paddingRight = 20,
    labels = []
  } = options;

  const ctx = setupCanvas(canvas, width, height);
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value across all datasets
  let maxVal = 0;
  datasets.forEach(ds => {
    ds.data.forEach(v => { if (v > maxVal) maxVal = v; });
  });
  if (maxVal === 0) maxVal = 1;

  // Y axis grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';

  const ySteps = Math.min(5, maxVal);
  for (let i = 0; i <= ySteps; i++) {
    const y = paddingTop + chartHeight - (i / ySteps) * chartHeight;
    const val = Math.round((i / ySteps) * maxVal);

    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillText(val, paddingLeft - 8, y + 4);
  }

  // X labels
  const pointCount = labels.length || (datasets[0] ? datasets[0].data.length : 0);
  const xStep = pointCount > 1 ? chartWidth / (pointCount - 1) : chartWidth;

  if (labels.length > 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
      const x = paddingLeft + i * xStep;
      ctx.fillText(label, x, height - 8);
    });
  }

  // Draw lines
  datasets.forEach(ds => {
    const points = ds.data.map((v, i) => ({
      x: paddingLeft + i * xStep,
      y: paddingTop + chartHeight - (v / maxVal) * chartHeight
    }));

    // Area fill
    if (ds.fill) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, paddingTop + chartHeight);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, paddingTop + chartHeight);
      ctx.closePath();
      ctx.fillStyle = ds.fillColor || (ds.color + '20');
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = ds.color || COLORS.planned;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Points
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = ds.color || COLORS.planned;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });
  });
}

export { COLORS };
