import { apiService } from './api';
import { API_URL } from '../config/environment';
import { useAuthStore } from '../stores/auth-store';

export interface AIMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

export interface ChatCompletionOptions {
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export enum ChatStatus {
  Idle = 'idle',
  Loading = 'loading',
  Streaming = 'streaming',
  Done = 'done',
  Error = 'error',
}

export interface ChatSession {
  id: string;
  messages: AIMessage[];
  status: ChatStatus;
  error?: string;
}

// Update this to point to your AI chat microservice
// In development, this would typically be http://localhost:8080
const AI_SERVICE_URL = 'http://localhost:9000';

class AIChatService {
  private readonly API_ENDPOINT = '/api/chat';
  
  /**
   * Sends a message to the AI model and receives a completion
   * @param options Chat completion options
   * @param onProgress Callback for streaming responses
   * @returns The AI response
   */
  async sendMessage(
    options: ChatCompletionOptions,
    onProgress?: (content: string, isDone: boolean) => void
  ): Promise<string> {
    console.log(`[AIChatService] Sending message to AI with options:`, JSON.stringify(options));

    try {
      // For streaming responses, we'll implement a polling approach that's more compatible with React Native
      if (options.stream && onProgress) {
        console.log(`[AIChatService] Using manual streaming mode for React Native compatibility`);
       
        // Immediately show empty response to avoid delay
        onProgress('', false);
        
        let fullText = '';
        let currentPosition = 0;
        let simulationInterval: ReturnType<typeof setInterval> | null = null;
        
        // Controller to abort fetch if needed
        const controller = new AbortController();
        const signal = controller.signal;
        
        // Create a promise to track completion
        const responseCompletePromise = new Promise<string>(async (resolve, reject) => {
          try {
            // Start with fetch request
            const response = await fetch(`${AI_SERVICE_URL}${this.API_ENDPOINT}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/plain, */*'
              },
              body: JSON.stringify(options),
              signal,
            });

            console.log(`[AIChatService] Response status: ${response.status}, content type: ${response.headers.get('Content-Type')}`);

            if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = 'Failed to get AI response';
              
              try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.detail || errorData.message || errorMessage;
              } catch (e) {
                if (errorText) errorMessage = errorText;
              }
              
              console.error(`[AIChatService] Error from API: ${errorMessage}`);
              throw new Error(errorMessage);
            }
            
            // Process response text a little at a time
            const reader = response.body?.getReader();
            
            if (reader) {
              const decoder = new TextDecoder();
              let responseBuffer = '';
              
              // This function will be called repeatedly as data arrives
              const processStreamChunks = async (): Promise<void> => {
                try {
                  const { done, value } = await reader.read();
                  
                  if (done) {
                    // End of stream, make sure we've processed everything
                    if (responseBuffer.length > 0) {
                      fullText += responseBuffer;
                      onProgress(fullText, true);
                    }
                    
                    if (simulationInterval) {
                      clearInterval(simulationInterval);
                      simulationInterval = null;
                    }
                    
                    resolve(fullText);
                    return;
                  }
                  
                  // Decode the binary chunk to text
                  const chunk = decoder.decode(value, { stream: true });
                  responseBuffer += chunk;
                  
                  // Update fullText with new data
                  fullText += responseBuffer;
                  responseBuffer = '';
                  
                  // Continue reading
                  processStreamChunks();
                } catch (error) {
                  if (simulationInterval) {
                    clearInterval(simulationInterval);
                    simulationInterval = null;
                  }
                  
                  reject(error);
                }
              };
              
              // Start processing the stream
              processStreamChunks();
              
              // Start simulation that reveals the text as it comes in
              let lastRevealLength = 0;
              simulationInterval = setInterval(() => {
                if (currentPosition < fullText.length) {
                  // Calculate next reveal position - reveal faster when there's more text available
                  const available = fullText.length - currentPosition;
                  const revealSpeed = Math.min(10, Math.max(1, Math.floor(available / 5)));
                  const revealAmount = revealSpeed + Math.floor(Math.random() * 3); // Add slight randomness
                  
                  currentPosition = Math.min(
                    currentPosition + revealAmount,
                    fullText.length
                  );
                  
                  const currentText = fullText.substring(0, currentPosition);
                  onProgress(currentText, false);
                  
                  if (fullText.length > lastRevealLength + 50) {
                    console.log(`[AIChatService] Received ${fullText.length} total chars, revealed ${currentPosition}`);
                    lastRevealLength = fullText.length;
                  }
                }
              }, 25); // Update every 25ms for smooth animation
              
            } else {
              // Fallback to text() if response.body is not available
              console.log(`[AIChatService] No stream body available, falling back to text()`);
              
              // Start a timer to simulate streaming for better UX
              let intervalId = setInterval(() => {
                onProgress(fullText.substring(0, currentPosition), false);
                
                // Use a fast typing simulation when we don't have real streaming
                currentPosition = Math.min(currentPosition + 3, fullText.length);
                
                if (currentPosition >= fullText.length) {
                  clearInterval(intervalId);
                  onProgress(fullText, true);
                  resolve(fullText);
                }
              }, 30);
              
              // Get the full text
              fullText = await response.text();
              console.log(`[AIChatService] Received text response of length: ${fullText.length}`);
            }
          } catch (error) {
            console.error('Error in fetch:', error);
            
            if (simulationInterval) {
              clearInterval(simulationInterval);
              simulationInterval = null;
            }
            
            reject(error);
          }
        });
        
        return await responseCompletePromise;
      } 
      
      // For non-streaming responses
      console.log(`[AIChatService] Using non-streaming mode`);
      const response = await fetch(`${AI_SERVICE_URL}${this.API_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...options, stream: false }),
      });
      
      console.log(`[AIChatService] Non-stream response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to get AI response';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If the error response is not valid JSON, use the text as is
          if (errorText) errorMessage = errorText;
        }
        
        console.error(`[AIChatService] Error from API: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      try {
        const data = await response.json();
        console.log(`[AIChatService] Received non-streaming JSON response successfully`);
        return data.response;
      } catch (jsonError) {
        // If response is not JSON, try to get text
        console.log(`[AIChatService] Response is not JSON, falling back to text`);
        const text = await response.clone().text();
        return text;
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      throw error;
    }
  }

  /**
   * Creates a new chat message object
   */
  createMessage(content: string, isUser: boolean): AIMessage {
    return {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: Date.now(),
    };
  }

  /**
   * Creates a new chat session
   */
  createSession(): ChatSession {
    return {
      id: Date.now().toString(),
      messages: [],
      status: ChatStatus.Idle,
    };
  }
}

export default new AIChatService(); 