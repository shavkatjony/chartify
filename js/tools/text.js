// Text Tool Implementation
class TextTool {
    constructor() {
        this.isAdding = false;
        this.currentEditor = null;
        this.color = '#000000';
        this.fontSize = 16;
        this.fontFamily = 'Comic Sans MS, cursive, sans-serif'; // Hand-drawn style font
        this.canvas = document.getElementById('drawing-canvas');
        this.textareaContainer = document.createElement('div');
        this.textareaContainer.id = 'text-editor-container';
        this.textareaContainer.style.position = 'absolute';
        this.textareaContainer.style.zIndex = 1000;
        this.textareaContainer.style.display = 'none';
        document.body.appendChild(this.textareaContainer);
    }

    activate() {
        console.log('Text tool activated');
        this.canvas.style.cursor = 'text';
        this.attachEventListeners();
    }

    deactivate() {
        this.detachEventListeners();
        this.canvas.style.cursor = 'default';
        this.finishEditing();
    }

    attachEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        
        // For mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    }

    detachEventListeners() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    }

    handleMouseDown(e) {
        // First, finish any active editing
        if (this.isAdding) {
            this.finishEditing();
            return;
        }
        
        const coords = window.canvasManager.screenToCanvasCoordinates(e.clientX, e.clientY);
        
        // Check if clicking on an existing text object to edit
        const clickedObject = this.getTextObjectAtPosition(coords.x, coords.y);
        
        if (clickedObject) {
            this.editExistingText(clickedObject, e.clientX, e.clientY);
        } else {
            // Create a new text object
            this.createNewText(coords.x, coords.y, e.clientX, e.clientY);
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length !== 1) return;
        
        // First, finish any active editing
        if (this.isAdding) {
            this.finishEditing();
            return;
        }
        
        const touch = e.touches[0];
        const coords = window.canvasManager.screenToCanvasCoordinates(touch.clientX, touch.clientY);
        
        // Check if tapping on an existing text object to edit
        const clickedObject = this.getTextObjectAtPosition(coords.x, coords.y);
        
        if (clickedObject) {
            this.editExistingText(clickedObject, touch.clientX, touch.clientY);
        } else {
            // Create a new text object
            this.createNewText(coords.x, coords.y, touch.clientX, touch.clientY);
        }
    }

    getTextObjectAtPosition(x, y) {
        // Check if any text object contains this point
        if (window.stateManager) {
            const objects = window.stateManager.objects;
            
            // Check in reverse order (top-most first)
            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                
                if (obj.type === 'text' && 
                    x >= obj.x && 
                    x <= obj.x + obj.width && 
                    y >= obj.y && 
                    y <= obj.y + obj.height) {
                    return obj;
                }
            }
        }
        
        return null;
    }

    createNewText(canvasX, canvasY, screenX, screenY) {
        // Mark as adding text
        this.isAdding = true;
        
        // Get current color from the active color swatch
        const activeColorSwatch = document.querySelector('.color-swatch.active');
        if (activeColorSwatch && activeColorSwatch.dataset.color) {
            this.color = activeColorSwatch.dataset.color;
        }
        
        // Create a new text object
        const textObject = {
            type: 'text',
            x: canvasX,
            y: canvasY,
            text: '',
            color: this.color,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            width: 100, // Initial width, will be updated after editing
            height: this.fontSize * 1.5, // Initial height, will be updated after editing
            selected: false,
            
            // Method to draw this text
            draw: function(ctx) {
                ctx.font = `${this.fontSize}px ${this.fontFamily}`;
                ctx.fillStyle = this.color;
                ctx.textBaseline = 'top';
                
                // Handle multi-line text
                const lines = this.text.split('\n');
                let lineHeight = this.fontSize * 1.2;
                
                lines.forEach((line, index) => {
                    ctx.fillText(line, this.x, this.y + (index * lineHeight));
                });
                
                // If selected, draw a highlight box
                if (this.selected) {
                    ctx.strokeStyle = '#4a90e2';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
                }
            }
        };
        
        // Create a textarea for editing
        this.showTextEditor(textObject, screenX, screenY);
    }

    editExistingText(textObject, screenX, screenY) {
        // Mark as editing
        this.isAdding = true;
        
        // Show the text editor
        this.showTextEditor(textObject, screenX, screenY, true);
    }

    showTextEditor(textObject, screenX, screenY, isEditing = false) {
        // Clear existing editor if any
        this.textareaContainer.innerHTML = '';
        
        // Create textarea element
        const textarea = document.createElement('textarea');
        textarea.style.position = 'absolute';
        textarea.style.fontFamily = textObject.fontFamily;
        textarea.style.fontSize = `${textObject.fontSize}px`;
        textarea.style.color = textObject.color;
        textarea.style.border = '1px solid #4a90e2';
        textarea.style.padding = '4px';
        textarea.style.resize = 'both';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'rgba(255, 255, 255, 0.9)';
        textarea.style.minWidth = '100px';
        textarea.style.minHeight = '50px';
        
        // Set position near the click
        this.textareaContainer.style.left = `${screenX}px`;
        this.textareaContainer.style.top = `${screenY}px`;
        
        // If editing, pre-fill with existing text
        if (isEditing) {
            textarea.value = textObject.text;
            textarea.style.width = `${textObject.width + 20}px`; // Add padding
            textarea.style.height = `${textObject.height + 20}px`; // Add padding
        }
        
        // Add to container and show
        this.textareaContainer.appendChild(textarea);
        this.textareaContainer.style.display = 'block';
        
        // Focus and store reference
        textarea.focus();
        this.currentEditor = {
            textarea: textarea,
            textObject: textObject,
            isEditing: isEditing
        };
        
        // Add event listeners for finishing editing
        textarea.addEventListener('blur', this.finishEditing.bind(this));
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                // Allow shift+enter for line breaks
            } else if (e.key === 'Enter') {
                // Regular enter to finish editing
                e.preventDefault();
                textarea.blur();
            }
        });
    }

    finishEditing() {
        if (!this.isAdding || !this.currentEditor) return;
        
        const { textarea, textObject, isEditing } = this.currentEditor;
        
        // Update the text object with the new text
        textObject.text = textarea.value;
        
        // Calculate dimensions based on the text content
        const ctx = window.canvasManager.ctx;
        ctx.font = `${textObject.fontSize}px ${textObject.fontFamily}`;
        
        // Handle multi-line text
        const lines = textObject.text.split('\n');
        let maxWidth = 0;
        let lineHeight = textObject.fontSize * 1.2;
        
        lines.forEach(line => {
            const metrics = ctx.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
        });
        
        textObject.width = Math.max(maxWidth, 20); // Minimum width of 20px
        textObject.height = Math.max(lines.length * lineHeight, lineHeight); // Minimum height of one line
        
        // Add to state manager if it's a new text
        if (!isEditing && textObject.text.trim() !== '') {
            window.stateManager.addObject(textObject);
        } else if (textObject.text.trim() === '') {
            // If text is empty and it was an existing object, remove it
            if (isEditing) {
                window.stateManager.removeObject(textObject);
            }
        }
        
        // Save state for undo history
        window.stateManager.saveState();
        
        // Hide the editor
        this.textareaContainer.style.display = 'none';
        this.isAdding = false;
        this.currentEditor = null;
        
        // Update canvas
        window.canvasManager.render();
    }
}

// Initialize and expose globally
window.textTool = new TextTool();
