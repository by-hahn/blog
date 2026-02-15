/* Theme Toggle - Light/Dark Mode */
document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');

    // Initialize theme from localStorage or system preference
    function initializeTheme() {
        const savedTheme = localStorage.getItem('blog-theme');
        if (savedTheme) {
            applyTheme(savedTheme);
            return;
        }

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? 'dark' : 'light';
        applyTheme(systemTheme);
    }

    // Apply theme and update UI
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        
        if (themeToggle) {
            const isDark = theme === 'dark';
            themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            themeToggle.textContent = isDark ? '☀️' : '🌙';
        }
    }

    // Initialize on page load
    initializeTheme();

    // Theme toggle link click handler
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Add transition class for smooth color change
            html.classList.add('theme-transitioning');
            
            // Apply theme change after a short delay
            setTimeout(() => {
                applyTheme(newTheme);
                localStorage.setItem('blog-theme', newTheme);
                
                // Remove transition class after animation completes
                setTimeout(() => {
                    html.classList.remove('theme-transitioning');
                }, 400);
            }, 0);
        });
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const savedTheme = localStorage.getItem('blog-theme');
        if (!savedTheme) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
        }
    });
});