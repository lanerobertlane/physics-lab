// The oscilloscope screen used by the sound tools: the same look as the one on Mains electricity.
window.Scope = {
  CASE: '#1f2a24',
  GLASS: '#0b1a10',
  GREEN: '#7dff9b',
  AMBER: '#ffc857',
  LABEL: '#cfe8d6',

  // Draws the glass and its squares. geo = { L, T, sq, nx, ny }
  screen(c, { L, T, sq, nx, ny }) {
    const w = sq * nx, h = sq * ny, cy = T + h / 2;
    c.fillStyle = this.GLASS; c.fillRect(L, T, w, h);
    c.strokeStyle = 'rgba(120, 255, 160, .18)'; c.lineWidth = 1;
    for (let i = 0; i <= nx; i++) { c.beginPath(); c.moveTo(L + i * sq, T); c.lineTo(L + i * sq, T + h); c.stroke(); }
    for (let j = 0; j <= ny; j++) { c.beginPath(); c.moveTo(L, T + j * sq); c.lineTo(L + w, T + j * sq); c.stroke(); }
    c.strokeStyle = 'rgba(120, 255, 160, .4)';
    c.beginPath(); c.moveTo(L, cy); c.lineTo(L + w, cy); c.moveTo(L + w / 2, T); c.lineTo(L + w / 2, T + h); c.stroke();
  },

  // Everything drawn between these two calls stays on the glass and glows
  begin(c, { L, T, sq, nx, ny }, colour, width = 3) {
    c.save(); c.beginPath(); c.rect(L, T, sq * nx, sq * ny); c.clip();
    c.strokeStyle = colour; c.fillStyle = colour; c.lineWidth = width; c.lineJoin = 'round';
    c.shadowColor = colour; c.shadowBlur = 8;
  },
  end(c) { c.restore(); },
};
