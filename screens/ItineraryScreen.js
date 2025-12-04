import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import colors from '../constants/colors';
import { ACTIVITY_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants/activityCategories';

// Helper function to parse date and get day of week (0 = Sunday, 6 = Saturday)
const getDayOfWeek = (dateString) => {
    if (!dateString) return null;
    try {
        const [month, day, year] = dateString.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        return date.getDay();
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
};

// Helper function to check if activity is open during timeframe
const isOpenDuringTimeframe = (activity, startHour, endHour, dayOfWeek) => {
    // Validate inputs
    if (startHour === undefined || endHour === undefined || dayOfWeek === null) {
        // If no filtering criteria provided, assume open
        return true;
    }

    // If no hours data, assume always open (for outdoor activities, parks, etc.)
    if (!activity.hours) {
        return true;
    }

    // Validate hours data
    const openHour = activity.hours.open;
    const closeHour = activity.hours.close;
    
    if (openHour === undefined || closeHour === undefined) {
        // Invalid hours data, assume open
        return true;
    }

    // Check if open on this day of week
    if (activity.hours.days && Array.isArray(activity.hours.days)) {
        if (!activity.hours.days.includes(dayOfWeek)) {
            return false;
        }
    }

    // Handle overnight hours (e.g., bar open until 2 AM)
    if (closeHour < openHour) {
        // Overnight: open from openHour to 24, then 0 to closeHour
        const overlapsFirstPeriod = startHour >= openHour && startHour < 24;
        const overlapsSecondPeriod = endHour > 0 && endHour <= closeHour;
        const spansMidnight = startHour < closeHour || endHour > openHour;
        return overlapsFirstPeriod || overlapsSecondPeriod || spansMidnight;
    } else {
        // Normal hours: check if timeframe overlaps
        return startHour < closeHour && endHour > openHour;
    }
};

export default function ItineraryScreen({ route, navigation }) {
    const { lobbyData, selectedActivities, isOwner } = route?.params || {};
    
    // Mock selected activities with hours data - in real app, this comes from voting results
    // Activities should include hours data from the API/voting results
    const [activities, setActivities] = useState(selectedActivities || [
        { 
            id: '1', 
            name: 'Italian Restaurant', 
            category: ACTIVITY_CATEGORIES.FOOD, 
            time: '12:00 PM', 
            duration: 1,
            hours: { open: 11, close: 22, days: [0,1,2,3,4,5,6] }
        },
        { 
            id: '2', 
            name: 'Bowling Alley', 
            category: ACTIVITY_CATEGORIES.RECREATION, 
            time: '1:00 PM', 
            duration: 1,
            hours: { open: 12, close: 23, days: [0,1,2,3,4,5,6] }
        },
        { 
            id: '3', 
            name: 'Central Park', 
            category: ACTIVITY_CATEGORIES.NATURE, 
            time: '2:00 PM', 
            duration: 1,
            hours: null // Always open
        },
    ]);

    const startHour = lobbyData?.startHour || 12;
    const endHour = lobbyData?.endHour || 18;
    const date = lobbyData?.date || 'Today';

    // Calculate times for activities (1 hour each by default)
    const calculateTimes = (activities) => {
        if (!activities || activities.length === 0) {
            return [];
        }

        let currentHour = Math.max(0, Math.min(23, Math.floor(startHour)));
        const maxHour = Math.max(0, Math.min(23, Math.floor(endHour)));
        
        return activities.map((activity, index) => {
            // Ensure we don't exceed end hour
            if (currentHour >= maxHour) {
                return { ...activity, time: 'N/A', overflow: true };
            }
            
            const duration = Math.max(1, Math.min(3, activity.duration || 1)); // Max 3 hours per activity
            const time = `${currentHour.toString().padStart(2, '0')}:00`;
            currentHour = Math.min(maxHour, currentHour + duration);
            
            return { ...activity, time, duration };
        });
    };

    const [scheduledActivities, setScheduledActivities] = useState(calculateTimes(activities));

    const moveActivity = (fromIndex, toIndex) => {
        if (!isOwner) return; // Only owner can reorder
        
        // Validate indices
        if (fromIndex < 0 || fromIndex >= scheduledActivities.length) return;
        if (toIndex < 0 || toIndex >= scheduledActivities.length) return;
        if (fromIndex === toIndex) return;
        
        const newActivities = [...scheduledActivities];
        const [movedActivity] = newActivities.splice(fromIndex, 1);
        newActivities.splice(toIndex, 0, movedActivity);
        
        // Calculate what time the moved activity would be at the new position
        const calculateNewTime = (activities, targetIndex) => {
            let currentHour = Math.max(0, Math.min(23, Math.floor(startHour)));
            const maxHour = Math.max(0, Math.min(23, Math.floor(endHour)));
            
            for (let i = 0; i < targetIndex; i++) {
                if (i < activities.length) {
                    const duration = activities[i].duration || 1;
                    currentHour = Math.min(maxHour, currentHour + duration);
                }
            }
            return currentHour;
        };
        
        const newStartHour = calculateNewTime(newActivities, toIndex);
        const newEndHour = newStartHour + (movedActivity.duration || 1);
        
        // Validate calculated hours
        if (isNaN(newStartHour) || isNaN(newEndHour) || newStartHour < 0 || newStartHour > 23) {
            Alert.alert(
                'Cannot Move Activity',
                'Invalid time calculation. Please try again.',
                [{ text: 'OK' }]
            );
            return;
        }
        
        // Check if activity is open at the new time
        const dayOfWeek = getDayOfWeek(date);
        const isOpen = isOpenDuringTimeframe(movedActivity, newStartHour, newEndHour, dayOfWeek);
        
        if (!isOpen) {
            // Activity would be closed at new time - prevent move
            const timeString = `${newStartHour.toString().padStart(2, '0')}:00`;
            Alert.alert(
                'Cannot Move Activity',
                `${movedActivity.name} is not open at ${timeString}. Please choose a different time slot.`,
                [{ text: 'OK' }]
            );
            return;
        }
        
        // Check if new time would exceed end hour
        if (newEndHour > endHour) {
            Alert.alert(
                'Cannot Move Activity',
                `Moving this activity would exceed the end time (${endHour}:00).`,
                [{ text: 'OK' }]
            );
            return;
        }
        
        // Recalculate times for all activities
        const recalculated = calculateTimes(newActivities);
        
        // Double-check all activities are still valid after recalculation
        const allValid = recalculated.every((activity, index) => {
            // Skip validation if time is invalid (overflow case)
            if (activity.overflow || !activity.time || activity.time === 'N/A') {
                return true; // Allow overflow activities, they'll be handled separately
            }
            
            // Validate time format before parsing
            const timeMatch = activity.time.match(/^(\d{1,2}):(\d{2})$/);
            if (!timeMatch) {
                console.warn(`Invalid time format: ${activity.time}`);
                return true; // Allow invalid format to prevent blocking
            }
            
            const activityStartHour = parseInt(timeMatch[1], 10);
            if (isNaN(activityStartHour) || activityStartHour < 0 || activityStartHour > 23) {
                return true; // Allow invalid hours to prevent blocking
            }
            
            const activityEndHour = activityStartHour + (activity.duration || 1);
            return isOpenDuringTimeframe(activity, activityStartHour, activityEndHour, dayOfWeek);
        });
        
        if (!allValid) {
            Alert.alert(
                'Cannot Move Activity',
                'Moving this activity would cause scheduling conflicts with other activities.',
                [{ text: 'OK' }]
            );
            return;
        }
        
        setScheduledActivities(recalculated);
    };

    const handleSave = () => {
        // TODO: Save itinerary to backend
        if (navigation && navigation.navigate) {
            navigation.navigate('Home');
        } else {
            console.error('Navigation not available');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Itinerary</Text>
                    <Text style={styles.dateText}>{date}</Text>
                    <Text style={styles.timeframeText}>
                        {startHour}:00 - {endHour}:00 ({Math.max(0, endHour - startHour)} hours)
                    </Text>
                </View>

                {isOwner && (
                    <View style={styles.ownerNote}>
                        <Ionicons name="information-circle" size={20} color={colors.white} />
                        <Text style={styles.ownerNoteText}>
                            You can drag to reorder activities
                        </Text>
                    </View>
                )}

                {scheduledActivities.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No activities scheduled</Text>
                    </View>
                ) : (
                    <View style={styles.activitiesList}>
                        {scheduledActivities.map((activity, index) => (
                            <View key={activity.id || `activity-${index}`} style={styles.activityCard}>
                            <View style={styles.activityHeader}>
                                <View style={[
                                    styles.categoryBadge,
                                    { backgroundColor: CATEGORY_COLORS[activity.category] + '20' }
                                ]}>
                                    <Ionicons 
                                        name={CATEGORY_ICONS[activity.category]} 
                                        size={20} 
                                        color={CATEGORY_COLORS[activity.category]} 
                                    />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityName}>{activity.name}</Text>
                                    <Text style={styles.activityCategory}>{activity.category}</Text>
                                </View>
                                <Text style={styles.activityTime}>{activity.time}</Text>
                            </View>
                            
                            {isOwner && (
                                <View style={styles.moveButtonsContainer}>
                                    {index < scheduledActivities.length - 1 && (
                                        <TouchableOpacity
                                            style={styles.moveButton}
                                            onPress={() => moveActivity(index, index + 1)}
                                        >
                                            <Ionicons name="arrow-down" size={20} color={colors.primary} />
                                            <Text style={styles.moveButtonText}>Move Later</Text>
                                        </TouchableOpacity>
                                    )}
                                    {index > 0 && (
                                        <TouchableOpacity
                                            style={styles.moveButton}
                                            onPress={() => moveActivity(index, index - 1)}
                                        >
                                            <Ionicons name="arrow-up" size={20} color={colors.primary} />
                                            <Text style={styles.moveButtonText}>Move Earlier</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.summary}>
                    <Text style={styles.summaryTitle}>Summary</Text>
                    <Text style={styles.summaryText}>
                        {scheduledActivities.length} activities • {Math.max(0, endHour - startHour)} hours
                    </Text>
                </View>

                <Button
                    title="Done"
                    onPress={handleSave}
                    style={styles.doneButton}
                />
            </ScrollView>
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
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 4,
    },
    timeframeText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    ownerNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
    },
    ownerNoteText: {
        marginLeft: 8,
        fontSize: 14,
        color: colors.white,
    },
    activitiesList: {
        marginBottom: 24,
    },
    activityCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    activityCategory: {
        fontSize: 14,
        color: colors.gray,
    },
    activityTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    moveButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.gray + '40',
    },
    moveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(242, 107, 58, 0.1)',
        borderRadius: 8,
        minWidth: 100,
        justifyContent: 'center',
    },
    moveButtonText: {
        marginLeft: 4,
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    summary: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    doneButton: {
        backgroundColor: colors.darkGray,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
});

