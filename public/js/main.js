// Main JavaScript file for the Horarios System

// Global variables
let currentPage = window.location.pathname;
let isLoading = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    highlightCurrentPage();
});

// Initialize the application
function initializeApp() {
    console.log('Sistema de Gestión de Horarios iniciado');
    
    // Add loading states
    addLoadingStates();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize form validations
    initializeFormValidations();
    
    // Initialize data tables
    initializeDataTables();
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    }
}

// Setup global event listeners
function setupEventListeners() {
    // Form submissions
    document.addEventListener('submit', handleFormSubmit);
    
    // Delete confirmations
    document.addEventListener('click', handleDeleteClick);
    
    // Modal triggers
    document.addEventListener('click', handleModalTriggers);
    
    // Search functionality
    setupSearchListeners();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

// Handle form submissions
function handleFormSubmit(event) {
    const form = event.target;
    
    // Add loading state
    if (!isLoading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }
    }
}

// Handle delete confirmations
function handleDeleteClick(event) {
    if (event.target.classList.contains('delete-btn') || 
        event.target.closest('.delete-btn')) {
        
        const confirmed = confirm('¿Está seguro de que desea eliminar este elemento?');
        if (!confirmed) {
            event.preventDefault();
            return false;
        }
        
        // Show loading state
        const btn = event.target.classList.contains('delete-btn') ? 
                   event.target : event.target.closest('.delete-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        btn.disabled = true;
    }
}

// Handle modal triggers
function handleModalTriggers(event) {
    if (event.target.hasAttribute('data-modal')) {
        const modalId = event.target.getAttribute('data-modal');
        openModal(modalId);
    }
    
    if (event.target.classList.contains('modal-close') || 
        event.target.closest('.modal-close')) {
        closeModal();
    }
}

// Setup search listeners
function setupSearchListeners() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        let timeout;
        
        input.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                performSearch(this.value, this.dataset.searchType);
            }, 300);
        });
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + K for search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to close modals
        if (event.key === 'Escape') {
            closeModal();
        }
        
        // Ctrl/Cmd + N for new item
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            const newBtn = document.querySelector('.btn-new');
            if (newBtn) {
                newBtn.click();
            }
        }
    });
}

// Add loading states to buttons and forms
function addLoadingStates() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            }
        });
    });
}

// Initialize tooltips
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', function() {
            showTooltip(this, this.getAttribute('data-tooltip'));
        });
        
        element.addEventListener('mouseleave', function() {
            hideTooltip();
        });
    });
}

// Show tooltip
function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-popup';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.querySelector('.tooltip-popup');
    if (tooltip) {
        tooltip.remove();
    }
}

// Initialize form validations
function initializeFormValidations() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!validateForm(this)) {
                event.preventDefault();
                return false;
            }
        });
    });
}

// Validate form
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            showFieldError(input, 'Este campo es requerido');
            isValid = false;
        } else {
            clearFieldError(input);
        }
    });
    
    // Email validation
    const emailInputs = form.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        if (input.value && !isValidEmail(input.value)) {
            showFieldError(input, 'Email inválido');
            isValid = false;
        }
    });
    
    return isValid;
}

// Show field error
function showFieldError(input, message) {
    input.classList.add('error');
    
    let errorElement = input.parentNode.querySelector('.form-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        input.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

// Clear field error
function clearFieldError(input) {
    input.classList.remove('error');
    
    const errorElement = input.parentNode.querySelector('.form-error');
    if (errorElement) {
        errorElement.remove();
    }
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Initialize data tables
function initializeDataTables() {
    const tables = document.querySelectorAll('.data-table');
    
    tables.forEach(table => {
        // Add sorting functionality
        const headers = table.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            header.addEventListener('click', function() {
                sortTable(table, this);
            });
        });
        
        // Add search functionality
        const searchInput = table.parentNode.querySelector('.table-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterTable(table, this.value);
            });
        }
    });
}

// Sort table
function sortTable(table, header) {
    const column = header.getAttribute('data-sort');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isAscending = header.classList.contains('sort-asc');
    
    rows.sort((a, b) => {
        const aValue = a.querySelector(`td[data-${column}]`).getAttribute(`data-${column}`);
        const bValue = b.querySelector(`td[data-${column}]`).getAttribute(`data-${column}`);
        
        if (isAscending) {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    
    // Update table
    rows.forEach(row => tbody.appendChild(row));
    
    // Update header classes
    table.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    header.classList.add(isAscending ? 'sort-desc' : 'sort-asc');
}

// Filter table
function filterTable(table, searchTerm) {
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm.toLowerCase());
        row.style.display = isVisible ? '' : 'none';
    });
}

// Initialize charts
function initializeCharts() {
    const chartElements = document.querySelectorAll('[data-chart]');
    
    chartElements.forEach(element => {
        const chartType = element.getAttribute('data-chart');
        const chartData = JSON.parse(element.getAttribute('data-chart-data') || '{}');
        
        new Chart(element, {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    });
}

// Perform search
function performSearch(query, type) {
    if (!query.trim()) return;
    
    const searchUrl = `/buscar?q=${encodeURIComponent(query)}&tipo=${type || 'todos'}`;
    
    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            updateSearchResults(data);
        })
        .catch(error => {
            console.error('Error en búsqueda:', error);
        });
}

// Update search results
function updateSearchResults(data) {
    const resultsContainer = document.querySelector('.search-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (data.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No se encontraron resultados</p>';
        return;
    }
    
    data.forEach(item => {
        const resultElement = document.createElement('div');
        resultElement.className = 'search-result-item';
        resultElement.innerHTML = `
            <h4>${item.titulo}</h4>
            <p>${item.subtitulo}</p>
            <small>${item.descripcion}</small>
        `;
        
        resultElement.addEventListener('click', () => {
            window.location.href = `/${item.tipo}/${item.id}`;
        });
        
        resultsContainer.appendChild(resultElement);
    });
}

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
function closeModal() {
    const modals = document.querySelectorAll('.modal.open');
    modals.forEach(modal => {
        modal.classList.remove('open');
    });
    document.body.style.overflow = '';
}

// Highlight current page in sidebar
function highlightCurrentPage() {
    const menuLinks = document.querySelectorAll('.menu-link');
    
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Export functions to global scope
window.showNotification = showNotification;
window.openModal = openModal;
window.closeModal = closeModal; 