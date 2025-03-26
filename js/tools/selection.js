// Selection Tool Implementation
class SelectionTool {
    constructor() {
        this.isSelecting = false;
        this.isDragging = false;
        this.isResizing = false;
        this.startX = 0;
        this.startY = 0;
        this.selectedObjects = [];
        this.selectionRect = {x: 0, y: 0, width: 0, height: 0};
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.resizeHandleSize = 8;
        this.resizeHandle = null;
        this.canvas = document.getElementById('drawing-canvas');
    }

    activate() {
        console.log('Selection tool activated');
        this.canvas.style.cursor = 'default';
        this.attachEventListeners();
    }

    deactivate() {
        this.detachEventListeners();
    }

    attachEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // For mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Keyboard events for deletion
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    detachEventListeners() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        
        this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(e) {
        // Handle delete key to remove selected objects
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedObjects.length > 0) {
            e.preventDefault();
            this.deleteSelectedObjects();
        }
    }

    handleMouseDown(e) {
        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        
        // Check if clicking on a resize handle
        if (this.selectedObjects.length === 1) {
            const resizeHandle = this.getResizeHandleAtPosition(coords.x, coords.y);
            if (resizeHandle) {
                this.isResizing = true;
                this.resizeHandle = resizeHandle;
                this.startX = coords.x;
                this.startY = coords.y;
                return;
            }
        }
        
        // Check if clicking on a selected object
        const clickedObject = this.getObjectAtPosition(coords.x, coords.y);
        
        if (clickedObject) {
            if (!this.isObjectSelected(clickedObject)) {
                // If holding shift, add to selection, otherwise clear selection and select this object
                if (!e.shiftKey) {
                    this.clearSelection();
                }
                this.selectObject(clickedObject);
            }
            
            this.isDragging = true;
            this.startX = coords.x;
            this.startY = coords.y;
            
            // Calculate drag offsets for each selected object
            this.selectedObjects.forEach(obj => {
                obj.dragOffsetX = obj.x ? obj.x - coords.x : 0;
                obj.dragOffsetY = obj.y ? obj.y - coords.y : 0;
            });
        } else {
            // Start a selection rectangle
            this.clearSelection();
            this.isSelecting = true;
            this.startX = coords.x;
            this.startY = coords.y;
            this.selectionRect = {
                x: coords.x,
                y: coords.y,
                width: 0,
                height: 0
            };
        }
    }

    handleMouseMove(e) {
        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        
        // Check if hovering over a resize handle and update cursor
        if (this.selectedObjects.length === 1 && !this.isDragging && !this.isSelecting && !this.isResizing) {
            const resizeHandle = this.getResizeHandleAtPosition(coords.x, coords.y);
            if (resizeHandle) {
                switch (resizeHandle) {
                    case 'nw': case 'se': this.canvas.style.cursor = 'nwse-resize'; break;
                    case 'ne': case 'sw': this.canvas.style.cursor = 'nesw-resize'; break;
                    case 'n': case 's': this.canvas.style.cursor = 'ns-resize'; break;
                    case 'e': case 'w': this.canvas.style.cursor = 'ew-resize'; break;
                }
            } else {
                const obj = this.getObjectAtPosition(coords.x, coords.y);
                this.canvas.style.cursor = obj ? 'move' : 'default';
            }
        }
        
        if (this.isResizing) {
            this.resizeSelectedObject(coords.x, coords.y);
        } else if (this.isDragging) {
            // Move the selected objects
            const dx = coords.x - this.startX;
            const dy = coords.y - this.startY;
            
            this.selectedObjects.forEach(obj => {
                obj.x = obj.dragOffsetX + coords.x;
                obj.y = obj.dragOffsetY + coords.y;
            });
            
            // Update canvas
            window.canvasManager.render();
        } else if (this.isSelecting) {
            // Update selection rectangle
            this.selectionRect = {
                x: Math.min(this.startX, coords.x),
                y: Math.min(this.startY, coords.y),
                width: Math.abs(coords.x - this.startX),
                height: Math.abs(coords.y - this.startY)
            };
            
            // Visualize selection rectangle
            this.drawSelectionRect();
        }
    }

    handleMouseUp(e) {
        if (this.isResizing) {
            this.isResizing = false;
            this.resizeHandle = null;
        } else if (this.isDragging) {
            this.isDragging = false;
            
            // Save state for undo history
            if (window.stateManager) {
                window.stateManager.saveState();
            }
        } else if (this.isSelecting) {
            this.isSelecting = false;
            
            // Select objects within the selection rectangle
            if (window.stateManager) {
                const objectsInSelection = window.stateManager.getObjectsInRect(this.selectionRect);
                objectsInSelection.forEach(obj => this.selectObject(obj));
            }
            
            // Redraw to remove selection rectangle
            window.canvasManager.render();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const coords = window.canvasManager.screenToCanvasCoordinates(touch.clientX, touch.clientY);
        
        // Similar logic to mouseDown but simplified for touch
        const clickedObject = this.getObjectAtPosition(coords.x, coords.y);
        
        if (clickedObject) {
            this.clearSelection();
            this.selectObject(clickedObject);
            
            this.isDragging = true;
            this.startX = coords.x;
            this.startY = coords.y;
            
            // Calculate drag offsets
            this.selectedObjects.forEach(obj => {
                obj.dragOffsetX = obj.x ? obj.x - coords.x : 0;
                obj.dragOffsetY = obj.y ? obj.y - coords.y : 0;
            });
        } else {
            // Start a selection rectangle
            this.clearSelection();
            this.isSelecting = true;
            this.startX = coords.x;
            this.startY = coords.y;
            this.selectionRect = {
                x: coords.x,
                y: coords.y,
                width: 0,
                height: 0
            };
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const coords = window.canvasManager.screenToCanvasCoordinates(touch.clientX, touch.clientY);
        
        if (this.isDragging) {
            // Move the selected objects
            this.selectedObjects.forEach(obj => {
                obj.x = obj.dragOffsetX + coords.x;
                obj.y = obj.dragOffsetY + coords.y;
            });
            
            // Update canvas
            window.canvasManager.render();
        } else if (this.isSelecting) {
            // Update selection rectangle
            this.selectionRect = {
                x: Math.min(this.startX, coords.x),
                y: Math.min(this.startY, coords.y),
                width: Math.abs(coords.x - this.startX),
                height: Math.abs(coords.y - this.startY)
            };
            
            // Visualize selection rectangle
            this.drawSelectionRect();
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        
        if (this.isDragging) {
            this.isDragging = false;
            
            // Save state for undo history
            if (window.stateManager) {
                window.stateManager.saveState();
            }
        } else if (this.isSelecting) {
            this.isSelecting = false;
            
            // Select objects within the selection rectangle
            if (window.stateManager) {
                const objectsInSelection = window.stateManager.getObjectsInRect(this.selectionRect);
                objectsInSelection.forEach(obj => this.selectObject(obj));
            }
            
            // Redraw to remove selection rectangle
            window.canvasManager.render();
        }
    }

    getObjectAtPosition(x, y) {
        // Check if any object contains this point
        if (window.stateManager) {
            const objects = window.stateManager.objects;
            
            // Check in reverse order (top-most first)
            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                
                if (this.isPointInObject(x, y, obj)) {
                    return obj;
                }
            }
        }
        
        return null;
    }

    isPointInObject(x, y, obj) {
        if (obj.type === 'rectangle' || obj.type === 'ellipse' || obj.type === 'triangle') {
            return x >= obj.x && 
                   x <= obj.x + obj.width && 
                   y >= obj.y && 
                   y <= obj.y + obj.height;
        } else if (obj.type === 'path') {
            // For simplicity, use the bounding box
            const bounds = obj.getBounds();
            return x >= bounds.x && 
                   x <= bounds.x + bounds.width && 
                   y >= bounds.y && 
                   y <= bounds.y + bounds.height;
        }
        
        return false;
    }

    getResizeHandleAtPosition(x, y) {
        if (this.selectedObjects.length !== 1) return null;
        
        const obj = this.selectedObjects[0];
        const handles = this.getResizeHandles(obj);
        
        for (const position in handles) {
            const handle = handles[position];
            if (x >= handle.x - this.resizeHandleSize/2 && 
                x <= handle.x + this.resizeHandleSize/2 && 
                y >= handle.y - this.resizeHandleSize/2 && 
                y <= handle.y + this.resizeHandleSize/2) {
                return position;
            }
        }
        
        return null;
    }

    getResizeHandles(obj) {
        const handles = {};
        
        // Only show resize handles for shapes, not paths
        if (obj.type === 'rectangle' || obj.type === 'ellipse' || obj.type === 'triangle') {
            handles.nw = {x: obj.x, y: obj.y};
            handles.n = {x: obj.x + obj.width/2, y: obj.y};
            handles.ne = {x: obj.x + obj.width, y: obj.y};
            handles.e = {x: obj.x + obj.width, y: obj.y + obj.height/2};
            handles.se = {x: obj.x + obj.width, y: obj.y + obj.height};
            handles.s = {x: obj.x + obj.width/2, y: obj.y + obj.height};
            handles.sw = {x: obj.x, y: obj.y + obj.height};
            handles.w = {x: obj.x, y: obj.y + obj.height/2};
        }
        
        return handles;
    }

    resizeSelectedObject(x, y) {
        if (this.selectedObjects.length !== 1) return;
        
        const obj = this.selectedObjects[0];
        
        // Calculate deltas
        const dx = x - this.startX;
        const dy = y - this.startY;
        
        // Update object dimensions based on which handle is being dragged
        switch (this.resizeHandle) {
            case 'nw':
                obj.width -= dx;
                obj.height -= dy;
                obj.x += dx;
                obj.y += dy;
                break;
            case 'n':
                obj.height -= dy;
                obj.y += dy;
                break;
            case 'ne':
                obj.width += dx;
                obj.height -= dy;
                obj.y += dy;
                break;
            case 'e':
                obj.width += dx;
                break;
            case 'se':
                obj.width += dx;
                obj.height += dy;
                break;
            case 's':
                obj.height += dy;
                break;
            case 'sw':
                obj.width -= dx;
                obj.height += dy;
                obj.x += dx;
                break;
            case 'w':
                obj.width -= dx;
                obj.x += dx;
                break;
        }
        
        // Prevent negative dimensions
        if (obj.width < 10) {
            obj.width = 10;
        }
        if (obj.height < 10) {
            obj.height = 10;
        }
        
        // Update start position for next frame
        this.startX = x;
        this.startY = y;
        
        // Redraw canvas
        window.canvasManager.render();
    }

    drawSelectionRect() {
        // Draw a dashed rectangle for selection
        const ctx = window.canvasManager.ctx;
        
        // Save context state
        ctx.save();
        
        // Apply canvas transformation
        ctx.translate(window.canvasManager.offsetX * window.canvasManager.zoom, 
                     window.canvasManager.offsetY * window.canvasManager.zoom);
        ctx.scale(window.canvasManager.zoom, window.canvasManager.zoom);
        
        // Clear the canvas (to redraw from scratch)
        ctx.clearRect(-window.canvasManager.offsetX, -window.canvasManager.offsetY, 
                     window.canvasManager.canvas.width / window.canvasManager.zoom, 
                     window.canvasManager.canvas.height / window.canvasManager.zoom);
        
        // Redraw all existing objects
        if (window.stateManager) {
            window.stateManager.drawObjects(ctx);
        }
        
        // Draw selection rectangle
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.selectionRect.x, this.selectionRect.y, 
                      this.selectionRect.width, this.selectionRect.height);
        ctx.setLineDash([]);
        
        // Restore context state
        ctx.restore();
        
        // Redraw grid
        window.canvasManager.drawGrid();
    }

    drawSelectionHandles() {
        if (this.selectedObjects.length === 1 && !this.isSelecting) {
            const obj = this.selectedObjects[0];
            
            // Only show resize handles for shapes, not paths
            if (obj.type === 'rectangle' || obj.type === 'ellipse' || obj.type === 'triangle') {
                const ctx = window.canvasManager.ctx;
                
                const handles = this.getResizeHandles(obj);
                
                ctx.save();
                ctx.translate(window.canvasManager.offsetX * window.canvasManager.zoom, 
                             window.canvasManager.offsetY * window.canvasManager.zoom);
                ctx.scale(window.canvasManager.zoom, window.canvasManager.zoom);
                
                // Draw the handles
                ctx.fillStyle = '#4a90e2';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                
                for (const position in handles) {
                    const handle = handles[position];
                    ctx.fillRect(handle.x - this.resizeHandleSize/2, handle.y - this.resizeHandleSize/2, 
                                this.resizeHandleSize, this.resizeHandleSize);
                    ctx.strokeRect(handle.x - this.resizeHandleSize/2, handle.y - this.resizeHandleSize/2, 
                                  this.resizeHandleSize, this.resizeHandleSize);
                }
                
                ctx.restore();
            }
        }
    }

    selectObject(obj) {
        if (!this.isObjectSelected(obj)) {
            obj.selected = true;
            this.selectedObjects.push(obj);
            window.canvasManager.render();
        }
    }

    isObjectSelected(obj) {
        return this.selectedObjects.includes(obj);
    }

    clearSelection() {
        this.selectedObjects.forEach(obj => {
            obj.selected = false;
        });
        this.selectedObjects = [];
        window.canvasManager.render();
    }

    deleteSelectedObjects() {
        if (this.selectedObjects.length > 0 && window.stateManager) {
            // Remove all selected objects
            this.selectedObjects.forEach(obj => {
                window.stateManager.removeObject(obj);
            });
            
            // Clear selection
            this.selectedObjects = [];
            
            // Save state for undo history
            window.stateManager.saveState();
            
            // Update canvas
            window.canvasManager.render();
        }
    }
}

// Initialize and expose globally
window.selectionTool = new SelectionTool();
