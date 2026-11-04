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
        let role = document.getElementById('selected-role') ? document.getElementById('selected-role').value : 'tourist';

        // Auto-detect Admin role if admin governance email is entered
        if (email.toLowerCase() === 'admin.governance@yatrasetu.in') {
            role = 'admin';
        }

        if (!email || !password) {
            showGlassAlert('error', 'Please enter both email address and password.');
            return;
        }

        if (!validateEmail(email)) {
            showGlassAlert('error', 'Please enter a valid email address.');
            return;
        }

        // Account status enforcement: check if account was deactivated by Platform Administrator
        try {
            const rawUsers = localStorage.getItem('yatrasetu_admin_users') || sessionStorage.getItem('yatrasetu_admin_users');
            if (rawUsers) {
                const adminUsers = JSON.parse(rawUsers);
                const matched = adminUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
                if (matched && matched.account_status === 'Deactivated') {
                    showGlassAlert('error', 'ACCOUNT SUSPENDED: This account has been deactivated by the Platform Administrator. Access is blocked.');
                    return;
                }
                if (matched) {
                    sessionStorage.setItem('yatrasetu_name', matched.name);
                    sessionStorage.setItem('yatrasetu_user_id', matched.id);
                    if (matched.state_id) sessionStorage.setItem('yatrasetu_active_state_id', matched.state_id);
                    if (matched.destination_id) sessionStorage.setItem('yatrasetu_active_dest_id', matched.destination_id);
                    if (matched.access_level) sessionStorage.setItem('yatrasetu_access_level', matched.access_level);
                    if (matched.role === 'manager') {
                        sessionStorage.setItem('yatrasetu_manager_scope', matched.access_level === 'State Manager' ? 'state' : 'destination');
                        sessionStorage.setItem('yatrasetu_manager_access_level', matched.access_level);
                        
                        const isState = matched.access_level === 'State Manager';
                        const mgrProfile = {
                            id: matched.id,
                            name: matched.name,
                            email: matched.email,
                            phone: matched.phone || '+91 98230 41092',
                            organization: matched.organization || 'Tourism Authority',
                            manager_type: matched.access_level,
                            access_level: matched.access_level,
                            scope: isState ? 'STATE' : 'DESTINATION',
                            state_id: matched.state_id || 'maharashtra',
                            state_name: matched.state_id === 'kerala' ? 'Kerala' : 'Maharashtra',
                            destination_id: isState ? 'all' : matched.destination_id,
                            destination: matched.destination_name,
                            destination_name: matched.destination_name,
                            destination_ids: isState ? ['raigad-fort', 'ajanta-caves', 'ellora-caves', 'lonavala', 'shirdi'] : [matched.destination_id],
                            assigned_date: matched.created_at || '15 Jan 2026',
                            status: matched.account_status || 'Active',
                            account_status: matched.account_status || 'Active',
                            avatar_initials: matched.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        };
                        sessionStorage.setItem('yatrasetu_manager_profile', JSON.stringify(mgrProfile));
                    }
                }
            }
        } catch (err) {}

        // Store active user session context
        sessionStorage.setItem('yatrasetu_role', role);
        sessionStorage.setItem('yatrasetu_email', email);
        if (!sessionStorage.getItem('yatrasetu_name')) {
            sessionStorage.setItem('yatrasetu_name', role === 'tourist' ? 'Ananya Sharma' : (role === 'manager' ? 'Rajesh Patil' : (role === 'stakeholder' ? 'Suresh Deshmukh' : 'Rajesh Verma')));
        }

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

        // Auto-register stakeholder into AdminStore and Audit Trail
        if (role === 'stakeholder') {
            try {
                const userKey = 'yatrasetu_admin_users';
                const auditKey = 'yatrasetu_audit_trail';
                const rawUsers = localStorage.getItem(userKey) || sessionStorage.getItem(userKey);
                let users = [];
                if (rawUsers) {
                    try { users = JSON.parse(rawUsers); } catch (e) {}
                }
                const existing = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
                if (!existing) {
                    const newSh = {
                        id: `sh-${Date.now().toString(36)}`,
                        name: fullname,
                        email: email,
                        role: 'stakeholder',
                        access_level: 'Registered Business',
                        state_id: 'maharashtra',
                        destination_id: '',
                        destination_name: 'Pending Assignment',
                        organization: `${fullname} Enterprise`,
                        category: 'Tourism Partner',
                        account_status: 'Active',
                        registration_status: 'Pending Approval',
                        created_at: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                        last_active: 'Just now'
                    };
                    users.unshift(newSh);
                    localStorage.setItem(userKey, JSON.stringify(users));
                    sessionStorage.setItem(userKey, JSON.stringify(users));

                    const rawAudit = localStorage.getItem(auditKey) || sessionStorage.getItem(auditKey);
                    let audit = [];
                    if (rawAudit) {
                        try { audit = JSON.parse(rawAudit); } catch (e) {}
                    }
                    audit.unshift({
                        id: `aud-${Date.now().toString(36)}`,
                        timestamp: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                        action: 'USER_ACCOUNT_REGISTERED',
                        stakeholder_id: newSh.id,
                        stakeholder_name: newSh.organization,
                        actor_name: fullname,
                        actor_role: 'Tourism Stakeholder',
                        details: `New tourism stakeholder self-registered account. Business registration is Pending Approval.`,
                        previous_value: 'Unregistered',
                        new_value: 'Pending Approval'
                    });
                    localStorage.setItem(auditKey, JSON.stringify(audit));
                    sessionStorage.setItem(auditKey, JSON.stringify(audit));
                }
            } catch (err) {
                console.warn('[auth.js] Error creating stakeholder record:', err);
            }
        }

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
