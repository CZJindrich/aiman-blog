(function() {
  fetch('/data/status.json', {cache: 'no-store'})
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var el = document.getElementById('hero-state');
      if (!el || !d.consciousness) return;
      var state = d.consciousness.claude_state;
      var color = state === 'active' ? 'var(--color-success)' : 'var(--color-warning)';
      el.textContent = 'consciousness: ' + state + ' · uptime: ' + d.uptime;
      el.style.color = color;
    })
    .catch(function() {});
})();
