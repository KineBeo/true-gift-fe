import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import challengeService, { TodayChallengeDto, ChallengeHistoryDto } from '@/lib/services/challenge';
import { useAuthStore } from '@/lib/stores/auth-store';
import { API_URL } from '@/lib/config/environment';

export default function ApiTestScreen() {
  const [todayChallenge, setTodayChallenge] = useState<TodayChallengeDto | null>(null);
  const [history, setHistory] = useState<ChallengeHistoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { user, isAuthenticated } = useAuthStore();

  async function testGetTodayChallenge() {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await challengeService.getTodayChallenge();
      setTodayChallenge(result);
      console.log('Today challenge result:', result);
    } catch (error: any) {
      console.error('Error fetching today challenge:', error);
      setErrorMessage(`Error fetching today's challenge: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function testGetHistory() {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await challengeService.getChallengeHistory();
      setHistory(result);
      console.log('History result:', result);
    } catch (error: any) {
      console.error('Error fetching challenge history:', error);
      setErrorMessage(`Error fetching challenge history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'API Testing' }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>API Information</Text>
          <Text style={styles.infoText}>API URL: {API_URL}</Text>
          <Text style={styles.infoText}>User Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>
          {user && (
            <>
              <Text style={styles.infoText}>User ID: {user.id}</Text>
              <Text style={styles.infoText}>Email: {user.email}</Text>
            </>
          )}
        </View>

        {!isAuthenticated && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              You need to be logged in to test these APIs.
            </Text>
          </View>
        )}
        
        {isAuthenticated && (
          <>
            <Text style={styles.header}>Logged in as: {user?.email}</Text>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Challenge</Text>
              <TouchableOpacity 
                style={styles.button} 
                onPress={testGetTodayChallenge}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Test Get Today's Challenge</Text>
              </TouchableOpacity>
              
              {todayChallenge && (
                <View style={styles.resultBox}>
                  <Text style={styles.resultTitle}>Challenge Details:</Text>
                  <Text style={styles.resultText}>Title: {todayChallenge.title}</Text>
                  <Text style={styles.resultText}>Class: {todayChallenge.class}</Text>
                  <Text style={styles.resultText}>
                    Status: {todayChallenge.isCompleted ? 'Completed' : 'Not Completed'}
                  </Text>
                  <Text style={styles.resultText}>Current Streak: {todayChallenge.currentStreak}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Challenge History</Text>
              <TouchableOpacity 
                style={styles.button} 
                onPress={testGetHistory}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Test Get Challenge History</Text>
              </TouchableOpacity>
              
              {history && (
                <View style={styles.resultBox}>
                  <Text style={styles.resultTitle}>History Summary:</Text>
                  <Text style={styles.resultText}>Current Streak: {history.currentStreak}</Text>
                  <Text style={styles.resultText}>Highest Streak: {history.highestStreak}</Text>
                  <Text style={styles.resultText}>Total Completed: {history.totalCompleted}</Text>
                  <Text style={styles.resultText}>Total Entries: {history.history?.length || 0}</Text>
                </View>
              )}
            </View>
          </>
        )}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  infoText: {
    marginBottom: 4,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    marginBottom: 4,
  },
  loadingContainer: {
    margin: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  errorText: {
    color: '#c62828',
  },
  warningBox: {
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  warningText: {
    color: '#ff6f00',
  },
}); 