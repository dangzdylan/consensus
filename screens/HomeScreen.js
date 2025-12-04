import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Find a Perfect</Text>
                    <Text style={styles.title}>Plan</Text>
                </View>

                <View style={styles.cardsContainer}>
                    {/* Create Consensus Card */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('CreateLobby')}
                    >
                        <Text style={styles.cardTitle}>Create Consensus</Text>
                        <View style={styles.iconContainer}>
                            <Ionicons name="add" size={24} color={colors.white} />
                        </View>
                    </TouchableOpacity>

                    {/* Join Consensus Card */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('JoinLobby')}
                    >
                        <Text style={styles.cardTitle}>Join Consensus</Text>
                        <View style={styles.iconContainer}>
                            <Ionicons name="people" size={24} color={colors.white} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFCC99', // Light orange/peach background from Figma
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 48,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
    },
    cardsContainer: {
        gap: 24,
    },
    card: {
        backgroundColor: '#FFF5F0', // Very light peach/white
        borderRadius: 30,
        padding: 24,
        height: 160,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.black,
        maxWidth: '60%',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#333', // Dark gray/black button
        justifyContent: 'center',
        alignItems: 'center',
    },
});
