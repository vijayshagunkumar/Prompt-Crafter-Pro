// events.js - Event handling utilities
export class EventManager {
    constructor() {
        this.handlers = new Map();
    }

    on(element, event, handler, options = {}) {
        if (!this.handlers.has(element)) {
            this.handlers.set(element, new Map());
        }
        
        const elementHandlers = this.handlers.get(element);
        if (!elementHandlers.has(event)) {
            elementHandlers.set(event, new Set());
        }
        
        elementHandlers.get(event).add(handler);
        element.addEventListener(event, handler, options);
    }

    off(element, event, handler) {
        const elementHandlers = this.handlers.get(element);
        if (!elementHandlers || !elementHandlers.has(event)) return;
        
        const handlers = elementHandlers.get(event);
        if (handlers.has(handler)) {
            handlers.delete(handler);
            element.removeEventListener(event, handler);
        }
        
        if (handlers.size === 0) {
            elementHandlers.delete(event);
        }
        
        if (elementHandlers.size === 0) {
            this.handlers.delete(element);
        }
    }

    once(element, event, handler) {
        const onceHandler = (...args) => {
            handler(...args);
            this.off(element, event, onceHandler);
        };
        this.on(element, event, onceHandler);
    }

    emit(element, event, detail = {}) {
        const customEvent = new CustomEvent(event, { detail });
        element.dispatchEvent(customEvent);
    }

    destroy() {
        for (const [element, elementHandlers] of this.handlers) {
            for (const [event, handlers] of elementHandlers) {
                for (const handler of handlers) {
                    element.removeEventListener(event, handler);
                }
            }
        }
        this.handlers.clear();
    }
}

// Global event bus
export const eventBus = {
    events: {},
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    },
    
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
};
