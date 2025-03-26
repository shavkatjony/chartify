// Connector Tool Implementation
class ConnectorTool {
    constructor() {
        this.isConnecting = false;
        this.startX = 0;
        this.startY = 0;
        this.startObject = null;
        this.endObject = null;
        this.points = [];
        this.color = '#000000';
        this.lineWidth = 2;
        this.lineType = 'straight'; // straight, curved, orthogonal
        this.arrowStart = false;
        this.arrowEnd = true;
        this.canvas = document.getElementById('drawing-canvas');
        
        // Create connector type selector
        this.createConnectorSelector();
    }
    
    createConnectorSelector() {
        // Check if we already have a connector selector
        if (document.getElementById('connector-selector')) return;
        
        // Create the connector selector dropdown
        const selector = document.createElement('div');
        selector.id = 'connector-selector';
        selector.className = 'connector-selector';
        selector.innerHTML = `
            <div class="connector-selector-inner">
                <button data-connector="straight" class="connector-btn active"><i class="fas fa-minus"></i></button>
                <button data-connector="curved" class="connector-btn"><i class="fas fa-wave-square"></i></button>
                <button data-connector="orthogonal" class="connector-btn"><i class="fas fa-project-diagram"></i></button>
                <div class="connector-options">
                    <label><input type="checkbox" id="arrow-start"> Start Arrow</label>
                    <label><input type="checkbox" id="arrow-end" checked> End Arrow</label>
                </div>
            </div>
        `;
        
        // Add connector selector to the toolbar
        const connectorToolBtn = document.getElementById('connector-tool');
        connectorToolBtn.parentNode.insertBefore(selector, connectorToolBtn.nextSibling);
        
        // Initially hide it
        selector.style.display = 'none';
        
        // Add event listeners for connector buttons
        const connectorBtns = selector.querySelectorAll('.connector-btn');
        connectorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                connectorBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Set current connector
                this.lineType = btn.dataset.connector;
            });
        });
        
        // Add event listeners for arrow checkboxes
        const arrowStartCheckbox = document.getElementById('arrow-start');
        const arrowEndCheckbox = document.getElementById('arrow-end');
        
        arrowStartCheckbox.addEventListener('change', (e) => {
            this.arrowStart = e.target.checked;
        });
        
        arrowEndCheckbox.addEventListener('change', (e) => {
            this.arrowEnd = e.target.checked;
        });
    }

    activate() {
        console.log('Connector tool activated');
        this.canvas.style.cursor = 'crosshair';
        this.attachEventListeners();
        
        // Show connector selector
        const selector = document.getElementById('connector-selector');
        if (selector) selector.style.display = 'block';
    }

    deactivate() {
        this.detachEventListeners();
        this.canvas.style.cursor = 'default';
        
        // Hide connector selector
        const selector = document.getElementById('connector-selector');
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
        
        // Check if clicking on an object to start the connector
        const clickedObject = this.getObjectAtPosition(coords.x, coords.y);
        
        if (clickedObject) {
            this.startObject = clickedObject;
            const connectionPoint = this.findClosestConnectionPoint(clickedObject, coords.x, coords.y);
            this.startX = connectionPoint.x;
            this.startY = connectionPoint.y;
        } else {
            this.startObject = null;
            this.startX = coords.x;
            this.startY = coords.y;
        }
        
        this.isConnecting = true;
        this.points = [{x: this.startX, y: this.startY}];
        
        // Get current color from the active color swatch
        const activeColorSwatch = document.querySelector('.color-swatch.active');
        if (activeColorSwatch && activeColorSwatch.dataset.color) {
            this.color = activeColorSwatch.dataset.color;
        }
    }

    handleMouseMove(e) {
        if (!this.isConnecting) return;

        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        
        // Update points based on connector type
        this.updatePoints(coords.x, coords.y);
        
        // Draw the current connector temporarily
        this.drawTemporaryConnector();
    }

    handleMouseUp(e) {
        if (!this.isConnecting) return;
        
        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        
        // Check if ending the connector on an object
        this.endObject = this.getObjectAtPosition(coords.x, coords.y);
        
        // If ending on an object, snap to the closest connection point
        if (this.endObject) {
            const connectionPoint = this.findClosestConnectionPoint(this.endObject, coords.x, coords.y);
            coords.x = connectionPoint.x;
            coords.y = connectionPoint.y;
        }
        
        // Update points for the final position
        this.updatePoints(coords.x, coords.y);
        
        this.finishConnecting();
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const coords = window.canvasManager.screenToCanvasCoordinates(touch.clientX, touch.clientY);
        
        // Check if tapping on an object to start the connector
        const clickedObject = this.getObjectAtPosition(coords.x, coords.y);
        
        if (clickedObject) {
            this.startObject = clickedObject;
            const connectionPoint = this.findClosestConnectionPoint(clickedObject, coords.x, coords.y);
            this.startX = connectionPoint.x;
            this.startY = connectionPoint.y;
        } else {
            this.startObject = null;
            this.startX = coords.x;
            this.startY = coords.y;
        }
        
        this.isConnecting = true;
        this.points = [{x: this.startX, y: this.startY}];
        
        // Get current color
        const activeColorSwatch = document.querySelector('.color-swatch.active');
        if (activeColorSwatch && activeColorSwatch.dataset.color) {
            this.color = activeColorSwatch.dataset.color;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isConnecting || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const coords = window.canvasManager.screenToCanvasCoordinates(touch.clientX, touch.clientY);
        
        // Update points based on connector type
        this.updatePoints(coords.x, coords.y);
        
        // Draw the current connector temporarily
        this.drawTemporaryConnector();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.isConnecting) return;
        
        // Use the last touch position for the end point
        let endX = this.points[this.points.length - 1].x;
        let endY = this.points[this.points.length - 1].y;
        
        // Check if ending the connector on an object
        this.endObject = this.getObjectAtPosition(endX, endY);
        
        // If ending on an object, snap to the closest connection point
        if (this.endObject) {
            const connectionPoint = this.findClosestConnectionPoint(this.endObject, endX, endY);
            endX = connectionPoint.x;
            endY = connectionPoint.y;
            
            // Update the last point
            this.updatePoints(endX, endY);
        }
        
        this.finishConnecting();
    }

    getObjectAtPosition(x, y) {
        // Check if any object contains this point (excluding connectors)
        if (window.stateManager) {
            const objects = window.stateManager.objects;
            
            // Check in reverse order (top-most first)
            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                
                // Skip connector objects
                if (obj.type === 'connector') continue;
                
                if (this.isPointInObject(x, y, obj)) {
                    return obj;
                }
            }
        }
        
        return null;
    }

    isPointInObject(x, y, obj) {
        if (obj.type === 'rectangle' || obj.type === 'ellipse' || obj.type === 'triangle' || obj.type === 'text') {
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

    findClosestConnectionPoint(obj, x, y) {
        // Define standard connection points (center of each side)
        const points = [];
        
        if (obj.type === 'rectangle' || obj.type === 'ellipse' || obj.type === 'triangle' || obj.type === 'text') {
            // Top center
            points.push({
                x: obj.x + obj.width / 2, 
                y: obj.y
            });
            
            // Right center
            points.push({
                x: obj.x + obj.width, 
                y: obj.y + obj.height / 2
            });
            
            // Bottom center
            points.push({
                x: obj.x + obj.width / 2, 
                y: obj.y + obj.height
            });
            
            // Left center
            points.push({
                x: obj.x, 
                y: obj.y + obj.height / 2
            });
        } else if (obj.type === 'path') {
            // For paths, use the center of the bounding box
            const bounds = obj.getBounds();
            points.push({
                x: bounds.x + bounds.width / 2,
                y: bounds.y + bounds.height / 2
            });
        }
        
        // Find the closest point
        let closestPoint = null;
        let closestDistance = Infinity;
        
        for (const point of points) {
            const distance = Math.sqrt(
                Math.pow(point.x - x, 2) + 
                Math.pow(point.y - y, 2)
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = point;
            }
        }
        
        return closestPoint || {x: x, y: y};
    }

    updatePoints(endX, endY) {
        // Reset points to just the start point
        this.points = [{x: this.startX, y: this.startY}];
        
        // Add intermediate points based on connector type
        switch (this.lineType) {
            case 'straight':
                // Just add the end point
                this.points.push({x: endX, y: endY});
                break;
                
            case 'curved':
                // Add a control point for bezier curve
                const controlX = (this.startX + endX) / 2;
                const controlY = (this.startY + endY) / 2 - 50; // Offset for curve
                this.points.push({x: controlX, y: controlY, isControl: true});
                this.points.push({x: endX, y: endY});
                break;
                
            case 'orthogonal':
                // Add points for right-angle connections
                const midX = (this.startX + endX) / 2;
                this.points.push({x: midX, y: this.startY});
                this.points.push({x: midX, y: endY});
                this.points.push({x: endX, y: endY});
                break;
        }
    }

    drawTemporaryConnector() {
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
        
        // Set styles
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        
        // Draw the connector based on type
        ctx.beginPath();
        
        switch (this.lineType) {
            case 'straight':
                ctx.moveTo(this.points[0].x, this.points[0].y);
                ctx.lineTo(this.points[1].x, this.points[1].y);
                break;
                
            case 'curved':
                ctx.moveTo(this.points[0].x, this.points[0].y);
                ctx.quadraticCurveTo(
                    this.points[1].x, this.points[1].y, // Control point
                    this.points[2].x, this.points[2].y  // End point
                );
                break;
                
            case 'orthogonal':
                ctx.moveTo(this.points[0].x, this.points[0].y);
                
                for (let i = 1; i < this.points.length; i++) {
                    ctx.lineTo(this.points[i].x, this.points[i].y);
                }
                break;
        }
        
        ctx.stroke();
        
        // Draw arrows if needed
        if (this.arrowStart) {
            this.drawArrow(ctx, this.points[1], this.points[0]);
        }
        
        if (this.arrowEnd) {
            const lastIndex = this.points.length - 1;
            const secondLastIndex = this.lineType === 'curved' ? lastIndex : lastIndex - 1;
            this.drawArrow(ctx, this.points[secondLastIndex], this.points[lastIndex]);
        }
        
        // Restore context state
        ctx.restore();
        
        // Redraw grid
        window.canvasManager.drawGrid();
    }

    drawArrow(ctx, from, to) {
        // Calculate the arrow direction
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);
        
        // Arrow properties
        const arrowLength = 15;
        const arrowWidth = 8;
        
        // Calculate arrow points
        const x1 = to.x - arrowLength * Math.cos(angle - Math.PI/6);
        const y1 = to.y - arrowLength * Math.sin(angle - Math.PI/6);
        const x2 = to.x - arrowLength * Math.cos(angle + Math.PI/6);
        const y2 = to.y - arrowLength * Math.sin(angle + Math.PI/6);
        
        // Draw the arrow
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    finishConnecting() {
        this.isConnecting = false;
        
        // Create a new connector object
        const connectorObject = {
            type: 'connector',
            points: [...this.points],
            startObject: this.startObject ? window.stateManager.objects.indexOf(this.startObject) : null,
            endObject: this.endObject ? window.stateManager.objects.indexOf(this.endObject) : null,
            lineType: this.lineType,
            color: this.color,
            lineWidth: this.lineWidth,
            arrowStart: this.arrowStart,
            arrowEnd: this.arrowEnd,
            selected: false,
            
            // Method to draw this connector
            draw: function(ctx) {
                // Set styles
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.lineWidth;
                
                // Draw the connector based on type
                ctx.beginPath();
                
                switch (this.lineType) {
                    case 'straight':
                        ctx.moveTo(this.points[0].x, this.points[0].y);
                        ctx.lineTo(this.points[1].x, this.points[1].y);
                        break;
                        
                    case 'curved':
                        ctx.moveTo(this.points[0].x, this.points[0].y);
                        ctx.quadraticCurveTo(
                            this.points[1].x, this.points[1].y, // Control point
                            this.points[2].x, this.points[2].y  // End point
                        );
                        break;
                        
                    case 'orthogonal':
                        ctx.moveTo(this.points[0].x, this.points[0].y);
                        
                        for (let i = 1; i < this.points.length; i++) {
                            ctx.lineTo(this.points[i].x, this.points[i].y);
                        }
                        break;
                }
                
                ctx.stroke();
                
                // Draw arrows if needed
                if (this.arrowStart) {
                    connectorTool.drawArrow(ctx, this.points[1], this.points[0]);
                }
                
                if (this.arrowEnd) {
                    const lastIndex = this.points.length - 1;
                    const secondLastIndex = this.lineType === 'curved' ? lastIndex : lastIndex - 1;
                    connectorTool.drawArrow(ctx, this.points[secondLastIndex], this.points[lastIndex]);
                }
                
                // If selected, highlight the connector
                if (this.selected) {
                    // Draw points as small circles
                    ctx.fillStyle = '#4a90e2';
                    
                    for (const point of this.points) {
                        if (!point.isControl) { // Don't show control points
                            ctx.beginPath();
                            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
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
        
        // Add the connector to state manager
        if (window.stateManager) {
            window.stateManager.addObject(connectorObject);
        }
        
        // Reset points
        this.points = [];
        this.startObject = null;
        this.endObject = null;
        
        // Render the canvas
        if (window.canvasManager) {
            window.canvasManager.render();
        }
    }
}

// Initialize and expose globally
window.connectorTool = new ConnectorTool();
