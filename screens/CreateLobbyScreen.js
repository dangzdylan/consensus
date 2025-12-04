import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import colors from '../constants/colors';

import Slider from '@react-native-community/slider';

export default function CreateLobbyScreen({ navigation }) {
    const [radius, setRadius] = useState(2.5);

    const handleContinue = () => {
        navigation.navigate('Lobby');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Create</Text>
                    <Text style={styles.title}>Consensus</Text>
                </View>

                <Text style={styles.label}>Where to Eat?</Text>

                <View style={styles.mapContainer}>
                    {/* Placeholder Map Image */}
                    <Image
                        source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=Berkeley,CA&zoom=13&size=600x600&key=YOUR_API_KEY' }}
                        style={styles.mapImage}
                    />
                    {/* Radius Overlay Circle */}
                    <View style={[styles.radiusCircle, { transform: [{ scale: radius / 5 }] }]} />
                    <View style={styles.radiusLabel}>
                        <Text style={styles.radiusText}>{radius.toFixed(1)} mi</Text>
                    </View>
                </View>

                <Text style={styles.sliderLabel}>Drag to adjust radius</Text>

                <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={10}
                    step={0.5}
                    value={radius}
                    onValueChange={setRadius}
                    minimumTrackTintColor={colors.darkGray}
                    maximumTrackTintColor="rgba(0,0,0,0.1)"
                    thumbTintColor={colors.darkGray}
                />

                <Button
                    title="Continue"
                    onPress={handleContinue}
                    style={styles.continueButton}
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
    },
    header: {
        marginTop: 20,
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.white,
    },
    label: {
        fontSize: 20,
        color: colors.white,
        marginBottom: 16,
    },
    mapContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#eee',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    radiusCircle: {
        position: 'absolute',
        width: '100%', // Base size, scaled down
        height: '100%',
        borderRadius: 999,
        backgroundColor: 'rgba(242, 107, 58, 0.3)', // Primary color with opacity
        borderWidth: 2,
        borderColor: colors.primary,
    },
    radiusLabel: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: colors.white,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    radiusText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    sliderLabel: {
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    slider: {
        width: '100%',
        height: 40,
        marginBottom: 24,
    },
    continueButton: {
        backgroundColor: colors.darkGray,
        marginTop: 'auto',
    },
});
