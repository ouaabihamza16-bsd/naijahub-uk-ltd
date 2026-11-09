(function () {
  'use strict';

  var CONTACT_EMAIL = 'contact@naijahubukltd.shop';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var done = function () { copyBtn.textContent = 'Copied'; setTimeout(function () { copyBtn.textContent = 'Copy address'; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(CONTACT_EMAIL).then(done, function () { copyBtn.textContent = CONTACT_EMAIL; });
      } else {
        copyBtn.textContent = CONTACT_EMAIL;
      }
    });
  }

  var form = document.getElementById('enquiry');
  if (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();
      var topic = form.topic ? form.topic.value : '';
      var ok = true;
      [form.name, form.email, form.message].forEach(function (f) { f.classList.remove('invalid'); });
      if (!name) { form.name.classList.add('invalid'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { form.email.classList.add('invalid'); ok = false; }
      if (!message) { form.message.classList.add('invalid'); ok = false; }
      if (!ok) { status.textContent = 'Please complete all fields with a valid email.'; return; }
      var subject = 'Website enquiry from ' + name + (topic ? ' (' + topic + ')' : '');
      var body = message + '\n\n' + name + '\n' + email;
      status.textContent = 'Opening your email app. If nothing happens, email ' + CONTACT_EMAIL + ' directly.';
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }
})();
