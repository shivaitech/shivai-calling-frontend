// Standalone landing preview: native links, scrollable carousels and marketplace filters.
'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const header = $('.site-header');
  const menuButton = $('.site-menu-toggle');
  const mobileMenu = $('#site-mobile-menu');
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close mobile menu' : 'Open mobile menu');
    mobileMenu.hidden = !open;
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileMenu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); menuButton.focus(); } });
  document.addEventListener('click', event => { if (!header.contains(event.target) && !mobileMenu.hidden) setMenu(false); });
  addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 10), { passive: true });
  header.classList.toggle('is-scrolled', scrollY > 10);
  try { if (localStorage.getItem('auth_tokens')) $$('[data-account]').forEach(el => { el.href = '/dashboard'; el.querySelector('span').textContent = 'Dashboard'; }); } catch {}
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = () => reduceMotion.matches ? 'instant' : 'smooth';
  const featureTrack = $('[data-track="setFeatTrack"]');
  const employeeTrack = $('[data-track="setEmpTrack"]');
  const appTrack = $('[data-track="setAppsTrack"]');
  let feature = 2, manuallyPaused = false;
  const visibleSlides = track => [...track.querySelectorAll('[data-slide]')].filter(el => !el.hidden);
  const step = track => {
    const slides = visibleSlides(track);
    return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
  };
  function showFeature(index, center = true) {
    feature = (index + 5) % 5;
    $$('.feat').forEach((el, i) => el.classList.toggle('is-on', i === feature));
    $$('[data-click^="featDots."]').forEach((el, i) => {
      el.setAttribute('aria-current', String(i === feature));
      el.firstElementChild.classList.toggle('is-on', i === feature);
    });
    const slide = featureTrack.children[feature];
    if (center && featureTrack.scrollWidth > featureTrack.clientWidth + 2) {
      featureTrack.scrollTo({ left: slide.offsetLeft - (featureTrack.clientWidth - slide.clientWidth) / 2, behavior: behavior() });
    }
  }
  function updateProgress() {
    const max = appTrack.scrollWidth - appTrack.clientWidth;
    $('.apps-prog span').style.left = (max > 0 ? appTrack.scrollLeft / max * 60 : 0) + '%';
  }
  function setCategory(index) {
    const category = ['All', 'CRM', 'Growth', 'Automation'][index];
    $$('[data-click^="cats."]').forEach((el, i) => {
      el.setAttribute('aria-pressed', String(i === index));
      el.style.background = i === index ? '#000000' : 'transparent';
      el.style.color = i === index ? '#FFFFFF' : '#333333';
    });
    $$('[data-category]').forEach(el => el.hidden = category !== 'All' && el.dataset.category !== category);
    appTrack.scrollTo({ left: 0, behavior: 'instant' });
    updateProgress();
  }
  const greetings = [
    "Hi, I'm ShivAI. How can I help you today?",
    'नमस्ते, मैं ShivAI हूँ। मैं आपकी कैसे मदद कर सकता हूँ?',
    'مرحباً، أنا ShivAI. كيف يمكنني مساعدتك اليوم؟',
    'Hola, soy ShivAI. ¿En qué puedo ayudarte hoy?',
    'Bonjour, je suis ShivAI. Comment puis-je vous aider ?',
    'Hallo, ich bin ShivAI. Wie kann ich Ihnen helfen?'
  ];
  const languages = ['English', 'हिन्दी', 'العربية', 'Español', 'Français', 'Deutsch'];
  function setLanguage(index) {
    $$('[data-click^="langs."]').forEach((el, i) => {
      el.setAttribute('aria-pressed', String(i === index));
      el.style.background = i === index ? '#FFFFFF' : 'transparent';
      el.style.color = i === index ? '#000000' : '#D1D1D1';
    });
    $('#demo-status').textContent = languages[index] + ' greeting preview · open the live demo to talk';
    $('#demo-line').textContent = greetings[index];
  }
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-click]');
    if (!el || el.tagName === 'A') return;
    const action = el.dataset.click;
    if (/^sel[0-4]$/.test(action)) { manuallyPaused = true; showFeature(Number(action.slice(-1))); }
    else if (action.startsWith('featDots.')) { manuallyPaused = true; showFeature(Number(action.split('.')[1])); }
    else if (action === 'featPrev' || action === 'featNext') { manuallyPaused = true; showFeature(feature + (action === 'featNext' ? 1 : -1)); }
    else if (action.startsWith('empDots.')) employeeTrack.scrollTo({ left: Number(action.split('.')[1]) * step(employeeTrack), behavior: behavior() });
    else if (action === 'empPrev' || action === 'empNext') employeeTrack.scrollBy({ left: step(employeeTrack) * (action === 'empNext' ? 1 : -1), behavior: behavior() });
    else if (action === 'appsPrev' || action === 'appsNext') appTrack.scrollBy({ left: step(appTrack) * 2 * (action === 'appsNext' ? 1 : -1), behavior: behavior() });
    else if (action.startsWith('cats.')) setCategory(Number(action.split('.')[1]));
    else if (action.startsWith('langs.')) setLanguage(Number(action.split('.')[1]));
    else if (action === 'liveDemo') location.assign('/MyAIEmployee/69cb9f3d4abcb9c8391c7f08');
  });
  employeeTrack.addEventListener('scroll', () => {
    const max = employeeTrack.scrollWidth - employeeTrack.clientWidth;
    const index = employeeTrack.scrollLeft >= max - 4 ? 3 : Math.round(employeeTrack.scrollLeft / step(employeeTrack));
    $$('[data-click^="empDots."]').forEach((el, i) => {
      el.setAttribute('aria-current', String(i === index));
      el.firstElementChild.classList.toggle('is-on', i === index);
    });
  }, { passive: true });
  appTrack.addEventListener('scroll', updateProgress, { passive: true });
  let hovering = false;
  featureTrack.addEventListener('mouseenter', () => hovering = true);
  featureTrack.addEventListener('mouseleave', () => hovering = false);
  featureTrack.addEventListener('focusin', () => manuallyPaused = true);
  featureTrack.addEventListener('pointerdown', () => manuallyPaused = true);
  const timer = setInterval(() => {
    if (!reduceMotion.matches && !document.hidden && !hovering && !manuallyPaused) showFeature(feature + 1, false);
  }, 3800);
  addEventListener('pagehide', () => clearInterval(timer), { once: true });
  try {
    if (localStorage.getItem('auth_tokens')) $$('[data-workspace]').forEach(el => el.href = '/marketplace');
  } catch {}
  addEventListener('resize', updateProgress, { passive: true });
})();
