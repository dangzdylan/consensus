import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import Input from '../components/Input';
import colors from '../constants/colors';
import { authAPI } from '../services/api';
import { useUser } from '../context/UserContext';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useUser();

  console.log('LoginScreen rendering, navigation:', navigation ? 'exists' : 'missing');

  const handleLogin = async () => {
    // Clear previous errors
    setError('');
    
    // Validate input
    if (!username || username.trim() === '') {
      setError('Please enter a username');
      return;
    }

    setLoading(true);

    try {
      // Call backend API
      const result = await authAPI.login(username.trim());

      // Check for error first (handles 404, 400, 500, etc.)
      if (result.error) {
        // Handle error - backend returns {"error": "message"} for errors
        setError(result.error);
        setLoading(false);
        return;
      }

      // Check if result.data exists and is valid
      if (!result.data) {
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // Additional safety check: if data is an array, it's likely an error
      if (Array.isArray(result.data)) {
        console.error('Invalid response format from backend:', result.data);
        setError('Invalid response from server. Please try again.');
        setLoading(false);
        return;
      }

      // Validate user data structure before saving
      if (typeof result.data !== 'object' || !result.data.user_id || !result.data.username) {
        console.error('Invalid user data from backend:', result.data);
        setError('Invalid response from server. Please try again.');
        setLoading(false);
        return;
      }
      
      // Save user data and navigate
      try {
        await login(result.data);
        
        if (navigation && navigation.replace) {
          navigation.replace('Home');
        } else {
          console.error('Navigation not available in LoginScreen');
        }
      } catch (loginError) {
        console.error('Error saving user data:', loginError);
        setError('Failed to save user data. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  console.log('LoginScreen about to render JSX');
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Ready for a</Text>
            <Text style={styles.titleBold}>Consensus?</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>
            <Input
              placeholder="Enter your username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError(''); // Clear error when user types
              }}
              autoCapitalize="none"
              style={styles.input}
              editable={!loading}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <Button 
              title={loading ? "Logging in..." : "Log in"} 
              onPress={handleLogin} 
              style={styles.loginButton}
              loading={loading}
              disabled={loading || !username.trim()}
            />

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={() => {
                  if (navigation && navigation.navigate) {
                    navigation.navigate('Signup');
                  }
                }}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '400',
  },
  titleBold: {
    fontSize: 32,
    color: colors.white,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  label: {
    color: colors.white,
    fontWeight: '400',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 0,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: colors.white,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: -8,
    marginBottom: 8,
    textAlign: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: colors.white,
  },
  signupLink: {
    color: colors.white,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
