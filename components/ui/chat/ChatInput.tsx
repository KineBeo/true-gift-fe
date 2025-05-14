import React, { useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestionButtons?: React.ReactNode;
}

/**
 * A chat input component with a send button that becomes active when 
 * text is entered. Includes keyboard handling for a smooth user experience.
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  suggestionButtons,
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      Keyboard.dismiss();
    }
  }, [message, onSend, disabled]);

  const handleBlur = useCallback(() => {
    if (Platform.OS === 'ios') {
      inputRef.current?.setNativeProps({
        selection: { start: 0, end: 0 },
      });
    }
  }, []);

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[
            styles.container,
          ]}
        >
          {suggestionButtons}
          <View
            style={[
              styles.inputContainer,
            ]}
          >
            <TextInput
              ref={inputRef}
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor={isDark ? '#888' : '#999'}
              style={[
                styles.input,
              ]}
              multiline
              maxLength={1000}
              onBlur={handleBlur}
              editable={!disabled}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!canSend}
              style={[
                styles.sendButton,
                canSend ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
            >
              <Ionicons
                name="send"
                size={20}
                color={canSend ? '#fff' : isDark ? '#555' : '#ccc'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'black',
    borderTopWidth: 0.8,
    borderTopColor: 'gray'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 4 : 0,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    color: 'white',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#FFC83C',
  },
  sendButtonInactive: {
    backgroundColor: 'transparent',
  },
});

export default ChatInput; 