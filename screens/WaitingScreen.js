import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

export default function WaitingScreen({ route, navigation }) {
    const { allRoundsComplete, lobbyData, isOwner } = route?.params || {};
    const MAX_WAIT_TIME = 300000; // 5 minutes max wait
    const POLL_INTERVAL = 2000; // Poll every 2 seconds
    
    // Mock data - in real app, this would listen to backend for completion
    const [waitingFor, setWaitingFor] = React.useState(['Alice', 'Bob']);
    const [isComplete, setIsComplete] = React.useState(allRoundsComplete || false);
    const [waitTime, setWaitTime] = React.useState(0);
    const startTimeRef = React.useRef(Date.now());

    // Simulate auto-navigation when everyone is done
    React.useEffect(() => {
        const startTime = Date.now();
        startTimeRef.current = startTime;

        if (isComplete) {
            // In real app, this would wait for all users to finish all rounds
            const timer = setTimeout(() => {
                // Navigate to itinerary screen with results
                if (navigation && navigation.replace) {
                    navigation.replace('Itinerary', {
                        lobbyData: lobbyData || {},
                        selectedActivities: [], // TODO: Get from voting results
                        isOwner: isOwner !== undefined ? isOwner : false,
                    });
                }
            }, 3000); // Wait 3 seconds to show completion

            return () => clearTimeout(timer);
        } else {
            // Still waiting for others to finish current round
            // In real app, poll backend for completion status
            const pollInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                setWaitTime(elapsed);

                // Check timeout
                if (elapsed > MAX_WAIT_TIME) {
                    clearInterval(pollInterval);
                    alert('Wait time exceeded. Returning to lobby.');
                    if (navigation && navigation.goBack) {
                        navigation.goBack();
                    }
                    return;
                }

                // TODO: In real app, check backend:
                // const status = await checkRoundStatus();
                // if (status.allComplete) {
                //     setIsComplete(true);
                //     setWaitingFor([]);
                // } else {
                //     setWaitingFor(status.waitingFor);
                // }
            }, POLL_INTERVAL);

            // Simulate completion for demo
            const completionTimer = setTimeout(() => {
                setIsComplete(true);
                setWaitingFor([]);
            }, 5000);

            return () => {
                clearInterval(pollInterval);
                clearTimeout(completionTimer);
            };
        }
    }, [navigation, isComplete, lobbyData, isOwner]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="hourglass-outline" size={80} color={colors.white} />
                </View>

                <Text style={styles.title}>
                    {isComplete ? 'All done!' : 'Great job!'}
                </Text>
                <Text style={styles.subtitle}>
                    {isComplete 
                        ? 'Generating your itinerary...' 
                        : "You've finished swiping"}
                </Text>

                <View style={styles.waitingContainer}>
                    <ActivityIndicator size="large" color={colors.white} />
                    <Text style={styles.waitingText}>
                        {isComplete 
                            ? 'Finalizing results...' 
                            : 'Waiting for others to finish...'}
                    </Text>
                </View>

                {waitingFor.length > 0 && (
                    <View style={styles.membersList}>
                        <Text style={styles.membersTitle}>
                            Still swiping ({waitingFor.length}):
                        </Text>
                        <ScrollView 
                            style={styles.membersScrollView}
                            showsVerticalScrollIndicator={waitingFor.length > 5}
                        >
                            {waitingFor.slice(0, 10).map((name, index) => (
                                <View key={`${name}-${index}`} style={styles.memberItem}>
                                    <View style={styles.avatarCircle}>
                                        <Ionicons name="person" size={20} color={colors.primary} />
                                    </View>
                                    <Text style={styles.memberName}>{name}</Text>
                                    <ActivityIndicator size="small" color={colors.white} />
                                </View>
                            ))}
                            {waitingFor.length > 10 && (
                                <Text style={styles.moreMembersText}>
                                    +{waitingFor.length - 10} more...
                                </Text>
                            )}
                        </ScrollView>
                    </View>
                )}
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
    membersScrollView: {
        maxHeight: 200,
    },
    moreMembersText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
});
