// events.js - Event management
(function() {
    'use strict';
    
    class EventManager {
        constructor() {
            this.events = {};
        }
        
        on(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        }
        
        off(event, callback) {
            if (!this.events[event]) return;
            
            if (callback) {
                const index = this.events[event].indexOf(callback);
                if (index !== -1) {
                    this.events[event].splice(index, 1);
                }
            } else {
                this.events[event] = [];
            }
        }
        
        emit(event, data = null) {
            if (!this.events[event]) return;
            
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
        
        once(event, callback) {
            const onceHandler = (data) => {
                callback(data);
                this.off(event, onceHandler);
            };
            this.on(event, onceHandler);
        }
    }
    
    // Export to global scope
    window.EventManager = EventManager;
    
})();
