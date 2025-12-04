import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import colors from '../constants/colors';

export default function SignupScreen({ navigation }) {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreed, setAgreed] = useState(false);

    const handleSignup = () => {
        // TODO: Implement signup logic
        navigation.replace('Home');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                        <Text style={styles.backText}>back</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Sign up to</Text>
                        <Text style={styles.titleBold}>Consensus</Text>
                    </View>

                    <View style={styles.form}>
                        <Input placeholder="Enter your name" value={name} onChangeText={setName} />
                        <Input placeholder="Enter username" value={username} onChangeText={setUsername} autoCapitalize="none" />
                        <Input placeholder="Enter Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        <Input placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry />

                        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreed(!agreed)}>
                            <View style={[styles.checkbox, agreed && styles.checked]}>
                                {agreed && <Ionicons name="checkmark" size={12} color={colors.primary} />}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                I agree with the <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy policy</Text>
                            </Text>
                        </TouchableOpacity>

                        <Button title="Create Account" onPress={handleSignup} style={styles.signupButton} />

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.orText}>Or</Text>
                            <View style={styles.line} />
                        </View>

                        <Button
                            title="Sign up with Google"
                            variant="secondary"
                            onPress={() => { }}
                            style={styles.googleButton}
                            icon={<Ionicons name="logo-google" size={20} color={colors.white} style={{ marginRight: 8 }} />}
                        />

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
});
