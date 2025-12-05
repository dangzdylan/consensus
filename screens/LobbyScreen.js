import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import colors from '../constants/colors';
import { ACTIVITY_CATEGORIES } from '../constants/activityCategories';
import { lobbyAPI, consensusAPI } from '../services/api';
import { useUser } from '../context/UserContext';

export default function LobbyScreen({ route, navigation }) {
  const { userId } = useUser();
  const lobbyData = route?.params?.lobbyData;
  const lobby_id = route?.params?.lobby_id;
  const isOwnerParam = route?.params?.isOwner;
  
  const [lobbyCode, setLobbyCode] = useState(route?.params?.lobbyCode || lobbyData?.code || '');
  const [members, setMembers] = useState([]);
  const [allReady, setAllReady] = useState(false);
  const [isOwner, setIsOwner] = useState(isOwnerParam || false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [userReady, setUserReady] = useState(false);
  const [readyLoading, setReadyLoading] = useState(false);
  
  const MAX_MEMBERS = 25;
  const POLL_INTERVAL = 2000; // Poll every 2 seconds
  const isMountedRef = useRef(true);

  // Fetch lobby status
  const fetchLobbyStatus = useCallback(async () => {
    if (!lobby_id || !isMountedRef.current) return;

    try {
      const result = await lobbyAPI.getStatus(lobby_id);
      
      if (!isMountedRef.current) return; // Check before state updates

      if (result.error) {
        console.error('Error fetching lobby status:', result.error);
        return;
      }

      if (result.data && isMountedRef.current) {
        setLobbyCode(result.data.code || lobbyCode);
        setMembers(result.data.members || []);
        setAllReady(result.data.all_ready || false);
        
        // Check if current user is owner and ready status
        const currentUserMember = result.data.members?.find(m => m.id === userId);
        if (currentUserMember && isMountedRef.current) {
          setIsOwner(currentUserMember.isOwner || false);
          setUserReady(currentUserMember.isReady || false);
        }
        
        // For single-user testing: if owner is the only member, allow starting
        const validMembers = (result.data.members || []).filter(m => m && m.id && m.name);
        if (validMembers.length === 1 && isOwner && isMountedRef.current) {
          setAllReady(true); // Allow owner to start with just themselves
        }
      }
    } catch (error) {
      console.error('Error fetching lobby status:', error);
    } finally {
      if (isMountedRef.current) {
        setStatusLoading(false);
      }
    }
  }, [lobby_id, userId, lobbyCode]);

  // Poll lobby status
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!lobby_id) {
      Alert.alert('Error', 'Lobby ID missing');
      if (navigation && navigation.goBack) {
        navigation.goBack();
      }
      return;
    }

    // Initial fetch
    fetchLobbyStatus();

    // Poll for updates
    const pollInterval = setInterval(() => {
      if (isMountedRef.current) {
        fetchLobbyStatus();
      }
    }, POLL_INTERVAL);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
    };
  }, [lobby_id, fetchLobbyStatus]);

  // Handle toggle ready status
  const handleToggleReady = async () => {
    if (!lobby_id || !userId) {
      Alert.alert('Error', 'Missing lobby ID or user ID');
      return;
    }

    if (isOwner) {
      Alert.alert('Info', 'Lobby owner is automatically ready');
      return;
    }

    setReadyLoading(true);
    const newReadyStatus = !userReady;

    try {
      const result = await lobbyAPI.setReady(lobby_id, userId, newReadyStatus);

      if (!isMountedRef.current) return;

      if (result.error) {
        Alert.alert('Error', result.error);
        setReadyLoading(false);
        return;
      }

      // Update local state
      if (isMountedRef.current) {
        setUserReady(newReadyStatus);
        
        // Refresh lobby status
        await fetchLobbyStatus();
      }
    } catch (error) {
      console.error('Toggle ready error:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to update ready status');
      }
    } finally {
      if (isMountedRef.current) {
        setReadyLoading(false);
      }
    }
  };

  const handleStartGame = async () => {
    if (!lobby_id || !userId) {
      Alert.alert('Error', 'Missing lobby ID or user ID');
      return;
    }

    if (!isOwner) {
      Alert.alert('Error', 'Only the lobby owner can start the game');
      return;
    }

    setLoading(true);

    try {
      // Call backend to start game
      const result = await consensusAPI.start(lobby_id, userId);

      if (!isMountedRef.current) return;

      if (result.error) {
        Alert.alert('Error', result.error);
        setLoading(false);
        return;
      }

      if (result.data && isMountedRef.current) {
        // Navigate to SwipingScreen with lobby_id
        if (navigation && navigation.navigate) {
          navigation.navigate('Swiping', { 
            lobby_id,
            lobbyData: lobbyData || {},
            isOwner: true
          });
        } else {
          console.error('Navigation not available');
        }
      } else {
        Alert.alert('Error', 'Failed to start game. Please try again.');
      }
    } catch (error) {
      console.error('Start game error:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Validate members array
  const validMembers = members.filter(m => m && m.id && m.name);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Lobby</Text>
          <Text style={styles.subtitle}>Share this code with friends</Text>
        </View>

        <View style={styles.codeContainer}>
          <Text style={styles.code}>{lobbyCode}</Text>
        </View>

        <View style={styles.membersContainer}>
          <Text style={styles.membersTitle}>
            Members ({validMembers.length}{lobbyData?.maxMembers ? `/${lobbyData.maxMembers}` : ''})
          </Text>
          {validMembers.length >= MAX_MEMBERS && (
            <Text style={styles.fullLobbyText}>Lobby is full</Text>
          )}
          <ScrollView 
            style={styles.membersList}
            showsVerticalScrollIndicator={validMembers.length > 5}
          >
            {validMembers.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.name || 'Unknown'}
                </Text>
                {member.isReady ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                ) : (
                  <Ionicons name="time-outline" size={24} color={colors.gray} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.statusContainer}>
          {validMembers.length === 1 && isOwner ? (
            <Text style={styles.statusReady}>Ready to start!</Text>
          ) : allReady ? (
            <Text style={styles.statusReady}>Everyone is ready!</Text>
          ) : (
            <Text style={styles.statusWaiting}>Waiting for others...</Text>
          )}
        </View>

        {!isOwner && (
          <Button 
            title={userReady ? "I'm Ready ✓" : "Mark as Ready"} 
            onPress={handleToggleReady}
            disabled={readyLoading || statusLoading}
            style={[styles.readyButton, userReady && styles.readyButtonActive]}
            loading={readyLoading}
          />
        )}

        {statusLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          isOwner && (
            <Button 
              title={loading ? "Starting..." : "Start Game"} 
              onPress={handleStartGame}
              disabled={(!allReady && validMembers.length > 1) || loading}
              style={styles.startButton}
              loading={loading}
            />
          )
        )}
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  codeContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  code: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 8,
  },
  membersContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(242, 107, 58, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusReady: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  statusWaiting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  startButton: {
    backgroundColor: colors.white,
  },
  readyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  readyButtonActive: {
    backgroundColor: colors.success,
  },
  fullLobbyText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    marginTop: 16,
  },
});
