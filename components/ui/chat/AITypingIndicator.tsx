import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { useColorScheme } from 'nativewind';

interface AITypingIndicatorProps {
  text?: string;
  visible?: boolean;
}

/**
 * A component that displays a typing indicator with dots animation
 * to indicate that the AI is processing or thinking.
 */
export const AITypingIndicator: React.FC<AITypingIndicatorProps> = ({
  text = 'Thinking',
  visible = true,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [fadeAnim] = useState(new Animated.Value(0));
  const [dots, setDots] = useState('');
  
  // Animate the fade in when component becomes visible
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        switch (prev) {
          case '':
            return '.';
          case '.':
            return '..';
          case '..':
            return '...';
          default:
            return '';
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        isDark ? styles.darkContainer : styles.lightContainer,
        { opacity: fadeAnim },
      ]}
    >
      <Text style={[styles.text, isDark ? styles.darkText : styles.lightText]}>
        {text}{dots}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
    maxWidth: '90%',
    alignSelf: 'flex-start',
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightContainer: {
    backgroundColor: '#E5E5EA',
  },
  darkContainer: {
    backgroundColor: '#2C2C2E',
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
  },
  lightText: {
    color: '#000000',
  },
  darkText: {
    color: '#FFFFFF',
  }
});

export default AITypingIndicator; 