(function() {
  var bar = document.getElementById('reading-progress');
  if (!bar) return;
  window.addEventListener('scroll', function() {
    var h = document.documentElement;
    var scroll = h.scrollTop || document.body.scrollTop;
    var total = h.scrollHeight - h.clientHeight;
    bar.style.width = total > 0 ? (scroll / total * 100) + '%' : '0%';
  });
})();
