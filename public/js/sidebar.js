// Sidebar JavaScript functionality

let sidebarOpen = false;
let sidebarCollapsed = false;

// Initialize sidebar
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    setupSidebarEventListeners();
    checkSidebarState();
});

// Initialize sidebar functionality
function initializeSidebar() {
    // Create sidebar overlay for mobile
    createSidebarOverlay();
    
    // Add sidebar toggle button to header
    addSidebarToggleButton();
    
    // Set up responsive behavior
    setupResponsiveSidebar();
    
    // Initialize sidebar search if exists
    initializeSidebarSearch();
    
    // Initialize sidebar notifications
    initializeSidebarNotifications();
}

// Create sidebar overlay for mobile
function createSidebarOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
}

// Add sidebar toggle button to header
function addSidebarToggleButton() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn btn-secondary sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.addEventListener('click', toggleSidebar);
        headerActions.appendChild(toggleBtn);
    }
}

// Setup sidebar event listeners
function setupSidebarEventListeners() {
    // Sidebar toggle
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('sidebar-toggle') || 
            event.target.closest('.sidebar-toggle')) {
            toggleSidebar();
        }
    });
    
    // Sidebar collapse/expand
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('sidebar-collapse') || 
            event.target.closest('.sidebar-collapse')) {
            toggleSidebarCollapse();
        }
    });
    
    // Close sidebar on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && sidebarOpen) {
            closeSidebar();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', handleWindowResize);
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// Open sidebar
function openSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.add('open');
    overlay.classList.add('open');
    mainContent.classList.add('sidebar-open');
    sidebarOpen = true;
    
    // Add body class to prevent scrolling
    document.body.classList.add('sidebar-open');
}

// Close sidebar
function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    mainContent.classList.remove('sidebar-open');
    sidebarOpen = false;
    
    // Remove body class
    document.body.classList.remove('sidebar-open');
}

// Toggle sidebar collapse
function toggleSidebarCollapse() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarCollapsed) {
        expandSidebar();
    } else {
        collapseSidebar();
    }
}

// Collapse sidebar
function collapseSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.add('collapsed');
    mainContent.classList.add('sidebar-collapsed');
    sidebarCollapsed = true;
    
    // Save state to localStorage
    localStorage.setItem('sidebarCollapsed', 'true');
}

// Expand sidebar
function expandSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('sidebar-collapsed');
    sidebarCollapsed = false;
    
    // Save state to localStorage
    localStorage.setItem('sidebarCollapsed', 'false');
}

// Setup responsive sidebar behavior
function setupResponsiveSidebar() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    function handleMediaQueryChange(e) {
        if (e.matches) {
            // Mobile view
            closeSidebar();
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.remove('collapsed');
        } else {
            // Desktop view
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.remove('open');
            document.body.classList.remove('sidebar-open');
            
            // Restore collapse state
            checkSidebarState();
        }
    }
    
    mediaQuery.addListener(handleMediaQueryChange);
    handleMediaQueryChange(mediaQuery);
}

// Handle window resize
function handleWindowResize() {
    if (window.innerWidth > 768) {
        // Desktop view
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        sidebarOpen = false;
    }
}

// Check sidebar state from localStorage
function checkSidebarState() {
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    if (collapsed && window.innerWidth > 768) {
        collapseSidebar();
    }
}

// Initialize sidebar search
function initializeSidebarSearch() {
    const searchInput = document.querySelector('.sidebar-search input');
    if (searchInput) {
        let timeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                performSidebarSearch(this.value);
            }, 300);
        });
        
        searchInput.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
        });
        
        searchInput.addEventListener('blur', function() {
            this.parentNode.classList.remove('focused');
        });
    }
}

