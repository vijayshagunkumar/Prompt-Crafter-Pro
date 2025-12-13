// utilities.js - Utility Functions (UPDATED & COMPLETE)

import { STORAGE_KEYS } from './constants.js';

/**
 * Save data to localStorage as JSON
 * @param {string} key - Storage key
 * @param {any} value - Data to save
 * @returns {boolean} Success status
 */
export function saveJSON(key, value) {
  try {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid storage key');
    }
    
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    
    // Try to save at least basic data
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else if (typeof value === 'number') {
        localStorage.setItem(key, value.toString());
      } else if (typeof value === 'boolean') {
        localStorage.setItem(key, value ? 'true' : 'false');
      }
      return true;
    } catch (fallbackError) {
      console.error('Fallback save also failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @param {any} fallback - Default value if not found
 * @returns {any} Parsed data or fallback
 */
export function loadJSON(key, fallback = null) {
  try {
    if (!key || typeof key !== 'string') {
      return fallback;
    }
    
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    
    // Try to parse as basic types
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) {
        return fallback;
      }
      
      // Try to guess the type
      if (raw === 'true' || raw === 'false') {
        return raw === 'true';
      }
      
      const num = Number(raw);
      if (!isNaN(num) && raw.trim() !== '') {
        return num;
      }
      
      return raw;
    } catch (fallbackError) {
      console.error('Fallback load also failed:', fallbackError);
      return fallback;
    }
  }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function removeJSON(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all app data from localStorage
 * @returns {boolean} Success status
 */
export function clearAllStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear any other keys that start with our app prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('prompt') || key.startsWith('OPENAI'))) {
        localStorage.removeItem(key);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Whether to call immediately
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function to limit function execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate a unique ID
 * @param {number} length - Length of ID (optional)
 * @returns {string} Unique ID
 */
export function generateId(length = 12) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2);
  const id = (timestamp + random).substr(0, length);
  return id;
}

/**
 * Format date to readable string
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format style ('short', 'medium', 'long', 'relative')
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'medium') {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (format === 'relative') {
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
    }
    
    const formats = {
      short: d.toLocaleDateString(),
      medium: d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      long: d.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      time: d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      }),
      iso: d.toISOString()
    };
    
    return formats[format] || formats.medium;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text to copy');
    }
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback method for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Clipboard error:', error);
    return false;
  }
}

/**
 * Download content as a file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} type - MIME type
 * @returns {boolean} Success status
 */
export function downloadFile(content, filename = 'file.txt', type = 'text/plain') {
  try {
    if (!content) {
      throw new Error('No content to download');
    }
    
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Download error:', error);
    return false;
  }
}

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {boolean} keepWords - Whether to keep whole words
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100, keepWords = true) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  if (keepWords) {
    // Try to break at word boundary
    const truncated = text.substr(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) { // Only if we're not cutting too much
      return truncated.substr(0, lastSpace) + '...';
    }
  }
  
  return text.substr(0, maxLength) + '...';
}

/**
 * Calculate reading time for text
 * @param {string} text - Text to calculate
 * @param {number} wordsPerMinute - Reading speed (default: 200)
 * @returns {Object} Reading time in minutes and words
 */
export function calculateReadingTime(text, wordsPerMinute = 200) {
  if (!text || typeof text !== 'string') {
    return { minutes: 0, words: 0 };
  }
  
  const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return {
    minutes,
    words,
    text: minutes === 1 ? '1 min read' : `${minutes} min read`
  };
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Unescape HTML special characters
 * @param {string} text - Text to unescape
 * @returns {string} Unescaped text
 */
export function unescapeHtml(text) {
  if (!text || typeof text !== 'string') return '';
  
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

/**
 * Check if browser supports feature
 * @param {string} feature - Feature to check
 * @returns {boolean} True if supported
 */
export function isFeatureSupported(feature) {
  const features = {
    speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window,
    clipboard: 'clipboard' in navigator,
    localStorage: 'localStorage' in window,
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    webWorkers: 'Worker' in window,
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    pushManager: 'PushManager' in window
  };
  
  return features[feature] || false;
}

/**
 * Get browser information
 * @returns {Object} Browser info
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let version = '';
  
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
    version = ua.match(/Edg\/(\d+)/)?.[1] || '';
  }
  
  return {
    browser,
    version,
    userAgent: ua,
    platform: navigator.platform,
    language: navigator.language,
    isMobile: isMobileDevice(),
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    },
    window: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate random color
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
export function getRandomColor(opacity = 1) {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate gradient from color
 * @param {string} color - Base color
 * @returns {string} Gradient string
 */
export function generateGradient(color) {
  return `linear-gradient(135deg, ${color} 0%, ${getRandomColor(0.8)} 100%)`;
}

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalizeWords(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate slug from text
 * @param {string} text - Text to slugify
 * @returns {string} Slug
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse query parameters from URL
 * @returns {Object} Query parameters
 */
export function getQueryParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  
  queryString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });
  
  return params;
}

/**
 * Create query string from object
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
export function createQueryString(params) {
  if (!params || typeof params !== 'object') return '';
  
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  
  return obj;
}

/**
 * Merge objects deeply
 * @param {Object} target - Target object
 * @param {...Object} sources - Source objects
 * @returns {Object} Merged object
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

/**
 * Check if value is object
 * @param {any} item - Item to check
 * @returns {boolean} True if object
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Sleep for specified time
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after sleep
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Function result
 */
export async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(2, i));
      }
    }
  }
  
  throw lastError;
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid format
 */
export function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return false;
  
  const trimmedKey = apiKey.trim();
  
  // OpenAI keys start with 'sk-'
  if (trimmedKey.startsWith('sk-')) {
    return trimmedKey.length >= 20;
  }
  
  // Other API key patterns can be added here
  return trimmedKey.length >= 10;
}

/**
 * Get current timestamp
 * @returns {string} ISO timestamp
 */
export function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Measure execution time
 * @param {Function} fn - Function to measure
 * @param {...any} args - Function arguments
 * @returns {Object} Result and execution time
 */
export function measureTime(fn, ...args) {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();
  
  return {
    result,
    time: end - start,
    timeFormatted: `${(end - start).toFixed(2)}ms`
  };
}
