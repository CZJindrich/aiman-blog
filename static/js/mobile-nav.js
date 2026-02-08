(function() {
  var toggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', function() {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    menu.classList.toggle('nav-menu-open');
  });

  // Close menu when a nav link is clicked
  var links = menu.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function() {
      if (window.innerWidth < 768) {
        menu.classList.remove('nav-menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Close menu on click outside
  document.addEventListener('click', function(e) {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('nav-menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
