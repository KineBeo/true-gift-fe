import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useColorScheme } from 'nativewind';

import StreamingMessage from './StreamingMessage';
import AITypingIndicator from './AITypingIndicator';
import ChatInput from './ChatInput';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

interface ChatContainerProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isGenerating?: boolean;
  isError?: boolean;
  loadingIndicatorText?: string;
  showTypingIndicator?: boolean;
}

/**
 * A container component that combines chat messages, typing indicator,
 * and input for a complete AI chat experience.
 */
export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  isGenerating = false,
  isError = false,
  loadingIndicatorText = 'Thinking',
  showTypingIndicator = true,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [inputDisabled, setInputDisabled] = useState(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Disable input while generating
  useEffect(() => {
    setInputDisabled(isGenerating);
  }, [isGenerating]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <StreamingMessage
        content={item.content}
        isGenerating={isGenerating && item.id === messages[messages.length - 1]?.id}
        isPrimary={item.isUser}
      />
    ),
    [isGenerating, messages]
  );

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!inputDisabled) {
        onSendMessage(text);
      }
    },
    [onSendMessage, inputDisabled]
  );

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        isDark ? styles.containerDark : styles.containerLight
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          }
        />

        {isGenerating && showTypingIndicator && (
          <AITypingIndicator text={loadingIndicatorText} visible={true} />
        )}

        <ChatInput 
          onSend={handleSendMessage} 
          disabled={inputDisabled} 
          placeholder={isError ? "An error occurred. Try again..." : "Type a message..."}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
  keyboardAvoidingView: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default ChatContainer; 