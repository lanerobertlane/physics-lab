// Circuit symbols (UK / IEC), shared by the circuit builder and the quiz pictures, so a
// symbol looks the same everywhere on the site. Load before circuits.js or quiz-images.js.
(() => {
// ---------- Symbol drawing (UK / IEC symbols), horizontal from (0,0) to (L,0) ----------

function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function leads(ctx, L, a, b) { line(ctx, 0, 0, a, 0); line(ctx, b, 0, L, 0); }
function arrowHead(ctx, x1, y1, x2, y2, size = 6) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(ang - 0.45), y2 - size * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - size * Math.cos(ang + 0.45), y2 - size * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
}
function arrow(ctx, x1, y1, x2, y2, size) { line(ctx, x1, y1, x2, y2); arrowHead(ctx, x1, y1, x2, y2, size); }

function drawSymbol(ctx, type, L, c, col, w, extra = {}) {
  const m = L / 2;
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (type) {
    case 'wire':
      line(ctx, 0, 0, L, 0);
      break;
    case 'cell': {
      leads(ctx, L, m - 5, m + 5);
      ctx.lineWidth = w * 2.4; line(ctx, m - 5, -9, m - 5, 9);
      ctx.lineWidth = w; line(ctx, m + 5, -18, m + 5, 18);
      break;
    }
    case 'battery': {
      leads(ctx, L, m - 17, m + 17);
      ctx.lineWidth = w * 2.4; line(ctx, m - 17, -9, m - 17, 9); line(ctx, m + 9, -9, m + 9, 9);
      ctx.lineWidth = w; line(ctx, m - 9, -18, m - 9, 18); line(ctx, m + 17, -18, m + 17, 18);
      ctx.setLineDash([3, 3]); line(ctx, m - 9, 0, m + 9, 0); ctx.setLineDash([]);
      break;
    }
    case 'lamp': {
      leads(ctx, L, m - 15, m + 15);
      const b = extra.glow || 0;
      if (b > 0.01) {
        const g = ctx.createRadialGradient(m, 0, 4, m, 0, 34);
        g.addColorStop(0, `rgba(255, 210, 60, ${0.9 * b})`);
        g.addColorStop(1, 'rgba(255, 210, 60, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(m, 0, 34, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col;
      }
      ctx.beginPath(); ctx.arc(m, 0, 15, 0, Math.PI * 2); ctx.stroke();
      const d = 15 * Math.SQRT1_2;
      line(ctx, m - d, -d, m + d, d); line(ctx, m - d, d, m + d, -d);
      break;
    }
    case 'resistor':
      leads(ctx, L, m - 20, m + 20);
      ctx.strokeRect(m - 20, -8, 40, 16);
      break;
    case 'varres':
      leads(ctx, L, m - 20, m + 20);
      ctx.strokeRect(m - 20, -8, 40, 16);
      arrow(ctx, m - 18, 15, m + 18, -16, 7);
      break;
    case 'ldr':
      leads(ctx, L, m - 15, m + 15);
      ctx.strokeRect(m - 15, -7, 30, 14);
      ctx.beginPath(); ctx.arc(m, 0, 23, 0, Math.PI * 2); ctx.stroke();
      arrow(ctx, m - 30, -36, m - 17, -23, 6);
      arrow(ctx, m - 18, -42, m - 5, -29, 6);
      break;
    case 'thermistor':
      leads(ctx, L, m - 20, m + 20);
      ctx.strokeRect(m - 20, -8, 40, 16);
      line(ctx, m - 26, 15, m - 15, 15);
      line(ctx, m - 15, 15, m + 17, -16);
      break;
    case 'diode':
    case 'led': {
      leads(ctx, L, m - 10, m + 10);
      line(ctx, m - 10, 0, m + 10, 0);
      ctx.beginPath(); ctx.moveTo(m - 10, -11); ctx.lineTo(m - 10, 11); ctx.lineTo(m + 10, 0); ctx.closePath(); ctx.fill();
      line(ctx, m + 10, -12, m + 10, 12);
      if (type === 'led') {
        if (extra.glow) {
          const g = ctx.createRadialGradient(m, 0, 2, m, 0, 30);
          g.addColorStop(0, 'rgba(255, 60, 60, .8)');
          g.addColorStop(1, 'rgba(255, 60, 60, 0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(m, 0, 30, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = col;
        }
        arrow(ctx, m + 2, -14, m + 12, -26, 5);
        arrow(ctx, m + 10, -12, m + 20, -24, 5);
      }
      break;
    }
    case 'switch': {
      leads(ctx, L, m - 16, m + 16);
      ctx.beginPath(); ctx.arc(m - 16, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(m + 16, 0, 3, 0, Math.PI * 2); ctx.fill();
      if (c && c.open) line(ctx, m - 16, 0, m + 13, -17);
      else line(ctx, m - 16, 0, m + 16, 0);
      break;
    }
    case 'fuse':
      leads(ctx, L, m - 18, m + 18);
      ctx.strokeRect(m - 18, -7, 36, 14);
      if (c && c.blown) { line(ctx, m - 18, 0, m - 5, 0); line(ctx, m + 5, 0, m + 18, 0); line(ctx, m - 5, 0, m - 1, -5); line(ctx, m + 5, 0, m + 1, 5); }
      else line(ctx, m - 18, 0, m + 18, 0);
      break;
    case 'ammeter':
    case 'voltmeter':
      leads(ctx, L, m - 15, m + 15);
      ctx.beginPath(); ctx.arc(m, 0, 15, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'select': {
      ctx.beginPath(); ctx.moveTo(m - 6, -14); ctx.lineTo(m - 6, 10); ctx.lineTo(m, 4); ctx.lineTo(m + 9, 8); ctx.closePath(); ctx.fill();
      break;
    }
    case 'erase': {
      ctx.save(); ctx.translate(m, 0); ctx.rotate(-0.6);
      ctx.strokeRect(-14, -7, 28, 14); line(ctx, -2, -7, -2, 7);
      ctx.restore();
      break;
    }
  }
}


  // ---------- Pictures for quiz questions, drawn with the same symbols ----------
  // A canvas sized for the screen, with the drawing in CSS pixels and colours from the theme.
  function canvas(w, h, label, paint) {
    const cv = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = `${w}px`; cv.style.maxWidth = '100%'; cv.style.height = 'auto';
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', label);
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const col = (css.getPropertyValue('--text') || '#222').trim() || '#222';
    paint(g, col);
    return cv;
  }
  // Draw a symbol from (x1,y1) to (x2,y2), the way the circuit builder does
  function place(g, type, x1, y1, x2, y2, col, w = 2.5, c = {}) {
    g.save();
    g.translate(x1, y1);
    g.rotate(Math.atan2(y2 - y1, x2 - x1));
    drawSymbol(g, type, Math.hypot(x2 - x1, y2 - y1), c, col, w);
    g.restore();
  }
  function text(g, s, x, y, col, size = 12, weight = 700) {
    g.fillStyle = col; g.font = `${weight} ${size}px system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y);
  }
  // One component on its own
  function component(type, label, letter) {
    return () => canvas(200, 70, label, (g, col) => {
      place(g, type, 10, 35, 190, 35, col, 3, { open: true });
      if (letter) text(g, letter, 100, 36, col, 15);
    });
  }

  window.CircuitSymbols = { drawSymbol, line, leads, arrow, arrowHead, canvas, place, text, component };
})();
