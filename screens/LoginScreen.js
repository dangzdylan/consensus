import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import Input from '../components/Input';
import colors from '../constants/colors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    // TODO: Implement actual login logic
    navigation.replace('Home');
  };

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
            <Text style={styles.label}>Username or Email</Text>
            <Input
              placeholder=""
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Button title="Log in" onPress={handleLogin} style={styles.loginButton} />
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
});
