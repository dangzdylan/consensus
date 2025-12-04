import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import colors from '../constants/colors';
import { ACTIVITY_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants/activityCategories';
import Slider from '@react-native-community/slider';

export default function CreateLobbyScreen({ navigation }) {
    const [radius, setRadius] = useState(2.5);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateInput, setDateInput] = useState('');
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

    const updateActivityCount = (category, delta) => {
        setActivityCounts(prev => {
            const newCount = Math.max(0, Math.min(MAX_ACTIVITIES, prev[category] + delta));
            return {
                ...prev,
                [category]: newCount
            };
        });
    };

    const handleContinue = () => {
        // Validate date
        if (!selectedDate) {
            alert('Please select a date');
            return;
        }
        if (!validateDate(selectedDate)) {
            alert('Please select a valid future date');
            setSelectedDate(null);
            return;
        }

        // Validate activities
        if (totalActivities === 0) {
            alert('Please select at least one activity');
            return;
        }
        if (totalActivities > MAX_ACTIVITIES) {
            alert(`Maximum ${MAX_ACTIVITIES} activities allowed`);
            return;
        }

        // Validate timeframe
        if (startHour >= endHour) {
            alert('End time must be after start time');
            return;
        }
        if (totalHours < totalActivities) {
            alert(`You need at least ${totalActivities} hours for ${totalActivities} activities`);
            return;
        }
        if (totalHours > 12) {
            alert('Maximum 12 hours allowed for a hangout');
            return;
        }

        // Validate radius
        if (radius < 0.5 || radius > 10) {
            alert('Radius must be between 0.5 and 10 miles');
            return;
        }

        const lobbyData = {
            radius: Math.round(radius * 10) / 10, // Round to 1 decimal
            date: selectedDate,
            startHour: Math.floor(startHour),
            endHour: Math.floor(endHour),
            activityCounts: { ...activityCounts }, // Create copy
            location: 'Current Location', // TODO: Get actual location
            maxMembers: MAX_MEMBERS,
        };

        // Pass lobby data to next screen
        if (navigation && navigation.navigate) {
            navigation.navigate('Lobby', { lobbyData, isOwner: true });
        } else {
            console.error('Navigation not available');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Create Consensus</Text>
                </View>

                {/* Location & Radius Section */}
                <Text style={styles.sectionTitle}>Location & Radius</Text>
                <View style={styles.mapContainer}>
                    <View style={styles.mapPlaceholder}>
                        <Ionicons name="map-outline" size={48} color={colors.gray} />
                        <Text style={styles.mapPlaceholderText}>Map View</Text>
                    </View>
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

                {/* Timeframe Selection */}
                <Text style={styles.sectionTitle}>Timeframe</Text>
                <View style={styles.timeframeContainer}>
                    <View style={styles.hourSelector}>
                        <Text style={styles.hourLabel}>Start: {Math.floor(startHour)}:00</Text>
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
                        <Text style={styles.hourLabel}>End: {Math.floor(endHour)}:00</Text>
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
                    title="Create Lobby"
                    onPress={handleContinue}
                    style={styles.continueButton}
                    disabled={!selectedDate || totalActivities === 0 || totalHours < totalActivities}
                />
            </ScrollView>

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
                            onChangeText={setDateInput}
                            placeholderTextColor={colors.gray}
                        />
                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                variant="secondary"
                                onPress={() => {
                                    setShowDatePicker(false);
                                    setDateInput('');
                                }}
                                style={styles.modalButton}
                            />
                            <Button
                                title="Confirm"
                                onPress={handleDateConfirm}
                                style={styles.modalButton}
                            />
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
        paddingBottom: 40,
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
    },
    radiusText: {
        fontWeight: 'bold',
        fontSize: 12,
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
    continueButton: {
        backgroundColor: colors.darkGray,
        marginTop: 24,
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
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 8,
    },
    countButtonDisabled: {
        opacity: 0.5,
    },
});
