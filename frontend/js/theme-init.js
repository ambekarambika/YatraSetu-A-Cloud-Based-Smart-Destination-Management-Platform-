/**
 * YatraSetu Immediate Theme Initializer
 * Runs synchronously in document <head> to prevent theme flash (FOUC).
 * Sets data-theme and data-state-theme on <html> and <body> immediately.
 */
(function() {
    try {
        var urlParams = new URLSearchParams(window.location.search);
        var urlState = urlParams.get('state');
        var profileState = null;
        try {
            var rawProfile = sessionStorage.getItem('yatrasetu_manager_profile');
            if (rawProfile) {
                var p = JSON.parse(rawProfile);
                profileState = p.state_id;
            }
        } catch (e) {}

        var theme = urlState || sessionStorage.getItem('yatrasetu_active_state_id') || localStorage.getItem('yatrasetu_active_state_id') || profileState || 'maharashtra';
        if (theme) {
            theme = theme.toLowerCase().trim();
            document.documentElement.setAttribute('data-theme', theme);
            document.documentElement.setAttribute('data-state-theme', theme);

            if (document.body) {
                document.body.setAttribute('data-theme', theme);
                document.body.setAttribute('data-state-theme', theme);
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    if (document.body) {
                        document.body.setAttribute('data-theme', theme);
                        document.body.setAttribute('data-state-theme', theme);
                    }
                });
            }
        }
    } catch (err) {}
})();
