// Debounce and throttle utilities
class DebounceUtils {
    // Debounce function
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        let lastFunc;
        let lastRan;
        
        return function(...args) {
            const context = this;
            
            if (!inThrottle) {
                func.apply(context, args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if (Date.now() - lastRan >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    // Debounce with leading edge
    static debounceLeading(func, wait) {
        return this.debounce(func, wait, true);
    }

    // Debounce with max wait
    static debounceMaxWait(func, wait, maxWait) {
        let timeout;
        let maxTimeout;
        let lastCall = 0;
        
        return function executedFunction(...args) {
            const context = this;
            const now = Date.now();
            
            const later = function() {
                timeout = null;
                maxTimeout = null;
                func.apply(context, args);
            };
            
            clearTimeout(timeout);
            clearTimeout(maxTimeout);
            
            timeout = setTimeout(later, wait);
            
            if (now - lastCall >= maxWait || !maxTimeout) {
                maxTimeout = setTimeout(later, maxWait);
            }
            
            lastCall = now;
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebounceUtils;
} else {
    window.DebounceUtils = DebounceUtils;
}
