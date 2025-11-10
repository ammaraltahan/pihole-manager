import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Switch 
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  setPiHoleConfig, 
  clearPiHoleConfig, 
  setConnectionStatus,
  setAuthenticationStatus 
} from '../store/slices/settingsSlice';
import { setAuthRequired, setAuthentication, clearAuth } from '../store/slices/authSlice';
import { 
  useLazyTestConnectionQuery, 
  useCheckAuthRequiredQuery,
  useLoginMutation 
} from '../store/api/piholeApi';

const SettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { piHoleConfig, isConnected } = useAppSelector((state) => state.settings);
  const { isAuthenticated, requiresAuth } = useAppSelector((state) => state.auth);
  
  const [baseUrl, setBaseUrl] = useState(piHoleConfig?.baseUrl || 'http://pi.hole');
  const [password, setPassword] = useState(piHoleConfig?.password || '');
  const [isTesting, setIsTesting] = useState(false);
  const [savePassword, setSavePassword] = useState(true);

  // RTK Query hooks
  const [testConnection, { data: connectionTestResult }] = useLazyTestConnectionQuery();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  // Check if auth is required for this Pi-hole
  const { data: authStatus, refetch: checkAuth } = useCheckAuthRequiredQuery(undefined, {
    skip: !piHoleConfig || !isConnected,
  });

  // Update auth requirement when we get the status
  useEffect(() => {
    if (authStatus !== undefined) {
      dispatch(setAuthRequired(authStatus.session?.valid === false));
      if (authStatus.session?.valid) {
        dispatch(setAuthentication({ isAuthenticated: true, sid: authStatus.session?.sid }));
      }
    }
  }, [authStatus, dispatch]);

  const handleTestConnection = async () => {
    if (!baseUrl.trim()) {
      Alert.alert('Error', 'Please enter your Pi-hole server URL');
      return;
    }

    setIsTesting(true);
    try {
        console.log('Testing connection to:', baseUrl.trim());
      // Test basic connection using the auth endpoint
      const connectionResult = await testConnection({ 
        baseUrl: baseUrl.trim() 
      }).unwrap();

      console.log('Connection test result:', connectionResult);

      if (connectionResult?.connected) {
        dispatch(setConnectionStatus(true));
        
        // Save configuration
        const config = {
          baseUrl: baseUrl.trim(),
          password: savePassword ? password.trim() : undefined,
        };
        
        dispatch(setPiHoleConfig(config));
        
        // Update auth requirement based on connection test
        dispatch(setAuthRequired(connectionResult.requiresAuth || false));
        if(connectionResult.requiresAuth === false){
          dispatch(setAuthenticationStatus(true));
        }
        
        Alert.alert(
          'Success', 
          `Connected to Pi-hole successfully!${
            connectionResult.requiresAuth 
              ? '\n\nAuthentication is required. Please login below.' 
              : '\n\nNo authentication required.'
          }`
        );
        
        // If auth is required and we have a password, try to login automatically
        if (connectionResult.requiresAuth && password.trim()) {
          await handleLogin();
        }
      } else {
        Alert.alert('Error', 'Failed to connect to Pi-hole. Please check your URL and ensure Pi-hole is running.');
        dispatch(setConnectionStatus(false));
        dispatch(setAuthRequired(false));
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to reach Pi-hole server. Check your network connection.');
      console.error('Connection test failed:', error);
      dispatch(setConnectionStatus(false));
      dispatch(setAuthRequired(false));
    } finally {
      setIsTesting(false);
    }
  };

  const handleLogin = async () => {
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your Pi-hole password');
      return;
    }

    try {
      const result = await login({ password: password.trim() }).unwrap();
      console.log('Login result:', JSON.stringify(result));

      if (result.session?.valid && result.session?.sid) {
        dispatch(setAuthentication({ 
          isAuthenticated: true, 
          sid: result.session.sid 
        }));
        dispatch(setAuthenticationStatus(true));
        Alert.alert('Success', 'Logged in successfully!');
        
        // Update config with password if save is enabled
        if (savePassword) {
          dispatch(setPiHoleConfig({
            baseUrl: baseUrl.trim(),
            password: password.trim(),
          }));
        }
      } else {
        Alert.alert('Login Failed', result.session.message || 'Invalid password. Please check your Pi-hole password.');
        dispatch(setAuthenticationStatus(false));
      }
    } catch (error: any) {
      Alert.alert('Login Error', 'Failed to authenticate with Pi-hole. Please check your password.');
      console.error('Login error:', error);
      dispatch(setAuthenticationStatus(false));
    }
  };

  const handleClearSettings = () => {
    Alert.alert(
      'Clear Settings',
      'Are you sure you want to clear all Pi-hole settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setBaseUrl('https://pi.hole');
            setPassword('');
            dispatch(clearPiHoleConfig());
            dispatch(clearAuth());
            Alert.alert('Settings Cleared', 'Pi-hole configuration has been cleared.');
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pi-hole Configuration</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pi-hole Server URL</Text>
          <TextInput
            style={styles.textInput}
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="https://pi.hole"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helpText}>
            Enter the full URL of your Pi-hole server (include http://)
          </Text>
        </View>

        {/* Always show password field since we don't know if auth is required until we test */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Pi-hole Password {requiresAuth && '*'}
          </Text>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your Pi-hole web interface password"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helpText}>
            Your Pi-hole web interface password (leave empty if no password set)
          </Text>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Save password securely</Text>
          <Switch
            value={savePassword}
            onValueChange={setSavePassword}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={savePassword ? '#2196f3' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestConnection}
          disabled={isTesting}
        >
          {isTesting ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.buttonText}>Testing Connection...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Test Connection</Text>
          )}
        </TouchableOpacity>

        {requiresAuth && isConnected && !isAuthenticated && (
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={handleLogin}
            disabled={!password.trim() || isLoggingIn}
          >
            {isLoggingIn ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.buttonText}>Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClearSettings}
        >
          <Text style={styles.buttonText}>Clear Settings</Text>
        </TouchableOpacity>

        {isConnected && (
          <View style={[
            styles.connectionStatus,
            !isAuthenticated && requiresAuth ? styles.authWarning : styles.connected
          ]}>
            <Text style={styles.connectedText}>
              {isAuthenticated ? '✓ Authenticated' : requiresAuth ? '⚠ Authentication Required' : '✓ Connected (No Auth)'}
            </Text>
            <Text style={styles.configText}>Server: {baseUrl}</Text>
            {isAuthenticated && (
              <Text style={styles.configText}>Session: Active</Text>
            )}
          </View>
        )}

        {/* Help section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Connection Tips</Text>
          <Text style={styles.helpItem}>• Ensure your phone is on the same network as Pi-hole</Text>
          <Text style={styles.helpItem}>• Use the exact IP address of your Pi-hole server</Text>
          <Text style={styles.helpItem}>• Include http:// in the URL</Text>
          <Text style={styles.helpItem}>• Password is only needed if you set one in Pi-hole web interface</Text>
          <Text style={styles.helpItem}>• If no password is set, leave the password field empty</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'white',
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  testButton: {
    backgroundColor: '#2196f3',
  },
  loginButton: {
    backgroundColor: '#4caf50',
  },
  clearButton: {
    backgroundColor: '#ff9800',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionStatus: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  connected: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#4caf50',
  },
  authWarning: {
    backgroundColor: '#fff3cd',
    borderLeftColor: '#ffc107',
  },
  connectedText: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  configText: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  helpSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  helpItem: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default SettingsScreen;