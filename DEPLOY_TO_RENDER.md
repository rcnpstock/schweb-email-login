# 🚀 Deploy Schwab TradingView Integration to Render

This guide will help you deploy your Schwab TradingView webhook integration to Render, eliminating the need for ngrok.

## ✅ Benefits of Cloud Deployment
- **No ngrok issues** - Direct HTTPS URL
- **Always available** - No local machine dependency
- **Free tier available** - $0/month for basic usage
- **Automatic SSL** - HTTPS included
- **Professional URLs** - e.g., `your-app.onrender.com`

## 📋 Prerequisites

1. **GitHub Account** (free)
2. **Render Account** (free) - Sign up at [render.com](https://render.com)
3. **MongoDB Atlas** (free) - For database hosting
4. **Schwab Developer Account** with API credentials

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Step 2: Set up MongoDB Atlas (if not already done)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user
4. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/database`)

### Step 3: Deploy to Render

1. **Go to Render Dashboard:**
   - Visit [render.com](https://render.com)
   - Sign in with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select this repository

3. **Configure Build Settings:**
   - **Name:** `schwab-trading-webhook` (or your choice)
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`

4. **Set Environment Variables:**
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   CLIENT_ID=your_schwab_client_id
   CLIENT_SECRET=your_schwab_client_secret
   REDIRECT_URI=https://your-app-name.onrender.com/callback
   MONGODB_URI=your_mongodb_atlas_connection_string
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

### Step 4: Update Schwab App Settings

1. **Go to Schwab Developer Portal**
2. **Update Redirect URI:**
   - Change from `https://local.schwabtest.com:3000/callback`
   - To: `https://your-app-name.onrender.com/callback`

### Step 5: Configure Your App

1. **Access your deployed app:**
   - URL: `https://your-app-name.onrender.com`

2. **Setup TradingView Integration:**
   - Click "Setup TradingView Integration"
   - Enter your Schwab credentials
   - Your webhook URL will be: `https://your-app-name.onrender.com/webhook/tradingview`

## 🔗 Usage After Deployment

### For Manual Trading:
- Visit: `https://your-app-name.onrender.com`
- Login with Schwab OAuth
- Place orders through the web interface

### For TradingView Webhooks:
- **Webhook URL:** `https://your-app-name.onrender.com/webhook/tradingview`
- **Message Format:**
  ```json
  {
    "ticker": "{{ticker}}",
    "action": "buy",
    "quantity": 1,
    "strategy": "{{strategy.order.comment}}"
  }
  ```

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json

2. **Environment Variables:**
   - Double-check all env vars in Render dashboard
   - Ensure REDIRECT_URI matches your Render URL

3. **MongoDB Connection:**
   - Verify MongoDB Atlas connection string
   - Ensure network access is set to "Allow from anywhere"

4. **Schwab OAuth Issues:**
   - Verify redirect URI in Schwab developer portal
   - Ensure CLIENT_ID and CLIENT_SECRET are correct

### Viewing Logs:
- Go to Render dashboard → Your service → "Logs" tab
- View real-time application logs

## 💰 Render Pricing

- **Free Tier:** Perfect for testing and light usage
- **Paid Plans:** Start at $7/month for production apps
- **Automatic scaling** based on traffic

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Render automatically rebuilds and redeploys
3. Zero downtime deployments

## 📞 Support

If you encounter issues:
1. Check Render logs
2. Verify environment variables
3. Test Schwab API credentials
4. Ensure MongoDB connection

Your app will be available 24/7 at: `https://your-app-name.onrender.com`

**No more ngrok issues!** 🎉