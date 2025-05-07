import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import ChatContainer, { ChatMessage } from '../../components/ui/chat/ChatContainer';
import aiChatService, { ChatStatus } from '../../lib/services/ai-chat';

export default function AIChatScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<ChatStatus>(ChatStatus.Idle);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Log debug info
  const addDebugInfo = useCallback((info: string) => {
    console.log(`[AIChatScreen] ${info}`);
    setDebugInfo(prev => `${info}\n${prev}`);
  }, []);

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
      addDebugInfo('Added user message, status: Loading');

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
      addDebugInfo('Added AI placeholder with "Typing...", status: Streaming');

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
            if (isDone || contentDiff > 20 || currentStreamingContent.length === 0) {
              addDebugInfo(`Stream update - ${isDone ? 'DONE' : 'ongoing'}, length: ${newContentLength}, +${contentDiff} chars`);
            }
            
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
            addDebugInfo('Stream complete, status: Done');
            setChatStatus(ChatStatus.Done);
          }
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      addDebugInfo(`Error: ${errorMessage}`);
      setChatStatus(ChatStatus.Error);
      setError(errorMessage);
    }
  }, [addDebugInfo, currentStreamingContent]);

  // Add a welcome message when the component mounts
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      content: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
    addDebugInfo('Chat initialized with welcome message');
  }, [addDebugInfo]);

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
}); 