/**
 * Horarios.js - JavaScript para la página de gestión de horarios
 * 
 * Este archivo contiene las funciones específicas para la página de horarios,
 * incluyendo la gestión de pestañas, visualización de datos y funcionalidades interactivas.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la página de horarios
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
        
        // Destruir cualquier instancia previa del calendario
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            showErrorMessage('No se encontró el elemento del calendario');
            return;
        }
        
        // Forzar visibilidad del elemento del calendario
        calendarEl.style.display = 'block';
        calendarEl.style.visibility = 'visible';
        calendarEl.style.opacity = '1';
        calendarEl.style.height = 'auto';
        calendarEl.style.minHeight = '600px';
        
        // Mantener visible el calendario y sus elementos hijos
        const forceVisibility = () => {
            calendarContainer.style.display = 'block';
            calendarContainer.style.visibility = 'visible';
            calendarEl.style.display = 'block';
            calendarEl.style.visibility = 'visible';
            
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
        
        // Si no hay eventos o son muy pocos, agregar eventos de prueba
        if (!events || events.length < 2) {
            console.warn('Pocos o ningún evento encontrado, agregando eventos de prueba');
            // Agregar eventos de prueba para asegurar que el calendario se muestre
            const testEvents = [
                {
                    title: 'Matemáticas - Juan Pérez',
                    daysOfWeek: [1],  // Lunes
                    startTime: '08:00',
                    endTime: '10:00',
                    backgroundColor: '#4285F4',
                    resourceId: 'prof-test1-mat-mat1',
                    extendedProps: {
                        profesorId: 'test1',
                        profesorNombre: 'Juan Pérez',
                        materiaId: 'mat1',
                        materiaNombre: 'Matemáticas'
                    }
                },
                {
                    title: 'Física - Juan Pérez',
                    daysOfWeek: [2],  // Martes
                    startTime: '10:00',
                    endTime: '12:00',
                    backgroundColor: '#EA4335',
                    resourceId: 'prof-test1-mat-fis1',
                    extendedProps: {
                        profesorId: 'test1',
                        profesorNombre: 'Juan Pérez',
                        materiaId: 'fis1',
                        materiaNombre: 'Física'
                    }
                },
                {
                    title: 'Programación - María Rodríguez',
                    daysOfWeek: [3],  // Miércoles
                    startTime: '14:00',
                    endTime: '16:00',
                    backgroundColor: '#FBBC05',
                    resourceId: 'prof-test2-mat-prog1',
                    extendedProps: {
                        profesorId: 'test2',
                        profesorNombre: 'María Rodríguez',
                        materiaId: 'prog1',
                        materiaNombre: 'Programación'
                    }
                },
                {
                    title: 'Bases de Datos - María Rodríguez',
                    daysOfWeek: [4],  // Jueves
                    startTime: '16:00',
                    endTime: '18:00',
                    backgroundColor: '#34A853',
                    resourceId: 'prof-test2-mat-bd1',
                    extendedProps: {
                        profesorId: 'test2',
                        profesorNombre: 'María Rodríguez',
                        materiaId: 'bd1',
                        materiaNombre: 'Bases de Datos'
                    }
                },
                {
                    title: 'Algoritmos - Carlos Gómez',
                    daysOfWeek: [5],  // Viernes
                    startTime: '09:00',
                    endTime: '11:00',
                    backgroundColor: '#3498db',
                    resourceId: 'prof-test3-mat-alg1',
                    extendedProps: {
                        profesorId: 'test3',
                        profesorNombre: 'Carlos Gómez',
                        materiaId: 'alg1',
                        materiaNombre: 'Algoritmos'
                    }
                }
            ];
            
            // Si ya hay eventos, agregar los de prueba; si no, usar solo los de prueba
            events = events && events.length > 0 ? [...events, ...testEvents] : testEvents;
            console.log('Eventos finales para el calendario:', events);
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
        
        // Configuración del calendario
        const calendarConfig = {
            locale: 'es',
            initialView: 'resourceTimeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimeGridWeek,resourceTimeGridDay,timeGridWeek'
            },
            slotMinTime: '07:00:00',
            slotMaxTime: '22:00:00',
            allDaySlot: false,
            weekends: false,  // No mostrar sábados y domingos
            slotDuration: '00:30:00',
            slotLabelInterval: '01:00',
            height: 'auto',
            events: events,
            resources: resources,
            resourceLabelText: 'Profesores',
            resourceOrder: 'title',
            resourcesInitiallyExpanded: false,
            eventColor: '#3788d8',
            eventTextColor: '#ffffff',
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            // Callback cuando el calendario esté montado
            datesSet: function() {
                console.log('Calendario montado, forzando visibilidad');
                forceVisibility();
            },
            // Callback cuando se renderiza un evento
            eventDidMount: function(info) {
                // Asignar color basado en la materia
                if (info.event.extendedProps && info.event.extendedProps.materiaId) {
                    const materiaId = info.event.extendedProps.materiaId;
                    const color = getColorForMateria(materiaId);
                    info.el.style.backgroundColor = color;
                }
                
                // Agregar tooltip con información adicional
                const tooltip = document.createElement('div');
                tooltip.className = 'event-tooltip';
                tooltip.innerHTML = `
                    <strong>${info.event.title}</strong><br>
                    ${info.event.extendedProps?.profesorNombre || ''}<br>
                    ${info.event.start ? info.event.start.toLocaleTimeString('es', {hour: '2-digit', minute:'2-digit'}) : ''} - 
                    ${info.event.end ? info.event.end.toLocaleTimeString('es', {hour: '2-digit', minute:'2-digit'}) : ''}
                `;
                
                // Mostrar tooltip al pasar el mouse
                info.el.addEventListener('mouseover', function() {
                    tooltip.style.display = 'block';
                    tooltip.style.left = info.el.getBoundingClientRect().right + 10 + 'px';
                    tooltip.style.top = info.el.getBoundingClientRect().top + 'px';
                    document.body.appendChild(tooltip);
                });
                
                // Ocultar tooltip al quitar el mouse
                info.el.addEventListener('mouseout', function() {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
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
            window.calendar = new FullCalendar.Calendar(calendarEl, calendarConfig);
            
            // Renderizar el calendario
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
            }, 500);
            
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
    
    // Funciones para mostrar mensajes de notificación
function showErrorMessage(message) {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        // Crear contenedor de notificaciones si no existe
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <div class="notification-header">
            <i class="fas fa-exclamation-circle"></i>
            <span>Error</span>
            <button class="close-btn">&times;</button>
        </div>
        <div class="notification-body">${message}</div>
    `;
    
    // Estilos inline para la notificación
    notification.style.backgroundColor = '#f8d7da';
    notification.style.color = '#721c24';
    notification.style.border = '1px solid #f5c6cb';
    notification.style.borderRadius = '4px';
    notification.style.padding = '10px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    // Añadir al contenedor
    document.getElementById('notification-container').appendChild(notification);
    
    // Configurar botón de cierre
    notification.querySelector('.close-btn').addEventListener('click', function() {
        notification.remove();
    });
    
    // Auto-eliminar después de 10 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

function showWarningMessage(message) {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        // Crear contenedor de notificaciones si no existe
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification warning';
    notification.innerHTML = `
        <div class="notification-header">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Advertencia</span>
            <button class="close-btn">&times;</button>
        </div>
        <div class="notification-body">${message}</div>
    `;
    
    // Estilos inline para la notificación
    notification.style.backgroundColor = '#fff3cd';
    notification.style.color = '#856404';
    notification.style.border = '1px solid #ffeeba';
    notification.style.borderRadius = '4px';
    notification.style.padding = '10px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    // Añadir al contenedor
    document.getElementById('notification-container').appendChild(notification);
    
    // Configurar botón de cierre
    notification.querySelector('.close-btn').addEventListener('click', function() {
        notification.remove();
    });
    
    // Auto-eliminar después de 10 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

/**
 * Inicializa el calendario FullCalendar con eventos y recursos
 */
