document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileNav();
  
  // Only run accordion logic if we are on the classes page
  if (document.querySelector('.accordion-item')) {
    initAccordions();
  }
  
  // Only run contact form logic if on contact page
  if (document.getElementById('contact-form')) {
    initContactForm();
  }
});

/* ========================
   THEME TOGGLE
   ======================== */
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  
  // Check localStorage or System Preference
  const currentTheme = localStorage.getItem("theme");
  
  if (currentTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    toggleBtn.textContent = "☀️ Light";
  } else if (currentTheme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    toggleBtn.textContent = "🌙 Dark";
  } else if (prefersDark.matches) {
    document.documentElement.setAttribute("data-theme", "dark");
    toggleBtn.textContent = "☀️ Light";
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
      toggleBtn.textContent = "🌙 Dark";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      toggleBtn.textContent = "☀️ Light";
    }
  });
}

/* ========================
   MOBILE NAV TOGGLE
   ======================== */
function initMobileNav() {
  const menuBtn = document.querySelector('.menu-toggle');
  const navUl = document.querySelector('nav ul');

  if(menuBtn) {
    menuBtn.addEventListener('click', () => {
      navUl.classList.toggle('active');
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true' || false;
      menuBtn.setAttribute('aria-expanded', !expanded);
    });
  }
}

/* ========================
   ACCORDIONS (CLASSES)
   ======================== */
function initAccordions() {
  const accordions = document.querySelectorAll('.accordion-header');

  // Load saved state from LocalStorage
  const savedState = JSON.parse(localStorage.getItem('accordionState')) || [];

  accordions.forEach(acc => {
    const panelId = acc.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);

    // Restore state
    if (savedState.includes(panelId)) {
      acc.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + "px";
    }

    acc.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      
      // Toggle current
      this.setAttribute('aria-expanded', !isExpanded);
      
      if (!isExpanded) {
        panel.style.maxHeight = panel.scrollHeight + "px";
        saveAccordionState(panelId, true);
      } else {
        panel.style.maxHeight = null;
        saveAccordionState(panelId, false);
      }
    });
  });
}

function saveAccordionState(id, isOpen) {
  let state = JSON.parse(localStorage.getItem('accordionState')) || [];
  if (isOpen) {
    if (!state.includes(id)) state.push(id);
  } else {
    state = state.filter(item => item !== id);
  }
  localStorage.setItem('accordionState', JSON.stringify(state));
}

/* ========================
   CONTACT FORM MOCKUP
   ======================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const msg = document.getElementById('message').value;

    if(email && msg) {
      // Create mailto link
      const mailtoLink = `mailto:174070@donga.ac.kr?subject=Portfolio Contact&body=${encodeURIComponent(msg)} (From: ${email})`;
      window.location.href = mailtoLink;
      alert("Thank you! Your default email client should open now.");
    } else {
      alert("Please fill out all fields.");
    }
  });
}