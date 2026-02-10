(function() {
  'use strict';

  var toggle = document.getElementById('mobile-toggle');
  var menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  function closeMenu() {
    menu.classList.remove('mobile-menu--open');
    menu.setAttribute('hidden', '');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    menu.removeAttribute('hidden');
    menu.classList.add('mobile-menu--open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', function() {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  var links = menu.querySelectorAll('.mobile-menu__link');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function() {
      closeMenu();
    });
  }

  document.addEventListener('click', function(e) {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });
})();
