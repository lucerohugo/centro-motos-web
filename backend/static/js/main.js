// Script base reutilizable

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado');
    
    // Cerrar alertas automáticamente después de 5 segundos
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    });
});

// Función para confirmar eliminación
function confirmDelete(url) {
    if (confirm('¿Está seguro de que desea eliminar este elemento?')) {
        window.location.href = url;
    }
}

// Función para hacer fetch JSON
async function fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en fetch:', error);
        throw error;
    }
}