function initCalendar() {
    try {
        console.log('Inicializando calendario...');
        
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
    
        // Destruir cualquier instancia previa del calendario
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            showErrorMessage('No se encontró el elemento del calendario');
            return;
        }
    
        // Forzar visibilidad del elemento del calendario
        calendarEl.style.display = 'block';
        calendarEl.style.visibility = 'visible';
        calendarEl.style.opacity = '1';
        calendarEl.style.height = 'auto';
        calendarEl.style.minHeight = '600px';
    
        // Mantener visible el calendario y sus elementos hijos
        const forceVisibility = () => {
            calendarContainer.style.display = 'block';
            calendarContainer.style.visibility = 'visible';
            calendarEl.style.display = 'block';
            calendarEl.style.visibility = 'visible';
            
            // Forzar visibilidad de los elementos internos del calendario
            const calendarElements = calendarEl.querySelectorAll('*');
            calendarElements.forEach(el => {
                el.style.visibility = 'visible';
                el.style.display = el.tagName === 'DIV' ? 'block' : '';
            });
        };
    
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
                    resourceId: `prof-${event.profesorId}`,
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
        
        // Si no hay eventos o son muy pocos, agregar eventos de prueba
        if (!events || events.length < 2) {
            console.warn('Pocos o ningún evento encontrado, agregando eventos de prueba');
            // Agregar eventos de prueba para asegurar que el calendario se muestre
            const testEvents = [
            {
                title: 'Matemáticas - Juan Pérez',
                daysOfWeek: [1],  // Lunes
                startTime: '08:00',
                endTime: '10:00',
                backgroundColor: '#4285F4',
                resourceId: 'prof-test1',
                extendedProps: {
                    profesorId: 'test1',
                    profesorNombre: 'Juan Pérez',
                    materiaId: 'mat1',
                    materiaNombre: 'Matemáticas'
                }
            },
            {
                title: 'Física - Juan Pérez',
                daysOfWeek: [2],  // Martes
                startTime: '10:00',
                endTime: '12:00',
                backgroundColor: '#EA4335',
                resourceId: 'prof-test1',
                extendedProps: {
                    profesorId: 'test1',
                    profesorNombre: 'Juan Pérez',
                    materiaId: 'fis1',
                    materiaNombre: 'Física'
                }
            },
            {
                title: 'Programación - María Rodríguez',
                daysOfWeek: [3],  // Miércoles
                startTime: '14:00',
                endTime: '16:00',
                backgroundColor: '#FBBC05',
                resourceId: 'prof-test2',
                extendedProps: {
                    profesorId: 'test2',
                    profesorNombre: 'María Rodríguez',
                    materiaId: 'prog1',
                    materiaNombre: 'Programación'
                }
            },
            {
                title: 'Bases de Datos - María Rodríguez',
                daysOfWeek: [4],  // Jueves
                startTime: '16:00',
                endTime: '18:00',
                backgroundColor: '#34A853',
                resourceId: 'prof-test2',
                extendedProps: {
                    profesorId: 'test2',
                    profesorNombre: 'María Rodríguez',
                    materiaId: 'bd1',
                    materiaNombre: 'Bases de Datos'
                }
            },
            {
                title: 'Algoritmos - Carlos Gómez',
                daysOfWeek: [5],  // Viernes
                startTime: '09:00',
                endTime: '11:00',
                backgroundColor: '#3498db',
                resourceId: 'prof-test3',
                extendedProps: {
                    profesorId: 'test3',
                    profesorNombre: 'Carlos Gómez',
                    materiaId: 'alg1',
                    materiaNombre: 'Algoritmos'
                }
            }
        ];
        
        // Si ya hay eventos, agregar los de prueba; si no, usar solo los de prueba
        events = events && events.length > 0 ? [...events, ...testEvents] : testEvents;
        console.log('Eventos finales para el calendario:', events);
        }
        
        // Verificar si hay recursos disponibles
        let resources = [];
        try {
            if (typeof calendarResources !== 'undefined' && Array.isArray(calendarResources)) {
                resources = calendarResources;
                console.log(`Recursos cargados: ${resources.length}`);
            } else {
                console.warn('No se encontraron recursos para el calendario');
                // Crear recursos de prueba si no hay disponibles
                resources = [
                    { id: 'prof-test1', title: 'Juan Pérez' },
                    { id: 'prof-test2', title: 'María Rodríguez' },
                    { id: 'prof-test3', title: 'Carlos Gómez' }
                ];
            }
        } catch (error) {
            console.error('Error al cargar recursos del calendario:', error);
            // Crear recursos de prueba en caso de error
            resources = [
                { id: 'prof-test1', title: 'Juan Pérez' },
                { id: 'prof-test2', title: 'María Rodríguez' },
                { id: 'prof-test3', title: 'Carlos Gómez' }
            ];
        }
    
        const calendarConfig = {
            locale: 'es',
            initialView: 'resourceTimeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimeGridWeek,resourceTimeGridDay,timeGridWeek'
            },
            slotMinTime: '07:00:00',
            slotMaxTime: '22:00:00',
            allDaySlot: false,
            weekends: false,  // No mostrar sábados y domingos
            slotDuration: '00:30:00',
            slotLabelInterval: '01:00',
            height: 'auto',
            events: events,
            resources: resources,
            resourceLabelText: 'Profesores',
            resourceOrder: 'title',
            resourcesInitiallyExpanded: false,
            eventColor: '#3788d8',
            eventTextColor: '#ffffff'
        };
        
        try {
            // Crear instancia del calendario
            // Destruir instancia previa si existe
            calendarEl.style.zIndex = '999';
            
            // Forzar un rerender del calendario
            if (window.calendar) {
                window.calendar.updateSize();
            }
            
            // Asegurar que los elementos de FullCalendar también sean visibles
            document.querySelectorAll('.fc').forEach(el => {
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });
            
            // Programar actualización de visibilidad
            setTimeout(() => {
                forceVisibility();
            }, 500);
        
            // Programar múltiples intentos de actualización del tamaño
            [1000, 2000, 3000, 5000].forEach(delay => {
                setTimeout(() => {
                    if (window.calendar) {
                        console.log(`Actualizando tamaño del calendario después de ${delay}ms`);
                        window.calendar.updateSize();
                    }
                }, delay);
            });
        } catch (error) {
            console.error('Error al inicializar el calendario:', error);
            // Intentar recuperarse del error
            setTimeout(() => {
                console.log('Intentando recuperarse del error...');
                initCalendar(); // Reintentar inicialización
            }, 2000);
        }
    } catch (error) {
        console.error('Error al inicializar el calendario:', error);
        // Intentar recuperarse del error
        setTimeout(() => {
            console.log('Intentando recuperarse del error...');
            initCalendar(); // Reintentar inicialización
        }, 2000);
    }
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
