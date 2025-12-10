/**
 * INnatural Chatbot Widget
 * Bilingual (Arabic/English) AI-powered chatbot for innaturalstores.com
 */

class InnaturalChatbot {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:5000',
      defaultLanguage: config.defaultLanguage || 'en',
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.currentLanguage = this.config.defaultLanguage;
    this.isOpen = false;
    this.userProfile = {};

    this.init();
  }

  /**
   * Initialize the chatbot
   */
  init() {
    this.injectStyles();
    this.createWidget();
    this.attachEventListeners();
    this.loadGreeting();
  }

  /**
   * Inject CSS styles
   */
  injectStyles() {
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = `${this.config.apiUrl}/chatbot.css`;
    document.head.appendChild(linkElement);
  }

  /**
   * Create widget HTML
   */
  createWidget() {
    const widgetHTML = `
      <!-- Chat Button -->
      <button id="innatural-chat-button" aria-label="Open chat">
        🌿
      </button>

      <!-- Chat Widget -->
      <div id="innatural-chat-widget" class="${this.currentLanguage === 'ar' ? 'rtl' : ''}">
        <!-- Header -->
        <div class="innatural-chat-header">
          <div class="innatural-chat-header-content">
            <div class="innatural-chat-avatar">N</div>
            <div class="innatural-chat-title">
              <h3>${this.currentLanguage === 'ar' ? 'نور' : 'Nour'}</h3>
              <p>${this.currentLanguage === 'ar' ? 'مساعدة INnatural' : 'INnatural Assistant'}</p>
            </div>
          </div>
          <button class="innatural-close-btn" aria-label="Close chat">×</button>
        </div>

        <!-- Messages Container -->
        <div class="innatural-chat-messages" id="innatural-messages">
          <!-- Messages will appear here -->
        </div>

        <!-- Input Container -->
        <div class="innatural-chat-input-container">
          <!-- Language Toggle -->
          <div class="innatural-language-toggle">
            <button class="innatural-lang-btn ${this.currentLanguage === 'en' ? 'active' : ''}" data-lang="en">
              English
            </button>
            <button class="innatural-lang-btn ${this.currentLanguage === 'ar' ? 'active' : ''}" data-lang="ar">
              العربية
            </button>
          </div>

          <!-- Input Wrapper -->
          <div class="innatural-chat-input-wrapper">
            <input
              type="text"
              id="innatural-chat-input"
              class="innatural-chat-input"
              placeholder="${this.currentLanguage === 'ar' ? 'اكتبي رسالتك هنا...' : 'Type your message...'}"
              autocomplete="off"
            />
            <button id="innatural-send-btn" class="innatural-send-btn" aria-label="Send message">
              ➤
            </button>
          </div>
        </div>
      </div>
    `;

    // Insert widget into body
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Chat button
    const chatButton = document.getElementById('innatural-chat-button');
    chatButton.addEventListener('click', () => this.toggleChat());

    // Close button
    const closeBtn = document.querySelector('.innatural-close-btn');
    closeBtn.addEventListener('click', () => this.toggleChat());

    // Send button
    const sendBtn = document.getElementById('innatural-send-btn');
    sendBtn.addEventListener('click', () => this.sendMessage());

    // Input enter key
    const input = document.getElementById('innatural-chat-input');
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Language toggle buttons
    const langButtons = document.querySelectorAll('.innatural-lang-btn');
    langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        this.switchLanguage(lang);
      });
    });
  }

  /**
   * Toggle chat open/close
   */
  toggleChat() {
    this.isOpen = !this.isOpen;

    const widget = document.getElementById('innatural-chat-widget');
    const button = document.getElementById('innatural-chat-button');

    if (this.isOpen) {
      widget.classList.add('open');
      button.classList.add('open');
      button.innerHTML = '×';
      this.scrollToBottom();
      document.getElementById('innatural-chat-input').focus();
    } else {
      widget.classList.remove('open');
      button.classList.remove('open');
      button.innerHTML = '🌿';
    }
  }

  /**
   * Switch language
   */
  switchLanguage(language) {
    if (this.currentLanguage === language) return;

    this.currentLanguage = language;
    this.userProfile.language = language;

    // Update active button
    const langButtons = document.querySelectorAll('.innatural-lang-btn');
    langButtons.forEach(btn => {
      if (btn.getAttribute('data-lang') === language) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update RTL class
    const widget = document.getElementById('innatural-chat-widget');
    if (language === 'ar') {
      widget.classList.add('rtl');
    } else {
      widget.classList.remove('rtl');
    }

    // Update placeholder
    const input = document.getElementById('innatural-chat-input');
    input.placeholder = language === 'ar' ? 'اكتبي رسالتك هنا...' : 'Type your message...';

    // Update header
    const title = document.querySelector('.innatural-chat-title h3');
    const subtitle = document.querySelector('.innatural-chat-title p');
    title.textContent = language === 'ar' ? 'نور' : 'Nour';
    subtitle.textContent = language === 'ar' ? 'مساعدة INnatural' : 'INnatural Assistant';

    // Notify language change
    this.addBotMessage(
      language === 'ar'
        ? 'تم التبديل إلى العربية. كيف يمكنني مساعدتك؟'
        : "Switched to English. How can I help you?"
    );
  }

  /**
   * Load initial greeting
   */
  async loadGreeting() {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/greeting?language=${this.currentLanguage}&sessionId=${this.sessionId}`
      );
      const data = await response.json();

      if (data.success) {
        setTimeout(() => {
          this.addBotMessage(data.message);
        }, 500);
      }
    } catch (error) {
      console.error('Error loading greeting:', error);
      this.addBotMessage(
        this.currentLanguage === 'ar'
          ? 'مرحبًا! كيف يمكنني مساعدتك اليوم؟'
          : 'Hello! How can I help you today?'
      );
    }
  }

  /**
   * Send user message with streaming response
   */
  async sendMessage() {
    const input = document.getElementById('innatural-chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    this.addUserMessage(message);

    // Clear input
    input.value = '';

    // Show typing indicator
    this.showTyping();

    try {
      // Send to streaming API
      const response = await fetch(`${this.config.apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId: this.sessionId,
          userProfile: this.userProfile,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Remove typing indicator
      this.hideTyping();

      // Create placeholder for streaming message
      const botMessageDiv = this.createBotMessagePlaceholder();
      let fullMessage = '';

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));

            if (data.type === 'connected') {
              // Connected message
              continue;
            }

            if (data.content && !data.done) {
              // Append new content
              fullMessage += data.content;
              this.updateBotMessage(botMessageDiv, fullMessage);
            }

            if (data.done) {
              if (data.success === false) {
                // Error occurred
                this.updateBotMessage(
                  botMessageDiv,
                  data.message || (this.currentLanguage === 'ar'
                    ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
                    : 'Sorry, an error occurred. Please try again.')
                );
              } else {
                // Success - update message
                this.updateBotMessage(botMessageDiv, fullMessage);
                
                // NEW: Show category buttons if provided
                if (data.showCategories && data.categories) {
                  this.addCategoryButtons(botMessageDiv, data.categories);
                }
                
                // NEW: Show subcategory buttons if provided
                if (data.showSubcategories && data.subcategories) {
                  this.addSubcategoryButtons(botMessageDiv, data.subcategories);
                }
                
                // Show quick replies if no categories/subcategories
                if (!data.showCategories && !data.showSubcategories) {
                  this.addQuickRepliesToMessage(botMessageDiv);
                }
              }
              return;
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      this.hideTyping();
      this.addBotMessage(
        this.currentLanguage === 'ar'
          ? 'عذراً، لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقًا.'
          : 'Sorry, unable to connect to the server. Please try again later.'
      );
    }
  }

  /**
   * Add user message to chat
   */
  addUserMessage(message) {
    const messagesContainer = document.getElementById('innatural-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'innatural-message user';
    messageElement.innerHTML = `
      <div class="innatural-message-bubble">${this.escapeHtml(message)}</div>
    `;
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  /**
   * Add bot message to chat
   */
  addBotMessage(message) {
    const messagesContainer = document.getElementById('innatural-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'innatural-message bot';

    // Convert markdown-style bold text to HTML
    const formattedMessage = this.formatMessage(message);

    messageElement.innerHTML = `
      <div class="innatural-message-bubble">${formattedMessage}</div>
    `;
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  /**
   * Create placeholder for streaming bot message
   */
  createBotMessagePlaceholder() {
    const messagesContainer = document.getElementById('innatural-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'innatural-message bot';
    messageElement.innerHTML = `
      <div class="innatural-message-bubble"></div>
    `;
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
    return messageElement;
  }

  /**
   * Update bot message during streaming
   */
  updateBotMessage(messageElement, text, showQuickReplies = false) {
    const bubble = messageElement.querySelector('.innatural-message-bubble');
    const formattedMessage = this.formatMessage(text);
    bubble.innerHTML = formattedMessage;

    // Add quick replies if requested and not already present
    if (showQuickReplies && !messageElement.querySelector('.innatural-quick-replies')) {
      this.addQuickRepliesToMessage(messageElement);
    }

    this.scrollToBottom();
  }

  /**
   * Add quick reply buttons to a message
   */
  addQuickRepliesToMessage(messageElement) {
    const quickReplies = this.getQuickReplies();

    if (quickReplies.length === 0) return;

    const quickRepliesDiv = document.createElement('div');
    quickRepliesDiv.className = 'innatural-quick-replies';

    quickReplies.forEach(reply => {
      const button = document.createElement('button');
      button.className = 'innatural-quick-reply-btn';
      button.textContent = reply.text;
      button.dataset.action = reply.action;
      button.onclick = () => this.handleQuickReply(reply);
      quickRepliesDiv.appendChild(button);
    });

    messageElement.appendChild(quickRepliesDiv);
  }

  /**
   * Get quick reply options based on context
   */
  getQuickReplies() {
    const lang = this.currentLanguage;

    // Basic quick replies that work for most contexts
    return [
      {
        text: lang === 'ar' ? '💚 منتجات مميزة' : '💚 Featured Products',
        action: 'show_products',
        message: lang === 'ar' ? 'أرني أفضل المنتجات' : 'Show me your best products'
      },
      {
        text: lang === 'ar' ? '💁‍♀️ نصيحة للشعر' : '💁‍♀️ Hair Advice',
        action: 'hair_advice',
        message: lang === 'ar' ? 'أحتاج نصيحة للعناية بشعري' : 'I need hair care advice'
      },
      {
        text: lang === 'ar' ? '📞 تواصل معنا' : '📞 Contact Us',
        action: 'contact',
        message: lang === 'ar' ? 'كيف يمكنني التواصل معكم؟' : 'How can I contact you?'
      },
      {
        text: lang === 'ar' ? '❓ أسئلة شائعة' : '❓ FAQ',
        action: 'faq',
        message: lang === 'ar' ? 'ما هي الأسئلة الشائعة؟' : 'What are the frequently asked questions?'
      }
    ];
  }

  /**
   * Handle quick reply button click
   */
  handleQuickReply(reply) {
    // Remove all quick reply buttons
    document.querySelectorAll('.innatural-quick-replies').forEach(el => el.remove());

    // Send the associated message
    const input = document.getElementById('innatural-chat-input');
    input.value = reply.message;
    this.sendMessage();
  }

  /**
   * Format message (convert markdown to HTML)
   */
  formatMessage(message) {
    // Escape HTML first
    let formatted = this.escapeHtml(message);

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  /**
   * Show typing indicator
   */
  showTyping() {
    const messagesContainer = document.getElementById('innatural-messages');
    const typingElement = document.createElement('div');
    typingElement.className = 'innatural-message bot';
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = `
      <div class="innatural-message-bubble innatural-typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    messagesContainer.appendChild(typingElement);
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTyping() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    const messagesContainer = document.getElementById('innatural-messages');
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }


  /**
   * Add category selection buttons (Corps/Cheveux)
   */
  addCategoryButtons(messageElement, categories) {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'innatural-category-buttons';

    categories.forEach(category => {
      const button = document.createElement('button');
      button.className = 'innatural-category-btn';
      button.innerHTML = `${category.icon || ''} ${category.label}`;
      button.dataset.categoryId = category.id;
      button.onclick = () => this.handleCategorySelection(category);
      buttonsDiv.appendChild(button);
    });

    messageElement.appendChild(buttonsDiv);
    this.scrollToBottom();
  }

  /**
   * Add subcategory selection buttons
   */
  addSubcategoryButtons(messageElement, subcategories) {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'innatural-subcategory-buttons';

    subcategories.forEach(subcategory => {
      const button = document.createElement('button');
      button.className = 'innatural-subcategory-btn';
      button.textContent = subcategory.label;
      button.dataset.subcategoryId = subcategory.id;
      button.onclick = () => this.handleSubcategorySelection(subcategory);
      buttonsDiv.appendChild(button);
    });

    messageElement.appendChild(buttonsDiv);
    this.scrollToBottom();
  }

  /**
   * Handle category selection (Corps/Cheveux)
   */
  handleCategorySelection(category) {
    // Remove all category buttons
    document.querySelectorAll('.innatural-category-buttons').forEach(el => el.remove());

    // Send the category selection as a message
    const input = document.getElementById('innatural-chat-input');
    input.value = category.label;
    this.sendMessage();
  }

  /**
   * Handle subcategory selection
   */
  handleSubcategorySelection(subcategory) {
    // Remove all subcategory buttons
    document.querySelectorAll('.innatural-subcategory-buttons').forEach(el => el.remove());

    // Send the subcategory selection as a message
    const input = document.getElementById('innatural-chat-input');
    input.value = subcategory.label;
    this.sendMessage();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Auto-initialize if configuration is provided
if (window.InnaturalChatbotConfig) {
  document.addEventListener('DOMContentLoaded', () => {
    window.innaturalChatbot = new InnaturalChatbot(window.InnaturalChatbotConfig);
  });
}
