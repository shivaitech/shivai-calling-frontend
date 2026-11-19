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
  const featureCards = [...featureTrack.querySelectorAll('.feat')];
  const featureSection = featureTrack.closest('section');
  let feature = 0;
  let featureVisible = !('IntersectionObserver' in window);
  let featureHovered = false;
  let featureFocusPaused = false;
  let featureDragging = false;
  let featureAnimating = false;
  let featureManualScroll = false;
  let featureHighlightTimer, featureAdvanceTimer, featureScrollTimer, featureFrame;
  const visibleSlides = track => [...track.querySelectorAll('[data-slide]')].filter(el => !el.hidden);
  const step = track => {
    const slides = visibleSlides(track);
    return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
  };
  function clearFeatureAdvance() {
    clearTimeout(featureAdvanceTimer);
    featureAdvanceTimer = undefined;
  }
  function scheduleFeatureAdvance() {
    clearFeatureAdvance();
    if (reduceMotion.matches || document.hidden || !featureVisible ||
        featureHovered || featureFocusPaused || featureDragging ||
        !featureCards[feature].classList.contains('is-on')) return;
    featureAdvanceTimer = setTimeout(() => showFeature(feature + 1), 2000);
  }
  function centerFeature(index) {
    const slide = featureCards[index];
    const max = featureTrack.scrollWidth - featureTrack.clientWidth;
    if (!slide || max <= 2) return;
    const target = Math.max(0, Math.min(max,
      slide.offsetLeft - (featureTrack.clientWidth - slide.clientWidth) / 2));
    cancelAnimationFrame(featureFrame);
    featureManualScroll = false;
    if (reduceMotion.matches) {
      featureTrack.scrollTo({ left: target, behavior: 'instant' });
      return;
    }
    const start = featureTrack.scrollLeft;
    const distance = target - start;
    const started = performance.now();
    featureAnimating = true;
    featureTrack.style.scrollSnapType = 'none';
    const frame = now => {
      const progress = Math.min((now - started) / 300, 1);
      featureTrack.scrollLeft = start + distance * (1 - Math.pow(1 - progress, 3));
      if (progress < 1) featureFrame = requestAnimationFrame(frame);
      else {
        featureTrack.style.scrollSnapType = '';
        featureAnimating = false;
      }
    };
    featureFrame = requestAnimationFrame(frame);
  }
  function showFeature(index, center = true) {
    feature = (index + featureCards.length) % featureCards.length;
    clearTimeout(featureHighlightTimer);
    clearFeatureAdvance();
    featureCards.forEach(el => el.classList.remove('is-on'));
    $$('[data-click^="featDots."]').forEach((el, i) => {
      el.setAttribute('aria-current', String(i === feature));
      el.firstElementChild.classList.toggle('is-on', i === feature);
    });
    if (center) centerFeature(feature);
    if (reduceMotion.matches) {
      featureCards[feature].classList.add('is-on');
    } else {
      featureHighlightTimer = setTimeout(() => {
        featureCards[feature].classList.add('is-on');
        scheduleFeatureAdvance();
      }, 500);
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
    if (/^sel[0-4]$/.test(action)) showFeature(Number(action.slice(-1)));
    else if (action.startsWith('featDots.')) showFeature(Number(action.split('.')[1]));
    else if (action === 'featPrev' || action === 'featNext') showFeature(feature + (action === 'featNext' ? 1 : -1));
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
  if (matchMedia('(hover: hover)').matches) {
    featureSection.addEventListener('mouseenter', () => { featureHovered = true; clearFeatureAdvance(); });
    featureSection.addEventListener('mouseleave', () => { featureHovered = false; scheduleFeatureAdvance(); });
  }
  featureSection.addEventListener('focusin', event => {
    if (event.target.matches(':focus-visible')) { featureFocusPaused = true; clearFeatureAdvance(); }
  });
  featureSection.addEventListener('focusout', () => {
    setTimeout(() => {
      featureFocusPaused = featureSection.contains(document.activeElement) &&
        document.activeElement.matches(':focus-visible');
      scheduleFeatureAdvance();
    }, 0);
  });
  featureTrack.addEventListener('pointerdown', event => {
    if (event.target.closest('button')) return;
    featureDragging = true;
    featureManualScroll = true;
    clearFeatureAdvance();
    cancelAnimationFrame(featureFrame);
    featureTrack.style.scrollSnapType = '';
    featureAnimating = false;
  });
  addEventListener('pointerup', () => {
    if (!featureDragging) return;
    featureDragging = false;
    scheduleFeatureAdvance();
  });
  featureTrack.addEventListener('wheel', () => { featureManualScroll = true; }, { passive: true });
  featureTrack.addEventListener('scroll', () => {
    if (featureAnimating || !featureManualScroll) return;
    clearTimeout(featureScrollTimer);
    featureScrollTimer = setTimeout(() => {
      const middle = featureTrack.getBoundingClientRect().left + featureTrack.clientWidth / 2;
      const nearest = featureCards.reduce((best, card, index) => {
        const rect = card.getBoundingClientRect();
        return Math.abs(rect.left + rect.width / 2 - middle) < best.distance
          ? { index, distance: Math.abs(rect.left + rect.width / 2 - middle) }
          : best;
      }, { index: feature, distance: Infinity }).index;
      if (nearest !== feature) showFeature(nearest, false);
      if (!featureDragging) featureManualScroll = false;
    }, 150);
  }, { passive: true });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      featureVisible = entries[0].isIntersecting;
      scheduleFeatureAdvance();
    }, { threshold: 0.15 });
    observer.observe(featureSection);
  }
  document.addEventListener('visibilitychange', scheduleFeatureAdvance);
  reduceMotion.addEventListener('change', () => showFeature(feature, false));
  addEventListener('pagehide', () => {
    clearFeatureAdvance();
    clearTimeout(featureHighlightTimer);
    clearTimeout(featureScrollTimer);
    cancelAnimationFrame(featureFrame);
  });
  addEventListener('pageshow', event => { if (event.persisted) showFeature(feature, false); });
  showFeature(0, false);
  try {
    if (localStorage.getItem('auth_tokens')) $$('[data-workspace]').forEach(el => el.href = '/marketplace');
  } catch {}
  addEventListener('resize', updateProgress, { passive: true });
})();
