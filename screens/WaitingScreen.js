import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

export default function WaitingScreen({ navigation }) {
    // Mock data - in real app, this would listen to backend for completion
    const [waitingFor] = React.useState(['Alice', 'Bob']);

    // Simulate auto-navigation when everyone is done
    React.useEffect(() => {
        // In real app, this would be triggered by backend event
        const timer = setTimeout(() => {
            navigation.replace('Leaderboard');
        }, 5000); // Auto-navigate after 5 seconds for demo

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="hourglass-outline" size={80} color={colors.white} />
                </View>

                <Text style={styles.title}>Great job!</Text>
                <Text style={styles.subtitle}>You've finished swiping</Text>

                <View style={styles.waitingContainer}>
                    <ActivityIndicator size="large" color={colors.white} />
                    <Text style={styles.waitingText}>Waiting for others to finish...</Text>
                </View>

                <View style={styles.membersList}>
                    <Text style={styles.membersTitle}>Still swiping:</Text>
                    {waitingFor.map((name, index) => (
                        <View key={index} style={styles.memberItem}>
                            <View style={styles.avatarCircle}>
                                <Ionicons name="person" size={20} color={colors.primary} />
                            </View>
                            <Text style={styles.memberName}>{name}</Text>
                            <ActivityIndicator size="small" color={colors.white} />
                        </View>
                    ))}
                </View>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 48,
    },
    waitingContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    waitingText: {
        fontSize: 16,
        color: colors.white,
        marginTop: 16,
    },
    membersList: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        padding: 16,
    },
    membersTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 12,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberName: {
        flex: 1,
        fontSize: 16,
        color: colors.white,
        fontWeight: '600',
    },
});
