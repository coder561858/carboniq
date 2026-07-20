// Theme initialization (shared logic)
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.setAttribute('data-theme', 'dark');
}
const themeToggle = document.getElementById('theme-toggle');
// The click listener is intentionally omitted here to prevent conflicts with app.js 
// which handles the SVG icon swapping and theme toggling across the site.

// Authentication Logic
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const authContainer = document.getElementById('auth-container');

// Detect mobile
function isMobile() {
  return window.innerWidth <= 768;
}

// Unified mode switcher — works on both desktop and mobile
function switchMode(toSignUp) {
  if (toSignUp) {
    authContainer.classList.add('right-panel-active');
  } else {
    authContainer.classList.remove('right-panel-active');
  }
  updateMobileTabs(toSignUp);
}

// Show/hide mobile tabs and set active state
function updateMobileTabs(isSignUp) {
  const allTabSets = document.querySelectorAll('.mobile-auth-tabs');
  allTabSets.forEach(tabs => {
    tabs.style.display = isMobile() ? 'flex' : 'none';
  });

  // Update tab active states
  ['tab-signin',  'tab-signin2' ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', !isSignUp);
  });
  ['tab-signup', 'tab-signup2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', isSignUp);
  });
}

// Overlay ghost buttons (desktop)
if (signUpButton) signUpButton.addEventListener('click', () => switchMode(true));
if (signInButton) signInButton.addEventListener('click', () => switchMode(false));

// Mobile tab buttons
document.querySelectorAll('#tab-signup, #tab-signup2').forEach(btn => {
  btn.addEventListener('click', () => switchMode(true));
});
document.querySelectorAll('#tab-signin, #tab-signin2').forEach(btn => {
  btn.addEventListener('click', () => switchMode(false));
});

// Init tabs visibility on load and resize
function initMobileTabs() {
  const isSignUp = authContainer.classList.contains('right-panel-active');
  updateMobileTabs(isSignUp);
}

window.addEventListener('resize', initMobileTabs);
document.addEventListener('DOMContentLoaded', initMobileTabs);
// Also run immediately in case DOMContentLoaded already fired
initMobileTabs();


// Handle Form Submissions
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');

async function handleAuth(endpoint, body, errorElement) {
  errorElement.style.display = 'none';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    
    // Save token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      id: data._id,
      username: data.username,
      email: data.email
    }));
    
    window.location.href = 'analyze.html';
  } catch (err) {
    errorElement.textContent = err.message;
    errorElement.style.display = 'block';
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    handleAuth('/api/auth/login', { email, password }, loginError);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    handleAuth('/api/auth/register', { username, email, password }, signupError);
  });
}

// Global Auth Helpers for other scripts
window.logout = function() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'auth.html';
};

window.isAuthenticated = function() {
  return !!localStorage.getItem('token');
};

window.fetchWithAuth = async function(url, options = {}) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'auth.html';
    throw new Error('Not authenticated');
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    window.logout();
  }
  
  return res;
};

window.protectPage = function() {
  if (!window.isAuthenticated()) {
    window.location.href = 'auth.html';
  }
};

window.updateNavbarAuth = function() {
  const navbarLinks = document.getElementById('navbar-links');
  if (!navbarLinks) return;
  
  const existingLogin = document.getElementById('nav-login-link');
  const existingLogout = document.getElementById('nav-logout-link');
  if (existingLogin) existingLogin.remove();
  if (existingLogout) existingLogout.remove();
  
  if (window.isAuthenticated()) {
    const userStr = localStorage.getItem('user');
    let initial = '?';
    try {
      const user = JSON.parse(userStr);
      if (user && user.username) {
        initial = user.username.charAt(0).toUpperCase();
      }
    } catch(e) {}

    const li = document.createElement('li');
    li.id = 'nav-logout-link';
    li.innerHTML = `
      <div class="nav-avatar-container" onclick="this.querySelector('.nav-dropdown').classList.toggle('show');">
        <div class="nav-avatar">${initial}</div>
        <div class="nav-dropdown">
          <a href="#" onclick="window.logout(); return false;">Logout</a>
        </div>
      </div>
    `;
    navbarLinks.insertBefore(li, document.getElementById('theme-toggle').parentElement);
  } else {
    const li = document.createElement('li');
    li.id = 'nav-login-link';
    li.innerHTML = `<a href="auth.html" class="navbar-cta">Login / Sign Up →</a>`;
    navbarLinks.insertBefore(li, document.getElementById('theme-toggle').parentElement);
  }
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const container = document.querySelector('.nav-avatar-container');
  if (container && !container.contains(e.target)) {
    const dropdown = container.querySelector('.nav-dropdown');
    if (dropdown) dropdown.classList.remove('show');
  }
});

document.addEventListener('DOMContentLoaded', window.updateNavbarAuth);
