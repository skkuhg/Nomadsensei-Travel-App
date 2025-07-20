# NomadSensei - Smart Travel Guide & Agent

A React Native Expo mobile application that serves as your AI-powered travel companion. NomadSensei combines real-time web search with advanced AI to provide personalized travel recommendations, landmark identification, and custom itinerary planning.

## Features

🌍 **AI-Powered Travel Assistant**
- Real-time travel information retrieval using Tavily API
- Intelligent responses powered by OpenAI's GPT-4o-mini model
- Context-aware travel recommendations

📸 **Landmark Identification**
- Advanced photo recognition using GPT-4o-mini Vision API
- Camera integration for on-the-go identification
- Smart landmark and tourist attraction identification

🗺️ **Smart Itinerary Planning**
- Custom travel itineraries based on preferences
- Current events and real-time information integration
- Actionable recommendations with booking links

📱 **Mobile-Optimized Design**
- Elegant and intuitive user interface
- Cross-platform compatibility (iOS & Android)
- Responsive design for all screen sizes

## Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tooling
- **OpenAI API** - AI-powered responses using GPT-4o-mini model
- **Tavily API** - Real-time web search and information retrieval
- **Expo Linear Gradient** - Beautiful gradient backgrounds
- **Expo Image Picker** - Camera and gallery integration
- **Expo Vector Icons** - Consistent iconography

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- Expo Go app on your mobile device

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/skkuhg/nomadsensei-travel-app.git
   cd nomadsensei-travel-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure API keys:
   Create a `.env` file in the root directory and add your API keys:
   ```
   EXPO_PUBLIC_TAVILY_API_KEY=your-tavily-api-key-here
   EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key-here
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Scan the QR code with your Expo Go app (iOS) or camera app (Android)

### Running the App

To run the app in development mode:

```bash
# Start the Expo development server
npx expo start

# Or run specific platform (requires simulators/emulators)
npm run android  # Android
npm run ios      # iOS (macOS only)
npm run web      # Web browser
```

## API Configuration

The app uses two main APIs:

- **OpenAI API**: For AI-powered travel recommendations and image analysis
- **Tavily API**: For real-time travel information search

### Getting API Keys

1. **OpenAI API**: 
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Generate an API key from the dashboard
   - Add credits to your account for usage

2. **Tavily API**:
   - Sign up at [Tavily](https://tavily.com/)
   - Get your API key from the dashboard

### Security Note

⚠️ **Important**: This repository uses environment variables for API keys. Never commit actual API keys to version control. In production, implement proper backend authentication and key management.

## Usage

1. **Ask Questions**: Type any travel-related question
2. **Upload Photos**: Tap the camera icon to identify landmarks
3. **Quick Actions**: Use the preset buttons for common requests
4. **View Sources**: All responses include cited sources
5. **Take Actions**: Tap action buttons for maps, bookings, etc.

## Example Queries

- "Build me a 3-day cultural itinerary for Tokyo"
- "What's happening in Paris this week?"
- "Best restaurants near the Eiffel Tower"
- Upload a photo of any landmark for instant information

## Development

### Project Structure

```
├── App.js                 # Main app entry point
├── components/
│   ├── NomadSensei.js    # Main component with travel agent logic
│   └── SimpleTest.js     # Simple test component
├── .github/
│   └── copilot-instructions.md
└── package.json
```

### Key Components

- **NomadSensei**: Main chat interface and AI integration
- **Image Picker**: Camera and gallery functionality
- **Message System**: Chat-like interface for user interactions
- **API Integration**: OpenAI and Tavily API connections

### Architecture

The app follows a RAG (Retrieval-Augmented Generation) architecture:

1. **Query Processing**: Analyze user input and images
2. **Information Retrieval**: Search real-time data via Tavily API
3. **Response Generation**: Generate contextual responses via OpenAI
4. **Action Generation**: Provide actionable recommendations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is created for educational and demonstration purposes.

## Acknowledgments

- OpenAI for GPT-4o-mini language and vision model
- Tavily for real-time search capabilities
- Expo team for excellent mobile development tools

## Screenshots

*Screenshots will be added once the app is deployed*

## Support

For questions or issues, please open an issue on GitHub.

---

**Note**: This is a demo application. For production use, implement proper authentication, error handling, and security measures.