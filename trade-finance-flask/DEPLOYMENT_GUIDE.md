# 🚀 Complete Render Deployment Guide

## Prerequisites

- GitHub account
- Render account (free tier available at render.com)
- Git installed on your computer

---

## Step 1: Push Code to GitHub

### 1.1 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name: `trade-finance-flask`
4. Description: `Secure trade finance document management system`
5. Keep it **Public** (or Private with paid Render plan)
6. **DO NOT** initialize with README, .gitignore, or license
7. Click "Create repository"

### 1.2 Push Your Code

In your project directory, run:

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Trade Finance Flask App"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/trade-finance-flask.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Render (Automatic - RECOMMENDED)

### 2.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 2.2 Deploy Using Blueprint

1. Click **"New +"** button
2. Select **"Blueprint"**
3. Connect your GitHub repository: `trade-finance-flask`
4. Render will detect `render.yaml` automatically
5. Click **"Apply"**

### 2.3 What Happens Next

Render will automatically create:
- ✅ PostgreSQL Database (`trade-finance-db`)
- ✅ Web Service (`trade-finance-flask`)
- ✅ Environment variables
- ✅ Database connection

### 2.4 Monitor Deployment

1. Watch the build logs in Render dashboard
2. Deployment typically takes 3-5 minutes
3. Look for "Build successful" message
4. Your app will be live at: `https://trade-finance-flask.onrender.com`

---

## Step 3: Deploy to Render (Manual Method)

If automatic deployment doesn't work, use this method:

### 3.1 Create PostgreSQL Database

1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Configure:
   - **Name**: `trade-finance-db`
   - **Database**: `trade_finance`
   - **User**: `trade_finance_user`
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: 15
   - **Plan**: **Free**
4. Click **"Create Database"**
5. **COPY** the **Internal Database URL** (you'll need this)

### 3.2 Create Web Service

1. Click **"New +"** again
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `trade-finance-flask`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Environment**: **Python 3**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: **Free**

### 3.3 Add Environment Variables

In the web service settings, go to **"Environment"** tab:

1. Click **"Add Environment Variable"**
2. Add:

```
Key: SECRET_KEY
Value: [Generate random string - use: https://randomkeygen.com/]

Key: DATABASE_URL
Value: [Paste the Internal Database URL from Step 3.1]
```

Example DATABASE_URL:
```
postgresql://trade_finance_user:password@dpg-xxxxx.oregon-postgres.render.com/trade_finance
```

### 3.4 Deploy

1. Click **"Create Web Service"**
2. Render will start building
3. Monitor logs for completion
4. Access your app at the provided URL

---

## Step 4: Verify Deployment

### 4.1 Access Your App

Go to: `https://your-app-name.onrender.com`

You should see the login page.

### 4.2 Test Login

Use default admin credentials:
- **Email**: `admin@trade.com`
- **Password**: `admin123`

### 4.3 Change Admin Password

⚠️ **IMPORTANT**: Change the default password immediately!

1. Create a new admin user
2. Delete or change the default admin account

---

## Step 5: Configure Custom Domain (Optional)

### 5.1 In Render Dashboard

1. Go to your web service
2. Click "Settings"
3. Scroll to "Custom Domain"
4. Add your domain: `yourdomain.com`

### 5.2 In Your Domain Registrar

Add CNAME record:
```
Type: CNAME
Name: www (or @)
Value: your-app-name.onrender.com
```

---

## Troubleshooting

### Build Fails

**Error**: `No module named 'xyz'`
- **Fix**: Add missing package to `requirements.txt`

**Error**: `Failed to connect to database`
- **Fix**: Check DATABASE_URL is correct
- **Fix**: Ensure database is in same region

### App Crashes

**Check Logs**:
1. Go to web service in Render
2. Click "Logs" tab
3. Look for error messages

**Common Issues**:
- Missing environment variables
- Database connection failed
- Port binding issues (Render sets PORT automatically)

### Slow Performance

**Free Tier Limitations**:
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- **Solution**: Upgrade to paid plan ($7/month)

### Database Connection Errors

1. Verify DATABASE_URL format:
   ```
   postgresql://user:password@host/database
   ```
2. Use **Internal Database URL** (not External)
3. Check database is running in Render dashboard

---

## Monitoring & Maintenance

### View Logs

```bash
# In Render dashboard
1. Click on your web service
2. Go to "Logs" tab
3. Select time range
```

### Database Backups

Render automatically backs up PostgreSQL databases daily.

To restore:
1. Go to database in dashboard
2. Click "Backups"
3. Select backup to restore

### Update Application

```bash
# Make changes locally
git add .
git commit -m "Update description"
git push origin main

# Render auto-deploys on push
```

### Environment Variable Updates

1. Go to web service settings
2. Click "Environment"
3. Update variables
4. Click "Save Changes"
5. Service will automatically redeploy

---

## Free Tier Limits

### PostgreSQL Database
- ✅ 1 GB storage
- ✅ Automatic backups (7 days)
- ✅ Shared CPU
- ⚠️ Expires after 90 days (must upgrade or recreate)

### Web Service
- ✅ 750 hours/month
- ✅ 512 MB RAM
- ✅ Shared CPU
- ⚠️ Spins down after 15 min inactivity
- ⚠️ 100 GB bandwidth/month

---

## Upgrade Path

### When to Upgrade

- ⚡ Need faster response times
- 📊 Higher traffic volume
- 💾 More storage needed
- 🔄 Always-on service required

### Paid Plans

**Starter Plan** ($7/month):
- Always-on service
- No spin-down
- Better performance

**Standard Plan** ($25/month):
- 2 GB RAM
- Dedicated CPU
- Custom domains

---

## Security Best Practices

### 1. Change Default Credentials
```python
# Create new admin via signup page
# Then delete old admin or change password
```

### 2. Use Strong SECRET_KEY
```bash
# Generate secure random key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Enable HTTPS Only
- Render provides free SSL certificates
- Enabled by default

### 4. Regular Backups
- Enable daily database backups
- Export critical data periodically

### 5. Monitor Logs
- Check for suspicious activity
- Set up log alerts in paid plans

---

## Support Resources

### Render Documentation
- [Official Docs](https://render.com/docs)
- [Deploy Flask](https://render.com/docs/deploy-flask)
- [PostgreSQL](https://render.com/docs/databases)

### Community Support
- [Render Community Forum](https://community.render.com)
- [Discord](https://discord.gg/render)
- [GitHub Discussions](https://github.com/renderinc/render-examples/discussions)

### Contact Support
- Email: support@render.com
- Chat: Available in dashboard (paid plans)

---

## Success! 🎉

Your Trade Finance app is now live on Render!

**Next Steps**:
1. ✅ Change admin password
2. ✅ Create test users
3. ✅ Upload test documents
4. ✅ Test all features
5. ✅ Share app URL with team

**Your App URL**: `https://your-app-name.onrender.com`

---

## Quick Reference

### Common Commands

```bash
# Check deployment status
git status

# Update app
git add .
git commit -m "Update message"
git push origin main

# View remote repo
git remote -v
```

### Important URLs

- **Your App**: `https://your-app-name.onrender.com`
- **Render Dashboard**: `https://dashboard.render.com`
- **Database**: Available in Render dashboard
- **GitHub Repo**: `https://github.com/YOUR_USERNAME/trade-finance-flask`

---

**Deployment completed! If you encounter any issues, check the troubleshooting section or contact Render support.**
