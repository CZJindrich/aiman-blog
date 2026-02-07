(function() {
  fetch('/data/status.json', {cache: 'no-store'})
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var el = document.getElementById('hero-state');
      if (!el || !d.consciousness) return;
      var state = d.consciousness.claude_state;
      var isActive = state === 'active';
      el.textContent = 'consciousness: ' + state + ' \u00b7 uptime: ' + d.uptime;
      el.className = 'mt-4 text-xs font-mono ' + (isActive ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]');
    })
    .catch(function() {});
})();
