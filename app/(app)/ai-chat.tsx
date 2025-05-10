import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import ChatContainer, { ChatMessage } from '../../components/ui/chat/ChatContainer';
import aiChatService, { ChatStatus } from '../../lib/services/ai-chat';
import { API_CONFIG } from '../../lib/config/environment';
import { useAuthStore } from '../../lib/stores/auth-store';

// Interface for suggestion prompts
interface PromptSuggestion {
  key: string;
  description: string;
}

export default function AIChatScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<ChatStatus>(ChatStatus.Idle);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [availablePrompts, setAvailablePrompts] = useState<PromptSuggestion[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  // Log debug info
  const addDebugInfo = useCallback((info: string) => {
    // console.log(`[AIChatScreen] ${info}`);
    setDebugInfo(prev => `${info}\n${prev}`);
  }, []);

  // Fetch available prompt suggestions
  const fetchAvailablePrompts = useCallback(async () => {
    try {
      setIsLoadingPrompts(true);
      const response = await fetch(`${API_CONFIG.AI_SERVICE_URL}/suggest/prompts`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prompts: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailablePrompts(data.available_prompts || []);
      // addDebugInfo(`Loaded ${data.available_prompts?.length || 0} prompt suggestions`);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      addDebugInfo(`Error fetching prompts: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [addDebugInfo]);

  // Handle selecting a suggestion prompt
  const handleSuggestionSelect = useCallback(async (promptKey: string) => {
    try {
      if (!user?.id) {
        addDebugInfo('Cannot use suggestion: No user ID available');
        return;
      }
      
      addDebugInfo(`Using suggestion prompt: ${promptKey}`);
      
      // Add user message indicating the suggestion being used
      const selectedPrompt = availablePrompts.find(p => p.key === promptKey);
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: selectedPrompt?.description || `Using suggestion: ${promptKey}`,
        isUser: true,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, userMessage]);
      setChatStatus(ChatStatus.Loading);
      setError(null);

      // Add "Typing..." message as a placeholder
      const aiMessageId = (Date.now() + 1).toString();
      const aiPlaceholder: ChatMessage = {
        id: aiMessageId,
        content: 'Typing...', // Show "Typing..." immediately as the content
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiPlaceholder]);
      setChatStatus(ChatStatus.Streaming);
      
      // Call the suggestion endpoint
      const suggestionUrl = `${API_CONFIG.AI_SERVICE_URL}/suggest/${user.id}/${promptKey}`;
      const response = await fetch(suggestionUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to get suggestion: ${response.status}`);
      }
      
      const data = await response.json();
      const suggestion = data.suggestion || "Không có gợi ý nào phù hợp.";
      
      // Update the AI message with the suggestion
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: suggestion } 
            : msg
        )
      );
      
      setChatStatus(ChatStatus.Done);
      
    } catch (error) {
      console.error('Error using suggestion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get suggestion';
      addDebugInfo(`Error: ${errorMessage}`);
      setChatStatus(ChatStatus.Error);
      setError(errorMessage);
    }
  }, [user, availablePrompts, addDebugInfo]);

  // Send a message to the AI
  const sendMessage = useCallback(async (content: string) => {
    try {
      addDebugInfo(`Sending message: "${content.substring(0, 30)}..."`);
      
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        isUser: true,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, userMessage]);
      setChatStatus(ChatStatus.Loading);
      setError(null);
      // addDebugInfo('Added user message, status: Loading');

      // Add "Typing..." message as a temporary placeholder
      const aiMessageId = (Date.now() + 1).toString();
      const aiPlaceholder: ChatMessage = {
        id: aiMessageId,
        content: 'Typing...', // Show "Typing..." immediately as the content
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiPlaceholder]);
      setChatStatus(ChatStatus.Streaming);
      // addDebugInfo('Added AI placeholder with "Typing...", status: Streaming');

      // Send the message to the AI service
      await aiChatService.sendMessage(
        {
          prompt: content,
          temperature: 0.7,
          stream: true,
        },
        (streamContent, isDone) => {
          // Once we get actual content, update the AI message content
          if (streamContent.trim().length > 0) {
            // Update the AI message with streaming content
            const newContentLength = streamContent.length;
            const contentDiff = newContentLength - (currentStreamingContent?.length || 0);
            
            // Only log occasionally to reduce console spam
            // if (isDone || contentDiff > 20 || currentStreamingContent.length === 0) {
            //   addDebugInfo(`Stream update - ${isDone ? 'DONE' : 'ongoing'}, length: ${newContentLength}, +${contentDiff} chars`);
            // }
            
            setCurrentStreamingContent(streamContent);
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: streamContent } 
                  : msg
              )
            );
          }

          if (isDone) {
            // // addDebugInfo('Stream complete, status: Done');
            setChatStatus(ChatStatus.Done);
          }
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      // addDebugInfo(`Error: ${errorMessage}`);
      setChatStatus(ChatStatus.Error);
      setError(errorMessage);
    }
  }, [addDebugInfo, currentStreamingContent]);

  // Add a welcome message and fetch prompts when the component mounts
  useEffect(() => {
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      content: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
    addDebugInfo('Chat initialized with welcome message');
    
    // Fetch available prompts
    fetchAvailablePrompts();
  }, [addDebugInfo, fetchAvailablePrompts]);

  // Render suggestion buttons
  const renderSuggestionButtons = () => {
    if (isLoadingPrompts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsScrollView}
        contentContainerStyle={styles.suggestionsContainer}
      >
        {availablePrompts.map((prompt) => (
          <TouchableOpacity
            key={prompt.key}
            style={[
              styles.suggestionButton,
              isDark ? styles.suggestionButtonDark : styles.suggestionButtonLight
            ]}
            onPress={() => handleSuggestionSelect(prompt.key)}
            disabled={chatStatus === ChatStatus.Loading || chatStatus === ChatStatus.Streaming}
          >
            <Text 
              style={[
                styles.suggestionText,
                isDark ? styles.suggestionTextDark : styles.suggestionTextLight
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {prompt.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'AI Chat',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={isDark ? '#fff' : '#000'}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Suggestion buttons at the top */}
      {availablePrompts.length > 0 && renderSuggestionButtons()}
      
      <ChatContainer
        messages={messages}
        onSendMessage={sendMessage}
        isGenerating={chatStatus === ChatStatus.Streaming || chatStatus === ChatStatus.Loading}
        isError={chatStatus === ChatStatus.Error}
        loadingIndicatorText="Thinking..."
        showTypingIndicator={false} // Hide the separate typing indicator, as it's now part of the messages
      />
      
      {__DEV__ && error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#f8f8f8',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  backButton: {
    padding: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  errorText: {
    color: 'red',
  },
  suggestionsScrollView: {
    maxHeight: 50,
  },
  suggestionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  suggestionButtonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
  },
  suggestionButtonDark: {
    backgroundColor: '#2c2c2e',
    borderColor: '#3a3a3c',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionTextLight: {
    color: '#007AFF',
  },
  suggestionTextDark: {
    color: '#0A84FF',
  },
  loadingContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
}); 