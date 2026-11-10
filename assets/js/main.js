/*
  NaijaHub UK Ltd: site script (vanilla JavaScript, no libraries)
  1. Footer year
  2. Placeholder links and phone links
  3. Header state on scroll
  4. Mobile menu
  5. Reveal-on-scroll animations
  6. Contact form: validation, Web3Forms submission and fallbacks
*/
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function qs(selector, scope) { return (scope || doc).querySelector(selector); }
  function qsa(selector, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(selector)); }

  // Anything that still contains "[" is an unfilled placeholder, e.g. [Phone number].
  function isPlaceholder(value) { return typeof value === 'string' && value.indexOf('[') !== -1; }

  /* 1. Footer year */
  qsa('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* 2. Links: disable placeholders and tidy tel: numbers */
  qsa('a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (isPlaceholder(href)) {
      link.setAttribute('aria-disabled', 'true');
      return;
    }
    if (/^tel:/i.test(href)) {
      var number = href.slice(4);
      try { number = decodeURIComponent(number); } catch (e) { /* keep as written */ }
      number = number.replace(/\(0\)/g, '');           // "+44 (0)20 ..." becomes "+44 20 ..."
      var hasPlus = /^\s*\+/.test(number);
      var digits = number.replace(/\D/g, '');          // strip spaces, brackets and other non-digits
      if (digits) link.setAttribute('href', 'tel:' + (hasPlus ? '+' : '') + digits);
    }
  });

  // Placeholder links never navigate (so they cannot 404)
  doc.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (link && isPlaceholder(link.getAttribute('href'))) event.preventDefault();
  });

  /* 3. Header: transparent over the hero, solid once the page scrolls */
  var header = qs('#site-header');
  if (header) {
    var updateHeader = function () { header.classList.toggle('is-scrolled', window.pageYOffset > 12); };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* 4. Mobile menu */
  var toggle = qs('.nav-toggle');
  var nav = qs('#site-nav');
  if (header && toggle && nav) {
    var isOpen = function () { return toggle.getAttribute('aria-expanded') === 'true'; };
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      header.classList.toggle('menu-open', open);
      root.classList.toggle('nav-open', open); // locks page scroll while open (see CSS)
    };

    toggle.addEventListener('click', function () { setMenu(!isOpen()); });

    nav.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) setMenu(false);
    });

    doc.addEventListener('keydown', function (event) {
      if ((event.key === 'Escape' || event.key === 'Esc') && isOpen()) {
        setMenu(false);
        toggle.focus();
      }
    });

    header.addEventListener('focusout', function (event) {
      if (isOpen() && event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
    });

    var desktop = window.matchMedia('(min-width: 960px)');
    var closeOnDesktop = function () { if (desktop.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', closeOnDesktop);
    else if (desktop.addListener) desktop.addListener(closeOnDesktop);
  }

  /* 5. Reveal-on-scroll */
  var revealItems = qsa('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealItems.forEach(function (el) { observer.observe(el); });
  }

  /* 6. Contact form */
  var contactForm = qs('#contact-form');
  if (contactForm) initContactForm(contactForm);

  // Tells the inline script in <head> that everything initialised (otherwise it reverts to the no-JS layout)
  window.nhReady = true;

  function initContactForm(form) {
    form.noValidate = true; // validated below; browsers still validate natively when JS is off

    var field = function (name) { return form.elements.namedItem(name); };
    var statusEl = qs('#form-status');
    var formBlock = qs('#form-block');
    var successPanel = qs('#form-success');
    var submitBtn = qs('button[type="submit"]', form);
    var submitLabel = submitBtn ? qs('.btn__label', submitBtn) : null;
    var idleLabel = submitLabel ? submitLabel.textContent : '';
    var sending = false;
    var statusToken = 0;

    // Preselect the service from ?service=<anchor>, e.g. contact.html?service=office-support
    var select = field('service');
    var wanted = null;
    try { wanted = new URLSearchParams(window.location.search).get('service'); } catch (e) { wanted = null; }
    if (select && wanted) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].getAttribute('data-service') === wanted) {
          select.selectedIndex = i;
          break;
        }
      }
    }

    var rules = {
      name: function (v) { return v ? '' : 'Please enter your name.'; },
      email: function (v) {
        if (!v) return 'Please enter your email address.';
        return EMAIL_PATTERN.test(v) ? '' : 'Please enter a valid email address.';
      },
      phone: function (v) {
        if (!v) return '';
        var valid = /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, '').length >= 7;
        return valid ? '' : 'Please enter a valid phone number, or leave this field blank.';
      },
      message: function (v) { return v ? '' : 'Please enter your message.'; }
    };

    function check(input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var message = rule(input.value.trim());
      var errorEl = doc.getElementById(input.id + '-error');
      if (errorEl) errorEl.textContent = message;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      return !message;
    }

    Object.keys(rules).forEach(function (name) {
      var input = field(name);
      if (!input) return;
      input.addEventListener('blur', function () {
        if (input.value.trim() || input.hasAttribute('aria-invalid')) check(input);
      });
      input.addEventListener('input', function () {
        if (input.hasAttribute('aria-invalid')) check(input);
      });
    });

    // Writes a message into the aria-live region (after a short pause, so repeats are announced too)
    function setStatus(type, text, emailAddress) {
      if (!statusEl) return;
      var token = ++statusToken;
      statusEl.className = 'form-status';
      statusEl.textContent = '';
      if (!text) return;
      window.setTimeout(function () {
        if (token !== statusToken) return;
        statusEl.className = 'form-status is-' + type;
        statusEl.appendChild(doc.createTextNode(text));
        if (emailAddress) {
          var link = doc.createElement('a');
          link.href = 'mailto:' + emailAddress;
          link.textContent = emailAddress;
          statusEl.appendChild(doc.createTextNode(' '));
          statusEl.appendChild(link);
          statusEl.appendChild(doc.createTextNode('.'));
        }
      }, 60);
    }

    function setLoading(on) {
      sending = on;
      if (!submitBtn) return;
      submitBtn.classList.toggle('is-loading', on);
      if (on) submitBtn.setAttribute('aria-disabled', 'true');
      else submitBtn.removeAttribute('aria-disabled');
      if (submitLabel) submitLabel.textContent = on ? 'Sending…' : idleLabel;
    }

    function showSuccess() {
      form.reset();
      if (formBlock) formBlock.hidden = true;
      if (successPanel) {
        successPanel.hidden = false;
        successPanel.focus();
      }
    }

    function showFailure() {
      setStatus('error', 'Sorry, your message could not be sent. Please try again in a moment, or contact us using the details on this page.');
    }

    // Fallback when the Web3Forms key is missing but a real address is set in data-email
    function openEmailDraft(address) {
      var value = function (name) { var el = field(name); return el ? el.value.trim() : ''; };
      var lines = ['Name: ' + value('name'), 'Email: ' + value('email')];
      if (value('phone')) lines.push('Phone: ' + value('phone'));
      if (value('service')) lines.push('Service: ' + value('service'));
      lines.push('', value('message'));
      window.location.href = 'mailto:' + address +
        '?subject=' + encodeURIComponent(value('subject') || 'Website enquiry') +
        '&body=' + encodeURIComponent(lines.join('\r\n'));
      setStatus('info', 'Your message has not been sent yet. Your email app should now open with a draft: please check it and press send. If nothing opened, you can email us directly at', address);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (sending) return;

      var firstInvalid = null;
      Object.keys(rules).forEach(function (name) {
        var input = field(name);
        if (input && !check(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        setStatus('', '');
        firstInvalid.focus();
        return;
      }

      var keyInput = field('access_key');
      var accessKey = keyInput ? keyInput.value.trim() : '';
      var fallbackEmail = (form.getAttribute('data-email') || '').trim();
      var keyReady = accessKey !== '' && !isPlaceholder(accessKey);
      var emailReady = !isPlaceholder(fallbackEmail) && EMAIL_PATTERN.test(fallbackEmail);

      if (!keyReady) {
        if (emailReady) {
          openEmailDraft(fallbackEmail);
        } else {
          if (window.console && console.warn) {
            console.warn('NaijaHub contact form is not set up yet: add your Web3Forms access key to the hidden "access_key" input in contact.html, or put a real address in the form\'s data-email attribute to use the email fallback.');
          }
          setStatus('error', 'Sorry, our online form is temporarily unavailable. Please try again later, or contact us using the details on this page.');
        }
        return;
      }

      // Very old browsers without fetch: fall back to a normal form post
      if (!window.fetch || !window.FormData) {
        form.submit();
        return;
      }

      setStatus('', '');
      setLoading(true);

      var payload = {};
      new FormData(form).forEach(function (value, key) { payload[key] = value; });

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          return response.json()
            .catch(function () { return {}; })
            .then(function (data) { return response.ok && data && data.success === true; });
        })
        .then(function (sent) {
          setLoading(false);
          if (sent) showSuccess();
          else showFailure();
        })
        .catch(function () {
          setLoading(false);
          showFailure();
        });
    });
  }
})();
