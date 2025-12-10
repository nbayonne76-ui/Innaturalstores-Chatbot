# INnatural Chatbot - Deployment Guide

This guide will walk you through deploying your INnatural chatbot from development to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Testing](#local-testing)
3. [Get Claude API Key](#get-claude-api-key)
4. [Deploy Backend](#deploy-backend)
5. [Integrate with Website](#integrate-with-website)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, make sure you have:

- ✅ Node.js installed (v16 or higher)
- ✅ npm or yarn package manager
- ✅ A Claude API key (from Anthropic)
- ✅ Access to innaturalstores.com website (to add the script)

---

## Local Testing

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Claude API key
# ANTHROPIC_API_KEY=your_api_key_here
```

### Step 3: Start the Server

```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║   🌿 INnatural Chatbot API Server Running! 🌿       ║
║   Server:  http://localhost:3000                     ║
╚═══════════════════════════════════════════════════════╝
```

### Step 4: Test the Chatbot

Open your browser and go to: **http://localhost:3000**

You should see the demo page. Click the green chat button in the bottom-right corner to test!

---

## Get Claude API Key

### Option 1: Sign Up for Anthropic

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up for an account
3. Go to **API Keys** section
4. Click **Create Key**
5. Copy the key (it starts with `sk-ant-...`)
6. Add it to your `.env` file

### Pricing (as of 2024)

- **Claude 3.5 Sonnet**: ~$3 per million input tokens, ~$15 per million output tokens
- **Estimated cost**: ~$0.01-0.05 per conversation (very affordable!)
- **Free tier**: $5 credit for new accounts

---

## Deploy Backend

You have several options for deploying the backend. Here are the most popular:

### Option 1: Railway (Recommended - Easiest)

**Why Railway?**
- ✅ Free tier available ($5 credit/month)
- ✅ Automatic deployments
- ✅ Built-in environment variables
- ✅ One-click deploy

**Steps:**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository (or upload the `backend` folder)

3. **Add Environment Variables**
   - In Railway dashboard, go to **Variables**
   - Add:
     ```
     ANTHROPIC_API_KEY=your_api_key_here
     PORT=3000
     NODE_ENV=production
     ALLOWED_ORIGINS=https://innaturalstores.com
     ```

4. **Deploy!**
   - Railway will automatically build and deploy
   - You'll get a URL like: `https://your-app.railway.app`

5. **Copy Your URL**
   - This is your `BACKEND_URL` - save it!

---

### Option 2: Vercel

**Why Vercel?**
- ✅ Free tier
- ✅ Excellent performance
- ✅ Easy GitHub integration

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd backend
   vercel
   ```

3. **Add Environment Variables**
   ```bash
   vercel env add ANTHROPIC_API_KEY
   vercel env add ALLOWED_ORIGINS
   ```

4. **Redeploy**
   ```bash
   vercel --prod
   ```

---

### Option 3: Render

**Why Render?**
- ✅ Free tier
- ✅ Auto-deploy from Git
- ✅ Built-in SSL

**Steps:**

1. Go to [render.com](https://render.com)
2. Create **New Web Service**
3. Connect your Git repository
4. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**: Add `ANTHROPIC_API_KEY`
5. Click **Create Web Service**

---

### Option 4: Heroku

**Steps:**

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   cd backend
   heroku create innatural-chatbot
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set ANTHROPIC_API_KEY=your_api_key_here
   heroku config:set ALLOWED_ORIGINS=https://innaturalstores.com
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

---

## Integrate with Website

Once your backend is deployed, add the chatbot to innaturalstores.com:

### Method 1: Simple Embed (Recommended)

Add this **one line** before the closing `</body>` tag in your website:

```html
<script src="https://YOUR_BACKEND_URL/embed.js"></script>
```

**Example:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>INnatural Stores</title>
</head>
<body>
  <!-- Your existing website content -->

  <!-- INnatural Chatbot - Add this before closing </body> -->
  <script src="https://innatural-chatbot.railway.app/embed.js"></script>
</body>
</html>
```

That's it! The chatbot will appear on every page.

---

### Method 2: Custom Configuration

If you want to customize settings:

```html
<script>
  window.InnaturalChatbotConfig = {
    apiUrl: 'https://YOUR_BACKEND_URL',
    defaultLanguage: 'ar' // 'ar' for Arabic, 'en' for English
  };
</script>
<script src="https://YOUR_BACKEND_URL/embed.js"></script>
```

---

### Method 3: Shopify Integration

If innaturalstores.com is on Shopify:

1. **Go to Shopify Admin**
2. **Online Store** → **Themes**
3. **Actions** → **Edit Code**
4. Open `theme.liquid`
5. Find `</body>` tag
6. Add the embed script above it
7. **Save**

---

## Verify Installation

After adding the script:

1. Visit your website
2. Look for the **green chat button** in the bottom-right corner
3. Click it and test the chatbot
4. Try switching between English and Arabic

---

## Customization

### Change Colors

Edit `widget/chatbot.css`:

```css
:root {
  --innatural-primary: #2d5016;  /* Change this */
  --innatural-secondary: #6b8e23; /* And this */
}
```

### Change Bot Name

Edit `config/bot-personality.json`:

```json
{
  "botName": {
    "en": "Nour",  /* Change to your preferred name */
    "ar": "نور"
  }
}
```

### Add More Products

Edit `config/products.json` and add your products:

```json
{
  "id": "new-product",
  "name": {
    "en": "Product Name",
    "ar": "اسم المنتج"
  },
  ...
}
```

### Add More FAQs

Edit `config/faqs.json`:

```json
{
  "question": {
    "en": "Your question?",
    "ar": "سؤالك؟"
  },
  "answer": {
    "en": "Your answer",
    "ar": "إجابتك"
  },
  "keywords": ["relevant", "keywords"]
}
```

---

## Troubleshooting

### Chatbot doesn't appear

- ✅ Check browser console for errors (F12)
- ✅ Verify the embed script URL is correct
- ✅ Make sure backend is running (visit `/api/health`)
- ✅ Check CORS settings in backend `.env`

### "Unable to connect to server" error

- ✅ Backend might be down - check your hosting platform
- ✅ CORS issue - add your website domain to `ALLOWED_ORIGINS`
- ✅ Check API key is valid

### Bot responses are in wrong language

- ✅ The bot auto-detects language from user messages
- ✅ Users can manually switch using language toggle buttons
- ✅ Set `defaultLanguage` in embed config

### Slow responses

- ✅ Normal response time is 2-5 seconds (Claude AI processing)
- ✅ If slower, check your hosting platform performance
- ✅ Consider upgrading hosting plan if needed

---

## Monitoring & Analytics

### Track Usage

Add this to `backend/server.js` to log conversations:

```javascript
// Log chat messages
app.post('/api/chat', async (req, res) => {
  console.log(`[${new Date().toISOString()}] User: ${req.body.message}`);
  // ... rest of code
});
```

### Monitor Costs

- Check Anthropic dashboard: [console.anthropic.com](https://console.anthropic.com/)
- Set up billing alerts
- Monitor token usage

---

## Security Best Practices

1. **Never commit `.env` file** to Git
2. **Use environment variables** for sensitive data
3. **Enable CORS** only for your domain
4. **Use HTTPS** in production (automatically handled by Railway/Vercel/Render)
5. **Rate limiting** - Add if you get spam (use `express-rate-limit`)

---

## Next Steps

- 🔄 **Set up auto-deployment** (push to Git → auto-deploy)
- 📊 **Add analytics** (track popular questions, products)
- 💾 **Add database** (store chat history, leads)
- 📱 **WhatsApp integration** (connect to WhatsApp Business API)
- 📧 **Email notifications** (send leads to sales team)

---

## Support

If you encounter issues:

1. Check the [README.md](README.md) for general info
2. Review backend logs on your hosting platform
3. Test locally first (`npm start`)
4. Check Claude API status: [status.anthropic.com](https://status.anthropic.com)

---

## Cost Estimation

**Monthly costs for 1000 conversations:**

- **Claude API**: ~$10-30 (depends on conversation length)
- **Hosting (Railway)**: Free tier (or $5/month)
- **Total**: ~$10-35/month

**Very affordable for the value it provides!**

---

**🎉 Congratulations! Your chatbot is now live!**

Your customers can now get instant help in Arabic and English, 24/7!
