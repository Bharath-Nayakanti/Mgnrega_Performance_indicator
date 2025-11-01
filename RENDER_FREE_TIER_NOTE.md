# Important: Free Tier Limitations

## Database Persistence Issue

⚠️ **The free tier does NOT support persistent disks.**

This means:
- Database will be stored in ephemeral storage
- **Data will be lost** when the service restarts or redeploys
- Database will auto-populate on each restart (takes 2-3 minutes)

## What Happens

### First Start
1. Service starts
2. Database doesn't exist
3. Populates from API (2-3 min)
4. Server ready

### After Spin-Down (15 min inactivity)
1. Service wakes up
2. Database may or may not exist (ephemeral storage)
3. If missing, re-populates (2-3 min)
4. Server ready

### After Redeploy
1. New instance created
2. Database doesn't exist
3. Populates from API (2-3 min)
4. Server ready

## Solutions

### Option 1: Accept the Limitation (Free)
- Database re-populates automatically
- Takes 2-3 minutes on cold start
- Good for testing/demo purposes

### Option 2: Upgrade to Paid Plan ($7/month)
- Persistent disk available on Starter plan
- Database survives restarts
- No spin-down (always on)
- Faster response times

To add persistent disk on paid plan:
```yaml
services:
  - type: web
    name: Mgnrega_Performance_indicator-backend
    plan: starter  # Change from free to starter
    disk:
      name: mgnrega-data
      mountPath: /opt/render/project/src/data
      sizeGB: 1
```

### Option 3: Use External Database
- PostgreSQL (Render offers free 90-day trial)
- MongoDB Atlas (free tier available)
- Requires code changes to use PostgreSQL/MongoDB instead of SQLite

## Recommendation for Free Tier

**Current setup works fine for free tier:**
- Database auto-populates on startup
- Data is cached in memory while running
- Good for demo/testing
- Users may experience 2-3 min delay on first request after spin-down

## Monitoring

Check backend logs to see when database is being populated:
```
Database is empty or does not exist. Populating with initial data...
=== Populating database with Maharashtra data ===
```

If you see this frequently, it means the database is being recreated often (expected on free tier).

## Current Configuration

✅ **render.yaml is now configured for free tier:**
- No persistent disk (not supported)
- Backend will use ephemeral storage
- Database auto-populates as needed
- Frontend is static (no storage needed)

---

**Ready to deploy with these limitations understood.**
