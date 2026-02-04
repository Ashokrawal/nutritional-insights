# 🍎 Nutritional Insights

A smart nutrition scanner application that provides instant nutritional information and AI-powered analysis to help you make informed dietary decisions.

## 📋 Overview

Nutritional Insights is a web application that scans food products and delivers comprehensive nutritional data at your fingertips. Powered by Google's Gemini AI, the app goes beyond basic nutrition facts to provide intelligent analysis and personalized insights about your food choices.

### Key Features

- **📸 Instant Scanning**: Scan food products to retrieve detailed nutritional information
- **🤖 AI-Powered Analysis**: Optional Gemini AI integration for intelligent nutritional insights and recommendations
- **⚡ Fast & Responsive**: Built with modern technologies for a seamless user experience
- **🎯 Simple & Intuitive**: Clean interface focused on delivering information quickly

## 🛠️ Technology Stack

**Frontend**

- React.js - UI library for building interactive interfaces
- CSS3 - Styling and responsive design

**Backend**

- Node.js - JavaScript runtime
- Express.js - Web application framework
- MongoDB - NoSQL database for data storage

**AI Integration**

- Google Gemini AI - Advanced AI analysis and insights

**Deployment**

- Vercel - Cloud platform for seamless deployment

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- Gemini API Key

### Clone Repository

```bash
git clone https://github.com/Ashokrawal/nutritional-insights.git
cd nutritional-insights
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your environment variables to .env:
# MONGODB_URI=your_mongodb_connection_string
# GEMINI_API_KEY=your_gemini_api_key
# PORT=5000

# Start the server
npm start
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your environment variables to .env:
# REACT_APP_API_URL=your_backend_url

# Start the development server
npm start
```

The application will open at `http://localhost:3000`

## 📖 Usage

1. **Scan Product**: Upload or scan a food product image/barcode
2. **View Nutrition Data**: Instantly see detailed nutritional information
3. **AI Analysis** (Optional): Get intelligent insights powered by Gemini AI
   - Nutritional breakdown and recommendations
   - Health impact analysis
   - Dietary suggestions based on the product

## 🌐 Deployment

This application is deployed on Vercel for optimal performance and reliability.

**Live Demo**: [Your Vercel URL]

### Deploy Your Own

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📁 Project Structure

```
nutritional-insights/
├── backend/
│   ├── controllers/      # Request handlers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── config/          # Configuration files
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API integration
│   │   ├── utils/       # Helper functions
│   │   └── App.js       # Main component
│   └── package.json
├── .gitignore
├── README.md
└── LICENSE
```

## 🔑 Environment Variables

### Backend (.env)

```
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=production
```

### Frontend (.env)

```
REACT_APP_API_URL=your_backend_api_url
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Ashok Rawal**

- GitHub: [@Ashokrawal](https://github.com/Ashokrawal)
- LinkedIn: [Connect with me](https://linkedin.com/in/your-profile)

## 🙏 Acknowledgments

- Google Gemini AI for powerful AI capabilities
- MERN Stack community for excellent resources
- Vercel for seamless deployment

---

⭐ **Star this repo if you find it helpful!**

Made with ❤️ for healthier eating choices
