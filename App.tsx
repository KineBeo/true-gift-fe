import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SignupScreen } from './components/SignupScreen';
import { HomeScreen } from './components/HomeScreen';

import './global.css';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <>
      {isLoggedIn ? <HomeScreen onLogout={handleLogout} /> : <SignupScreen onLogin={handleLogin} />}
      <StatusBar style="light" />
    </>
  );
}