// Perform sidebar search
function performSidebarSearch(query) {
    if (!query.trim()) {
        showAllMenuItems();
        return;
    }
    
    const menuItems = document.querySelectorAll('.menu-item');
    const queryLower = query.toLowerCase();
    
    menuItems.forEach(item => {
        const link = item.querySelector('.menu-link');
        const text = link.textContent.toLowerCase();
        
        if (text.includes(queryLower)) {
            item.style.display = '';
            item.classList.add('search-highlight');
        } else {
            item.style.display = 'none';
            item.classList.remove('search-highlight');
        }
    });
    
    // Show/hide sections based on visible items
    const sections = document.querySelectorAll('.menu-section');
    sections.forEach(section => {
        const visibleItems = section.querySelectorAll('.menu-item[style=""]');
        if (visibleItems.length === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = '';
        }
    });
}

// Show all menu items
function showAllMenuItems() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.menu-section');
    
    menuItems.forEach(item => {
        item.style.display = '';
        item.classList.remove('search-highlight');
    });
    
    sections.forEach(section => {
        section.style.display = '';
    });
}

// Initialize sidebar notifications
function initializeSidebarNotifications() {
    const notificationItems = document.querySelectorAll('.sidebar-notifications');
    
    notificationItems.forEach(item => {
        // Add click handler for notifications
        item.addEventListener('click', function() {
            // Handle notification click
            console.log('Notification clicked');
        });
        
        // Update notification count
        updateNotificationCount(item);
    });
}

// Update notification count
function updateNotificationCount(notificationItem) {
    // This would typically fetch from an API
    const count = Math.floor(Math.random() * 5); // Mock data
    
    let badge = notificationItem.querySelector('.notification-badge');
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            notificationItem.appendChild(badge);
        }
        badge.textContent = count;
    } else if (badge) {
        badge.remove();
    }
}

// Add sidebar theme functionality
function setSidebarTheme(theme) {
    const sidebar = document.querySelector('.sidebar');
    
    // Remove existing themes
    sidebar.classList.remove('theme-dark', 'theme-blue');
    
    // Add new theme
    if (theme) {
        sidebar.classList.add(`theme-${theme}`);
    }
    
    // Save theme preference
    localStorage.setItem('sidebarTheme', theme);
}

// Get sidebar theme
function getSidebarTheme() {
    return localStorage.getItem('sidebarTheme') || 'default';
}

// Apply saved theme on load
function applySavedTheme() {
    const theme = getSidebarTheme();
    if (theme !== 'default') {
        setSidebarTheme(theme);
    }
}

// Add sidebar user info
function addSidebarUserInfo(userData) {
    const sidebar = document.querySelector('.sidebar');
    const existingUser = sidebar.querySelector('.sidebar-user');
    
    if (existingUser) {
        existingUser.remove();
    }
    
    const userSection = document.createElement('div');
    userSection.className = 'sidebar-user';
    userSection.innerHTML = `
        <div class="sidebar-user-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="sidebar-user-info">
            <h4>${userData.name}</h4>
            <p>${userData.role}</p>
        </div>
    `;
    
    // Insert after header
    const header = sidebar.querySelector('.sidebar-header');
    header.parentNode.insertBefore(userSection, header.nextSibling);
}

// Add sidebar footer
function addSidebarFooter() {
    const sidebar = document.querySelector('.sidebar');
    const existingFooter = sidebar.querySelector('.sidebar-footer');
    
    if (existingFooter) {
        return;
    }
    
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.innerHTML = `
        <p>Sistema de Horarios v1.0</p>
        <small>&copy; 2024 Universidad</small>
    `;
    
    sidebar.appendChild(footer);
}

// Initialize sidebar on page load
document.addEventListener('DOMContentLoaded', function() {
    applySavedTheme();
    addSidebarFooter();
    
    // Add user info if available
    const userData = {
        name: 'Administrador',
        role: 'Sistema'
    };
    addSidebarUserInfo(userData);
});

// Export functions to global scope
window.toggleSidebar = toggleSidebar;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebarCollapse = toggleSidebarCollapse;
window.setSidebarTheme = setSidebarTheme; 