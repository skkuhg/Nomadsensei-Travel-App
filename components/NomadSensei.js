import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

const NomadSensei = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const scrollViewRef = useRef(null);

  console.log('NomadSensei component loaded successfully');

  // API Keys - In production, these should be stored securely on the backend
  // For development, you can set these environment variables or replace with your keys
  const TAVILY_API_KEY = process.env.EXPO_PUBLIC_TAVILY_API_KEY || 'your-tavily-api-key-here';
  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here';

  // Tavily Search Function
  const searchTavily = async (query, k = 10, recencyDays = null) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: query,
          max_results: k,
          include_domains: [],
          exclude_domains: [],
          ...(recencyDays && { days: recencyDays })
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Tavily search failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Tavily search error:', error);
      return [];
    }
  };

  // OpenAI Generation Function
  const generateWithOpenAI = async (prompt, searchResults) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are NomadSensei, a multilingual mobile concierge. Generate travel advice based on the search results provided. 
              Format your response in plain text with citations (¹,²,³) that correspond to the source URLs.
              Keep answers under 300 words for regular queries and 700 for itineraries.
              Be friendly, informative, and safety-conscious.`
            },
            {
              role: 'user',
              content: `User query: ${prompt}\n\nSearch results:\n${JSON.stringify(searchResults, null, 2)}\n\nGenerate a comprehensive answer with citations.`
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenAI generation failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI generation error:', error);
      if (error.name === 'AbortError') {
        return 'I apologize, but the request timed out. Please try again with a shorter query.';
      }
      return 'I apologize, but I encountered an error generating a response. Please try again.';
    }
  };

  // Image Analysis Function using OpenAI Vision API
  const analyzeImage = async (imageFile) => {
    try {
      // Convert image to base64 using expo-file-system
      const base64 = await FileSystem.readAsStringAsync(imageFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Call OpenAI Vision API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image and identify any landmarks, tourist attractions, or notable locations. Please provide:
                  1. The name of the landmark/location (if identifiable)
                  2. The city and country
                  3. Confidence level (0.0-1.0)
                  4. Brief description of what you see
                  
                  Respond in JSON format like this:
                  {
                    "landmark": "landmark name or 'Unknown'",
                    "location": "City, Country or 'Unknown'", 
                    "confidence": 0.85,
                    "description": "brief description of what you see",
                    "isLandmark": true/false
                  }`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!visionResponse.ok) {
        throw new Error(`Vision API request failed with status: ${visionResponse.status}`);
      }

      const visionData = await visionResponse.json();
      const content = visionData.choices[0].message.content;
      
      // Parse the JSON response
      try {
        const parsed = JSON.parse(content);
        return {
          landmark: parsed.landmark || 'Unknown Location',
          confidence: parsed.confidence || 0.5,
          location: parsed.location || 'Unknown',
          description: parsed.description || 'Unable to identify specific details',
          isLandmark: parsed.isLandmark || false
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          landmark: 'Unidentified Location',
          confidence: 0.3,
          location: 'Unknown',
          description: content.substring(0, 100) + '...',
          isLandmark: false
        };
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      if (error.name === 'AbortError') {
        return {
          landmark: 'Analysis Timeout',
          confidence: 0.0,
          location: 'Unknown',
          description: 'Image analysis timed out. Please try again.',
          isLandmark: false
        };
      }
      return {
        landmark: 'Analysis Failed',
        confidence: 0.0,
        location: 'Unknown',
        description: 'Unable to analyze the image. Please try again.',
        isLandmark: false
      };
    }
  };

  // Main RAG Workflow
  const processQuery = async (userQuery, image = null) => {
    setIsLoading(true);
    
    try {
      let visionData = null;
      let queries = [];
      
      // Step 1: Analyze image if provided
      if (image) {
        visionData = await analyzeImage(image);
        console.log('Vision analysis result:', visionData);
      }
      
      // Step 2: Compose retrieval queries
      if (visionData && visionData.confidence >= 0.6 && visionData.isLandmark) {
        queries.push(`${visionData.landmark} history visitor information tickets`);
        queries.push(`${visionData.location} attractions near ${visionData.landmark}`);
        queries.push(`${visionData.landmark} travel guide tips`);
      } else if (visionData && visionData.confidence >= 0.3) {
        // For lower confidence or non-landmarks, still search based on what we can see
        queries.push(`${visionData.location} tourist attractions travel guide`);
        queries.push(`${visionData.description} travel destination information`);
      } else {
        const isCurrentEvent = userQuery.toLowerCase().includes('now') || 
                             userQuery.toLowerCase().includes('today') || 
                             userQuery.toLowerCase().includes('this week');
        
        queries.push(userQuery);
        
        if (userQuery.toLowerCase().includes('itinerary')) {
          queries.push(`${userQuery} cultural activities recommendations`);
        }
        if (isCurrentEvent) {
          queries.push(`${userQuery} events ${new Date().toLocaleDateString()}`);
        }
      }
      
      // Step 3: Execute searches
      const searchPromises = queries.map(q => 
        searchTavily(q, 10, userQuery.toLowerCase().includes('this week') ? 7 : null)
      );
      const searchResultsArray = await Promise.all(searchPromises);
      const allResults = searchResultsArray.flat();
      
      // Step 4: Remove duplicates
      const uniqueResults = allResults.filter((result, index, self) =>
        index === self.findIndex((r) => r.url === result.url)
      );
      
      // Step 5: Generate answer
      const generatedAnswer = await generateWithOpenAI(userQuery, uniqueResults);
      
      // Step 6: Create structured response
      const response = {
        title: visionData ? 
          (visionData.isLandmark && visionData.confidence > 0.6 ? 
            `About ${visionData.landmark}` : 
            `Image Analysis: ${visionData.location}`) : 
          'Travel Information',
        answer: generatedAnswer,
        sources: uniqueResults.slice(0, 5).map((r, i) => ({
          number: i + 1,
          title: r.title,
          url: r.url
        })),
        actions: generateSmartActions(userQuery, visionData, uniqueResults)
      };
      
      return response;
    } catch (error) {
      console.error('Processing error:', error);
      return {
        title: 'Error',
        answer: 'I apologize, but I encountered an error processing your request. Please try again.',
        sources: [],
        actions: []
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Generate smart action buttons
  const generateSmartActions = (query, visionData, results) => {
    const actions = [];
    
    if (visionData && visionData.landmark && visionData.landmark !== 'Unknown Location') {
      const searchTerm = visionData.isLandmark ? visionData.landmark : visionData.location;
      actions.push({
        label: 'Open in Maps',
        url: `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`
      });
    }
    
    if (query.toLowerCase().includes('itinerary')) {
      actions.push({
        label: 'Save Itinerary',
        url: '#save'
      });
    }
    
    const ticketResult = results.find(r => 
      r.title.toLowerCase().includes('ticket') || 
      r.title.toLowerCase().includes('book')
    );
    if (ticketResult) {
      actions.push({
        label: 'Book Tickets',
        url: ticketResult.url
      });
    }
    
    return actions.slice(0, 3);
  };

  // Handle message submission
  const handleSubmit = async () => {
    if (!input.trim() && !selectedImage) return;
    
    const userMessage = {
      type: 'user',
      content: input,
      image: selectedImage,
      timestamp: new Date()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const response = await processQuery(input, selectedImage);
    
    const botMessage = {
      type: 'bot',
      content: response,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, botMessage]);
    setSelectedImage(null);
    
    // Scroll to bottom again
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Handle image selection
  const handleImageSelect = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage({
        uri: result.assets[0].uri
      });
    }
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage({
        uri: result.assets[0].uri
      });
    }
  };

  const quickActions = [
    {
      title: 'Plan Itinerary',
      subtitle: 'Get custom travel plans',
      icon: 'calendar-outline',
      color: '#3B82F6',
      query: 'Build me a 3-day cultural itinerary for Tokyo'
    },
    {
      title: 'Identify Landmark',
      subtitle: 'Upload or take a photo',
      icon: 'camera-outline',
      color: '#10B981',
      action: 'camera'
    },
    {
      title: 'Current Events',
      subtitle: 'Real-time information',
      icon: 'information-circle-outline',
      color: '#8B5CF6',
      query: "What's happening in Paris this week?"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="globe-outline" size={32} color="white" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>NomadSensei</Text>
              <Text style={styles.headerSubtitle}>Your AI Travel Companion</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="location-outline" size={16} color="white" />
            <Text style={styles.headerRightText}>RAG-Powered Guide</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Messages Container */}
      <KeyboardAvoidingView 
        style={styles.messagesContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <Ionicons name="globe-outline" size={64} color="#9CA3AF" />
              <Text style={styles.welcomeTitle}>Welcome to NomadSensei!</Text>
              <Text style={styles.welcomeText}>
                Ask me anything about travel, upload photos of landmarks, or request itineraries.
              </Text>
              
              <View style={styles.quickActionsContainer}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionCard}
                    onPress={() => {
                      if (action.action === 'camera') {
                        Alert.alert(
                          'Add Photo',
                          'Choose an option',
                          [
                            { text: 'Camera', onPress: handleCameraCapture },
                            { text: 'Gallery', onPress: handleImageSelect },
                            { text: 'Cancel', style: 'cancel' }
                          ]
                        );
                      } else {
                        setInput(action.query);
                      }
                    }}
                  >
                    <Ionicons name={action.icon} size={24} color={action.color} />
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                    <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((message, index) => (
              <View key={index} style={[
                styles.messageContainer,
                message.type === 'user' ? styles.userMessage : styles.botMessage
              ]}>
                <View style={[
                  styles.messageBubble,
                  message.type === 'user' ? styles.userBubble : styles.botBubble
                ]}>
                  {message.type === 'user' ? (
                    <View>
                      {message.image && (
                        <Image source={{ uri: message.image.uri }} style={styles.messageImage} />
                      )}
                      <Text style={styles.userText}>{message.content}</Text>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.botTitle}>{message.content.title}</Text>
                      <Text style={styles.botText}>{message.content.answer}</Text>
                      
                      {message.content.sources.length > 0 && (
                        <View style={styles.sourcesContainer}>
                          <Text style={styles.sourcesTitle}>Sources:</Text>
                          {message.content.sources.map(source => (
                            <Text key={source.number} style={styles.sourceText}>
                              {source.number}. {source.title}
                            </Text>
                          ))}
                        </View>
                      )}
                      
                      {message.content.actions.length > 0 && (
                        <View style={styles.actionsContainer}>
                          {message.content.actions.map((action, i) => (
                            <TouchableOpacity key={i} style={styles.actionButton}>
                              <Text style={styles.actionButtonText}>{action.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Searching and generating response...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {selectedImage && (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => {
                Alert.alert(
                  'Add Photo',
                  'Choose an option',
                  [
                    { text: 'Camera', onPress: handleCameraCapture },
                    { text: 'Gallery', onPress: handleImageSelect },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Ionicons name="camera-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about any destination, upload a photo, or request an itinerary..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() && !selectedImage) && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || (!input.trim() && !selectedImage)}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Warning Notice */}
      <View style={styles.warningContainer}>
        <Ionicons name="warning-outline" size={16} color="#D97706" />
        <Text style={styles.warningText}>
          <Text style={styles.warningBold}>Note:</Text> Configure your API keys in environment variables for production use.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRightText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  quickActionsContainer: {
    width: '100%',
  },
  quickActionCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
  },
  botBubble: {
    backgroundColor: 'white',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  userText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  botTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  botText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  sourcesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 12,
    color: '#3B82F6',
    marginBottom: 4,
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedImageContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  selectedImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  imageButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F59E0B',
  },
  warningText: {
    fontSize: 12,
    color: '#D97706',
    marginLeft: 8,
    flex: 1,
  },
  warningBold: {
    fontWeight: 'bold',
  },
});

export default NomadSensei;