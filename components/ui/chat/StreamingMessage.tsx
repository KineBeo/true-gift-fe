import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { useColorScheme } from 'nativewind';

interface StreamingMessageProps {
  content: string;
  isGenerating: boolean;
  letterInterval?: number;
  isPrimary?: boolean;
}

/**
 * A component that renders text with a character-by-character animation effect
 * similar to how ChatGPT displays streaming responses.
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  isGenerating,
  letterInterval = 0.01, // Default animation speed: 10ms per character, slightly slower than before
  isPrimary = false,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef('');
  const queueRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Animation for typing dots
  const [typingDots, setTypingDots] = useState('');
  const typingDotsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Last content update timestamp for rate limiting
  const lastUpdateRef = useRef<number>(Date.now());
  // Animation frame tracking
  const animationFrameRef = useRef<number | null>(null);

  // Typing dots animation for "Typing..." message
  useEffect(() => {
    // If the content is "Typing...", animate the dots
    if (content === 'Typing...') {
      // Clear any existing animation
      if (typingDotsTimerRef.current) {
        clearInterval(typingDotsTimerRef.current);
      }
      
      // Set up the typing dots animation
      typingDotsTimerRef.current = setInterval(() => {
        setTypingDots(prev => {
          if (prev === '') return '.';
          if (prev === '.') return '..';
          if (prev === '..') return '...';
          return '';
        });
      }, 500);
      
      // Set the display text to "Typing" without dots (will be added separately)
      setDisplayText('Typing');
      
      return () => {
        if (typingDotsTimerRef.current) {
          clearInterval(typingDotsTimerRef.current);
        }
      };
    }
    
    return undefined;
  }, [content]);

  // Queue management for text streaming animation
  const addToQueue = (text: string) => {
    if (text.length > 200) {
      // For very large updates, split into larger chunks
      // This significantly improves performance for large updates
      const chunks = [];
      for (let i = 0; i < text.length; i += 20) { // Process in chunks of 20 chars
        chunks.push(text.substring(i, Math.min(i + 20, text.length)));
      }
      queueRef.current = [...queueRef.current, ...chunks];
    } else if (text.length > 50) {
      // Medium-sized updates
      const chunks = [];
      for (let i = 0; i < text.length; i += 10) {
        chunks.push(text.substring(i, Math.min(i + 10, text.length)));
      }
      queueRef.current = [...queueRef.current, ...chunks];
    } else {
      // For smaller updates, animate character-by-character for better effect
      for (let i = 0; i < text.length; i++) {
        queueRef.current.push(text[i]);
      }
    }
    
    // If too many items in queue, process more aggressively
    if (queueRef.current.length > 300) {
      console.log(`[StreamingMessage] Queue too large (${queueRef.current.length}), optimizing...`);
      const combinedChunks = [];
      const chunkSize = 40; // Larger chunks when backed up
      
      while (queueRef.current.length > 0) {
        let chunk = '';
        for (let i = 0; i < chunkSize && queueRef.current.length > 0; i++) {
          chunk += queueRef.current.shift();
        }
        if (chunk) combinedChunks.push(chunk);
      }
      
      queueRef.current = combinedChunks;
    }
  };

  // Process the next character from the queue using requestAnimationFrame
  // This provides smoother animation than setTimeout
  const processNextCharacter = () => {
    if (queueRef.current.length === 0) {
      setIsAnimating(false);
      animationFrameRef.current = null;
      return;
    }

    const now = Date.now();
    const elapsed = now - lastUpdateRef.current;
    
    // Rate limit updates for smoother animation
    if (elapsed >= letterInterval * 1000) {
      const nextItem = queueRef.current.shift() || '';
      setDisplayText(prev => prev + nextItem);
      lastUpdateRef.current = now;
    }
    
    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(processNextCharacter);
  };

  // Start the animation
  const startAnimation = () => {
    if (!isAnimating && queueRef.current.length > 0 && !animationFrameRef.current) {
      setIsAnimating(true);
      animationFrameRef.current = requestAnimationFrame(processNextCharacter);
    }
  };

  // Watch for content changes to animate new text
  useEffect(() => {
    // Skip animation if this is a "Typing..." message
    if (content === 'Typing...') {
      return;
    }
    
    // If content changed
    if (content !== contentRef.current) {
      // If there's new content to add
      if (content.length > contentRef.current.length) {
        // Get only the new part of the content
        const newContent = content.substring(contentRef.current.length);
        
        // Log significant updates
        if (newContent.length > 10) {
          console.log(`[StreamingMessage] Adding ${newContent.length} new characters to animation queue`);
        }
        
        addToQueue(newContent);
        startAnimation();
      } else if (content.length < contentRef.current.length) {
        // Content was reset/replaced entirely
        console.log(`[StreamingMessage] Content was reset, displaying immediately: ${content.length} chars`);
        setDisplayText(content);
        queueRef.current = [];
        setIsAnimating(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
      
      contentRef.current = content;
    }
  }, [content]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (typingDotsTimerRef.current) {
        clearInterval(typingDotsTimerRef.current);
      }
    };
  }, []);

  // If generation stops, display the entire content immediately
  useEffect(() => {
    if (!isGenerating && content.length > displayText.length && content !== 'Typing...') {
      console.log(`[StreamingMessage] Generation stopped, showing full content: ${content.length} chars`);
      setDisplayText(content);
      queueRef.current = [];
      setIsAnimating(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isGenerating, content, displayText]);

  return (
    <View 
      style={[
        styles.container, 
        isPrimary 
          ? (isDark ? styles.primaryDark : styles.primary) 
          : (isDark ? styles.secondaryDark : styles.secondary),
        content === 'Typing...' && styles.typingContainer,
      ]}
    >
      <Text style={[
        styles.text,
        isPrimary 
          ? styles.primaryText 
          : (isDark ? styles.secondaryTextDark : styles.secondaryText),
        content === 'Typing...' && styles.typingText,
      ]}>
        {content === 'Typing...' ? `${displayText}${typingDots}` : displayText}
        {isAnimating && content !== 'Typing...' && <Text style={styles.cursor}>▋</Text>}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 12,
    maxWidth: '85%',
    marginVertical: 4,
  },
  primary: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  primaryDark: {
    backgroundColor: '#0A84FF',
    alignSelf: 'flex-end',
  },
  secondary: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  secondaryDark: {
    backgroundColor: '#2C2C2E',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#000000',
  },
  secondaryTextDark: {
    color: '#FFFFFF',
  },
  cursor: {
    color: '#999',
    opacity: 0.7,
  },
  typingContainer: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
    padding: 8,
    paddingHorizontal: 16,
    opacity: 0.9,
  },
  typingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
});

export default StreamingMessage; 