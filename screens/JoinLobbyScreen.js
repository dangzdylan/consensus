import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import CodeInput from '../components/CodeInput';
import colors from '../constants/colors';

export default function JoinLobbyScreen({ navigation }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleJoin = async () => {
        // Validate code format (4-6 alphanumeric characters)
        if (!code || code.length < 4) {
            setError('Please enter a valid lobby code');
            return;
        }

        const isValidCode = /^[A-Z0-9]{4,6}$/i.test(code);
        
        if (!isValidCode) {
            setError('Invalid code format. Use 4-6 letters or numbers.');
            return;
        }

        try {
            // TODO: Validate code with backend
            // In real app: 
            // const response = await joinLobby(code.toUpperCase());
            // if (response.error) {
            //     setError(response.error);
            //     return;
            // }
            // if (response.lobbyFull) {
            //     setError('Lobby is full. Maximum 25 members allowed.');
            //     return;
            // }
            // if (response.lobbyNotFound) {
            //     setError('Lobby not found. Please check the code.');
            //     return;
            // }

            // Simulate validation - in real app, check backend response
            setError('');
            if (navigation && navigation.navigate) {
                navigation.navigate('Lobby', { 
                    lobbyCode: code.toUpperCase(),
                    isOwner: false 
                });
            } else {
                console.error('Navigation not available');
                setError('Navigation error. Please try again.');
            }
        } catch (error) {
            setError('Failed to join lobby. Please try again.');
            console.error('Join lobby error:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Join a</Text>
                    <Text style={styles.title}>Consensus</Text>
                </View>

                <Text style={styles.label}>Enter a code</Text>

                <CodeInput length={6} onCodeChange={(newCode) => {
                    setCode(newCode);
                    setError('');
                }} />

                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : null}

                <Button
                    title="Join"
                    onPress={handleJoin}
                    style={styles.joinButton}
                    disabled={!code || code.length < 4}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        paddingTop: 60,
    },
    header: {
        marginBottom: 48,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.white,
    },
    label: {
        fontSize: 18,
        color: colors.white,
        marginBottom: 24,
    },
    joinButton: {
        backgroundColor: colors.darkGray,
        marginTop: 'auto',
        marginBottom: 24,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginTop: -16,
        marginBottom: 16,
        textAlign: 'center',
    },
});
