# ⚡ Quick Start Guide - Deploy in 5 Minutes

## 🎯 Goal
Get your Trade Finance app live on Render in under 5 minutes!

---

## 📋 Prerequisites
- ✅ GitHub account
- ✅ Render account (free at render.com)
- ✅ This code on your computer

---

## 🚀 Deploy Now (3 Steps)

### Step 1: Push to GitHub (2 minutes)

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/trade-finance-flask.git
git push -u origin main
```

### Step 2: Deploy on Render (1 minute)

1. Go to [render.com](https://render.com/login)
2. Click **"New +"** → **"Blueprint"**
3. Select your GitHub repo
4. Click **"Apply"**
5. ✅ Done! Render creates everything automatically

### Step 3: Access Your App (30 seconds)

1. Wait 3-5 minutes for deployment
2. Go to: `https://your-app-name.onrender.com`
3. Login with:
   - Email: `admin@trade.com`
   - Password: `admin123`

---

## 🎉 You're Live!

**What Was Created:**
- ✅ Flask web application
- ✅ PostgreSQL database
- ✅ Automatic SSL certificate
- ✅ Auto-deploy on git push

**Free Tier Includes:**
- ✅ 750 hours/month
- ✅ 1 GB database storage
- ✅ Custom domain support
- ✅ Daily backups

---

## 📝 Next Steps

1. **Change admin password** (IMPORTANT!)
2. Create test users via signup page
3. Upload test documents
4. Explore all 4 dashboards

---

## 🆘 Issues?

### Build Failed?
- Check `requirements.txt` has all dependencies
- Verify Python version in `runtime.txt`

### Can't Login?
- Wait for deployment to complete (check Render logs)
- Clear browser cache
- Check DATABASE_URL is set

### App is Slow?
- Free tier spins down after 15 min
- First request takes ~30 seconds
- Upgrade to $7/month for always-on

---

## 📚 Full Documentation

- **README.md** - Complete project documentation
- **DEPLOYMENT_GUIDE.md** - Detailed deployment steps
- **render.yaml** - Infrastructure as code

---

## 🔗 Important Links

- **Render Dashboard**: https://dashboard.render.com
- **Documentation**: https://render.com/docs
- **Support**: https://community.render.com

---

**That's it! Your app is now live and ready to use! 🚀**

For detailed instructions, see `DEPLOYMENT_GUIDE.md`
