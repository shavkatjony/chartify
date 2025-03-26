/**
 * State Manager
 * Manages the application state, including objects, layers, undo/redo history
 */
class StateManager {
    constructor() {
        // Object storage
        this.objects = [];
        this.selectedObjects = [];
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Layers
        this.layers = [
            { id: 'layer1', name: 'Layer 1', visible: true, locked: false, objects: [] }
        ];
        this.activeLayerId = 'layer1';
        
        // Initialize
        this.initEventListeners();
        this.updateUndoRedoButtons();
        this.updateLayersPanel();
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Undo/Redo buttons
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            
            // Ctrl+Y or Ctrl+Shift+Z for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
            
            // Delete key for deleting selected objects
            if (e.key === 'Delete' && this.selectedObjects.length > 0) {
                e.preventDefault();
                this.deleteSelectedObjects();
            }
        });
    }
    
    /**
     * Add a new object to the canvas
     */
    addObject(object) {
        // Add object to the active layer
        const layer = this.getActiveLayer();
        layer.objects.push(object);
        this.objects.push(object);
        
        // Add to history
        this.addToHistory({
            type: 'add',
            objects: [object],
            layerId: this.activeLayerId
        });
        
        // Trigger render
        if (window.canvasManager) {
            canvasManager.render();
        }
    }
    
    /**
     * Select an object
     */
    selectObject(object) {
        this.clearSelection();
        this.selectedObjects.push(object);
        object.selected = true;
        
        this.updatePropertiesPanel();
        
        // Trigger render
        if (window.canvasManager) {
            canvasManager.render();
        }
    }
    
    /**
     * Clear the current selection
     */
    clearSelection() {
        this.selectedObjects.forEach(obj => obj.selected = false);
        this.selectedObjects = [];
        
        this.updatePropertiesPanel();
        
        // Trigger render
        if (window.canvasManager) {
            canvasManager.render();
        }
    }
    
    /**
     * Delete selected objects
     */
    deleteSelectedObjects() {
        if (this.selectedObjects.length === 0) return;
        
        // Create a history entry before deleting
        this.addToHistory({
            type: 'delete',
            objects: [...this.selectedObjects],
            layerId: this.activeLayerId
        });
        
        // Remove objects from layer and main objects array
        this.layers.forEach(layer => {
            layer.objects = layer.objects.filter(obj => !this.selectedObjects.includes(obj));
        });
        
        this.objects = this.objects.filter(obj => !this.selectedObjects.includes(obj));
        this.selectedObjects = [];
        
        this.updatePropertiesPanel();
        
        // Trigger render
        if (window.canvasManager) {
            canvasManager.render();
        }
    }
    
    /**
     * Get the active layer
     */
    getActiveLayer() {
        return this.layers.find(layer => layer.id === this.activeLayerId);
    }
    
    /**
     * Add an action to history
     */
    addToHistory(action) {
        // If we're not at the end of the history, truncate it
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Add the new action
        this.history.push(action);
        this.historyIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.updateUndoRedoButtons();
    }
    
    /**
     * Undo the last action
     */
    undo() {
        if (this.historyIndex < 0) return;
        
        const action = this.history[this.historyIndex];
        this.historyIndex--;
        
        this.executeUndoAction(action);
        this.updateUndoRedoButtons();
        
        // Trigger render
        if (window.canvasManager) {
            canvasManager.render();
        }
    }
    
    /**
     * Redo the previously undone action
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1) return;
        
        this.historyIndex++;
        const action = this.history[this.historyIndex];
        
        this.executeRedoAction(action);
        this.updateUndoRedoButtons();
        
        // Trigger render
        if (window.canvasManager) {
            canvasManager.render();
        }
    }
    
    /**
     * Execute an undo action
     */
    executeUndoAction(action) {
        switch (action.type) {
            case 'add':
                // Remove added objects
                action.objects.forEach(obj => {
                    this.objects = this.objects.filter(o => o !== obj);
                    
                    const layer = this.layers.find(l => l.id === action.layerId);
                    if (layer) {
                        layer.objects = layer.objects.filter(o => o !== obj);
                    }
                });
                break;
                
            case 'delete':
                // Re-add deleted objects
                action.objects.forEach(obj => {
                    this.objects.push(obj);
                    
                    const layer = this.layers.find(l => l.id === action.layerId);
                    if (layer) {
                        layer.objects.push(obj);
                    }
                });
                break;
                
            case 'modify':
                // Restore previous properties
                action.objects.forEach(({ object, before }) => {
                    Object.assign(object, before);
                });
                break;
        }
    }
    
    /**
     * Execute a redo action
     */
    executeRedoAction(action) {
        switch (action.type) {
            case 'add':
                // Re-add objects
                action.objects.forEach(obj => {
                    this.objects.push(obj);
                    
                    const layer = this.layers.find(l => l.id === action.layerId);
                    if (layer) {
                        layer.objects.push(obj);
                    }
                });
                break;
                
            case 'delete':
                // Delete objects again
                action.objects.forEach(obj => {
                    this.objects = this.objects.filter(o => o !== obj);
                    
                    const layer = this.layers.find(l => l.id === action.layerId);
                    if (layer) {
                        layer.objects = layer.objects.filter(o => o !== obj);
                    }
                });
                break;
                
            case 'modify':
                // Apply the changes again
                action.objects.forEach(({ object, after }) => {
                    Object.assign(object, after);
                });
                break;
        }
    }
    
    /**
     * Update undo/redo buttons state
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        undoBtn.disabled = this.historyIndex < 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
    
    /**
     * Update the properties panel based on selection
     */
    updatePropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        
        if (this.selectedObjects.length === 0) {
            panel.innerHTML = '<div class="empty-state"><p>Select an element to edit its properties</p></div>';
            return;
        }
        
        // For simplicity, just show properties of the first selected object
        const object = this.selectedObjects[0];
        
        // Basic properties panel with type-specific controls
        panel.innerHTML = `
            <div class="property-group">
                <label>Position</label>
                <div class="property-row">
                    <label>X:</label>
                    <input type="number" id="prop-x" value="${Math.round(object.x)}" step="1">
                    <label>Y:</label>
                    <input type="number" id="prop-y" value="${Math.round(object.y)}" step="1">
                </div>
            </div>
            ${object.width !== undefined ? `
                <div class="property-group">
                    <label>Size</label>
                    <div class="property-row">
                        <label>W:</label>
                        <input type="number" id="prop-width" value="${Math.round(object.width)}" step="1">
                        <label>H:</label>
                        <input type="number" id="prop-height" value="${Math.round(object.height)}" step="1">
                    </div>
                </div>
            ` : ''}
            ${object.fill !== undefined ? `
                <div class="property-group">
                    <label>Fill</label>
                    <input type="color" id="prop-fill" value="${object.fill}">
                    <label>Opacity:</label>
                    <input type="range" id="prop-fill-opacity" min="0" max="1" step="0.1" value="${object.fillOpacity || 1}">
                </div>
            ` : ''}
            ${object.stroke !== undefined ? `
                <div class="property-group">
                    <label>Stroke</label>
                    <input type="color" id="prop-stroke" value="${object.stroke}">
                    <label>Width:</label>
                    <input type="number" id="prop-stroke-width" value="${object.strokeWidth || 1}" min="0" max="20" step="0.5">
                </div>
            ` : ''}
        `;
        
        // Add event listeners to inputs (for simplicity, not implementing here)
    }
    
    /**
     * Update the layers panel
     */
    updateLayersPanel() {
        const panel = document.getElementById('layers-panel');
        
        if (this.layers.length === 0) {
            panel.innerHTML = '<div class="empty-state"><p>No layers yet</p></div>';
            return;
        }
        
        panel.innerHTML = this.layers.map(layer => `
            <div class="layer-item ${layer.id === this.activeLayerId ? 'active' : ''}" data-layer-id="${layer.id}">
                <div class="layer-visibility">
                    <i class="fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </div>
                <div class="layer-name">${layer.name}</div>
                <div class="layer-lock">
                    <i class="fas ${layer.locked ? 'fa-lock' : 'fa-lock-open'}"></i>
                </div>
            </div>
        `).join('');
        
        // Add event listeners (for simplicity, not implementing here)
    }
    
    /**
     * Draw all objects on the canvas
     */
    drawObjects(ctx) {
        // Draw each layer's objects
        this.layers.forEach(layer => {
            if (!layer.visible) return;
            
            layer.objects.forEach(object => {
                if (typeof object.draw === 'function') {
                    object.draw(ctx);
                    
                    // Draw selection outline
                    if (object.selected) {
                        this.drawSelectionOutline(ctx, object);
                    }
                }
            });
        });
    }
    
    /**
     * Draw selection outline around an object
     */
    drawSelectionOutline(ctx, object) {
        ctx.save();
        
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        if (object.type === 'rectangle') {
            ctx.strokeRect(object.x - 2, object.y - 2, object.width + 4, object.height + 4);
        } else if (object.type === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(object.x + object.width / 2, object.y + object.height / 2, 
                        object.width / 2 + 2, object.height / 2 + 2, 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (object.type === 'path') {
            // For free-form paths, draw a bounding box
            const bounds = object.getBounds();
            ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
        }
        
        ctx.restore();
    }
}

// Initialize state manager when DOM is loaded
let stateManager;
document.addEventListener('DOMContentLoaded', () => {
    stateManager = new StateManager();
    window.stateManager = stateManager; // Expose to window for debugging and access from other modules
});
