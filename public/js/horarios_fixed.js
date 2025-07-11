/**
 * Horarios.js - JavaScript para la página de gestión de horarios
 * 
 * Este archivo contiene las funciones específicas para la página de horarios,
 * incluyendo la gestión de pestañas, visualización de datos y funcionalidades interactivas.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando calendario desde horarios_fixed.js');
    initCalendar();
    initHorariosPage();
    
    // Inicializar la página de cálculo de horarios si estamos en ella
    if (document.querySelector('#calculateForm')) {
        initCalculateForm();
    }
    
    // Inicializar calendario si hay resultados
    if (document.querySelector('#calendar')) {
        initCalendar();
    }
});

/**
 * Inicializa todas las funcionalidades de la página de horarios
 */
function initHorariosPage() {
    // Inicializar pestañas
    initTabs();
    
    // Inicializar tooltips
    initTooltips();
    
    // Inicializar filtros
    initFilters();
    
    // Destacar la pestaña activa en la carga inicial
    highlightActiveTab();
    
    console.log('Horarios page initialized');
}

/**
 * Inicializa el sistema de pestañas
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
    
    // Activar la primera pestaña por defecto si no hay ninguna activa
    if (!document.querySelector('.tab-btn.active')) {
        const firstTab = document.querySelector('.tab-btn');
        if (firstTab) {
            const firstTabId = firstTab.getAttribute('data-tab');
            switchTab(firstTabId);
        }
    }
}

/**
 * Cambia entre pestañas
 * @param {string} tabId - ID de la pestaña a mostrar
 */
function switchTab(tabId) {
    // Ocultar todos los contenidos de pestañas
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Desactivar todos los botones de pestañas
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Activar la pestaña seleccionada
    const selectedTab = document.getElementById(tabId);
    const selectedButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Guardar la pestaña activa en localStorage para persistencia
    localStorage.setItem('activeHorariosTab', tabId);
}

/**
 * Destaca la pestaña activa basada en localStorage o la URL
 */
function highlightActiveTab() {
    // Intentar obtener la pestaña activa desde localStorage
    let activeTab = localStorage.getItem('activeHorariosTab');
    
    // Si no hay pestaña guardada, usar la primera
    if (!activeTab) {
        const firstTabButton = document.querySelector('.tab-btn');
        if (firstTabButton) {
            activeTab = firstTabButton.getAttribute('data-tab');
        }
    }
    
    // Activar la pestaña correspondiente
    if (activeTab) {
        switchTab(activeTab);
    }
}

/**
 * Inicializa tooltips para elementos con datos adicionales
 */
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip');
            
            // Crear el tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            
            // Posicionar y mostrar el tooltip
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
            tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            
            // Eliminar el tooltip al salir del elemento
            this.addEventListener('mouseleave', function tooltipRemove() {
                tooltip.remove();
                this.removeEventListener('mouseleave', tooltipRemove);
            });
        });
    });
}

/**
 * Inicializa filtros para horarios
 */
