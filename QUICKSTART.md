# 🚀 Quick Start Guide - NutriScan

## Get Started in 5 Minutes!

### Step 1: Extract the Project
```bash
tar -xzf nutritional-insights.tar.gz
cd nutritional-insights
```

### Step 2: Install & Run Backend
```bash
cd server
npm install
cp .env.example .env
# Make sure MongoDB is running on your system
npm run dev
```

Backend will be running on http://localhost:5000

### Step 3: Install & Run Frontend (New Terminal)
```bash
cd client
npm install
npm start
```

Frontend will be running on http://localhost:3000

### Step 4: Start Scanning!
1. Open http://localhost:3000 in your browser
2. Click "Scan Barcode"
3. Allow camera access
4. Scan any product barcode
5. View nutritional insights!

## Test Barcodes

Try these barcodes to test the app:
- Nutella: `3017620422003`
- Coca-Cola: `5449000000996`
- Kellogg's Corn Flakes: `5053827139908`

## Requirements

- **Node.js**: v16+ (Download from nodejs.org)
- **MongoDB**: v5.0+ (Download from mongodb.com)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## Need Help?

**MongoDB not installed?**
Use MongoDB Atlas (free cloud database):
1. Sign up at mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update MONGODB_URI in server/.env

**Port already in use?**
- Change PORT in server/.env to 5001 or another port
- Update REACT_APP_API_URL in client/.env accordingly

**Camera not working?**
- Make sure you're using HTTPS or localhost
- Check browser permissions
- Try a different browser

## Project Structure

```
nutritional-insights/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── redux/         # State management
│   │   └── utils/         # Utilities
│   └── package.json
├── server/                # Node.js backend
│   ├── server.js         # Main server file
│   ├── .env.example      # Environment template
│   └── package.json
└── README.md             # Full documentation
```

## Key Features

✅ Real-time barcode scanning
✅ Health score calculation (0-100)
✅ Nutri-Score display (A-E)
✅ Detailed nutrition facts
✅ Scan history with MongoDB
✅ Fully responsive design
✅ Dark mode UI
✅ Smooth animations

## Deployment Options

**Easy (Recommended for beginners):**
- Frontend: Vercel or Netlify
- Backend: Heroku or Railway
- Database: MongoDB Atlas

**Professional (For production):**
- Frontend: AWS S3 + CloudFront
- Backend: AWS EC2 or Lambda
- Database: AWS DocumentDB or MongoDB Atlas

See README.md for detailed deployment instructions.

---

**Happy Scanning! 🎉**
