document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links on the landing page
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Ensure this is a link on the same page
            if (this.hostname === window.location.hostname && this.pathname === window.location.pathname) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});