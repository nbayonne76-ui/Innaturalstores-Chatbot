/**
 * INnatural Chatbot Embed Script
 * Add this script to your website to enable the chatbot
 *
 * Usage:
 * <script src="YOUR_API_URL/embed.js"></script>
 */

(function() {
  'use strict';

  // Get the current script element to extract API URL
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const scriptSrc = currentScript.src;
  const apiUrl = scriptSrc.replace('/embed.js', '');

  // Configuration
  window.InnaturalChatbotConfig = {
    apiUrl: apiUrl,
    defaultLanguage: 'ar', // 'ar' for Arabic, 'en' for English
  };

  // Load chatbot CSS
  const loadCSS = function(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);
  };

  // Load chatbot JS
  const loadJS = function(src, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
  };

  // Initialize chatbot when DOM is ready
  const initialize = function() {
    // Load CSS
    loadCSS(apiUrl + '/chatbot.css');

    // Load JS and initialize
    loadJS(apiUrl + '/chatbot.js', function() {
      if (window.InnaturalChatbot) {
        window.innaturalChatbot = new InnaturalChatbot(window.InnaturalChatbotConfig);
        console.log('✅ INnatural Chatbot loaded successfully');
      } else {
        console.error('❌ Failed to load INnatural Chatbot');
      }
    });
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
