/**
 * Hobit Landing Page - Interactive Logic & Theme Management
 */

document.addEventListener('DOMContentLoaded', () => {
  const config = window.HOBIT_CONFIG || {
    APP_NAME: 'Hobit',
    APK_DOWNLOAD_URL: 'https://github.com/giridhar7632/hobit-x/releases/latest',
    GITHUB_REPO_URL: 'https://github.com/giridhar7632/hobit-x'
  };

  // 1. Bind APK Download buttons to configured URL
  const downloadButtons = document.querySelectorAll('.btn-apk-download');
  downloadButtons.forEach(btn => {
    btn.setAttribute('href', config.APK_DOWNLOAD_URL);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
  });

  const githubLink = document.getElementById('github-repo-link');
  if (githubLink && config.GITHUB_REPO_URL) {
    githubLink.setAttribute('href', config.GITHUB_REPO_URL);
  }

  // 2. Global Dark Mode Management
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const heroCenterImg = document.getElementById('hero-screen-center');
  const heroLeftImg = document.getElementById('hero-screen-left');
  const heroRightImg = document.getElementById('hero-screen-right');
  const showcaseImage = document.getElementById('showcase-screen-img');
  const showcaseCaption = document.getElementById('showcase-caption-text');
  const viewTabButtons = document.querySelectorAll('.view-tab-btn');

  let currentView = 'card'; // 'list', 'grid', 'card', 'detail'

  const showcaseData = {
    list: {
      light: './assets/screenshots/home-page-light.png',
      dark: './assets/screenshots/home-page-dark.png',
      caption: 'List View: Organized into Morning, Afternoon, Evening, and Anytime routines.'
    },
    grid: {
      light: './assets/screenshots/grid-view-light.png',
      dark: './assets/screenshots/grid-view-dark.png',
      caption: 'Grid View: Compact visual layout to see all your habits at a quick glance.'
    },
    card: {
      light: './assets/screenshots/card-view-light.png',
      dark: './assets/screenshots/card-view-dark.png',
      caption: 'Card View: Rich habit cards featuring live timers, streak counts, and details.'
    },
    detail: {
      light: './assets/screenshots/habit-detail-light.png',
      dark: './assets/screenshots/habit-detail-dark.png',
      caption: 'Habit Detail: Daily completion calendar, history, and streak progress.'
    }
  };

  function getPreferredTheme() {
    const saved = localStorage.getItem('hobit_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  let currentTheme = getPreferredTheme();

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hobit_theme', theme);

    // Update toggle icon
    if (themeToggleBtn) {
      if (theme === 'dark') {
        // Sun icon (click to go light)
        themeToggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
        themeToggleBtn.setAttribute('aria-label', 'Switch to light theme');
      } else {
        // Moon icon (click to go dark)
        themeToggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
        themeToggleBtn.setAttribute('aria-label', 'Switch to dark theme');
      }
    }

    // Switch hero screenshots to match theme
    if (heroCenterImg) {
      heroCenterImg.src = theme === 'dark' ? './assets/screenshots/card-view-dark.png' : './assets/screenshots/card-view-light.png';
    }
    if (heroLeftImg) {
      heroLeftImg.src = theme === 'dark' ? './assets/screenshots/home-page-dark.png' : './assets/screenshots/home-page-light.png';
    }
    if (heroRightImg) {
      heroRightImg.src = theme === 'dark' ? './assets/screenshots/grid-view-dark.png' : './assets/screenshots/grid-view-light.png';
    }

    updateShowcase();
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  }

  // Initial theme application
  applyTheme(currentTheme);

  // 3. Showcase Switcher
  function updateShowcase() {
    if (!showcaseImage) return;

    const data = showcaseData[currentView] || showcaseData.card;
    const targetSrc = data[currentTheme];
    const caption = data.caption;

    showcaseImage.style.opacity = '0.35';
    setTimeout(() => {
      showcaseImage.src = targetSrc;
      showcaseImage.style.opacity = '1';
    }, 100);

    if (showcaseCaption) {
      showcaseCaption.textContent = caption;
    }
  }

  viewTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (!view || view === currentView) return;

      viewTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = view;
      updateShowcase();
    });
  });

  // 4. Mobile Navigation Toggle
  const mobileToggle = document.getElementById('nav-mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !expanded);
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 5. Hero Floating Snippets Responsive Parallax (Low Damping, No Bobbing Loops)
  const heroStage = document.getElementById('hero-visual-stage');
  const snippets = document.querySelectorAll('.hero-snippet');

  if (heroStage && snippets.length > 0) {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isTracking = false;
    let rafId = null;

    const onMouseMove = (e) => {
      if (window.innerWidth <= 640) return; // Skip parallax on small mobile screens
      const rect = heroStage.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX = (e.clientX - centerX);
      mouseY = (e.clientY - centerY);

      if (!isTracking) {
        isTracking = true;
        animateSnippets();
      }
    };

    const onMouseLeave = () => {
      mouseX = 0;
      mouseY = 0;
      isTracking = false;
    };

    function animateSnippets() {
      // Low damping factor (0.22) provides immediate, crisp cursor tracking without sluggish delay or spring oscillation
      currentX += (mouseX - currentX) * 0.22;
      currentY += (mouseY - currentY) * 0.22;

      snippets.forEach(snippet => {
        const factor = parseFloat(snippet.getAttribute('data-parallax') || '0.03');
        const tx = (currentX * factor).toFixed(2);
        const ty = (currentY * factor).toFixed(2);
        snippet.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });

      // Keep running while tracking or until returning within sub-pixel distance of origin
      if (isTracking || Math.abs(currentX) > 0.05 || Math.abs(currentY) > 0.05) {
        rafId = requestAnimationFrame(animateSnippets);
      } else {
        snippets.forEach(snippet => {
          snippet.style.transform = 'translate3d(0, 0, 0)';
        });
        rafId = null;
      }
    }

    heroStage.addEventListener('mousemove', onMouseMove, { passive: true });
    heroStage.addEventListener('mouseleave', onMouseLeave, { passive: true });
  }
});

