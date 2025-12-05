import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import colors from '../constants/colors';
import { ACTIVITY_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants/activityCategories';
import { consensusAPI } from '../services/api';
import { useUser } from '../context/UserContext';

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

export default function SwipingScreen({ route, navigation }) {
    const { userId } = useUser();
    const lobby_id = route?.params?.lobby_id;
    const lobbyData = route?.params?.lobbyData || {};
    const isOwner = route?.params?.isOwner || false;

    // State management
    const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
    const [roundData, setRoundData] = useState(null); // Current round info
    const [options, setOptions] = useState([]); // Options for current round
    const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
    const [isTiebreaker, setIsTiebreaker] = useState(false);
    const [tiedOptions, setTiedOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [checkingConsensus, setCheckingConsensus] = useState(false);
    const [totalRounds, setTotalRounds] = useState(0);
    
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const isMountedRef = useRef(true);
    const statusCheckTimeoutRef = useRef(null);
    const voteInProgressRef = useRef(false);

    // Fetch options for current round
    const fetchRoundOptions = async (roundNumber) => {
        if (!lobby_id || !isMountedRef.current) {
            if (!lobby_id) {
                Alert.alert('Error', 'Lobby ID missing');
                if (navigation && navigation.goBack) {
                    navigation.goBack();
                }
            }
            return;
        }

        setLoading(true);
        try {
            console.log(`[SwipingScreen] Fetching options for round ${roundNumber}, lobby ${lobby_id}`);
            const result = await consensusAPI.getRoundOptions(lobby_id, roundNumber);

            if (!isMountedRef.current) return;

            console.log(`[SwipingScreen] Round options response:`, result);

            if (result.error) {
                console.error(`[SwipingScreen] Error from backend:`, result.error);
                Alert.alert('Error', result.error || 'Failed to fetch options. Please check backend logs.');
                setLoading(false);
                return;
            }

            if (result.data) {
                setRoundData(result.data.round);
                const fetchedOptions = result.data.options || [];
                
                console.log(`[SwipingScreen] Fetched ${fetchedOptions.length} options for round ${roundNumber}`);
                
                if (fetchedOptions.length === 0) {
                    const errorMsg = result.data.message || 
                        `No options available for round ${roundNumber}. This might be due to:\n\n` +
                        `• No activities found in the selected area\n` +
                        `• All activities filtered out by timeframe\n` +
                        `• Backend API issue\n\n` +
                        `Please check the backend logs for more details.`;
                    console.error(`[SwipingScreen] No options found. Round data:`, result.data);
                    Alert.alert('No Options Available', errorMsg);
                    setLoading(false);
                    return;
                }
                
                // Map backend options to frontend format
                const mappedOptions = fetchedOptions.map(opt => ({
                    id: opt.option_id || opt.id,
                    name: opt.name,
                    category: opt.category,
                    distance: opt.distance?.toString() || '0',
                    time: opt.time || '12:00 PM',
                    image: opt.image_url || opt.image,
                    hours: opt.hours,
                    address: opt.address,
                    location: opt.location,
                }));

                console.log(`[SwipingScreen] Mapped ${mappedOptions.length} options successfully`);

                if (isMountedRef.current) {
                    setOptions(mappedOptions);
                    setCurrentOptionIndex(0);
                    setIsTiebreaker(false);
                    setTiedOptions([]);
                }
            } else {
                console.error(`[SwipingScreen] No data in response:`, result);
                Alert.alert('Error', 'Invalid response from server. Please try again.');
            }
        } catch (error) {
            console.error('[SwipingScreen] Error fetching round options:', error);
            if (isMountedRef.current) {
                Alert.alert('Error', `Failed to load options: ${error.message || 'Unknown error'}. Please check backend connection.`);
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    // Get total number of rounds (from lobby data or estimate from activity counts)
    useEffect(() => {
        if (lobbyData?.activityCounts) {
            const total = Object.values(lobbyData.activityCounts).reduce((sum, count) => sum + (count || 0), 0);
            setTotalRounds(total);
        }
    }, [lobbyData]);

    // Fetch options when round number changes
    useEffect(() => {
        if (lobby_id && currentRoundNumber) {
            fetchRoundOptions(currentRoundNumber);
        }
    }, [lobby_id, currentRoundNumber]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
            if (statusCheckTimeoutRef.current) {
                clearTimeout(statusCheckTimeoutRef.current);
            }
        };
    }, []);

    // Get current option
    const currentOptions = isTiebreaker ? tiedOptions : options;
    const currentOption = currentOptions && currentOptions.length > 0
        ? currentOptions[currentOptionIndex]
        : null;

    // Submit vote to backend
    const submitVote = async (optionId, vote) => {
        if (!lobby_id || !userId || !optionId || !isMountedRef.current) {
            console.error('Missing required data for vote');
            return false;
        }

        setVoting(true);
        try {
            const result = await consensusAPI.vote(lobby_id, {
                user_id: userId,
                option_id: optionId,
                round_number: currentRoundNumber,
                vote: vote,
            });

            if (!isMountedRef.current) return false;

            if (result.error) {
                console.error('Vote error:', result.error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error submitting vote:', error);
            return false;
        } finally {
            if (isMountedRef.current) {
                setVoting(false);
            }
        }
    };

    // Check round status for consensus
    const checkRoundStatus = async () => {
        if (!lobby_id || !isMountedRef.current) return;

        setCheckingConsensus(true);
        try {
            const result = await consensusAPI.getRoundStatus(lobby_id, currentRoundNumber);

            if (!isMountedRef.current) return; // Check before state updates

            if (result.error) {
                console.error('Error checking round status:', result.error);
                setCheckingConsensus(false);
                return;
            }

            if (result.data) {
                const { consensus_reached, consensus_option_id, is_tie, tied_options, all_voted } = result.data;

                if (consensus_reached && consensus_option_id) {
                    // Consensus reached - complete the round
                    await completeRound(consensus_option_id);
                } else if (is_tie && tied_options && tied_options.length > 0) {
                    // Tie detected - set up tiebreaker
                    const tiedOpts = options.filter(opt => tied_options.includes(opt.id));
                    if (tiedOpts.length > 0 && isMountedRef.current) {
                        setIsTiebreaker(true);
                        setTiedOptions(tiedOpts);
                        setCurrentOptionIndex(0);
                        fadeAnim.setValue(1);
                        setCheckingConsensus(false); // Exit checking state so user can vote
                    } else {
                        // Couldn't find tied options, retry status check
                        if (statusCheckTimeoutRef.current) {
                            clearTimeout(statusCheckTimeoutRef.current);
                        }
                        if (isMountedRef.current) {
                            statusCheckTimeoutRef.current = setTimeout(() => {
                                if (isMountedRef.current) {
                                    checkRoundStatus();
                                }
                            }, 2000);
                        }
                    }
                } else if (all_voted) {
                    // All users voted but no consensus yet - wait a bit and check again
                    if (statusCheckTimeoutRef.current) {
                        clearTimeout(statusCheckTimeoutRef.current);
                    }
                    if (isMountedRef.current) {
                        statusCheckTimeoutRef.current = setTimeout(() => {
                            if (isMountedRef.current) {
                                checkRoundStatus();
                            }
                        }, 2000);
                    }
                } else {
                    // Not all users have voted yet - navigate to waiting screen
                    if (isMountedRef.current) {
                        navigateToWaiting();
                    }
                }
            }
        } catch (error) {
            console.error('Error checking round status:', error);
        } finally {
            if (isMountedRef.current) {
                setCheckingConsensus(false);
            }
        }
    };

    // Complete round when consensus is reached
    const completeRound = async (selectedOptionId) => {
        if (!lobby_id || !userId || !isMountedRef.current) return;

        try {
            const result = await consensusAPI.completeRound(
                lobby_id,
                currentRoundNumber,
                selectedOptionId,
                userId
            );

            if (!isMountedRef.current) return;

            if (result.error) {
                Alert.alert('Error', result.error);
                return;
            }

            if (result.data && isMountedRef.current) {
                const { all_rounds_completed, next_round } = result.data;

                if (all_rounds_completed) {
                    // All rounds done - navigate to waiting screen (which will go to itinerary)
                    navigateToWaiting();
                } else if (next_round) {
                    // Move to next round
                    setCurrentRoundNumber(next_round);
                    setIsTiebreaker(false);
                    setTiedOptions([]);
                }
            }
        } catch (error) {
            console.error('Error completing round:', error);
            if (isMountedRef.current) {
                Alert.alert('Error', 'Failed to complete round. Please try again.');
            }
        }
    };

    // Navigate to waiting screen
    const navigateToWaiting = () => {
        if (navigation && navigation.replace && isMountedRef.current) {
            navigation.replace('Waiting', {
                lobby_id,
                lobbyData,
                isOwner,
            });
        }
    };

    // Handle swipe (vote)
    const handleSwipe = async (direction) => {
        if (!currentOption || voting || checkingConsensus || voteInProgressRef.current || !isMountedRef.current) return;
        
        // Set flag immediately to prevent duplicate calls
        voteInProgressRef.current = true;
        setVoting(true);

        const vote = direction === 'right'; // true for yes, false for no
        const optionId = currentOption.id; // Capture before async

        try {
            // Submit vote to backend
            const success = await submitVote(optionId, vote);

            if (!isMountedRef.current) {
                voteInProgressRef.current = false;
                return;
            }

            if (!success) {
                setVoting(false);
                voteInProgressRef.current = false;
                Alert.alert('Error', 'Failed to submit vote. Please try again.');
                return;
            }

            // Animate card out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                if (!isMountedRef.current) {
                    voteInProgressRef.current = false;
                    return;
                }
                
                if (currentOptionIndex < currentOptions.length - 1) {
                    // Move to next option
                    setCurrentOptionIndex(currentOptionIndex + 1);
                    fadeAnim.setValue(1);
                    setVoting(false);
                    voteInProgressRef.current = false;
                } else {
                    // Finished voting on all options - check for consensus
                    setVoting(false);
                    voteInProgressRef.current = false;
                    checkRoundStatus();
                }
            });
        } catch (error) {
            console.error('Swipe error:', error);
            if (isMountedRef.current) {
                setVoting(false);
                voteInProgressRef.current = false;
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        }
    };

    // Get progress text
    const getProgressText = () => {
        if (!roundData) return 'Loading...';
        if (isTiebreaker) {
            return `Tiebreaker - ${roundData.category}`;
        }
        return `Round ${currentRoundNumber}${totalRounds > 0 ? `/${totalRounds}` : ''}: ${roundData.category}`;
    };

    // Loading state
    if (loading && options.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.white} />
                    <Text style={styles.noMoreText}>Loading options...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state - no options
    if (!loading && options.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.white} />
                    <Text style={styles.noMoreText}>
                        No options available for this round.
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

    // Checking consensus state
    if (checkingConsensus) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.white} />
                    <Text style={styles.noMoreText}>Checking consensus...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Safety check
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
                                width: `${Math.min(100, Math.max(0, totalRounds > 0 ? ((currentRoundNumber / totalRounds) * 100) : 0))}%` 
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
                <TouchableOpacity 
                    style={[styles.circleButton, (voting || checkingConsensus) && styles.circleButtonDisabled]} 
                    onPress={() => handleSwipe('left')}
                    disabled={voting || checkingConsensus}
                >
                    <Ionicons name="close" size={40} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.circleButton, (voting || checkingConsensus) && styles.circleButtonDisabled]} 
                    onPress={() => handleSwipe('right')}
                    disabled={voting || checkingConsensus}
                >
                    <Ionicons name="checkmark" size={40} color={colors.success} />
                </TouchableOpacity>
            </View>
            {voting && (
                <Text style={styles.votingText}>Submitting vote...</Text>
            )}
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
    circleButtonDisabled: {
        opacity: 0.5,
    },
    votingText: {
        color: colors.white,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
});
