/**
 * Utility functions for the network graph application
 */

// Update status message with appropriate styling
function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    
    // Remove all status classes
    statusElement.classList.remove('status-info', 'status-success', 'status-warning', 'status-error');
    
    // Add appropriate class
    statusElement.classList.add('status-' + type);
}

// Toggle active class for buttons
function setActiveButton(button, isActive) {
    if (isActive) {
        button.classList.add('btn-active');
    } else {
        button.classList.remove('btn-active');
    }
}

// Debounce function to limit search frequency
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Initialize collapsible sections
function initCollapsibleSections() {
    const sectionTitles = document.querySelectorAll('.sidebar .section-title');
    
    sectionTitles.forEach(title => {
        title.addEventListener('click', function() {
            // Toggle the collapsed class on the parent container
            const parent = this.parentNode;
            const content = this.nextElementSibling;
            
            if (content && content.classList.contains('section-content')) {
                parent.classList.toggle('collapsed');
            }
        });
    });
}
