/* Galaxy Genie: optional zero-dependency atmosphere layer.
 * Entirely original browser animation inspired by open-source SVG/CSS motion.
 * Does not alter auth, curriculum, planet mastery or interaction.
 */
(function (root) {
  'use strict';
  const SELECTOR = '#genie-guide';
  const MAX_PARTICLES = 24;
  let current = null;
  function finiteInt(value, fallback) {
    return Number.isFinite(value) ? Math.max(0, Math.min(MAX_PARTICLES, Math.floor(value))) : fallback;
  }
  // Seeded placement keeps synthetic screenshots repeatable and avoids excess motion.
  function locations(count) {
    const positions = [];
    let seed = 0x9E3779B9;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 28 + random() * 22;
      positions.push({
        x: 50 + Math.cos(angle) * radius,
        y: 48 + Math.sin(angle) * radius * .68,
        delay: (random() * -5).toFixed(2),
        duration: (3.5 + random() * 3).toFixed(2),
        size: (2 + random() * 3.5).toFixed(1)
      });
    }
    return positions;
  }
  function mount(options = {}) {
    const host = options.host || root.document?.querySelector?.(SELECTOR);
    if (!host || !host.appendChild || !root.document?.createElement) return false;
    if (current && current.host === host && current.layer.isConnected) return true;
    unmount();
    const count = finiteInt(options.count, 18);
    const layer = root.document.createElement('div');
    layer.className = 'genie-cosmic-polish';
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('data-effect', 'galaxy-mist');
    for (const pos of locations(count)) {
      const particle = root.document.createElement('span');
      particle.className = 'genie-cosmic-particle';
      // Values are generated locally and bounded; no HTML/URL injection.
      particle.style.setProperty('--gx', pos.x + '%');
      particle.style.setProperty('--gy', pos.y + '%');
      particle.style.setProperty('--gdelay', pos.delay + 's');
      particle.style.setProperty('--gduration', pos.duration + 's');
      particle.style.setProperty('--gsize', pos.size + 'px');
      layer.appendChild(particle);
    }
    host.appendChild(layer);
    current = {host, layer};
    return true;
  }
  function unmount() {
    if (current?.layer) current.layer.remove();
    current = null;
  }
  root.GalaxyGenieCosmicPolish = {mount, unmount, locations};
})(typeof window === 'object' ? window : this);
