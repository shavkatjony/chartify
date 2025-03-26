/**
 * Canvas Manager
 * Handles the drawing canvas and its interactions
 */
class CanvasManager {
    constructor() {
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        // Canvas state
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.showGrid = true;
        this.snapToGrid = false;
        this.gridSize = 20;
        
        // Initialize
        this.initCanvas();
        this.attachEventListeners();
        this.render();
    }
    
    /**
     * Initialize canvas dimensions and settings
     */
    initCanvas() {
        // Set canvas dimensions to match container
        this.resizeCanvas();
        
        // Set initial view to center of canvas
        this.centerCanvas();
    }
    
    /**
     * Resize canvas to match container dimensions
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Also resize minimap
        this.minimapCanvas.width = this.minimapCanvas.parentElement.clientWidth;
        this.minimapCanvas.height = this.minimapCanvas.parentElement.clientHeight;
        
        // Re-render after resize
        this.render();
    }
    
    /**
     * Center the canvas view
     */
    centerCanvas() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.render();
    }
    
    /**
     * Attach event listeners to canvas
     */
    attachEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Mouse events for panning
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Mouse wheel for zooming
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Grid and snap toggles
        document.getElementById('grid-toggle').addEventListener('click', this.toggleGrid.bind(this));
        document.getElementById('snap-toggle').addEventListener('click', this.toggleSnap.bind(this));
        
        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('fit-screen').addEventListener('click', () => this.fitToScreen());
    }
    
    /**
     * Handle mouse down event for panning
     */
    handleMouseDown(e) {
        // Only handle middle mouse button or when Hand tool is active
        const activeToolId = document.querySelector('.tool-btn.active').id;
        
        if (e.button === 1 || activeToolId === 'hand-tool') {
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    /**
     * Handle mouse move event for panning
     */
    handleMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;
            
            this.offsetX += dx / this.zoom;
            this.offsetY += dy / this.zoom;
            
            this.startX = e.clientX;
            this.startY = e.clientY;
            
            this.render();
        }
    }
    
    /**
     * Handle mouse up event for panning
     */
    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        }
    }
    
    /**
     * Handle mouse wheel event for zooming
     */
    handleWheel(e) {
        e.preventDefault();
        
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to canvas coordinates
        const canvasX = (mouseX / this.zoom) - this.offsetX;
        const canvasY = (mouseY / this.zoom) - this.offsetY;
        
        // Adjust zoom level
        const zoomDelta = -e.deltaY / 1000;
        const newZoom = Math.max(0.1, Math.min(5, this.zoom * (1 + zoomDelta)));
        
        // Adjust offset to zoom at mouse position
        if (this.zoom !== newZoom) {
            const scale = newZoom / this.zoom;
            this.zoom = newZoom;
            
            this.offsetX = mouseX / this.zoom - canvasX;
            this.offsetY = mouseY / this.zoom - canvasY;
            
            // Update zoom display
            document.getElementById('zoom-level').textContent = Math.round(this.zoom * 100) + '%';
            
            this.render();
        }
    }
    
    /**
     * Handle touch start event for mobile panning
     */
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.isDragging = true;
            this.startX = touch.clientX;
            this.startY = touch.clientY;
        }
    }
    
    /**
     * Handle touch move event for mobile panning
     */
    handleTouchMove(e) {
        if (this.isDragging && e.touches.length === 1) {
            const touch = e.touches[0];
            const dx = touch.clientX - this.startX;
            const dy = touch.clientY - this.startY;
            
            this.offsetX += dx / this.zoom;
            this.offsetY += dy / this.zoom;
            
            this.startX = touch.clientX;
            this.startY = touch.clientY;
            
            this.render();
        }
    }
    
    /**
     * Handle touch end event for mobile panning
     */
    handleTouchEnd(e) {
        this.isDragging = false;
    }
    
    /**
     * Toggle grid visibility
     */
    toggleGrid() {
        this.showGrid = !this.showGrid;
        document.getElementById('grid-toggle').classList.toggle('active', this.showGrid);
        this.render();
    }
    
    /**
     * Toggle snap to grid
     */
    toggleSnap() {
        this.snapToGrid = !this.snapToGrid;
        document.getElementById('snap-toggle').classList.toggle('active', this.snapToGrid);
        // No need to render, just update the state
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        const newZoom = Math.min(5, this.zoom * 1.2);
        if (this.zoom !== newZoom) {
            this.zoom = newZoom;
            document.getElementById('zoom-level').textContent = Math.round(this.zoom * 100) + '%';
            this.render();
        }
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        const newZoom = Math.max(0.1, this.zoom / 1.2);
        if (this.zoom !== newZoom) {
            this.zoom = newZoom;
            document.getElementById('zoom-level').textContent = Math.round(this.zoom * 100) + '%';
            this.render();
        }
    }
    
    /**
     * Fit canvas contents to screen
     */
    fitToScreen() {
        // For now, just reset to initial view
        this.zoom = 1;
        this.centerCanvas();
        document.getElementById('zoom-level').textContent = '100%';
    }
    
    /**
     * Draw grid on canvas
     */
    drawGrid() {
        if (!this.showGrid) return;
        
        const { width, height } = this.canvas;
        const gridSize = this.gridSize * this.zoom;
        
        // Calculate grid offset
        const offsetX = (this.offsetX * this.zoom) % gridSize;
        const offsetY = (this.offsetY * this.zoom) % gridSize;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = offsetX; x < width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = offsetY; y < height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Render the canvas
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save current transformation
        this.ctx.save();
        
        // Apply transformation (pan and zoom)
        this.ctx.translate(this.offsetX * this.zoom, this.offsetY * this.zoom);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Draw objects from state manager (will be implemented later)
        if (window.stateManager) {
            stateManager.drawObjects(this.ctx);
        }
        
        // Restore transformation
        this.ctx.restore();
        
        // Draw grid (after restoring transformation)
        this.drawGrid();
        
        // Update minimap
        this.updateMinimap();
    }
    
    /**
     * Update minimap
     */
    updateMinimap() {
        // Clear minimap
        this.minimapCtx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Draw a white background
        this.minimapCtx.fillStyle = 'white';
        this.minimapCtx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Draw a border
        this.minimapCtx.strokeStyle = '#ddd';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Draw a rectangle representing the current view
        const viewportWidth = this.canvas.width / this.zoom;
        const viewportHeight = this.canvas.height / this.zoom;
        
        // Calculate scaling factor for minimap
        const scale = Math.min(
            this.minimapCanvas.width / viewportWidth,
            this.minimapCanvas.height / viewportHeight
        ) * 0.8;
        
        // Calculate viewport rectangle
        const x = (this.minimapCanvas.width / 2) - (this.offsetX * scale);
        const y = (this.minimapCanvas.height / 2) - (this.offsetY * scale);
        const width = viewportWidth * scale;
        const height = viewportHeight * scale;
        
        // Draw viewport rectangle
        this.minimapCtx.strokeStyle = '#4a6ee0';
        this.minimapCtx.lineWidth = 2;
        this.minimapCtx.strokeRect(x, y, width, height);
    }
    
    /**
     * Convert screen coordinates to canvas coordinates
     */
    screenToCanvasCoordinates(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (screenX - rect.left) / this.zoom - this.offsetX;
        const y = (screenY - rect.top) / this.zoom - this.offsetY;
        
        if (this.snapToGrid) {
            // Snap to nearest grid point
            return {
                x: Math.round(x / this.gridSize) * this.gridSize,
                y: Math.round(y / this.gridSize) * this.gridSize
            };
        }
        
        return { x, y };
    }
}

// Initialize canvas manager when DOM is loaded
let canvasManager;
document.addEventListener('DOMContentLoaded', () => {
    canvasManager = new CanvasManager();
    window.canvasManager = canvasManager; // Expose to window for debugging and access from other modules
});
