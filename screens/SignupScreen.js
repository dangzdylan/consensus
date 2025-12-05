import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import colors from '../constants/colors';
import { authAPI } from '../services/api';
import { useUser } from '../context/UserContext';

export default function SignupScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useUser();

    const handleSignup = async () => {
        // Clear previous errors
        setError('');

        // Validate input
        if (!username || username.trim() === '') {
            setError('Please enter a username');
            return;
        }

        if (!agreed) {
            setError('Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        setLoading(true);

        try {
            // Call backend API
            const result = await authAPI.signup(username.trim());

            // Check for error first (handles 400, 409, 500, etc.)
            if (result.error) {
                // Handle error - backend returns {"error": "message"} for errors
                setError(result.error);
                setLoading(false);
                return;
            }

            // Check if result.data exists and is valid
            if (!result.data) {
                setError('Signup failed. Please try again.');
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
                const loginResult = await login(result.data);
                if (loginResult.success) {
                    if (navigation && navigation.replace) {
                        navigation.replace('Home');
                    } else {
                        console.error('Navigation not available in SignupScreen');
                    }
                } else {
                    setError(loginResult.error || 'Failed to save user data. Please try again.');
                    setLoading(false);
                }
            } catch (loginError) {
                console.error('Error saving user data:', loginError);
                setError('Failed to save user data. Please try again.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Signup error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity 
                        onPress={() => {
                            if (navigation && navigation.goBack) {
                                navigation.goBack();
                            }
                        }} 
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                        <Text style={styles.backText}>back</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Sign up to</Text>
                        <Text style={styles.titleBold}>Consensus</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Username</Text>
                        <Input 
                            placeholder="Enter username" 
                            value={username} 
                            onChangeText={(text) => {
                                setUsername(text);
                                setError(''); // Clear error when user types
                            }} 
                            autoCapitalize="none"
                            editable={!loading}
                        />

                        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreed(!agreed)}>
                            <View style={[styles.checkbox, agreed && styles.checked]}>
                                {agreed && <Ionicons name="checkmark" size={12} color={colors.primary} />}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                I agree with the <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy policy</Text>
                            </Text>
                        </TouchableOpacity>

                        {error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        <Button 
                            title={loading ? "Creating Account..." : "Create Account"} 
                            onPress={handleSignup} 
                            style={styles.signupButton}
                            loading={loading}
                            disabled={loading || !username.trim() || !agreed}
                        />

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    if (navigation && navigation.navigate) {
                                        navigation.navigate('Login');
                                    }
                                }}
                            >
                                <Text style={styles.loginLink}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backText: {
        color: colors.white,
        marginLeft: 4,
        fontSize: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
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
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        backgroundColor: colors.white,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    checked: {
        backgroundColor: colors.white,
    },
    checkboxLabel: {
        color: colors.white,
        fontSize: 12,
        flex: 1,
    },
    link: {
        textDecorationLine: 'underline',
        fontWeight: 'bold',
    },
    signupButton: {
        backgroundColor: colors.darkGray,
        marginTop: 8,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    orText: {
        color: colors.white,
        marginHorizontal: 16,
        fontSize: 14,
    },
    googleButton: {
        backgroundColor: colors.darkGray,
        borderWidth: 0,
    },
    googleButtonTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        marginVertical: 8,
    },
    googleButtonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginText: {
        color: colors.white,
    },
    loginLink: {
        color: colors.white,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginTop: -8,
        marginBottom: 8,
        textAlign: 'center',
    },
    label: {
        color: colors.white,
        fontWeight: '400',
        marginBottom: 8,
        fontSize: 16,
    },
});
