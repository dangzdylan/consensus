import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../components/Button';
import Header from '../components/Header';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants/activityCategories';
import colors from '../constants/colors';
import { resultAPI } from '../services/api';

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

// Helper function to convert 24-hour time to 12-hour AM/PM format
const formatTime12Hour = (hour) => {
    if (hour === undefined || hour === null || isNaN(hour)) {
        return '12:00 PM';
    }
    const h = Math.floor(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHour}:00 ${ampm}`;
};

// Helper function to convert any time string (military or 12-hour) to 12-hour format
const convertTimeTo12Hour = (timeString) => {
    if (!timeString || typeof timeString !== 'string') {
        return '12:00 PM';
    }
    
    // If already in 12-hour format (contains AM/PM), return as is
    if (timeString.toUpperCase().includes('AM') || timeString.toUpperCase().includes('PM')) {
        return timeString;
    }
    
    // Try to parse military time (HH:MM or HH:MM:SS)
    const militaryMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (militaryMatch) {
        const hour = parseInt(militaryMatch[1], 10);
        const minute = militaryMatch[2];
        if (!isNaN(hour) && hour >= 0 && hour <= 23) {
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
            return `${formattedHour}:${minute} ${ampm}`;
        }
    }
    
    // If we can't parse it, return default
    return '12:00 PM';
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
    const { lobby_id, lobbyData, isOwner } = route?.params || {};
    
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const startHour = lobbyData?.startHour || 12;
    const endHour = lobbyData?.endHour || 18;
    const date = lobbyData?.date || 'Today';

    // Fetch itinerary from backend
    useEffect(() => {
        const fetchItinerary = async () => {
            if (!lobby_id) {
                setError('Lobby ID missing');
                setLoading(false);
                return;
            }

            try {
                const result = await resultAPI.getItinerary(lobby_id);

                if (result.error) {
                    setError(result.error);
                    setLoading(false);
                    return;
                }

                if (result.data && result.data.activities) {
                    // Map backend activities to frontend format
                    // Backend result route returns both 'image' and 'image_url' fields (both same value)
                    const mappedActivities = result.data.activities.map((activity, index) => {
                        // Backend provides image_url with hardcoded Unsplash URLs
                        const imageUrl = activity.image_url || activity.image;
                        
                        const mapped = {
                            id: activity.id || activity.option_id,
                            name: activity.name || activity.title || activity.place_name || 'Unknown Activity',
                            category: activity.category || activity.type || 'Uncategorized',
                            time: convertTimeTo12Hour(activity.time) || '12:00 PM', // Convert backend time to 12-hour format
                            duration: activity.duration || 1,
                            hours: activity.hours || activity.opening_hours || activity.business_hours,
                            location: activity.location || (activity.lat && activity.lng ? { latitude: activity.lat, longitude: activity.lng } : (activity.latitude && activity.longitude ? { latitude: activity.latitude, longitude: activity.longitude } : null)),
                            address: activity.address || activity.formatted_address || activity.location_address || activity.vicinity,
                            // Backend provides hardcoded Unsplash URLs in image_url field
                            image: imageUrl,
                            round_number: activity.round_number,
                        };
                        console.log(`[ItineraryScreen] Mapped activity:`, {
                            name: mapped.name,
                            address: mapped.address,
                            image: mapped.image ? `${mapped.image.substring(0, 80)}...` : 'none',
                            imageType: typeof mapped.image
                        });
                        return mapped;
                    });

                    console.log(`[ItineraryScreen] Mapped ${mappedActivities.length} activities from backend`);
                    setActivities(mappedActivities);
                } else {
                    setError('No activities found in itinerary');
                }
            } catch (error) {
                console.error('Error fetching itinerary:', error);
                setError('Failed to load itinerary. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchItinerary();
    }, [lobby_id]);

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
            const time = formatTime12Hour(currentHour); // Convert to 12-hour format
            currentHour = Math.min(maxHour, currentHour + duration);
            
            return { ...activity, time, duration };
        });
    };

    const [scheduledActivities, setScheduledActivities] = useState([]);

    // Recalculate times when activities change
    useEffect(() => {
        if (activities.length > 0) {
            setScheduledActivities(calculateTimes(activities));
        }
    }, [activities, startHour, endHour]);

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
        
        // Recalculate times for all activities - allow move even if not ideal
        const recalculated = calculateTimes(newActivities);
        
        // Check if activity is open at the new time (warning only, don't block)
        const dayOfWeek = getDayOfWeek(date);
        const isOpen = isOpenDuringTimeframe(movedActivity, newStartHour, newEndHour, dayOfWeek);
        
        if (!isOpen) {
            // Show warning but allow the move
            const timeString = formatTime12Hour(newStartHour);
            Alert.alert(
                'Warning',
                `${movedActivity.name} may not be open at ${timeString}. You can still move it if needed.`,
                [{ text: 'OK' }]
            );
        }
        
        // Check if new time would exceed end hour (warning only, don't block)
        if (newEndHour > endHour) {
            const endTimeString = formatTime12Hour(endHour);
            Alert.alert(
                'Warning',
                `Moving this activity may exceed the end time (${endTimeString}). You can still move it if needed.`,
                [{ text: 'OK' }]
            );
        }
        
        // Allow the move - owner has full control
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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <Header />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.white} />
                    <Text style={styles.loadingText}>Loading itinerary...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <Header />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Button
                        title="Go Back"
                        onPress={() => navigation?.goBack()}
                        style={styles.backButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <Header />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Itinerary</Text>
                    <Text style={styles.dateText}>{date}</Text>
                    <Text style={styles.timeframeText}>
                        {formatTime12Hour(startHour)} - {formatTime12Hour(endHour)} ({Math.max(0, endHour - startHour)} hours)
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.white,
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        color: colors.error,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: colors.white,
    },
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
