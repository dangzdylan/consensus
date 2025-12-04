import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import CreateLobbyScreen from './screens/CreateLobbyScreen';
import JoinLobbyScreen from './screens/JoinLobbyScreen';
import LobbyScreen from './screens/LobbyScreen';
import SwipingScreen from './screens/SwipingScreen';
import WaitingScreen from './screens/WaitingScreen';
import MatchScreen from './screens/MatchScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import RestaurantDetailsScreen from './screens/RestaurantDetailsScreen';
import colors from './constants/colors';

const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: colors.background },
                }}
                initialRouteName="Login"
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="CreateLobby" component={CreateLobbyScreen} />
                <Stack.Screen name="JoinLobby" component={JoinLobbyScreen} />
                <Stack.Screen name="Lobby" component={LobbyScreen} />
                <Stack.Screen name="Swiping" component={SwipingScreen} />
                <Stack.Screen name="Waiting" component={WaitingScreen} />
                <Stack.Screen name="Match" component={MatchScreen} />
                <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
                <Stack.Screen name="RestaurantDetails" component={RestaurantDetailsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
