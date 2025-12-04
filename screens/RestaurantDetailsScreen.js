import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import Button from '../components/Button';

export default function RestaurantDetailsScreen({ route, navigation }) {
    // In a real app, we'd get data from route.params
    // const { restaurant } = route.params;

    const restaurant = {
        name: 'Zhangliang Malatang',
        rating: 4.0,
        reviews: 114,
        price: '$20-30',
        type: 'Chinese restaurant',
        status: 'Open',
        closes: '9 PM',
        distance: '14 min',
        image: 'https://images.unsplash.com/photo-1549396535-c11d5c55b9df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            {/* Map Background Placeholder */}
            <View style={styles.mapPlaceholder}>
                <Image
                    source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=Berkeley,CA&zoom=14&size=600x300&key=YOUR_API_KEY' }}
                    style={styles.mapImage}
                />
                {/* Back Button Overlay */}
                <SafeAreaView style={styles.headerOverlay}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.black} />
                    </TouchableOpacity>
                </SafeAreaView>
            </View>

            {/* Bottom Sheet Content */}
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />

                <View style={styles.titleRow}>
                    <Text style={styles.title}>{restaurant.name}</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionButton}><Ionicons name="share-outline" size={20} /></TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}><Ionicons name="close-outline" size={20} /></TouchableOpacity>
                    </View>
                </View>

                <View style={styles.ratingRow}>
                    <Text style={styles.rating}>{restaurant.rating}</Text>
                    <View style={styles.stars}>
                        {[1, 2, 3, 4].map(i => <Ionicons key={i} name="star" size={14} color="#FFD700" />)}
                        <Ionicons name="star-outline" size={14} color="#FFD700" />
                    </View>
                    <Text style={styles.reviews}>({restaurant.reviews})</Text>
                    <Text style={styles.dot}>•</Text>
                    <Ionicons name="train-outline" size={14} color={colors.darkGray} />
                    <Text style={styles.distance}>{restaurant.distance}</Text>
                </View>

                <Text style={styles.subtext}>{restaurant.type} • {restaurant.price} • <Ionicons name="accessibility" size={12} /></Text>
                <Text style={styles.status}><Text style={{ color: colors.success }}>Open</Text> • Closes {restaurant.closes}</Text>

                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={[styles.pillButton, { backgroundColor: '#008080' }]}>
                        <Ionicons name="navigate" size={18} color={colors.white} />
                        <Text style={styles.pillButtonText}>Directions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pillButton, { backgroundColor: '#E0F7FA' }]}>
                        <Ionicons name="navigate-outline" size={18} color="#008080" />
                        <Text style={[styles.pillButtonText, { color: '#008080' }]}>Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pillButton, { backgroundColor: '#E0F7FA' }]}>
                        <Ionicons name="chatbubble-outline" size={18} color="#008080" />
                        <Text style={[styles.pillButtonText, { color: '#008080' }]}>Ask</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pillButton, { backgroundColor: '#E0F7FA' }]}>
                        <Ionicons name="call-outline" size={18} color="#008080" />
                    </TouchableOpacity>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Menu</Text>
                    <Text style={styles.sectionSubtitle}>Popular Dishes</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuScroll}>
                        {[1, 2, 3].map(i => (
                            <View key={i} style={styles.menuItem}>
                                <Image source={{ uri: restaurant.image }} style={styles.menuImage} />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapPlaceholder: {
        height: '40%',
        backgroundColor: '#ddd',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 16,
    },
    closeButton: {
        backgroundColor: colors.white,
        padding: 8,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bottomSheet: {
        flex: 1,
        backgroundColor: colors.white,
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: 16,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    rating: {
        fontWeight: 'bold',
        marginRight: 4,
    },
    stars: {
        flexDirection: 'row',
        marginRight: 4,
    },
    reviews: {
        color: colors.darkGray,
        marginRight: 8,
    },
    dot: {
        marginHorizontal: 4,
        color: colors.darkGray,
    },
    distance: {
        color: colors.darkGray,
        marginLeft: 4,
    },
    subtext: {
        color: colors.darkGray,
        marginBottom: 4,
    },
    status: {
        color: colors.darkGray,
        marginBottom: 16,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    pillButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
    },
    pillButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    menuSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    menuScroll: {
        flexDirection: 'row',
    },
    menuItem: {
        width: 120,
        height: 120,
        borderRadius: 12,
        marginRight: 12,
        overflow: 'hidden',
        backgroundColor: '#eee',
    },
    menuImage: {
        width: '100%',
        height: '100%',
    },
});