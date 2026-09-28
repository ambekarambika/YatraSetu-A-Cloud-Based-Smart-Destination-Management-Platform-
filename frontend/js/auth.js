/* ==========================================================================
   YatraSetu — Smart Destination Management Platform
   Cinematic Authentication Logic & Role Routing (login.html & register.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initGlassRoleSelectors();
    initPasswordToggles();
    initSubtleDemoTrigger();
    initLoginForm();
    initRegisterForm();
});

/**
 * Compact Glass Role Selector (Login Pills & Register Cards)
 */
function initGlassRoleSelectors() {
    const roleItems = document.querySelectorAll('.glass-role-pill, .glass-role-card');
    const hiddenRoleInput = document.getElementById('selected-role');

    if (!roleItems.length) return;

    roleItems.forEach(item => {
        item.addEventListener('click', () => {
            const role = item.getAttribute('data-role');
            if (hiddenRoleInput) {
                hiddenRoleInput.value = role;
            }

            roleItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            if (document.body.getAttribute('data-demo-mode') === 'true') {
                fillDemoCredentialsForRole(role);
            }
        });
    });
}

/**
 * Password Visibility Toggle
 */
function initPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.glass-toggle-password, .toggle-password');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Toggle Icon SVG
            if (type === 'text') {
                btn.innerHTML = `
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>`;
            } else {
                btn.innerHTML = `
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>`;
            }
        });
    });
}

/**
 * Subtle Demo Fill Helper Trigger
 */
function initSubtleDemoTrigger() {
    const demoBtn = document.getElementById('subtle-demo-btn');
    if (!demoBtn) return;

    demoBtn.addEventListener('click', () => {
        document.body.setAttribute('data-demo-mode', 'true');
        const activeRoleItem = document.querySelector('.glass-role-pill.active, .glass-role-card.active');
        const role = activeRoleItem ? activeRoleItem.getAttribute('data-role') : 'tourist';
        
        fillDemoCredentialsForRole(role);
    });
}

function fillDemoCredentialsForRole(role) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (!emailInput || !passwordInput) return;

    const demoAccounts = {
        tourist: { email: 'tourist.demo@yatrasetu.in', pass: 'Tourist@123' },
        manager: { email: 'manager.maharashtra@yatrasetu.in', pass: 'Manager@123' },
        stakeholder: { email: 'stakeholder.local@yatrasetu.in', pass: 'Stakeholder@123' },
        admin: { email: 'admin.governance@yatrasetu.in', pass: 'Admin@123' }
    };

    if (demoAccounts[role]) {
        emailInput.value = demoAccounts[role].email;
        passwordInput.value = demoAccounts[role].pass;
        showGlassAlert('info', `Demo credentials loaded for <strong>${role.toUpperCase()}</strong>.`);
    }
}

/**
 * Login Form Validation & Role-Based Routing
 */
function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const role = document.getElementById('selected-role') ? document.getElementById('selected-role').value : 'tourist';

        if (!email || !password) {
            showGlassAlert('error', 'Please enter both email address and password.');
            return;
        }

        if (!validateEmail(email)) {
            showGlassAlert('error', 'Please enter a valid email address.');
            return;
        }

        // Store active user session context
        sessionStorage.setItem('yatrasetu_role', role);
        sessionStorage.setItem('yatrasetu_email', email);

        showGlassAlert('success', `✨ Authenticated as <strong>${role.toUpperCase()}</strong>. Redirecting to workspace...`);

        // Perform role-based redirection to ${role}/dashboard.html
        setTimeout(() => {
            window.location.href = `${role}/dashboard.html`;
        }, 800);
    });
}

/**
 * Registration Form Handling & Role-Based Routing
 */
function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullname = document.getElementById('fullname') ? document.getElementById('fullname').value.trim() : '';
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password') ? document.getElementById('confirm-password').value : '';
        const role = document.getElementById('selected-role') ? document.getElementById('selected-role').value : 'tourist';
        const terms = document.getElementById('terms-agree') ? document.getElementById('terms-agree').checked : true;

        if (!fullname) {
            showGlassAlert('error', 'Please enter your full name.');
            return;
        }

        if (!email || !validateEmail(email)) {
            showGlassAlert('error', 'Please enter a valid email address.');
            return;
        }

        if (!password || password.length < 6) {
            showGlassAlert('error', 'Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            showGlassAlert('error', 'Confirm password does not match.');
            return;
        }

        if (!terms) {
            showGlassAlert('error', 'Please agree to the Terms of Service to continue.');
            return;
        }

        sessionStorage.setItem('yatrasetu_role', role);
        sessionStorage.setItem('yatrasetu_email', email);
        sessionStorage.setItem('yatrasetu_name', fullname);

        showGlassAlert('success', `✨ Account created for <strong>${fullname}</strong> as <strong>${role.toUpperCase()}</strong>! Redirecting...`);

        setTimeout(() => {
            window.location.href = `${role}/dashboard.html`;
        }, 800);
    });
}

/**
 * Utility: Email Regex
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Utility: Glass Notification Alert
 */
function showGlassAlert(type, message) {
    const alertBox = document.getElementById('auth-alert');
    if (!alertBox) return;

    alertBox.className = `auth-glass-alert show auth-glass-alert-${type}`;
    
    let iconSvg = '';
    if (type === 'error') {
        iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else if (type === 'success') {
        iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    alertBox.innerHTML = `${iconSvg} <span>${message}</span>`;
}
