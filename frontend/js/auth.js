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
    const destGroup = document.getElementById('destination-select-group');

    const updateDestGroupVisibility = (role) => {
        if (!destGroup) return;
        if (role === 'stakeholder' || role === 'manager') {
            destGroup.style.display = 'block';
        } else {
            destGroup.style.display = 'none';
        }
    };

    if (hiddenRoleInput) {
        updateDestGroupVisibility(hiddenRoleInput.value);
    }

    if (!roleItems.length) return;

    roleItems.forEach(item => {
        item.addEventListener('click', () => {
            const role = item.getAttribute('data-role');
            if (hiddenRoleInput) {
                hiddenRoleInput.value = role;
            }

            updateDestGroupVisibility(role);

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
        stakeholder: { email: 'sahyadri.guides@gmail.com', pass: 'Stakeholder@123' },
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('login-submit-btn');

        if (!email || !password) {
            showGlassAlert('error', 'Please enter both email address and password.');
            return;
        }

        if (!validateEmail(email)) {
            showGlassAlert('error', 'Please enter a valid email address.');
            return;
        }

        // Show loading state on button
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Sign In';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
                </svg>
                <span>Signing In...</span>`;
        }

        try {
            if (!window.YatraSetuApi) {
                throw new Error('API client is not loaded. Please refresh the page.');
            }

            // Authenticate against FastAPI backend (role derived authoritatively by backend)
            const data = await window.YatraSetuApi.login(email, password);
            const userRole = (data.user && (data.user.role || data.user.role_id)) || 'tourist';

            showGlassAlert('success', `✨ Authenticated as <strong>${userRole.toUpperCase()}</strong>. Redirecting to workspace...`);

            // Perform role-based redirection to ${userRole}/dashboard.html
            setTimeout(() => {
                window.location.href = `${userRole}/dashboard.html`;
            }, 800);
        } catch (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
            showGlassAlert('error', err.message || 'Authentication failed. Please verify your credentials.');
        }
    });
}

/**
 * Registration Form Handling & Role-Based Routing
 */
function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    // Populate registration destination dropdown if present
    const destSelect = document.getElementById('registration-destination');
    if (destSelect && window.YatraSetuManagerData && Array.isArray(window.YatraSetuManagerData.destinations)) {
        destSelect.innerHTML = '<option value="" style="color: #1E293B; background: #FFFFFF;">-- No Destination Assigned (Pending Review) --</option>';
        window.YatraSetuManagerData.destinations.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = `${d.name} (${d.state_id ? d.state_id.charAt(0).toUpperCase() + d.state_id.slice(1) : 'Maharashtra'})`;
            opt.style.cssText = 'color: #1E293B; background: #FFFFFF;';
            destSelect.appendChild(opt);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = document.getElementById('fullname') ? document.getElementById('fullname').value.trim() : '';
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password') ? document.getElementById('confirm-password').value : '';
        const selectedRoleInput = document.getElementById('selected-role');
        const role = selectedRoleInput ? selectedRoleInput.value.trim().toLowerCase() : 'tourist';
        const terms = document.getElementById('terms-agree') ? document.getElementById('terms-agree').checked : true;
        const submitBtn = document.getElementById('register-submit-btn');

        // Rule: Only tourist and stakeholder can self-register
        if (role === 'manager' || role === 'admin') {
            showGlassAlert('error', 'Public registration is only permitted for Tourist or Tourism Stakeholder accounts. Destination Manager and Administrative accounts must be provisioned by Platform Governance.');
            return;
        }

        if (!fullname || fullname.length < 2) {
            showGlassAlert('error', 'Please enter your full name (minimum 2 characters).');
            return;
        }

        if (!email || !validateEmail(email)) {
            showGlassAlert('error', 'Please enter a valid email address.');
            return;
        }

        // Validate password complexity matching backend PasswordSecurity policy
        const complexityError = validatePasswordComplexity(password);
        if (complexityError) {
            showGlassAlert('error', complexityError);
            return;
        }

        if (password !== confirmPassword) {
            showGlassAlert('error', 'Confirm password does not match.');
            return;
        }

        if (!terms) {
            showGlassAlert('error', 'Please agree to the Platform Terms & Privacy Policy to continue.');
            return;
        }

        // Determine destination selection for stakeholder
        const selectedDestId = (destSelect && role === 'stakeholder') ? destSelect.value.trim() : null;

        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Create Account';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
                </svg>
                <span>Creating Account...</span>`;
        }

        try {
            if (!window.YatraSetuApi) {
                throw new Error('API client is not loaded. Please refresh the page.');
            }

            const payload = {
                full_name: fullname,
                email: email.toLowerCase(),
                password: password,
                role: role,
                destination_id: selectedDestId || null
            };

            await window.YatraSetuApi.register(payload);

            showGlassAlert('success', `✨ Account created successfully for <strong>${fullname}</strong>! Redirecting to sign in...`);

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1200);
        } catch (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
            showGlassAlert('error', err.message || 'Registration failed. Please verify your details.');
        }
    });
}

/**
 * Utility: Password Complexity Validation
 * Matches backend PasswordSecurity policy (min 8 chars, uppercase, lowercase, digit, special char)
 */
function validatePasswordComplexity(password) {
    if (!password) return 'Password cannot be empty.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (password.length > 128) return 'Password must not exceed 128 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter (A-Z).';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter (a-z).';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one digit (0-9).';
    if (!/[\W_]/.test(password)) return 'Password must contain at least one special character (!@#$%^&*...).';
    return null;
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
