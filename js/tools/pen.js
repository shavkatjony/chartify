// Pen Tool Implementation
class PenTool {
    constructor() {
        this.isDrawing = false;
        this.currentPath = null;
        this.startX = 0;
        this.startY = 0;
        this.points = [];
        this.color = '#000000';
        this.width = 2;
        this.canvas = document.getElementById('drawing-canvas');
    }

    activate() {
        console.log('Pen tool activated');
        this.canvas.style.cursor = 'crosshair';
        this.attachEventListeners();
    }

    deactivate() {
        this.detachEventListeners();
        this.canvas.style.cursor = 'default';
    }

    attachEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // For mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    detachEventListeners() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleMouseDown(e) {
        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        this.startX = coords.x;
        this.startY = coords.y;
        this.isDrawing = true;
        this.points = [{x: this.startX, y: this.startY}];

        // Get current color from the active color swatch
        const activeColorSwatch = document.querySelector('.color-swatch.active');
        if (activeColorSwatch && activeColorSwatch.dataset.color) {
            this.color = activeColorSwatch.dataset.color;
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;

        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        this.points.push({x: coords.x, y: coords.y});
        
        // Draw the current stroke temporarily
        this.drawTemporaryPath();
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;
        
        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        this.points.push({x: coords.x, y: coords.y});
        
        this.finishDrawing();
    }

    handleMouseLeave(e) {
        if (this.isDrawing) {
            this.finishDrawing();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const coords = window.canvasManager.screenToCanvasCoordinates(touch.clientX, touch.clientY);
        this.startX = coords.x;
        this.startY = coords.y;
        this.isDrawing = true;
        this.points = [{x: this.startX, y: this.startY}];

        // Get current color
        const activeColorSwatch = document.querySelector('.color-swatch.active');
        if (activeColorSwatch && activeColorSwatch.dataset.color) {
            this.color = activeColorSwatch.dataset.color;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDrawing || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const coords = window.canvasManager.screenToCanvasCoordinates(touch.clientX, touch.clientY);
        this.points.push({x: coords.x, y: coords.y});
        
        // Draw the current stroke temporarily
        this.drawTemporaryPath();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.isDrawing) return;
        
        this.finishDrawing();
    }

    drawTemporaryPath() {
        // Get the canvas context
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
        
        // Draw the current path
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        if (this.points.length > 0) {
            ctx.moveTo(this.points[0].x, this.points[0].y);
            
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
        }
        
        ctx.stroke();
        
        // Restore context state
        ctx.restore();
        
        // Redraw grid
        window.canvasManager.drawGrid();
    }

    finishDrawing() {
        this.isDrawing = false;
        
        // Create a new path object
        const pathObject = {
            type: 'path',
            points: [...this.points],
            color: this.color,
            width: this.width,
            selected: false,
            
            // Method to draw this path
            draw: function(ctx) {
                ctx.beginPath();
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.width;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                
                if (this.points.length > 0) {
                    ctx.moveTo(this.points[0].x, this.points[0].y);
                    
                    for (let i = 1; i < this.points.length; i++) {
                        ctx.lineTo(this.points[i].x, this.points[i].y);
                    }
                }
                
                ctx.stroke();
            },
            
            // Method to get bounds for selection
            getBounds: function() {
                let minX = Infinity, minY = Infinity;
                let maxX = -Infinity, maxY = -Infinity;
                
                for (const point of this.points) {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                }
                
                return {
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
            }
        };
        
        // Add the path to state manager
        if (window.stateManager) {
            window.stateManager.addObject(pathObject);
        }
        
        // Reset points
        this.points = [];
        
        // Render the canvas
        if (window.canvasManager) {
            window.canvasManager.render();
        }
    }
}

// Initialize and expose globally
window.penTool = new PenTool();
