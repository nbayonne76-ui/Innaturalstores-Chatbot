# INnatural AI Chatbot

An intelligent bilingual (Arabic/English) chatbot for innaturalstores.com powered by Claude AI.

## Features

✅ **Product Recommendations** - Suggests products based on hair type and concerns
✅ **Customer Support** - Answers questions about products, ingredients, usage
✅ **Order & Shipping Help** - Handles delivery and order tracking queries
✅ **Lead Collection** - Gathers customer information for follow-up
✅ **Bilingual** - Supports both Arabic and English
✅ **Easy Integration** - Add one script tag to your website

## Project Structure

```
innatural-chatbot/
├── widget/                      # Frontend chat interface
│   ├── index.html              # Demo page to test the chatbot
│   ├── chatbot.js              # Main widget logic
│   ├── chatbot.css             # Styling
│   └── embed.js                # Embeddable script for website
│
├── backend/                     # Node.js API server
│   ├── server.js               # Express server
│   ├── claudeService.js        # Claude AI integration
│   ├── productKnowledge.js     # Product recommendations engine
│   ├── package.json            # Dependencies
│   └── .env.example            # Environment variables template
│
├── config/                      # Configuration files
│   ├── products.json           # Product catalog
│   ├── faqs.json               # Common questions & answers
│   └── bot-personality.json    # Bot behavior settings
│
├── README.md                    # This file
└── DEPLOYMENT.md               # Deployment instructions
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Add your Claude API key to .env
```

### 3. Run Backend Server

```bash
npm start
```

### 4. Test the Widget

Open `widget/index.html` in your browser to see the chatbot in action!

## Integration with innaturalstores.com

Add this single line before the closing `</body>` tag on your website:

```html
<script src="YOUR_BACKEND_URL/embed.js"></script>
```

That's it! The chatbot will appear on your website.

## Next Steps

1. Customize products in `config/products.json`
2. Add FAQs in `config/faqs.json`
3. Adjust bot personality in `config/bot-personality.json`
4. Deploy backend (see DEPLOYMENT.md)
5. Update embed script URL in your website

## Tech Stack

- **Frontend**: Vanilla JavaScript, CSS3
- **Backend**: Node.js, Express
- **AI**: Anthropic Claude API
- **Languages**: Arabic (RTL) + English

## Support

For questions or issues, refer to DEPLOYMENT.md or the inline code comments.
