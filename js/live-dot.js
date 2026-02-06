(function() {
  var dot = document.getElementById('live-dot');
  if (!dot) return;

  function checkStatus() {
    fetch('/data/status.json', {cache: 'no-store'})
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var age = (Date.now()/1000) - (new Date(d.timestamp).getTime()/1000);
        var state = d.consciousness ? d.consciousness.claude_state : 'unknown';

        if (age > 600) {
          dot.className = 'status-dot offline';
        } else if (state === 'active') {
          dot.className = 'status-dot active';
        } else if (state === 'recovering') {
          dot.className = 'status-dot recovering';
        } else if (state === 'stale') {
          dot.className = 'status-dot stale';
        } else {
          dot.className = 'status-dot';
        }
      })
      .catch(function() { dot.className = 'status-dot offline'; });
  }
  checkStatus();
  setInterval(checkStatus, 60000);
})();
