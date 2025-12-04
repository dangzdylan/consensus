import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import colors from '../constants/colors';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
                        <Text style={styles.title}>Log in to</Text>
                        <Text style={styles.titleBold}>Consensus</Text>
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

                        <View style={styles.passwordHeader}>
                            <Text style={styles.label}>Password</Text>
                            <TouchableOpacity>
                                <Text style={styles.forgotPassword}>Forgot?</Text>
                            </TouchableOpacity>
                        </View>
                        <Input
                            placeholder=""
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                        />

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.orText}>Or</Text>
                            <View style={styles.line} />
                        </View>

                        <Button
                            title="Log in with Google"
                            variant="secondary"
                            onPress={() => { }}
                            style={styles.googleButton}
                            icon={<Ionicons name="logo-google" size={20} color={colors.white} style={{ marginRight: 8 }} />}
                        />

                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.signupLink}>Sign up</Text>
                            </TouchableOpacity>
                        </View>


                    </View>

                    <Button title="Log in" onPress={handleLogin} style={styles.loginButton} />
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
        color: colors.darkGray,
        fontWeight: 'bold',
        marginBottom: 4,
        fontSize: 14,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: 30,
        borderWidth: 0,
        marginBottom: 16,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    forgotPassword: {
        color: colors.darkGray,
        textDecorationLine: 'underline',
        fontSize: 12,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.darkGray,
    },
    orText: {
        color: colors.darkGray,
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: 'bold',
    },
    googleButton: {
        backgroundColor: colors.darkGray,
        borderWidth: 0,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 16,
    },
    signupText: {
        color: colors.white,
    },
    signupLink: {
        color: colors.white,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },

    loginButton: {
        backgroundColor: colors.white,
        marginTop: 'auto',
    },
});