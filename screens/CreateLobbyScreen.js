import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Circle, Marker } from 'react-native-maps';
import Button from '../components/Button';
import colors from '../constants/colors';
import { ACTIVITY_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants/activityCategories';
import Slider from '@react-native-community/slider';
import { lobbyAPI } from '../services/api';
import { useUser } from '../context/UserContext';

export default function CreateLobbyScreen({ navigation }) {
    const { userId } = useUser();
    const [loading, setLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [mapRegion, setMapRegion] = useState(null);
    const [radius, setRadius] = useState(2.5);
    const [zoomLevel, setZoomLevel] = useState(0.05); // Initial zoom level (latitudeDelta)
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateInput, setDateInput] = useState('');
    const [currentStep, setCurrentStep] = useState(1); // 1: location/date, 2: timeframe/activities
    const [startHour, setStartHour] = useState(12);
    const [endHour, setEndHour] = useState(18);
    const [activityCounts, setActivityCounts] = useState({
        [ACTIVITY_CATEGORIES.FOOD]: 0,
        [ACTIVITY_CATEGORIES.RECREATION]: 0,
        [ACTIVITY_CATEGORIES.NATURE]: 0,
        [ACTIVITY_CATEGORIES.ARTS]: 0,
        [ACTIVITY_CATEGORIES.SOCIAL]: 0,
    });

    const totalActivities = Object.values(activityCounts).reduce((sum, count) => sum + count, 0);
    const totalHours = Math.max(0, endHour - startHour);
    const MAX_ACTIVITIES = 10; // Reasonable limit for itinerary
    const MAX_MEMBERS = 25; // Max users per lobby

    // Convert 24-hour time to 12-hour format with AM/PM
    const formatTime12Hour = (hour24) => {
        const hour = Math.floor(hour24);
        if (hour === 0) return '12:00 AM';
        if (hour === 12) return '12:00 PM';
        if (hour < 12) return `${hour}:00 AM`;
        return `${hour - 12}:00 PM`;
    };

    const validateDate = (dateString) => {
        // Basic MM/DD/YYYY format validation
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        if (!dateRegex.test(dateString)) return false;
        
        const [month, day, year] = dateString.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if date is valid
        const isValidDate = date.getMonth() === month - 1 && 
                           date.getDate() === day && 
                           date.getFullYear() === year;
        
        if (!isValidDate) return false;
        
        // Check if date is not in the past
        if (date < today) return false;
        
        // Check if date is not too far in the future (max 1 year)
        const maxDate = new Date(today);
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        if (date > maxDate) return false;
        
        return true;
    };

    // Auto-format date input with slashes
    const formatDateInput = (text) => {
        // Remove all non-digits
        const digits = text.replace(/\D/g, '');
        
        // Limit to 8 digits (MMDDYYYY)
        const limited = digits.slice(0, 8);
        
        // Format with slashes
        let formatted = '';
        if (limited.length > 0) {
            formatted = limited.slice(0, 2);
            if (limited.length > 2) {
                formatted += '/' + limited.slice(2, 4);
            }
            if (limited.length > 4) {
                formatted += '/' + limited.slice(4, 8);
            }
        }
        
        return formatted;
    };

    const handleDateInputChange = (text) => {
        const formatted = formatDateInput(text);
        setDateInput(formatted);
    };

    const handleDateConfirm = () => {
        if (!dateInput.trim()) {
            alert('Please enter a date');
            return;
        }
        if (!validateDate(dateInput)) {
            alert('Please enter a valid date in MM/DD/YYYY format (not in the past, not more than 1 year in the future)');
            return;
        }
        setSelectedDate(dateInput);
        setShowDatePicker(false);
        setDateInput('');
    };

    // Load user location on mount
    useEffect(() => {
        const loadUserLocation = async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    // Default to a reasonable location if permission denied
                    const defaultLocation = {
                        latitude: 37.8715,
                        longitude: -122.2730,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    };
                    setMapRegion(defaultLocation);
                    setSelectedLocation({ latitude: defaultLocation.latitude, longitude: defaultLocation.longitude });
                    return;
                }

                let locationResult = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                
                // Calculate appropriate delta based on radius (roughly show 2x radius in view)
                // 1 mile ≈ 0.0145 degrees latitude, so for radius miles, we want about 2*radius*0.0145
                const radiusInDegrees = (radius * 2 * 0.0145);
                const initialDelta = 0.05; // Initial zoom level
                const location = {
                    latitude: locationResult.coords.latitude,
                    longitude: locationResult.coords.longitude,
                    latitudeDelta: initialDelta,
                    longitudeDelta: initialDelta,
                };
                
                setMapRegion(location);
                setSelectedLocation({ latitude: location.latitude, longitude: location.longitude });
                setZoomLevel(initialDelta);
            } catch (error) {
                console.error('Error loading location:', error);
                // Default location
                const initialDelta = 0.05;
                const defaultLocation = {
                    latitude: 37.8715,
                    longitude: -122.2730,
                    latitudeDelta: initialDelta,
                    longitudeDelta: initialDelta,
                };
                setMapRegion(defaultLocation);
                setSelectedLocation({ latitude: defaultLocation.latitude, longitude: defaultLocation.longitude });
                setZoomLevel(initialDelta);
            }
        };

        loadUserLocation();
    }, []);

    const handleMapRegionChange = (region) => {
        setMapRegion(region);
        // Update selected location to the center of the map (where the circle should be)
        setSelectedLocation({ 
            latitude: region.latitude, 
            longitude: region.longitude 
        });
        setZoomLevel(region.latitudeDelta);
    };

    const handleZoomIn = () => {
        if (mapRegion && selectedLocation) {
            const newDelta = Math.max(0.001, zoomLevel * 0.5); // Zoom in by 50%
            setZoomLevel(newDelta);
            setMapRegion({
                ...mapRegion,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: newDelta,
                longitudeDelta: newDelta,
            });
        }
    };

    const handleZoomOut = () => {
        if (mapRegion && selectedLocation) {
            const newDelta = Math.min(0.5, zoomLevel * 2); // Zoom out by 100%
            setZoomLevel(newDelta);
            setMapRegion({
                ...mapRegion,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: newDelta,
                longitudeDelta: newDelta,
            });
        }
    };

    // Update map region when radius changes to keep circle visible (optional - can be removed if too aggressive)
    // useEffect(() => {
    //     if (mapRegion && selectedLocation) {
    //         const radiusInDegrees = (radius * 2 * 0.0145);
    //         const newRegion = {
    //             ...mapRegion,
    //             latitudeDelta: Math.max(0.01, Math.min(0.1, radiusInDegrees)),
    //             longitudeDelta: Math.max(0.01, Math.min(0.1, radiusInDegrees)),
    //         };
    //         // Only update if the delta changed significantly to avoid constant updates
    //         if (Math.abs(newRegion.latitudeDelta - mapRegion.latitudeDelta) > 0.001) {
    //             setMapRegion(newRegion);
    //         }
    //     }
    // }, [radius, mapRegion, selectedLocation]);

    const handleMapPress = (event) => {
        const { coordinate } = event.nativeEvent;
        // Update location and center map on it
        setSelectedLocation(coordinate);
        if (mapRegion) {
            setMapRegion({
                ...mapRegion,
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
            });
        }
    };

    const handleContinueToStep2 = () => {
        if (!selectedDate) {
            Alert.alert('Error', 'Please select a date');
            return;
        }
        if (!selectedLocation) {
            Alert.alert('Error', 'Please select a location on the map');
            return;
        }
        setCurrentStep(2);
    };

    const handleBackToStep1 = () => {
        setCurrentStep(1);
    };

    const updateActivityCount = (category, delta) => {
        setActivityCounts(prev => {
            const newCount = Math.max(0, Math.min(MAX_ACTIVITIES, prev[category] + delta));
            return {
                ...prev,
                [category]: newCount
            };
        });
    };

    const handleContinue = async () => {
        // Check if user is logged in
        if (!userId) {
            Alert.alert('Error', 'Please log in to create a lobby');
            if (navigation && navigation.navigate) {
                navigation.navigate('Login');
            }
            return;
        }

        // Validate date
        if (!selectedDate) {
            Alert.alert('Error', 'Please select a date');
            return;
        }
        if (!validateDate(selectedDate)) {
            Alert.alert('Error', 'Please select a valid future date');
            setSelectedDate(null);
            return;
        }

        // Validate activities
        if (totalActivities === 0) {
            Alert.alert('Error', 'Please select at least one activity');
            return;
        }
        if (totalActivities > MAX_ACTIVITIES) {
            Alert.alert('Error', `Maximum ${MAX_ACTIVITIES} activities allowed`);
            return;
        }

        // Validate timeframe
        if (startHour >= endHour) {
            Alert.alert('Error', 'End time must be after start time');
            return;
        }
        if (totalHours < totalActivities) {
            Alert.alert('Error', `You need at least ${totalActivities} hours for ${totalActivities} activities`);
            return;
        }
        if (totalHours > 12) {
            Alert.alert('Error', 'Maximum 12 hours allowed for a hangout');
            return;
        }

        // Validate radius
        if (radius < 0.5 || radius > 10) {
            Alert.alert('Error', 'Radius must be between 0.5 and 10 miles');
            return;
        }

        setLoading(true);
        setLocationLoading(true);

        try {
            // Request location permissions
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission Required',
                    'Please enable location permissions to create a lobby.',
                    [{ text: 'OK' }]
                );
                setLoading(false);
                setLocationLoading(false);
                return;
            }

            // Get current location
            let locationResult = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            
            const location = {
                latitude: locationResult.coords.latitude,
                longitude: locationResult.coords.longitude
            };

            // Validate location
            if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
                Alert.alert('Error', 'Invalid location. Please enable location services.');
                setLoading(false);
                setLocationLoading(false);
                return;
            }

            // Validate coordinates are within valid range
            if (location.latitude < -90 || location.latitude > 90 || 
                location.longitude < -180 || location.longitude > 180) {
                Alert.alert('Error', 'Invalid location coordinates.');
                setLoading(false);
                setLocationLoading(false);
                return;
            }

            setSelectedLocation(location);
            setLocationLoading(false);

            // Prepare activity_counts for backend (use exact category names)
            const activity_counts = {
                [ACTIVITY_CATEGORIES.FOOD]: activityCounts[ACTIVITY_CATEGORIES.FOOD],
                [ACTIVITY_CATEGORIES.RECREATION]: activityCounts[ACTIVITY_CATEGORIES.RECREATION],
                [ACTIVITY_CATEGORIES.NATURE]: activityCounts[ACTIVITY_CATEGORIES.NATURE],
                [ACTIVITY_CATEGORIES.ARTS]: activityCounts[ACTIVITY_CATEGORIES.ARTS],
                [ACTIVITY_CATEGORIES.SOCIAL]: activityCounts[ACTIVITY_CATEGORIES.SOCIAL],
            };

            // Call backend API
            const result = await lobbyAPI.create({
                host_id: userId,
                location: location,
                radius: Math.round(radius * 10) / 10,
                date: selectedDate, // Already in MM/DD/YYYY format
                start_hour: Math.floor(startHour),
                end_hour: Math.floor(endHour),
                activity_counts: activity_counts,
                max_members: MAX_MEMBERS,
            });

            if (result.error) {
                Alert.alert('Error', result.error);
                setLoading(false);
                return;
            }

            if (result.data) {
                // Create lobby data object for navigation
                const lobbyData = {
                    lobby_id: result.data.lobby_id,
                    code: result.data.code,
                    radius: result.data.radius,
                    date: result.data.date,
                    startHour: result.data.start_hour,
                    endHour: result.data.end_hour,
                    activityCounts: result.data.activity_counts,
                    location: result.data.location,
                    maxMembers: result.data.max_members,
                    status: result.data.status,
                };

                // Navigate to Lobby screen with lobby data
                if (navigation && navigation.navigate) {
                    navigation.navigate('Lobby', { 
                        lobbyData, 
                        isOwner: true,
                        lobby_id: result.data.lobby_id 
                    });
                } else {
                    console.error('Navigation not available');
                }
            } else {
                Alert.alert('Error', 'Failed to create lobby. Please try again.');
            }
        } catch (error) {
            console.error('Create lobby error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            setLocationLoading(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            {currentStep === 1 ? (
                <ScrollView 
                    style={styles.scrollView} 
                    contentContainerStyle={styles.content}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    scrollEventThrottle={16}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Consensus</Text>
                    </View>

                    {/* Location & Radius Section */}
                    <Text style={styles.sectionTitle}>Location & Radius</Text>
                    <View style={styles.mapWrapper}>
                        <View style={styles.mapContainer}>
                            {mapRegion ? (
                                <>
                                    <MapView
                                        style={styles.map}
                                        initialRegion={mapRegion}
                                        region={mapRegion}
                                        onRegionChangeComplete={handleMapRegionChange}
                                        onPress={handleMapPress}
                                        showsUserLocation={true}
                                        showsMyLocationButton={false}
                                        scrollEnabled={true}
                                        zoomEnabled={false}
                                        zoomTapEnabled={false}
                                        pitchEnabled={false}
                                        rotateEnabled={false}
                                        mapType="standard"
                                        loadingEnabled={true}
                                        toolbarEnabled={false}
                                        moveOnMarkerPress={false}
                                    >
                                        {selectedLocation && (
                                            <Circle
                                                center={selectedLocation}
                                                radius={radius * 1609.34} // Convert miles to meters
                                                strokeColor={colors.primary}
                                                fillColor="rgba(242, 107, 58, 0.2)"
                                                strokeWidth={3}
                                            />
                                        )}
                                    </MapView>
                                    {/* Center indicator */}
                                    <View style={styles.centerIndicator} pointerEvents="none">
                                        <View style={styles.centerDot} />
                                    </View>
                                    {/* Zoom buttons */}
                                    <View style={styles.zoomControls}>
                                        <TouchableOpacity
                                            style={styles.zoomButton}
                                            onPress={handleZoomIn}
                                        >
                                            <Ionicons name="add" size={24} color={colors.white} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.zoomButton}
                                            onPress={handleZoomOut}
                                        >
                                            <Ionicons name="remove" size={24} color={colors.white} />
                                        </TouchableOpacity>
                                    </View>
                                    {/* Radius label */}
                                    <View style={styles.radiusLabel}>
                                        <Text style={styles.radiusText}>{radius.toFixed(1)} mi</Text>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.mapPlaceholder}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={styles.mapPlaceholderText}>Loading map...</Text>
                                </View>
                            )}
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

                        {/* Date Selection */}
                        <Text style={styles.sectionTitle}>Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={24} color={colors.white} />
                            <Text style={styles.dateButtonText}>
                                {selectedDate || 'Select Date (MM/DD/YYYY)'}
                            </Text>
                        </TouchableOpacity>

                        {/* Continue Button */}
                        <View style={styles.continueButtonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.continueButtonTouchable,
                                    (!selectedDate || !selectedLocation || loading) && styles.continueButtonDisabled
                                ]}
                                onPress={handleContinueToStep2}
                                disabled={!selectedDate || !selectedLocation || loading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueButtonText}>
                                    Continue to Next Step →
                                </Text>
                            </TouchableOpacity>
                        </View>
                </ScrollView>
            ) : (
                <ScrollView 
                    style={styles.scrollView} 
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Consensus</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackToStep1}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>

                    {/* Timeframe Selection */}
                    <Text style={styles.sectionTitle}>Timeframe</Text>
                        <View style={styles.timeframeContainer}>
                    <View style={styles.hourSelector}>
                        <Text style={styles.hourLabel}>Start: {formatTime12Hour(startHour)}</Text>
                        <Slider
                            style={styles.hourSlider}
                            minimumValue={0}
                            maximumValue={22}
                            step={1}
                            value={startHour}
                            onValueChange={(value) => {
                                setStartHour(value);
                                // Ensure end hour is always after start hour
                                if (value >= endHour) {
                                    setEndHour(Math.min(23, value + 1));
                                }
                            }}
                            minimumTrackTintColor={colors.darkGray}
                            maximumTrackTintColor="rgba(0,0,0,0.1)"
                            thumbTintColor={colors.darkGray}
                        />
                    </View>
                    <View style={styles.hourSelector}>
                        <Text style={styles.hourLabel}>End: {formatTime12Hour(endHour)}</Text>
                        <Slider
                            style={styles.hourSlider}
                            minimumValue={1}
                            maximumValue={23}
                            step={1}
                            value={endHour}
                            onValueChange={(value) => {
                                setEndHour(value);
                                // Ensure start hour is always before end hour
                                if (value <= startHour) {
                                    setStartHour(Math.max(0, value - 1));
                                }
                            }}
                            minimumTrackTintColor={colors.darkGray}
                            maximumTrackTintColor="rgba(0,0,0,0.1)"
                            thumbTintColor={colors.darkGray}
                        />
                    </View>
                    <Text style={styles.totalHoursText}>Total: {totalHours} hours</Text>
                </View>

                {/* Activity Categories */}
                <Text style={styles.sectionTitle}>Activities ({totalActivities})</Text>
                <Text style={styles.sectionSubtitle}>Select number of activities per category</Text>
                {Object.values(ACTIVITY_CATEGORIES).map((category) => (
                    <View key={category} style={styles.activityRow}>
                        <View style={[styles.categoryIcon, { backgroundColor: CATEGORY_COLORS[category] + '20' }]}>
                            <Ionicons name={CATEGORY_ICONS[category]} size={24} color={CATEGORY_COLORS[category]} />
                        </View>
                        <Text style={styles.categoryName}>{category}</Text>
                        <View style={styles.countControls}>
                            <TouchableOpacity
                                style={styles.countButton}
                                onPress={() => updateActivityCount(category, -1)}
                                disabled={activityCounts[category] === 0}
                            >
                                <Ionicons name="remove" size={20} color={colors.white} />
                            </TouchableOpacity>
                            <Text style={styles.countText}>{activityCounts[category]}</Text>
                            <TouchableOpacity
                                style={[
                                    styles.countButton,
                                    (activityCounts[category] >= MAX_ACTIVITIES || totalActivities >= MAX_ACTIVITIES) && styles.countButtonDisabled
                                ]}
                                onPress={() => updateActivityCount(category, 1)}
                                disabled={activityCounts[category] >= MAX_ACTIVITIES || totalActivities >= MAX_ACTIVITIES}
                            >
                                <Ionicons 
                                    name="add" 
                                    size={20} 
                                    color={(activityCounts[category] >= MAX_ACTIVITIES || totalActivities >= MAX_ACTIVITIES) ? colors.gray : colors.white} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                    <Button
                        title={loading ? "Creating..." : "Create Lobby"}
                        onPress={handleContinue}
                        style={styles.continueButton}
                        disabled={!selectedDate || totalActivities === 0 || totalHours < totalActivities || loading}
                        loading={loading}
                    />
                </ScrollView>
            )}

            {/* Date Picker Modal */}
            <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Date</Text>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="MM/DD/YYYY"
                            value={dateInput}
                            onChangeText={handleDateInputChange}
                            placeholderTextColor={colors.gray}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowDatePicker(false);
                                    setDateInput('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleDateConfirm}
                            >
                                <Text style={styles.confirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 100,
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.white,
        marginTop: 24,
        marginBottom: 12,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 16,
    },
    mapWrapper: {
        width: '100%',
        marginBottom: 16,
    },
    mapContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#eee',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapPlaceholderText: {
        marginTop: 8,
        color: colors.gray,
        fontSize: 14,
    },
    radiusCircle: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 999,
        backgroundColor: 'rgba(242, 107, 58, 0.3)',
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
        zIndex: 1,
    },
    radiusText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    centerIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -15,
        marginLeft: -15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        pointerEvents: 'none',
    },
    centerDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary,
        borderWidth: 3,
        borderColor: colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    zoomControls: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        zIndex: 2,
    },
    zoomButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    sliderLabel: {
        color: colors.white,
        marginBottom: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
    slider: {
        width: '100%',
        height: 40,
        marginBottom: 24,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    dateButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: colors.white,
    },
    timeframeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    hourSelector: {
        marginBottom: 16,
    },
    hourLabel: {
        fontSize: 16,
        color: colors.white,
        marginBottom: 8,
        fontWeight: '600',
    },
    hourSlider: {
        width: '100%',
        height: 40,
    },
    totalHoursText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
        marginTop: 8,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryName: {
        flex: 1,
        fontSize: 16,
        color: colors.white,
        fontWeight: '600',
    },
    countControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.white,
        marginHorizontal: 16,
        minWidth: 30,
        textAlign: 'center',
    },
    continueButtonContainer: {
        width: '100%',
        marginTop: 32,
        marginBottom: 24,
    },
    continueButtonTouchable: {
        backgroundColor: colors.primary,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    continueButtonDisabled: {
        backgroundColor: colors.gray,
        opacity: 0.5,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.white,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 24,
        width: '80%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    dateInput: {
        borderWidth: 1,
        borderColor: colors.gray,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#FF3B30',
    },
    cancelButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#34C759',
    },
    confirmButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButtonText: {
        color: colors.white,
        marginLeft: 8,
        fontSize: 16,
    },
    countButtonDisabled: {
        opacity: 0.5,
    },
});
