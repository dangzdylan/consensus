import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import CodeInput from '../components/CodeInput';
import colors from '../constants/colors';

export default function JoinLobbyScreen({ navigation }) {
    const [code, setCode] = useState('');

    const handleJoin = () => {
        // TODO: Implement join lobby logic
        navigation.navigate('Lobby');
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

                <CodeInput length={4} onCodeChange={setCode} />

                <Button
                    title="Join"
                    onPress={handleJoin}
                    style={styles.joinButton}
                // variant="secondary" // Using default primary but styled dark
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
});
