import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

const LEADERBOARD_DATA = [
    { id: '1', name: 'Zhangliang Malatang', yays: 5, distance: '.3 mi', unanimous: true, image: 'https://images.unsplash.com/photo-1549396535-c11d5c55b9df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60' },
    { id: '2', name: '2th restaurant', yays: 4, distance: '.2 mi', unanimous: false },
    { id: '3', name: '3th restaurant', yays: 4, distance: '.8 mi', unanimous: false },
    { id: '4', name: '4th restaurant', yays: 3, distance: '.1 mi', unanimous: false },
    { id: '5', name: '5th restaurant', yays: 1, distance: '.5 mi', unanimous: false },
    { id: '6', name: '6th restaurant', yays: 0, distance: '.5 mi', unanimous: false },
];

export default function LeaderboardScreen({ navigation }) {
    const winner = LEADERBOARD_DATA[0];
    const others = LEADERBOARD_DATA.slice(1);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back-circle-outline" size={28} color={colors.white} />
                    <Text style={styles.backText}>back</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Winner Card */}
                <TouchableOpacity
                    style={styles.winnerCard}
                    onPress={() => navigation.navigate('RestaurantDetails', { restaurant: winner })}
                >
                    <View style={styles.winnerImageContainer}>
                        {/* Placeholder for circular image/icon */}
                        <View style={styles.winnerCircle} />
                        <View style={styles.crownContainer}>
                            <Ionicons name="trophy" size={20} color={colors.white} />
                        </View>
                    </View>

                    <View style={styles.winnerInfo}>
                        <Text style={styles.winnerName}>{winner.name}</Text>
                        <View style={styles.statsRow}>
                            <Text style={styles.yaysText}>{winner.yays} yays</Text>
                            {winner.unanimous && (
                                <View style={styles.unanimousTag}>
                                    <Ionicons name="star" size={12} color={colors.primary} />
                                    <Text style={styles.unanimousText}>Unanimous</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.distanceText}>{winner.distance}</Text>

                        <View style={styles.linksRow}>
                            <Text style={styles.linkText}>yelp</Text>
                            <Ionicons name="arrow-redo-outline" size={14} color={colors.black} />
                            <View style={{ width: 16 }} />
                            <Text style={styles.linkText}>google maps</Text>
                            <Ionicons name="arrow-redo-outline" size={14} color={colors.black} />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* List of others */}
                <View style={styles.listContainer}>
                    {others.map((item, index) => (
                        <View key={item.id} style={styles.listItem}>
                            <Text style={styles.rank}>{index + 2}</Text>
                            <View style={styles.listCircle} />
                            <Text style={styles.listName}>{item.name}</Text>
                            <View style={styles.listStats}>
                                <Text style={styles.listYays}>{item.yays} yays</Text>
                                <Text style={styles.listDistance}>{item.distance}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // Orange background
    },
    header: {
        padding: 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 16,
        marginLeft: 4,
        color: colors.white, // White text on orange
    },
    content: {
        padding: 16,
    },
    winnerCard: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    winnerImageContainer: {
        marginRight: 16,
        position: 'relative',
    },
    winnerCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E0E0E0',
        borderWidth: 4,
        borderColor: colors.primary,
    },
    crownContainer: {
        position: 'absolute',
        top: -10,
        left: -10,
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 4,
    },
    winnerInfo: {
        flex: 1,
    },
    winnerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.black,
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    yaysText: {
        color: colors.darkGray,
        marginRight: 8,
    },
    unanimousTag: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unanimousText: {
        color: colors.primary,
        fontWeight: 'bold',
        marginLeft: 2,
        fontSize: 12,
    },
    distanceText: {
        color: colors.darkGray,
        marginBottom: 8,
    },
    linksRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    linkText: {
        fontWeight: 'bold',
        marginRight: 2,
    },
    listContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white for list container
        borderRadius: 24,
        padding: 16,
    },
    listItem: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    rank: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 16,
        width: 20,
    },
    listCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#D0D0D0',
        marginRight: 12,
    },
    listName: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
    },
    listStats: {
        alignItems: 'flex-end',
    },
    listYays: {
        color: colors.darkGray,
        fontWeight: 'bold',
    },
    listDistance: {
        color: colors.darkGray,
        fontSize: 12,
    },
});
