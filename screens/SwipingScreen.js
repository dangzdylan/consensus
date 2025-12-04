import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import colors from '../constants/colors';

const DUMMY_DATA = [
    { id: '1', name: 'Golden Gate Bridge', distance: '11', time: '12:00 AM', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' },
    { id: '2', name: 'Palace of Fine Arts', distance: '10', time: '5:00 PM', image: 'https://images.unsplash.com/photo-1521464302861-ce943915d1c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' },
    { id: '3', name: 'Fisherman\'s Wharf', distance: '12', time: '10:00 AM', image: 'https://images.unsplash.com/photo-1558280417-ea782f829e93?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' },
];

const { width } = Dimensions.get('window');

export default function SwipingScreen({ navigation }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    // Simple fade/scale animation for transition
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const handleSwipe = (direction) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            if (currentIndex < DUMMY_DATA.length - 1) {
                setCurrentIndex(currentIndex + 1);
                fadeAnim.setValue(1);
            } else {
                // End of deck, go to Leaderboard (Final Screen)
                navigation.replace('Waiting');
            }
        });
    };

    const currentItem = DUMMY_DATA[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Consensus</Text>
                <Text style={styles.groupName}>Group 17</Text>
            </View>

            <View style={styles.cardContainer}>
                {currentItem ? (
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim }] }}>
                        <Card item={currentItem} />
                    </Animated.View>
                ) : (
                    <Text style={styles.noMoreText}>No more options</Text>
                )}
            </View>

            <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.circleButton} onPress={() => handleSwipe('left')}>
                    <Ionicons name="close" size={40} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.circleButton} onPress={() => handleSwipe('right')}>
                    <Ionicons name="checkmark" size={40} color={colors.success} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        alignItems: 'center',
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
    },
    groupName: {
        fontSize: 16,
        color: colors.secondary,
        fontWeight: 'bold',
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingBottom: 40,
        width: '100%',
    },
    circleButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    noMoreText: {
        color: colors.white,
        fontSize: 20,
    },
});
