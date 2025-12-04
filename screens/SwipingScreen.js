import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import colors from '../constants/colors';
import { ACTIVITY_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants/activityCategories';

const { width } = Dimensions.get('window');

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
        // If no filtering criteria provided, show all options
        return true;
    }

    // If no hours data, assume always open (for outdoor activities, parks, etc.)
    if (!activity.hours) {
        // Nature activities are typically always open
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
        // Check if timeframe overlaps with either period
        // First period: openHour to 24 (midnight)
        const overlapsFirstPeriod = startHour >= openHour && startHour < 24;
        // Second period: 0 to closeHour
        const overlapsSecondPeriod = endHour > 0 && endHour <= closeHour;
        // Timeframe spans midnight (starts before closeHour or ends after openHour)
        const spansMidnight = (startHour < closeHour && startHour >= 0) || 
                             (endHour > openHour && endHour <= 24);
        return overlapsFirstPeriod || overlapsSecondPeriod || spansMidnight;
    } else {
        // Normal hours: check if timeframe overlaps
        // Timeframe overlaps if: startHour < closeHour AND endHour > openHour
        return startHour < closeHour && endHour > openHour;
    }
};

// Mock data generator - in real app, this would come from API based on category
const generateOptionsForCategory = (category, count, startHour, endHour, dateString) => {
    const dayOfWeek = getDayOfWeek(dateString);
    
    // All options with hours of operation
    // hours format: { open: hour (0-23), close: hour (0-23), days: [0,1,2,3,4,5,6] }
    // days: 0=Sunday, 1=Monday, ..., 6=Saturday
    const allOptions = {
        [ACTIVITY_CATEGORIES.FOOD]: [
            { 
                id: '1', 
                name: 'Italian Restaurant', 
                distance: '0.5', 
                time: '12:00 PM', 
                image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000',
                hours: { open: 11, close: 22, days: [0,1,2,3,4,5,6] } // Open daily 11 AM - 10 PM
            },
            { 
                id: '2', 
                name: 'Sushi Bar', 
                distance: '1.2', 
                time: '1:00 PM', 
                image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1000',
                hours: { open: 12, close: 23, days: [1,2,3,4,5,6] } // Closed Mondays, 12 PM - 11 PM
            },
            { 
                id: '3', 
                name: 'Burger Joint', 
                distance: '0.8', 
                time: '2:00 PM', 
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1000',
                hours: { open: 10, close: 22, days: [0,1,2,3,4,5,6] } // Open daily 10 AM - 10 PM
            },
        ],
        [ACTIVITY_CATEGORIES.RECREATION]: [
            { 
                id: '4', 
                name: 'Bowling Alley', 
                distance: '2.1', 
                time: '3:00 PM', 
                image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1000',
                hours: { open: 12, close: 23, days: [0,1,2,3,4,5,6] } // Open daily 12 PM - 11 PM
            },
            { 
                id: '5', 
                name: 'Arcade', 
                distance: '1.5', 
                time: '4:00 PM', 
                image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1000',
                hours: { open: 10, close: 22, days: [1,2,3,4,5,6] } // Closed Mondays, 10 AM - 10 PM
            },
            { 
                id: '6', 
                name: 'Escape Room', 
                distance: '2.5', 
                time: '5:00 PM', 
                image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000',
                hours: { open: 14, close: 22, days: [0,1,2,3,4,5,6] } // Open daily 2 PM - 10 PM
            },
        ],
        [ACTIVITY_CATEGORIES.NATURE]: [
            { 
                id: '7', 
                name: 'Central Park', 
                distance: '3.0', 
                time: '6:00 PM', 
                image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1000',
                hours: null // Always open
            },
            { 
                id: '8', 
                name: 'Beach Walk', 
                distance: '4.2', 
                time: '7:00 PM', 
                image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000',
                hours: null // Always open
            },
            { 
                id: '9', 
                name: 'Hiking Trail', 
                distance: '5.1', 
                time: '8:00 PM', 
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1000',
                hours: { open: 6, close: 20, days: [0,1,2,3,4,5,6] } // Open 6 AM - 8 PM daily
            },
        ],
        [ACTIVITY_CATEGORIES.ARTS]: [
            { 
                id: '10', 
                name: 'Art Museum', 
                distance: '1.8', 
                time: '9:00 AM', 
                image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1000',
                hours: { open: 10, close: 17, days: [1,2,3,4,5,6] } // Closed Mondays, 10 AM - 5 PM
            },
            { 
                id: '11', 
                name: 'Theater Show', 
                distance: '2.3', 
                time: '10:00 AM', 
                image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1000',
                hours: { open: 19, close: 22, days: [3,4,5,6,0] } // Shows Thu-Sun, 7 PM - 10 PM
            },
            { 
                id: '12', 
                name: 'Gallery', 
                distance: '1.1', 
                time: '11:00 AM', 
                image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1000',
                hours: { open: 11, close: 18, days: [1,2,3,4,5,6] } // Closed Mondays, 11 AM - 6 PM
            },
        ],
        [ACTIVITY_CATEGORIES.SOCIAL]: [
            { 
                id: '13', 
                name: 'Rooftop Bar', 
                distance: '0.9', 
                time: '8:00 PM', 
                image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1000',
                hours: { open: 17, close: 2, days: [0,1,2,3,4,5,6] } // Open daily 5 PM - 2 AM (overnight)
            },
            { 
                id: '14', 
                name: 'Live Music Venue', 
                distance: '1.7', 
                time: '9:00 PM', 
                image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000',
                hours: { open: 20, close: 2, days: [4,5,6,0] } // Thu-Sun, 8 PM - 2 AM
            },
            { 
                id: '15', 
                name: 'Comedy Club', 
                distance: '2.0', 
                time: '10:00 PM', 
                image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000',
                hours: { open: 19, close: 1, days: [3,4,5,6,0] } // Wed-Sun, 7 PM - 1 AM
            },
        ],
    };

    const categoryOptions = allOptions[category] || [];
    
    // Filter options based on date and timeframe
    if (startHour !== undefined && endHour !== undefined && dateString) {
        return categoryOptions.filter(option => 
            isOpenDuringTimeframe(option, startHour, endHour, dayOfWeek)
        );
    }
    
    // If no filtering criteria, return all options
    return categoryOptions;
};

