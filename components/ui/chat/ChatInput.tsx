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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * A chat input component with a send button that becomes active when 
 * text is entered. Includes keyboard handling for a smooth user experience.
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
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
            isDark ? styles.containerDark : styles.containerLight,
          ]}
        >
          <View
            style={[
              styles.inputContainer,
              isDark ? styles.inputContainerDark : styles.inputContainerLight,
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
                isDark ? styles.inputDark : styles.inputLight,
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
  },
  containerLight: {
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  containerDark: {
    backgroundColor: '#1c1c1e',
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 4 : 0,
  },
  inputContainerLight: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputContainerDark: {
    backgroundColor: '#2c2c2e',
    borderWidth: 1,
    borderColor: '#3c3c3c',
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  inputLight: {
    color: '#000',
  },
  inputDark: {
    color: '#fff',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonInactive: {
    backgroundColor: 'transparent',
  },
});

export default ChatInput; 