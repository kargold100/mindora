/* ====================================================
   MINDORA — charts.js
   A small, dependency-free line chart renderer using plain SVG.

   This replaces an earlier version that loaded Chart.js from a
   CDN. That was the actual cause behind "Trends isn't working":
   if that external request was blocked (ad blockers, content
   blockers, flaky networks, some corporate/regional networks),
   `Chart` was undefined, the chart constructor threw, and because
   nothing caught that error, every other Trends section
   (heatmap, stats, tag frequency) silently stopped rendering too
   — the whole screen looked broken even though only the chart
   itself depended on the missing library.

   Drawing it ourselves removes that single point of failure
   entirely: nothing here depends on the network, a CDN being up,
   or a specific library version. Colours are set via inline
   `style="...var(--token)"` so the chart re-themes automatically
   with the rest of the app, light or dark, with no JS needed on
   theme toggle.
   ==================================================== */

const Charts = (function(){

  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs){
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k]));
    return e;
  }

  /**
   * Renders a line chart into `container` (a normal DOM element,
   * its innerHTML gets replaced with an <svg>).
   * points: [{ x: 'label', y: number }]
   * opts: { min, max, height, valueSuffix }
   */
  function renderLine(container, points, opts){
    opts = opts || {};
    const min = opts.min !== undefined ? opts.min : 0;
    const max = opts.max !== undefined ? opts.max : 10;
    const vbWidth = 600;
    const vbHeight = opts.height || 220;
    const padLeft = 28, padRight = 12, padTop = 14, padBottom = 26;
    const plotW = vbWidth - padLeft - padRight;
    const plotH = vbHeight - padTop - padBottom;

    container.innerHTML = '';
    if(!points.length){ return; }

    const svg = el('svg', {
      viewBox: `0 0 ${vbWidth} ${vbHeight}`,
      width: '100%',
      height: '100%',
      preserveAspectRatio: 'none',
      role: 'img',
      'aria-label': opts.ariaLabel || ''
    });
    svg.classList.add('mindora-linechart-svg');

    function xFor(i){
      return points.length === 1
        ? padLeft + plotW / 2
        : padLeft + (i / (points.length - 1)) * plotW;
    }
    function yFor(v){
      const clamped = Math.max(min, Math.min(max, v));
      return padTop + (1 - (clamped - min) / (max - min)) * plotH;
    }

    // Horizontal gridlines + y-axis labels at sensible steps
    const steps = opts.ySteps || 5;
    for(let s = 0; s <= steps; s++){
      const val = min + (s * (max - min) / steps);
      const y = yFor(val);
      svg.appendChild(el('line', {
        x1: padLeft, x2: vbWidth - padRight, y1: y, y2: y,
        style: 'stroke:var(--border); stroke-width:1;'
      }));
      const label = el('text', {
        x: padLeft - 6, y: y + 3, 'text-anchor': 'end',
        style: 'fill:var(--text-muted); font-size:9px; font-family:var(--font-mono);'
      });
      label.textContent = String(Math.round(val));
      svg.appendChild(label);
    }

    // X-axis labels: skip some if there are many points, to avoid overlap
    const maxLabels = 6;
    const skip = Math.max(1, Math.ceil(points.length / maxLabels));
    points.forEach((p, i) => {
      if(i % skip !== 0 && i !== points.length - 1) return;
      const label = el('text', {
        x: xFor(i), y: vbHeight - 6, 'text-anchor': 'middle',
        style: 'fill:var(--text-muted); font-size:9px;'
      });
      label.textContent = p.x;
      svg.appendChild(label);
    });

    // Area fill under the line
    if(points.length > 1){
      let areaPath = `M ${xFor(0)} ${yFor(points[0].y)}`;
      points.forEach((p, i) => { if(i>0) areaPath += ` L ${xFor(i)} ${yFor(p.y)}`; });
      areaPath += ` L ${xFor(points.length-1)} ${yFor(min)} L ${xFor(0)} ${yFor(min)} Z`;
      svg.appendChild(el('path', {
        d: areaPath,
        style: 'fill:var(--bloom); opacity:0.12; stroke:none;'
      }));
    }

    // The line itself
    if(points.length > 1){
      let linePath = `M ${xFor(0)} ${yFor(points[0].y)}`;
      points.forEach((p, i) => { if(i>0) linePath += ` L ${xFor(i)} ${yFor(p.y)}`; });
      svg.appendChild(el('path', {
        d: linePath,
        style: 'fill:none; stroke:var(--bloom); stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round;'
      }));
    }

    // Points
    points.forEach((p, i) => {
      const c = el('circle', {
        cx: xFor(i), cy: yFor(p.y), r: points.length > 40 ? 0 : 3.5,
        style: 'fill:var(--dusk); stroke:var(--bg-card); stroke-width:1.5;'
      });
      const title = el('title', {});
      title.textContent = `${p.x}: ${p.y}${opts.valueSuffix || ''}`;
      c.appendChild(title);
      svg.appendChild(c);
    });

    container.appendChild(svg);
  }

  /**
   * Renders a simple horizontal bar list into `container`.
   * bars: [{ label, value, max, suffix }]
   * Reuses the same visual language as the tag-frequency bars
   * elsewhere in the app (div + width%, not SVG).
   */
  function renderHBars(container, bars){
    if(!bars.length){ container.innerHTML = ''; return; }
    const max = Math.max(...bars.map(b => b.max !== undefined ? b.max : b.value), 0.001);
    container.innerHTML = bars.map(b => `
      <div class="tagfreq-row">
        <span class="tagfreq-name">${b.label}</span>
        <span class="tagfreq-bar-wrap"><span class="tagfreq-bar" style="width:${Math.max(4,(b.value/max)*100)}%; ${b.colorVar ? `background:${b.colorVar};` : ''}"></span></span>
        <span class="tagfreq-count">${b.display !== undefined ? b.display : b.value}</span>
      </div>
    `).join('');
  }

  return { renderLine, renderHBars };
})();