export default function SwipingScreen({ route, navigation }) {
    // Get lobby data from route params (set in CreateLobbyScreen or LobbyScreen)
    const lobbyData = route?.params?.lobbyData || {
        activityCounts: {
            [ACTIVITY_CATEGORIES.FOOD]: 1,
            [ACTIVITY_CATEGORIES.RECREATION]: 1,
        }
    };
    const isOwner = route?.params?.isOwner || false;

    // Build activity queue from lobby data with validation
    const buildActivityQueue = () => {
        const queue = [];
        if (!lobbyData || !lobbyData.activityCounts) {
            console.warn('Invalid lobby data, using defaults');
            return [{
                category: ACTIVITY_CATEGORIES.FOOD,
                roundNumber: 1,
                options: generateOptionsForCategory(ACTIVITY_CATEGORIES.FOOD, 1),
            }];
        }

        Object.entries(lobbyData.activityCounts).forEach(([category, count]) => {
            // Validate count is a number and positive
            const validCount = Math.max(0, Math.min(10, parseInt(count, 10) || 0));
            if (validCount <= 0) return;

            for (let i = 0; i < validCount; i++) {
                // Get filtered options based on date and timeframe
                const options = generateOptionsForCategory(
                    category, 
                    validCount,
                    lobbyData.startHour,
                    lobbyData.endHour,
                    lobbyData.date
                );
                
                if (!options || options.length === 0) {
                    console.warn(`No open options found for category: ${category} during selected timeframe (${lobbyData.date}, ${lobbyData.startHour}:00-${lobbyData.endHour}:00)`);
                    // Skip this activity round if no options are available
                    // In real app, you might want to notify the user or adjust the timeframe
                    continue;
                }
                
                // Ensure we have at least 2 options for voting (minimum for consensus)
                if (options.length < 2) {
                    console.warn(`Only ${options.length} option(s) available for ${category}. Consider expanding timeframe.`);
                }
                
                queue.push({
                    category,
                    roundNumber: queue.length + 1,
                    options,
                    votes: {}, // Track votes: { optionId: [userId1, userId2, ...] }
                });
            }
        });

        if (queue.length === 0) {
            console.error('No valid activities in queue');
            // Try to get at least one option, even if filtered
            const fallbackOptions = generateOptionsForCategory(
                ACTIVITY_CATEGORIES.FOOD, 
                1,
                lobbyData?.startHour,
                lobbyData?.endHour,
                lobbyData?.date
            );
            
            if (fallbackOptions.length > 0) {
                return [{
                    category: ACTIVITY_CATEGORIES.FOOD,
                    roundNumber: 1,
                    options: fallbackOptions,
                }];
            }
            
            // Last resort: return unfiltered options
            return [{
                category: ACTIVITY_CATEGORIES.FOOD,
                roundNumber: 1,
                options: generateOptionsForCategory(ACTIVITY_CATEGORIES.FOOD, 1),
            }];
        }

        return queue;
    };

    // Use useMemo to rebuild queue when lobbyData changes
    const activityQueue = useMemo(() => buildActivityQueue(), [
        lobbyData?.activityCounts,
        lobbyData?.startHour,
        lobbyData?.endHour,
        lobbyData?.date
    ]);
    
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
    const [isTiebreaker, setIsTiebreaker] = useState(false);
    const [tiedOptions, setTiedOptions] = useState([]);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const retryCountRef = useRef(0); // Track retry attempts for no-vote scenario

    // Get current activity being voted on
    const currentActivity = activityQueue && activityQueue.length > 0 
        ? activityQueue[currentRoundIndex] 
        : null;
    const currentOptions = isTiebreaker ? tiedOptions : (currentActivity?.options || []);
    const currentOption = currentOptions && currentOptions.length > 0
        ? currentOptions[currentOptionIndex]
        : null;

    // User votes tracking (in real app, this would sync with backend)
    const [userVotes, setUserVotes] = useState(new Set());

    // Reset state when activityQueue changes
    useEffect(() => {
        if (activityQueue && activityQueue.length > 0) {
            setCurrentRoundIndex(0);
            setCurrentOptionIndex(0);
            setIsTiebreaker(false);
            setTiedOptions([]);
            setUserVotes(new Set());
        }
    }, [activityQueue]);

    const handleSwipe = (direction) => {
        // Safety check
        if (!currentOption || !currentOptions || currentOptions.length === 0) {
            console.error('Invalid state: no current option');
            return;
        }

        const vote = direction === 'right'; // true for yes, false for no
        
        // Record vote
        if (vote) {
            const newVotes = new Set(userVotes);
            newVotes.add(currentOption.id);
            setUserVotes(newVotes);
        }

        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            if (currentOptionIndex < currentOptions.length - 1) {
                // Move to next option
                setCurrentOptionIndex(currentOptionIndex + 1);
                fadeAnim.setValue(1);
            } else {
                // Finished voting on all options for this round
                finishRound();
            }
        });
    };

    const finishRound = () => {
        // In real app, this would check with backend for all votes from all users
        // For now, simulate checking results
        const votedOptions = Array.from(userVotes);
        
        if (votedOptions.length === 0) {
            // No options selected - allow retry but limit attempts
            retryCountRef.current += 1;
            
            if (retryCountRef.current > 2) {
                // After 2 retries, move to next round with no selection
                alert('No options selected. Moving to next activity.');
                retryCountRef.current = 0;
                moveToNextActivity();
                return;
            }
            
            alert('Please select at least one option to continue.');
            setCurrentOptionIndex(0);
            setUserVotes(new Set());
            fadeAnim.setValue(1);
            return;
        }

        // Filter to only valid options that exist in currentOptions
        const validVotedOptions = votedOptions.filter(id => 
            currentOptions.some(opt => opt.id === id)
        );

        if (validVotedOptions.length === 0) {
            // Invalid votes, reset
            setCurrentOptionIndex(0);
            setUserVotes(new Set());
            fadeAnim.setValue(1);
            return;
        }

        // Check for ties (in real app, this would come from backend aggregating all user votes)
        // For demo, if multiple options were voted, it's a tie
        if (validVotedOptions.length > 1) {
            // Tie detected - go to tiebreaker
            const tiedOpts = currentOptions.filter(opt => validVotedOptions.includes(opt.id));
            if (tiedOpts.length > 1) {
                setIsTiebreaker(true);
                setTiedOptions(tiedOpts);
                setCurrentOptionIndex(0);
                setUserVotes(new Set());
                fadeAnim.setValue(1);
            } else {
                // Only one valid option, consensus reached
                moveToNextActivity();
            }
        } else {
            // Consensus reached - move to next activity
            moveToNextActivity();
        }
    };

    const moveToNextActivity = () => {
        // Reset retry counter for new activity
        retryCountRef.current = 0;
        
        if (currentRoundIndex < activityQueue.length - 1) {
            // Move to next activity
            setCurrentRoundIndex(currentRoundIndex + 1);
            setCurrentOptionIndex(0);
            setIsTiebreaker(false);
            setTiedOptions([]);
            setUserVotes(new Set());
            fadeAnim.setValue(1);
        } else {
            // All activities voted on - go to waiting screen
            if (navigation && navigation.replace) {
                navigation.replace('Waiting', { 
                    allRoundsComplete: true,
                    lobbyData,
                    isOwner
                });
            }
        }
    };

    const getProgressText = () => {
        if (!currentActivity) return 'Loading...';
        if (isTiebreaker) {
            return `Tiebreaker - ${currentActivity.category}`;
        }
        const queueLength = activityQueue.length || 1; // Prevent division by zero
        return `Activity ${Math.min(currentRoundIndex + 1, queueLength)}/${queueLength}: ${currentActivity.category}`;
    };

    // Check if any rounds have no open options
    const roundsWithNoOptions = activityQueue.filter(round => 
        !round.options || round.options.length === 0
    );
    
    if (roundsWithNoOptions.length > 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.white} />
                    <Text style={styles.noMoreText}>
                        No options available for some activities during the selected timeframe.
                    </Text>
                    <Text style={styles.noMoreSubtext}>
                        Please adjust your date or time in the lobby settings.
                    </Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (navigation && navigation.goBack) {
                                navigation.goBack();
                            }
                        }}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Safety checks
    if (!activityQueue || activityQueue.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <Text style={styles.noMoreText}>No activities found. Returning to lobby...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!currentActivity || !currentOptions || currentOptions.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <Text style={styles.noMoreText}>Loading next activity...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!currentOption) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <Text style={styles.noMoreText}>Loading option...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Consensus</Text>
                <Text style={styles.progressText}>{getProgressText()}</Text>
                <View style={styles.progressBar}>
                    <View 
                        style={[
                            styles.progressFill, 
                            { 
                                width: `${Math.min(100, Math.max(0, ((currentRoundIndex + 1) / Math.max(1, activityQueue.length)) * 100))}%` 
                            }
                        ]} 
                    />
                </View>
            </View>

            <View style={styles.cardContainer}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim }] }}>
                    <Card item={currentOption} />
                </Animated.View>
                <Text style={styles.optionCounter}>
                    {currentOptionIndex + 1} / {currentOptions.length}
                </Text>
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
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingTop: 10,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        color: colors.white,
        marginBottom: 8,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.secondary,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    optionCounter: {
        position: 'absolute',
        bottom: 20,
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
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
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 24,
    },
    noMoreSubtext: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 24,
    },
    backButton: {
        marginTop: 24,
        backgroundColor: colors.white,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    backButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
