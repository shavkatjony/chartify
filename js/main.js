/**
 * FlowDraw - Main JavaScript file
 * Initializes the application and integrates all components
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('FlowDraw application initialized');
    
    // Initialize UI components
    initializeUI();
    
    // Handle tool selection
    setupToolSelection();
    
    // Initialize modal functionality
    setupModals();
});

/**
 * Initialize UI components
 */
function initializeUI() {
    // Add event listeners for sidebar toggles (for mobile)
    const rightSidebar = document.querySelector('.right-sidebar');
    
    // Set initial active tool
    document.getElementById('select-tool').classList.add('active');
    window.selectionTool.activate();
    
    // Set initial active color
    const defaultColorSwatch = document.querySelector('.color-swatch[data-color="#000000"]');
    if (defaultColorSwatch) {
        defaultColorSwatch.classList.add('active');
    }
}

/**
 * Create placeholder/stub functions for tools not yet implemented
 */
function createPlaceholderTools() {
    // This function is no longer needed as we're implementing real tools
    // We'll keep it for backwards compatibility but it does nothing now
    console.log('All tools are being implemented with real functionality');
}

/**
 * Handle tool selection in the toolbar
 */
function setupToolSelection() {
    const toolButtons = document.querySelectorAll('.tool-btn');
    let activeTool = null;
    
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Deactivate current tool if exists
            if (activeTool) {
                // Find method to deactivate current tool
                const currentToolName = activeTool.id.replace('-tool', '');
                const currentToolInstance = window[currentToolName + 'Tool'];
                if (currentToolInstance && typeof currentToolInstance.deactivate === 'function') {
                    currentToolInstance.deactivate();
                }
            }
            
            // Remove active class from all tool buttons
            toolButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            activeTool = this;
            
            // Activate the selected tool
            const toolId = this.id;
            
            switch (toolId) {
                case 'select-tool':
                    window.selectionTool.activate();
                    break;
                case 'pen-tool':
                    window.penTool.activate();
                    break;
                case 'shape-tool':
                    window.shapeTool.activate();
                    break;
                case 'text-tool':
                    window.textTool.activate();
                    break;
                case 'note-tool':
                    // Placeholder for future implementation
                    console.log('Note tool activated');
                    break;
                case 'connector-tool':
                    window.connectorTool.activate();
                    break;
                case 'eraser-tool':
                    // Placeholder for future implementation
                    console.log('Eraser tool activated');
                    break;
                case 'hand-tool':
                    // Placeholder for future implementation
                    console.log('Hand tool activated');
                    break;
            }
        });
    });
    
    // Handle color selection
    const colorSwatches = document.querySelectorAll('.color-swatch');
    
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            // Remove active class from all swatches
            colorSwatches.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked swatch
            this.classList.add('active');
            
            // Get color value
            const color = this.dataset.color;
            console.log('Selected color:', color);
            
            // If it's the custom color swatch, show color picker
            if (this.classList.contains('custom')) {
                // Open a color picker
                const colorPicker = document.createElement('input');
                colorPicker.type = 'color';
                colorPicker.value = this.dataset.color || '#000000';
                
                colorPicker.addEventListener('input', (e) => {
                    this.dataset.color = e.target.value;
                    this.style.backgroundColor = e.target.value;
                });
                
                colorPicker.addEventListener('change', (e) => {
                    this.dataset.color = e.target.value;
                    this.style.backgroundColor = e.target.value;
                    colorPicker.remove();
                });
                
                colorPicker.click();
                document.body.appendChild(colorPicker);
            }
        });
    });
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Prevent shortcuts when focused on input elements
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key.toLowerCase()) {
            // Tool selection shortcuts
            case 'v': // Selection tool
                document.getElementById('select-tool').click();
                break;
            case 'p': // Pen tool
                document.getElementById('pen-tool').click();
                break;
            case 's': // Shape tool
                document.getElementById('shape-tool').click();
                break;
            case 't': // Text tool
                document.getElementById('text-tool').click();
                break;
            case 'l': // Connector (line) tool
                document.getElementById('connector-tool').click();
                break;
            case 'e': // Eraser tool
                document.getElementById('eraser-tool').click();
                break;
            case 'h': // Hand tool
                document.getElementById('hand-tool').click();
                break;
                
            // Delete selected objects with Delete key
            case 'delete':
                if (window.selectionTool && typeof window.selectionTool.deleteSelected === 'function') {
                    window.selectionTool.deleteSelected();
                }
                break;
                
            // Undo/Redo with Ctrl+Z and Ctrl+Y
            case 'z':
                if (e.ctrlKey) {
                    if (e.shiftKey) {
                        // Ctrl+Shift+Z for Redo
                        if (window.stateManager && typeof window.stateManager.redo === 'function') {
                            window.stateManager.redo();
                        }
                    } else {
                        // Ctrl+Z for Undo
                        if (window.stateManager && typeof window.stateManager.undo === 'function') {
                            window.stateManager.undo();
                        }
                    }
                }
                break;
                
            case 'y':
                if (e.ctrlKey) {
                    // Ctrl+Y for Redo
                    if (window.stateManager && typeof window.stateManager.redo === 'function') {
                        window.stateManager.redo();
                    }
                }
                break;
        }
    });
}

/**
 * Setup modals
 */
function setupModals() {
    // Share button opens share modal
    document.getElementById('share-btn').addEventListener('click', function() {
        document.getElementById('share-modal').classList.add('open');
    });
    
    // Close buttons close their parent modal
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.remove('open');
        });
    });
    
    // Copy link button
    document.getElementById('copy-link').addEventListener('click', function() {
        const linkInput = document.getElementById('share-url');
        linkInput.select();
        document.execCommand('copy');
        this.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
        
        // Reset button text after 2 seconds
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-copy"></i><span>Copy</span>';
        }, 2000);
    });
}