function initFilters() {
    const filterInputs = document.querySelectorAll('.filter-input');
    
    filterInputs.forEach(input => {
        input.addEventListener('input', function() {
            const filterValue = this.value.toLowerCase();
            const filterTarget = this.getAttribute('data-filter-target');
            const itemsToFilter = document.querySelectorAll(filterTarget);
            
            itemsToFilter.forEach(item => {
                const textContent = item.textContent.toLowerCase();
                if (textContent.includes(filterValue)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Exporta los horarios a formato CSV
 */
/**
 * Inicializa el formulario de cálculo de horarios
 */
function initCalculateForm() {
    console.log('Inicializando formulario de cálculo...');
    
    const form = document.getElementById('calculate-form');
    if (!form) {
        console.log('Formulario de cálculo no encontrado');
        // Aún así continuamos para inicializar el calendario si estamos en la página de resultados
    }
    
    // Crear overlay de carga
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.style.display = 'none';
    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <h3>Calculando horario...</h3>
            <div class="progress-container">
                <div class="progress-bar" id="calculation-progress"></div>
            </div>
            <p class="calculation-status" id="calculation-status">Iniciando cálculo...</p>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
    
    // Verificar si hay un cálculo en progreso
    const calculationInProgress = localStorage.getItem('calculationInProgress');
    if (calculationInProgress === 'true') {
        loadingOverlay.style.display = 'flex';
        simulateProgress();
    }
    
    // Verificar si estamos en la página de resultados
    const isResultPage = document.querySelector('.calculation-results') !== null;
    
    // Si estamos en la página de resultados, asegurarse de que el calendario se inicialice
    if (isResultPage) {
        console.log('Página de resultados detectada, preparando calendario...');
        // Asegurarse de que el contenedor del calendario sea visible
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            calendarContainer.style.display = 'block';
            calendarContainer.style.visibility = 'visible';
            calendarContainer.style.opacity = '1';
        }
        
        // Inicializar el calendario con un pequeño retraso para asegurar que el DOM esté listo
        setTimeout(() => {
            if (typeof initCalendar === 'function') {
                console.log('Inicializando calendario desde initCalculateForm');
                initCalendar();
                
                // Forzar la visibilidad del calendario después de inicializarlo
                setTimeout(() => {
                    const calendarEl = document.getElementById('calendar');
                    if (calendarEl) {
                        calendarEl.style.display = 'block';
                        calendarEl.style.visibility = 'visible';
                        calendarEl.style.opacity = '1';
                        console.log('Forzando visibilidad del calendario después de inicialización');
                    }
                }, 1000);
            }
        }, 500);
        
        // Limpiar el estado de cálculo en progreso
        localStorage.removeItem('calculationInProgress');
    }
    
    // Agregar el evento submit solo si encontramos el formulario
    if (form) {
        form.addEventListener('submit', function(e) {
            // No prevenir el envío del formulario, pero mostrar el overlay
            loadingOverlay.style.display = 'flex';
            localStorage.setItem('calculationInProgress', 'true');
            
            // Simular progreso mientras se procesa en el servidor
            simulateProgress();
        });
    }
    
    /**
     * Simula el progreso del cálculo con mensajes informativos
     */
    function simulateProgress() {
        const progressBar = document.getElementById('calculation-progress');
        const statusText = document.getElementById('calculation-status');
        let progress = 0;
        
        // Mensajes para mostrar durante el cálculo
        const messages = [
            'Iniciando cálculo...',
            'Analizando restricciones de profesores...',
            'Verificando disponibilidad de horarios...',
            'Aplicando algoritmo de backtracking...',
            'Resolviendo conflictos de horario...',
            'Optimizando asignaciones...',
            'Generando resultados...',
            'Finalizando cálculo...'
        ];
        
        let currentMessage = 0;
        statusText.textContent = messages[currentMessage];
        
        const interval = setInterval(() => {
            // Incrementar progreso
            progress += Math.random() * 2;
            
            // Cambiar mensaje cada cierto porcentaje
            if (progress > (currentMessage + 1) * 12 && currentMessage < messages.length - 1) {
                currentMessage++;
                statusText.textContent = messages[currentMessage];
            }
            
            // Limitar progreso máximo a 95% (el 100% se alcanza cuando se complete la carga)
            if (progress >= 95) {
                progress = 95;
                clearInterval(interval);
                
                // Verificar si la página ya se cargó completamente
                if (document.querySelector('.calculation-results')) {
                    // Si ya hay resultados, completar el progreso
                    progressBar.style.width = '100%';
                    statusText.textContent = 'Cálculo completado!';
                    
                    // Ocultar overlay después de un momento
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                        localStorage.removeItem('calculationInProgress');
                        
                        // Inicializar calendario si hay resultados
                        if (typeof initCalendar === 'function') {
                            console.log('Inicializando calendario después del cálculo');
                            initCalendar();
                            
                            // Forzar la visibilidad del calendario después de inicializarlo
                            setTimeout(() => {
                                const calendarEl = document.getElementById('calendar');
                                if (calendarEl) {
                                    calendarEl.style.display = 'block';
                                    calendarEl.style.visibility = 'visible';
                                    calendarEl.style.opacity = '1';
                                    console.log('Forzando visibilidad del calendario después de inicialización');
                                }
                            }, 1000);
                        }
                    }, 1000);
                }
            }
            
            // Actualizar barra de progreso
            progressBar.style.width = `${progress}%`;
            
        }, 300);
        
        // Guardar el intervalo para poder detenerlo si es necesario
        window.progressInterval = interval;
        
        // Si después de 30 segundos no se ha completado, mostrar mensaje de error
        setTimeout(() => {
            if (localStorage.getItem('calculationInProgress') === 'true') {
                clearInterval(interval);
                statusText.textContent = 'El cálculo está tomando más tiempo de lo esperado. Por favor, espere...';                
            }
        }, 30000);
    }
    
    // Verificar si hay resultados y mostrar el calendario
    if (document.querySelector('.calculation-results')) {
        console.log('Se encontraron resultados de cálculo');
        loadingOverlay.style.display = 'none';
        
        // Limpiar el estado de cálculo
        localStorage.removeItem('calculationInProgress');
        
        // Asegurarse de que el calendario sea visible
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            calendarContainer.style.display = 'block';
            calendarContainer.style.visibility = 'visible';
            calendarContainer.style.opacity = '1';
            console.log('Contenedor de calendario encontrado y configurado como visible');
        }
        
        // Inicializar el calendario
        if (typeof initCalendar === 'function') {
            console.log('Inicializando calendario desde la verificación de resultados');
            setTimeout(() => {
                initCalendar();
            }, 500);
        }
    } else if (localStorage.getItem('calculationInProgress') === 'true') {
        // Si estamos regresando de un cálculo pero no hay resultados, mostrar un mensaje
        localStorage.removeItem('calculationInProgress');
        alert('El cálculo de horarios no pudo completarse. Por favor, intente con menos materias o profesores.');
    }
}

/**
 * Inicializa el calendario para mostrar los horarios calculados
 */
function initCalendar() {
    console.log('Inicializando calendario...');
    try {
        // Forzar visibilidad del contenedor
        const calendarContainer = document.getElementById('calendar-container');
        if (!calendarContainer) {
            showErrorMessage('No se encontró el contenedor del calendario');
            return;
        }
        
        // Forzar visibilidad del contenedor
        calendarContainer.style.display = 'block';
        calendarContainer.style.visibility = 'visible';
        calendarContainer.style.opacity = '1';
        calendarContainer.style.height = 'auto';
        calendarContainer.style.minHeight = '600px';
        
        // Mostrar indicador de carga
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'calendar-loading';
        loadingDiv.className = 'alert alert-info';
        loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando datos del horario...';
        calendarContainer.insertBefore(loadingDiv, document.getElementById('calendar'));

        // Obtener el timestamp actual para evitar caché
        const timestamp = new Date().getTime();

        // Cargar los datos del horario mediante AJAX
        fetch(`/api/horarios/datos?t=${timestamp}`)
            .then(response => response.json())
            .then(data => {
                console.log('Datos de horario cargados:', data);

                // Almacenar los datos en variables globales
                window.horarioEvents = data.horarioEvents || [];
                window.calendarResources = data.profesoresCalendar || [];
                window.mensajeResultado = data.mensajeResultado || '';

                // Eliminar el indicador de carga
                const loadingDiv = document.getElementById('calendar-loading');
                if (loadingDiv) {
                    loadingDiv.remove();
                }
                
                // Inicializar el calendario con los datos cargados
                renderCalendar();  
            }
        );
    } catch (error) {
        console.error('Error al inicializar calendario:', error);
    }
}

function renderCalendar() {
    console.log('Renderizando calendario...');
    
    try {
        // Forzar visibilidad del elemento del calendario
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            console.error('No se encontró el elemento del calendario');
            return;
        }
        
        calendarEl.style.display = 'block';
        calendarEl.style.visibility = 'visible';
        calendarEl.style.opacity = '1';
        calendarEl.style.height = 'auto';
        
        // Mantener visible el calendario y sus elementos hijos
        const forceVisibility = () => {
            const calendarContainer = document.getElementById('calendar-container');
            if (calendarContainer) {
                calendarContainer.style.display = 'block';
                calendarContainer.style.visibility = 'visible';
            }
            
            calendarEl.style.display = 'block';
            calendarEl.style.visibility = 'visible';
            calendarEl.style.minHeight = '600px';
            
            // Forzar visibilidad de los elementos internos del calendario
            const calendarElements = calendarEl.querySelectorAll('*');
            calendarElements.forEach(el => {
                el.style.visibility = 'visible';
                el.style.display = el.tagName === 'DIV' ? 'block' : '';
            });
        };
        
        // Programar varios intentos para mantener la visibilidad
        for (let i = 1; i <= 10; i++) {
            setTimeout(forceVisibility, i * 1000); // Intentar cada segundo durante 10 segundos
        }
        
        // Procesar eventos para el calendario
        let events = [];
        
        // Verificar si hay eventos globales disponibles
        if (window.horarioEvents && Array.isArray(window.horarioEvents)) {
            console.log(`Procesando ${window.horarioEvents.length} eventos del horario`);
            
            // Mapear los eventos al formato que espera FullCalendar
            events = window.horarioEvents.map(event => {
                // Mapear día de la semana a número (0 = domingo, 1 = lunes, etc.)
                const daysMap = {
                    'Domingo': 0,
                    'Lunes': 1,
                    'Martes': 2,
                    'Miércoles': 3,
                    'Jueves': 4,
                    'Viernes': 5,
                    'Sábado': 6
                };
                
                const dayNumber = daysMap[event.dia];
                if (dayNumber === undefined) {
                    console.error(`Día no reconocido: ${event.dia}`);
                    return null;
                }
                
                return {
                    title: `${event.materiaNombre} - ${event.profesorNombre}`,
                    daysOfWeek: [dayNumber],
                    startTime: `${event.horaInicio}:00`,
                    endTime: `${event.horaFin}:00`,
                    backgroundColor: getColorForMateria(event.materiaId),
                    resourceId: `prof-${event.profesorId}-mat-${event.materiaId}`,
                    extendedProps: {
                        profesorId: event.profesorId,
                        profesorNombre: event.profesorNombre,
                        materiaId: event.materiaId,
                        materiaNombre: event.materiaNombre
                    }
                };
            }).filter(Boolean); // Eliminar eventos nulos
        } else {
            console.warn('No se encontraron eventos de horario');
            showWarningMessage('No hay horarios disponibles. Por favor, calcule un nuevo horario.');
        }
        
        // Si no hay eventos, mostrar mensaje pero no agregar eventos de prueba
        if (!events || events.length === 0) {
            console.warn('No se encontraron eventos de horario');
        }
        
        // Verificar si hay recursos disponibles
        let resources = [];
        try {
            if (typeof calendarResources !== 'undefined' && Array.isArray(calendarResources)) {
                resources = calendarResources;
                console.log(`Recursos cargados: ${resources.length}`);
            } else {
                console.warn('No se encontraron recursos para el calendario');
            }
        } catch (error) {
            console.error('Error al cargar recursos del calendario:', error);
        }

        // Configurar opciones del calendario
        const calendarOptions = {
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            locale: 'es',
            allDaySlot: false,
            slotMinTime: '07:00:00',
            slotMaxTime: '22:00:00',
            slotDuration: '00:30:00',
            slotLabelInterval: '01:00:00',
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            weekends: true,
            editable: false,
            selectable: false,
            selectMirror: true,
            dayMaxEvents: true,
            nowIndicator: true,
            height: 'auto',
            expandRows: true,
            stickyHeaderDates: true,
            firstDay: 1, // Lunes como primer día
            
            // Configuración de recursos (profesores)
            schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
            resources: resources,
            resourceLabelText: 'Profesores',
            resourceAreaWidth: '15%',
            resourceOrder: 'title',
            resourcesInitiallyExpanded: false,
            eventColor: '#3788d8',
            eventTextColor: '#ffffff',
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            
            // Callbacks
            datesSet: function() {
                console.log('Calendario montado');
                forceVisibility();
            },
            
            eventDidMount: function(info) {
                // Crear tooltip para eventos
                const tooltip = document.createElement('div');
                tooltip.className = 'calendar-tooltip';
                tooltip.style.position = 'absolute';
                tooltip.style.zIndex = '10000';
                tooltip.style.backgroundColor = '#fff';
                tooltip.style.border = '1px solid #ddd';
                tooltip.style.padding = '8px';
                tooltip.style.borderRadius = '4px';
                tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                tooltip.style.display = 'none';
                document.body.appendChild(tooltip);
                
                // Mostrar tooltip al pasar el mouse
                info.el.addEventListener('mouseover', function() {
                    const event = info.event;
                    const materia = event.extendedProps.materiaNombre || 'Sin materia';
                    const profesor = event.extendedProps.profesorNombre || 'Sin profesor';
                    const aula = event.extendedProps.aula || 'Sin aula asignada';
                    
                    tooltip.innerHTML = `
                        <strong>Materia:</strong> ${materia}<br>
                        <strong>Profesor:</strong> ${profesor}<br>
                        <strong>Aula:</strong> ${aula}<br>
                        <strong>Horario:</strong> ${event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        ${event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    `;
                    
                    tooltip.style.display = 'block';
                    tooltip.style.left = info.el.getBoundingClientRect().left + window.scrollX + 'px';
                    tooltip.style.top = info.el.getBoundingClientRect().bottom + window.scrollY + 'px';
                });
                
                // Ocultar tooltip
                info.el.addEventListener('mouseout', function() {
                    tooltip.style.display = 'none';
                });
            }
        };

        // Crear instancia del calendario
        try {
            // Destruir instancia previa si existe
            if (window.calendar) {
                console.log('Destruyendo instancia previa del calendario');
                window.calendar.destroy();
            }
            
            // Crear nueva instancia
            if (!calendarEl) {
                console.error('No se encontró el elemento del calendario');
                return;
            }
            
            window.calendar = new FullCalendar.Calendar(calendarEl, calendarOptions);
            window.calendar.render();
            
            // Forzar visibilidad después de renderizar
            setTimeout(() => {
                forceVisibility();
                console.log('Calendario renderizado y forzado a ser visible');
                
                // Expandir todos los recursos si hay pocos
                if (resources.length > 0 && resources.length <= 5) {
                    resources.forEach(resource => {
                        const resourceObj = window.calendar.getResourceById(resource.id);
                        if (resourceObj) resourceObj.setExpanded(true);
                    });
                }
            }, 1000);
            
            // Mostrar mensaje de éxito
            showWarningMessage('Calendario inicializado correctamente. Puede cambiar entre las vistas usando los botones de la parte superior derecha.');
        } catch (error) {
            console.error('Error al crear el calendario:', error);
            showErrorMessage('Error al inicializar el calendario: ' + error.message);
        }
        
    } catch (error) {
        console.error('Error al inicializar eventos del calendario:', error);
        showErrorMessage('Error al cargar los datos del horario: ' + error.message);
    }
}

// Funciones para mostrar mensajes de notificación tipo toast
function showToast(message, type = 'info') {
    // Ocultar overlay de carga si está visible
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay && loadingOverlay.style.display === 'flex') {
        loadingOverlay.style.display = 'none';
    }
    
    // Crear contenedor de toasts si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Crear el toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.minWidth = '250px';
    toast.style.backgroundColor = type === 'error' ? '#f8d7da' : 
                                 type === 'success' ? '#d4edda' : 
                                 type === 'warning' ? '#fff3cd' : '#d1ecf1';
    toast.style.color = type === 'error' ? '#721c24' : 
                       type === 'success' ? '#155724' : 
                       type === 'warning' ? '#856404' : '#0c5460';
    toast.style.borderRadius = '4px';
    toast.style.padding = '12px 20px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    
    // Icono según tipo
    const icon = document.createElement('i');
    icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 
                    type === 'success' ? 'fas fa-check-circle' : 
                    type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';
    icon.style.marginRight = '8px';
    
    // Contenido del toast
    toast.appendChild(icon);
    toast.appendChild(document.createTextNode(message));
    
    // Botón de cerrar
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.float = 'right';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.transition = 'all 0.3s ease';
    closeBtn.onclick = function() {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    };
    toast.insertBefore(closeBtn, toast.firstChild);
    
    // Agregar al contenedor
    toastContainer.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => toast.style.opacity = '1', 10);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function showErrorMessage(message) {
    showToast(message, 'error');
}

function showWarningMessage(message) {
    showToast(message, 'warning');
}

function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showInfoMessage(message) {
    showToast(message, 'info');
}


/**
 * Genera un color basado en el ID de la materia
 */
function getColorForMateria(materiaId) {
    // Lista de colores para asignar a las materias
    const colors = [
        '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', // Flat colors
        '#9b59b6', '#1abc9c', '#d35400', '#c0392b', // More flat colors
        '#16a085', '#27ae60', '#2980b9', '#8e44ad', // Even more colors
        '#f1c40f', '#e67e22', '#95a5a6', '#34495e'  // Final set
    ];
    
    // Convertir el ID a número si es string
    const id = typeof materiaId === 'string' ? parseInt(materiaId) : materiaId;
    
    // Usar el módulo para obtener un índice dentro del rango de colores
    return colors[id % colors.length];
}

function exportSchedulesToCSV() {
    // Obtener datos de horarios
    const horarios = [];
    const horariosElements = document.querySelectorAll('.schedule-slot');
    
    horariosElements.forEach(element => {
        const profesor = element.getAttribute('data-profesor');
        const materia = element.getAttribute('data-materia');
        const dia = element.getAttribute('data-dia');
        const horaInicio = element.getAttribute('data-hora-inicio');
        const horaFin = element.getAttribute('data-hora-fin');
        
        horarios.push({
            profesor,
            materia,
            dia,
            horaInicio,
            horaFin
        });
    });
    
    // Convertir a CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Profesor,Materia,Día,Hora Inicio,Hora Fin\n";
    
    horarios.forEach(horario => {
        csvContent += `${horario.profesor},${horario.materia},${horario.dia},${horario.horaInicio},${horario.horaFin}\n`;
    });
    
    // Descargar archivo
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "horarios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Muestra un modal con detalles de un horario específico
 * @param {string} profesorId - ID del profesor
 * @param {string} materiaId - ID de la materia
 */
function showScheduleDetails(profesorId, materiaId) {
    // Implementación del modal de detalles
    console.log(`Mostrando detalles para profesor ${profesorId} y materia ${materiaId}`);
    
    // Esta función se completaría con la lógica para mostrar un modal con detalles
}

/**
 * Verifica conflictos en tiempo real al editar un horario
 * @param {HTMLElement} form - Formulario de edición de horario
 */
function checkConflictsRealtime(form) {
    const profesorId = form.querySelector('[name="profesorId"]').value;
    const dia = form.querySelector('[name="dia"]').value;
    const horaInicio = form.querySelector('[name="horaInicio"]').value;
    const horaFin = form.querySelector('[name="horaFin"]').value;
    
    // Esta función se implementaría para hacer una verificación en tiempo real
    // de conflictos al editar un horario, posiblemente mediante una llamada AJAX
    // a un endpoint de la API
    
    console.log(`Verificando conflictos para profesor ${profesorId} en ${dia} de ${horaInicio} a ${horaFin}`);
}
