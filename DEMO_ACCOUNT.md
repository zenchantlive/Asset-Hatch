# Demo Account Setup for Asset Hatch

This document contains the demo account credentials for showcasing Asset Hatch in job applications.

## 🎯 Purpose

This demo account allows prospective employers to test the full Asset Hatch application with:
- Pre-configured user account
- Personal OpenRouter API key management
- Complete access to all features (Planning, Style Anchor, Generation, Export)

---

## 📋 Demo Credentials

**For Resume/Portfolio:**

```
Application: Asset Hatch
URL: [Your deployed URL]
Demo Account:
  Email: demo@assethatch.com
  Password: AssetHatch2026!
```

**Security Note:** This is a demo account specifically for job applications. Change the password after deployment to production.

---

## 🚀 Setup Instructions

### Step 1: Run Database Seed Script

The seed script creates the demo user account in the database.

```bash
# In PowerShell (Windows) or terminal
cd src
bunx prisma db seed
```

**Expected Output:**
```
🌱 Starting database seed...
🔐 Hashing password...
👤 Creating demo user...
✅ Demo user created successfully!

📋 Demo Credentials (for resume):
   Email:     demo@assethatch.com
   Password:  AssetHatch2026!
   User ID:   [generated-id]

🔑 Next Steps:
   1. Login with the credentials above
   2. Go to Settings → API Keys
   3. Add your OpenRouter API key
   4. Start generating game assets!
```

### Step 2: Add OpenRouter API Key

After running the seed script:

1. **Start the development server:**
   ```bash
   bun dev
   ```

2. **Login to the demo account:**
   - Go to http://localhost:3000
   - Click "Sign In"
   - Use the demo credentials above

3. **Configure API Key:**
   - Navigate to Settings (or go directly to http://localhost:3000/settings)
   - Under "OpenRouter API Key" section
   - Paste your OpenRouter API key (starts with `sk-or-`)
   - Click "Save API Key"

4. **Verify Setup:**
   - The page should show: ✅ API key configured: sk-or-...xxxx
   - You can now create projects and generate assets!

---

## 🔐 Security Considerations

### For Development
- The seed script uses `upsert`, so running it multiple times is safe
- Password is hashed with bcrypt (10 rounds)
- API keys are stored in the database (consider encryption for production)

### For Production Deployment
1. **Change the demo password** to something unique
2. **Enable API key encryption** (see `docs/API_KEY_ARCHITECTURE.md`)
3. **Set up rate limiting** for the demo account
4. **Monitor usage** to prevent abuse

---

## 📊 What Can Employers Test?

With this demo account, employers can:

1. **Planning Phase:**
   - Have a natural conversation with the AI
   - Watch the AI build a complete asset specification
   - See quality parameters update in real-time

2. **Style Anchor Phase:**
   - Upload reference images
   - Generate a style anchor image with Flux 2 Pro
   - View extracted style keywords and color palettes

3. **Generation Phase:**
   - Queue multiple assets for generation
   - Monitor generation progress
   - Download generated assets

4. **Export Phase:**
   - Organize assets into sprite sheets
   - Export as ZIP with metadata
   - Multiple format options

---

## 🔑 API Key Management

The demo account uses the **BYOK (Bring Your Own Key)** model:

- **User's API Key:** Stored in database, used for their generations
- **Validation:** Keys are tested against OpenRouter before saving
- **Privacy:** Only shows last 4 characters (e.g., `sk-or-...x7K9`)
- **Cost Control:** Each user pays for their own generations

### API Routes
- `GET /api/settings` - Fetch current API key status
- `PATCH /api/settings` - Update or remove API key

### Pricing Reference
- **Chat (Gemini):** ~$0.001 per message
- **Image (Flux 2 Pro):** ~$0.04 per image
- **Light Usage:** $5-10/month
- **Heavy Usage:** $20-50/month

---

## 📝 Resume Format Suggestion

### Project Description
```
Asset Hatch - AI-Powered Game Asset Generator
• Built with Next.js 16, React 19, TypeScript, Prisma, Vercel AI SDK
• Natural language asset planning with OpenAI function calling
• Multi-phase workflow: Planning → Style → Generation → Export
• User authentication with GitHub OAuth and credentials (Auth.js v5)
• Per-user API key management with BYOK model
• Real-time asset generation queue with Flux 2 Pro

Demo Account:
  URL: [your-deployed-url]
  Email: demo@assethatch.com
  Password: AssetHatch2026!

Tech Stack: Next.js • React • TypeScript • Prisma • PostgreSQL •
            OpenRouter • Tailwind CSS • Vercel AI SDK
```

---

## 🧪 Testing Checklist

Before sharing with employers, verify:

- [ ] Demo user can login successfully
- [ ] Settings page loads and shows API key section
- [ ] API key can be added and validated
- [ ] New project can be created
- [ ] Chat interface responds to messages
- [ ] Style anchor generation works
- [ ] Asset generation queue functions
- [ ] Export produces valid ZIP files
- [ ] Sign out and sign in again works

---

## 🛠️ Troubleshooting

### "User not found" after seed
- Make sure you ran `bunx prisma db seed` from the `src/` directory
- Check that the database is accessible (DATABASE_URL in .env)

### "Invalid credentials" when logging in
- Verify you're using the exact password: `AssetHatch2026!`
- Check if seed script completed successfully

### "Failed to save API key"
- Verify your OpenRouter key starts with `sk-or-`
- Test the key at https://openrouter.ai/keys first
- Check browser console for detailed error messages

### "Unauthorized" when generating assets
- Make sure you added a valid OpenRouter API key in Settings
- The key must be validated before use

---

## 📚 Additional Resources

- **Full Architecture:** See `docs/API_KEY_ARCHITECTURE.md`
- **Development Guide:** See `CLAUDE.md`
- **API Documentation:** See `docs/` folder
- **OpenRouter Docs:** https://openrouter.ai/docs

---

**Created:** 2026-01-04
**Version:** 1.0
**Status:** Ready for deployment
