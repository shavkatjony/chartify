// Shapes Tool Implementation
class ShapesTool {
    constructor() {
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.currentShape = 'rectangle'; // rectangle, ellipse, triangle
        this.color = '#000000';
        this.fillColor = 'rgba(255, 255, 255, 0.5)';
        this.strokeWidth = 2;
        this.canvas = document.getElementById('drawing-canvas');
        
        // Create shape type selector
        this.createShapeSelector();
    }
    
    createShapeSelector() {
        // Check if we already have a shape selector
        if (document.getElementById('shape-selector')) return;
        
        // Create the shape selector dropdown
        const selector = document.createElement('div');
        selector.id = 'shape-selector';
        selector.className = 'shape-selector';
        selector.innerHTML = `
            <div class="shape-selector-inner">
                <button data-shape="rectangle" class="shape-btn active"><i class="fas fa-square"></i></button>
                <button data-shape="ellipse" class="shape-btn"><i class="fas fa-circle"></i></button>
                <button data-shape="triangle" class="shape-btn"><i class="fas fa-play" style="transform: rotate(90deg);"></i></button>
            </div>
        `;
        
        // Add shape selector to the toolbar
        const shapeToolBtn = document.getElementById('shape-tool');
        shapeToolBtn.parentNode.insertBefore(selector, shapeToolBtn.nextSibling);
        
        // Initially hide it
        selector.style.display = 'none';
        
        // Add event listeners for shape buttons
        const shapeBtns = selector.querySelectorAll('.shape-btn');
        shapeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                shapeBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Set current shape
                this.currentShape = btn.dataset.shape;
            });
        });
    }

    activate() {
        console.log('Shape tool activated');
        this.canvas.style.cursor = 'crosshair';
        this.attachEventListeners();
        
        // Show shape selector
        const selector = document.getElementById('shape-selector');
        if (selector) selector.style.display = 'block';
    }

    deactivate() {
        this.detachEventListeners();
        this.canvas.style.cursor = 'default';
        
        // Hide shape selector
        const selector = document.getElementById('shape-selector');
        if (selector) selector.style.display = 'none';
    }

    attachEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // For mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    detachEventListeners() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        
        this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleMouseDown(e) {
        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        this.startX = coords.x;
        this.startY = coords.y;
        this.isDrawing = true;

        // Get current color from the active color swatch
        const activeColorSwatch = document.querySelector('.color-swatch.active');
        if (activeColorSwatch && activeColorSwatch.dataset.color) {
            this.color = activeColorSwatch.dataset.color;
            
            // Use a semi-transparent version of the stroke color for fill
            const hex = activeColorSwatch.dataset.color;
            this.fillColor = hex + '33'; // 20% opacity version
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;

        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        this.endX = coords.x;
        this.endY = coords.y;
        
        // Draw the current shape temporarily
        this.drawTemporaryShape();
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;
        
        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        this.endX = coords.x;
        this.endY = coords.y;
        
        this.finishDrawing();
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const coords = window.canvasManager.screenToCanvasCoordinates(touch.clientX, touch.clientY);
        this.startX = coords.x;
        this.startY = coords.y;
        this.isDrawing = true;

        // Get current color
        const activeColorSwatch = document.querySelector('.color-swatch.active');
        if (activeColorSwatch && activeColorSwatch.dataset.color) {
            this.color = activeColorSwatch.dataset.color;
            
            // Use a semi-transparent version of the stroke color for fill
            const hex = activeColorSwatch.dataset.color;
            this.fillColor = hex + '33'; // 20% opacity version
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDrawing || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const coords = window.canvasManager.screenToCanvasCoordinates(touch.clientX, touch.clientY);
        this.endX = coords.x;
        this.endY = coords.y;
        
        // Draw the current shape temporarily
        this.drawTemporaryShape();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.isDrawing) return;
        
        this.finishDrawing();
    }

    drawTemporaryShape() {
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
        
        // Calculate dimensions
        const x = Math.min(this.startX, this.endX);
        const y = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        const height = Math.abs(this.endY - this.startY);
        
        // Set styles
        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        
        // Draw the shape
        switch (this.currentShape) {
            case 'rectangle':
                ctx.beginPath();
                ctx.rect(x, y, width, height);
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'ellipse':
                ctx.beginPath();
                ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(x + width / 2, y); // Top center
                ctx.lineTo(x, y + height); // Bottom left
                ctx.lineTo(x + width, y + height); // Bottom right
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
        }
        
        // Restore context state
        ctx.restore();
        
        // Redraw grid
        window.canvasManager.drawGrid();
    }

    finishDrawing() {
        this.isDrawing = false;
        
        // Calculate dimensions
        const x = Math.min(this.startX, this.endX);
        const y = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        const height = Math.abs(this.endY - this.startY);
        
        // Skip creating very small shapes (likely clicks)
        if (width < 5 && height < 5) return;
        
        // Create a new shape object
        let shapeObject;
        
        switch (this.currentShape) {
            case 'rectangle':
                shapeObject = {
                    type: 'rectangle',
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    fill: this.fillColor,
                    stroke: this.color,
                    strokeWidth: this.strokeWidth,
                    selected: false,
                    
                    // Method to draw this shape
                    draw: function(ctx) {
                        ctx.fillStyle = this.fill;
                        ctx.strokeStyle = this.stroke;
                        ctx.lineWidth = this.strokeWidth;
                        
                        ctx.beginPath();
                        ctx.rect(this.x, this.y, this.width, this.height);
                        ctx.fill();
                        ctx.stroke();
                    }
                };
                break;
                
            case 'ellipse':
                shapeObject = {
                    type: 'ellipse',
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    fill: this.fillColor,
                    stroke: this.color,
                    strokeWidth: this.strokeWidth,
                    selected: false,
                    
                    // Method to draw this shape
                    draw: function(ctx) {
                        ctx.fillStyle = this.fill;
                        ctx.strokeStyle = this.stroke;
                        ctx.lineWidth = this.strokeWidth;
                        
                        ctx.beginPath();
                        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, 
                                   this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                };
                break;
                
            case 'triangle':
                shapeObject = {
                    type: 'triangle',
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    fill: this.fillColor,
                    stroke: this.color,
                    strokeWidth: this.strokeWidth,
                    selected: false,
                    
                    // Method to draw this shape
                    draw: function(ctx) {
                        ctx.fillStyle = this.fill;
                        ctx.strokeStyle = this.stroke;
                        ctx.lineWidth = this.strokeWidth;
                        
                        ctx.beginPath();
                        ctx.moveTo(this.x + this.width / 2, this.y); // Top center
                        ctx.lineTo(this.x, this.y + this.height); // Bottom left
                        ctx.lineTo(this.x + this.width, this.y + this.height); // Bottom right
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }
                };
                break;
        }
        
        // Add the shape to state manager
        if (window.stateManager && shapeObject) {
            window.stateManager.addObject(shapeObject);
        }
        
        // Render the canvas
        if (window.canvasManager) {
            window.canvasManager.render();
        }
    }
}

// Initialize and expose globally
window.shapeTool = new ShapesTool();
