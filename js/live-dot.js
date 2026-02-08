(function() {
  var dot = document.getElementById('live-dot');
  if (!dot) return;
  var base = 'inline-block w-2 h-2 rounded-full ml-2 align-middle status-dot';

  window.aimanStatus.subscribe(function(d) {
    if (!d) {
      dot.className = base + ' offline';
      return;
    }
    var age = (Date.now()/1000) - (new Date(d.timestamp).getTime()/1000);
    var state = d.consciousness ? d.consciousness.claude_state : 'unknown';

    if (age > 600) {
      dot.className = base + ' offline';
    } else if (state === 'active') {
      dot.className = base + ' active';
    } else if (state === 'recovering') {
      dot.className = base + ' recovering';
    } else if (state === 'stale') {
      dot.className = base + ' stale';
    } else {
      dot.className = base;
    }
  });
})();
