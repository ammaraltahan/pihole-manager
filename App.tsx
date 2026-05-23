import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import DashboardScreen from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ServerEditorScreen from './src/screens/ServerEditorScreen';
import HealthScreen from './src/screens/HealthScreen';

export type RootTabParamList = {
  Home: undefined;
  Settings: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  ServerEditor: { serverId?: string };
  Health: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="ServerEditor"
        component={ServerEditorScreen}
        options={({ route }) => ({
          title: route.params?.serverId ? 'Edit Server' : 'Add Server',
        })}
      />
      <SettingsStack.Screen
        name="Health"
        component={HealthScreen}
        options={{ title: 'System Health' }}
      />
    </SettingsStack.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                const iconName: keyof typeof Ionicons.glyphMap =
                  route.name === 'Home'
                    ? focused ? 'home' : 'home-outline'
                    : focused ? 'settings' : 'settings-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#2196f3',
              tabBarInactiveTintColor: 'gray',
            })}
          >
            <Tab.Screen
              name="Home"
              component={DashboardScreen}
              options={{ title: 'Pi-hole' }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsNavigator}
              options={{ headerShown: false }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}
