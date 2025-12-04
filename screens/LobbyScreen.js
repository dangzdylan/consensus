import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import colors from '../constants/colors';
import { ACTIVITY_CATEGORIES } from '../constants/activityCategories';

export default function LobbyScreen({ route, navigation }) {
  // Get lobby data from route params (from CreateLobbyScreen or JoinLobbyScreen)
  const lobbyData = route?.params?.lobbyData;
  const lobbyCodeFromJoin = route?.params?.lobbyCode;
  
  // Mock data - in real app, this would come from backend
  const [lobbyCode] = useState(lobbyCodeFromJoin || 'ABCD');
  const [members] = useState([
    { id: '1', name: 'You', isReady: true, isOwner: true },
    { id: '2', name: 'Alice', isReady: true },
    { id: '3', name: 'Bob', isReady: true },
    { id: '4', name: 'Charlie', isReady: true },
  ]);

  const allReady = members.length > 0 && members.every(m => m && m.isReady);
  const isOwner = members.length > 0 && members[0]?.isOwner || false;
  const MAX_MEMBERS = 25;
  
  // Validate members array
  const validMembers = members.filter(m => m && m.id && m.name);

  const handleStartGame = () => {
    // Pass lobby data to SwipingScreen
    // If lobbyData is missing (e.g., from join), use defaults but log warning
    if (!lobbyData) {
      console.warn('Lobby data missing when starting game. Using defaults.');
    }
    
    if (navigation && navigation.navigate) {
      navigation.navigate('Swiping', { 
      lobbyData: lobbyData || {
        activityCounts: {
          [ACTIVITY_CATEGORIES.FOOD]: 1,
          [ACTIVITY_CATEGORIES.RECREATION]: 1,
        },
        startHour: 12,
        endHour: 18,
        date: new Date().toLocaleDateString('en-US'),
      },
        isOwner 
      });
    } else {
      console.error('Navigation not available');
    }
  };

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
          {allReady ? (
            <Text style={styles.statusReady}>Everyone is ready!</Text>
          ) : (
            <Text style={styles.statusWaiting}>Waiting for others...</Text>
          )}
        </View>

        <Button 
          title="Start Game" 
          onPress={handleStartGame}
          disabled={!allReady}
          style={styles.startButton}
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
  fullLobbyText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
});
