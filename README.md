# Prompt Review Engine

A comprehensive AI-powered prompt analysis tool with COSTAR methodology integration.

## Features

- **Prompt Analysis**: Advanced COSTAR (Context, Objective, Style, Tone, Audience, Response) analysis
- **Security Filtering**: Multi-layer security checks to block harmful content
- **LLM Integration**: Support for ChatGPT, DeepSeek, Gemini and other LLM's
- **Real-time Statistics**: Dashboard with analysis graph 
- **User Authentication**: Firebase-based authentication with Google sign-in

## Setup Instructions

### 1. Firebase Configuration

To enable authentication, you need to set up Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication and add Email/Password and Google providers
4. Get your Firebase configuration from Project Settings
5. Update `firebase-config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

### 2. LLM API Keys

Create a `.env` file in the root directory with your API keys:

```env
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask backend:
```bash
python app.py
```

3. Open `index.html` in your browser or serve it with a local server.

## Usage

1. **Sign Up/Login**: Create an account or sign in with Google
2. **Submit Prompt**: Enter your prompt in the text area
3. **Review Analysis**: View the COSTAR analysis and security verdict
4. **Send to LLM**: If approved, send the sanitized prompt to your chosen LLM
5. **View History**: Access your prompt history and statistics

## API Endpoints

- `POST /review` - Analyze a prompt
- `POST /broker` - Send approved prompt to LLM
- `GET /stats` - Get analysis statistics
- `GET /history` - Get prompt history
- `DELETE /history` - Clear history



