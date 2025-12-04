import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import colors from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function MatchScreen({ navigation }) {
    // Dummy match data
    const match = {
        name: 'Golden Gate Bridge',
        distance: '11 miles',
        time: '12:00 AM',
        image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <Text style={styles.title}>Consensus!</Text>

                <View style={styles.matchCard}>
                    <Image source={{ uri: match.image }} style={styles.image} />
                    <View style={styles.overlay} />
                    <View style={styles.infoContainer}>
                        <Text style={styles.name}>{match.name}</Text>
                        <View style={styles.detailsRow}>
                            <Ionicons name="location-outline" size={16} color={colors.secondary} />
                            <Text style={styles.detailsText}>{match.distance}</Text>
                            <Ionicons name="time-outline" size={16} color={colors.secondary} style={{ marginLeft: 12 }} />
                            <Text style={styles.detailsText}>{match.time}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <Button title="Go There" onPress={() => { }} />
                    <Button title="Back to Home" variant="secondary" onPress={() => navigation.navigate('Home')} />
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 32,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    matchCard: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 32,
        backgroundColor: colors.white,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    infoContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.white,
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsText: {
        marginLeft: 4,
        color: colors.text,
        fontSize: 14,
    },
    buttonContainer: {
        width: '100%',
    },
});
