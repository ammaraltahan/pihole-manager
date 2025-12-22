import React, { useEffect, useState } from 'react';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { Snackbar } from 'react-native-paper';

import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Switch 
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  useLazyTestConnectionQuery,
  useLoginMutation,
  useLogoutMutation,
  useDeleteSessionMutation,
  useLazyGetSessionsQuery,
  useTestConnectionQuery
} from '../store/api/piholeApi';

import { clearPiHoleConfig, setAuthRequired, setPiHoleConfig } from '../store/slices/settingsSlice';

const PI_HOLE_DEFAULT_URL = 'http://pi.hole';

const SettingsScreen: React.FC = () => {
  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  // State for toggling URL edit mode
  const [showUrlEdit, setShowUrlEdit] = useState(false);

    // Helper: Recent errors (stub, replace with actual error fetch if available)
    // Declare after hooks and state
  const dispatch = useAppDispatch();
  const isAuthRequired = useAppSelector((state) => state.settings.authRequired);

  const [baseUrl, setBaseUrl] = useState(PI_HOLE_DEFAULT_URL);
  const [password, setPassword] = useState('');
  const [savePassword, setSavePassword] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // RTK Query hooks
  const [testConnection, {data: testConnectionStatus,isLoading: isTesting}] = useLazyTestConnectionQuery();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [logout] = useLogoutMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const [getSessions] = useLazyGetSessionsQuery();

  // Check if auth is required for this Pi-hole
  const { data: authStatus, isAuthenticated } = useTestConnectionQuery({baseUrl}, {
    skip: !baseUrl || isConnected === false,
    selectFromResult: (result) => ({
      isAuthenticated: result.data?.session?.valid === true,
      ...result
    })
  });
  console.log(authStatus);

  useEffect(() => {
    if (testConnectionStatus) {
      setIsConnected(testConnectionStatus.connected || false);
      dispatch(setPiHoleConfig({sid: testConnectionStatus.session?.sid || null, baseUrl: baseUrl, password: savePassword ? password : undefined }))
      if(testConnectionStatus.session?.valid === true) {
         dispatch(setAuthRequired(false));
      }
    }
  }, [testConnectionStatus]);

  useEffect(() => {
    if (authStatus) {
      dispatch(setPiHoleConfig({sid: authStatus.session?.sid || null, baseUrl: baseUrl, password: savePassword ? password : undefined }));
      if( authStatus.session?.valid === true) {
        dispatch(setAuthRequired(false));
      }
    }
  }, [authStatus, isAuthRequired]);

  const handleTestConnection = async () => {
    
    if (!baseUrl.trim()) {
      setErrorMsg('Please enter your Pi-hole server URL');
      return;
    }
    try {
      const connectionResult = await testConnection({ baseUrl: baseUrl.trim() }).unwrap();
      
      if (connectionResult?.connected) {
        const config = {
          baseUrl: baseUrl.trim(),
          password: savePassword ? password.trim() : undefined,
          sid: connectionResult.session?.sid || null,
        };

        dispatch(setPiHoleConfig(config));

        setErrorMsg(null);
        setSnackbarMsg(`Connected to Pi-hole successfully!${connectionResult.requiresAuth ? '\nAuthentication is required. Please login below.' : '\nNo authentication required.'}`);
        setSnackbarVisible(true);
        if (connectionResult.requiresAuth && password.trim()) {
          await handleLogin();
        }
      } else {
        setErrorMsg('Failed to connect to Pi-hole. Please check your URL and ensure Pi-hole is running.');
        
      }
    } catch (error: any) {
      setErrorMsg('Unable to reach Pi-hole server. Check your network connection.');
      console.error('Connection test failed:', error);
    }
  };

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!password.trim()) {
      setErrorMsg('Please enter your Pi-hole password');
      return;
    }
    
    try {
      const result = await login({ password: password.trim() }).unwrap();
      if (result.session?.valid && result.session?.sid) {
        setErrorMsg(null);
        setSnackbarMsg('Logged in successfully!');
        setSnackbarVisible(true);
        if (savePassword) {
          const updatedConfig = {
            baseUrl: baseUrl.trim(),
            password: password.trim(),
            sid: result.session.sid,
          };

          dispatch(setPiHoleConfig(updatedConfig));
        }
      } else {
        setErrorMsg(result.session?.message || 'Invalid password. Please check your Pi-hole password.');
       
      }
    } catch (error: any) {
      setErrorMsg('Failed to authenticate with Pi-hole. Please check your password.');
      console.error('Login error:', error);
    }
  };

  const handleClearSettings = async () => {
    try {
      console.log('Attempting to delete session from Pi-hole server if exists...', authStatus);
     
      if (authStatus?.session?.sid){ 
        await logout();
        
        // const {sessions} = await getSessions().unwrap();
        // sessions.forEach(async session => {
        //   console.log(`Existing session - ID: ${session.id}, Current: ${session.current_session}, TLS Login: ${session.tls.login}`);
        //   if(session.current_session === true){
        //     await deleteSession({ sid: session.id }).unwrap();
        //     console.log(`Deleted current session with ID: ${session.id}`);
        //   }
        // });

        
        

        dispatch(clearPiHoleConfig());
        dispatch(setAuthRequired(false));
      }
    } catch (e) {
      
      console.error('Error during logout/session deletion:', e);
    }

    setBaseUrl(PI_HOLE_DEFAULT_URL);
    setPassword('');
    dispatch(clearPiHoleConfig());
    dispatch(setAuthRequired(true));
    setSnackbarMsg('Pi-hole configuration has been cleared and logged out.');
    setSnackbarVisible(true);
  };

  return (
    <View style={styles.container}>
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pi-hole Configuration</Text>
       
        {/* Show input fields only when adding a profile */}
        <View style={styles.inputGroup}>
          <Text style={styles.label} accessibilityRole="text" accessibilityLabel="Pi-hole Server URL">Pi-hole Server URL</Text>
          {showUrlEdit ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 14, justifyContent: 'center' }}
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder={PI_HOLE_DEFAULT_URL}
                placeholderTextColor="#333"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Enter Pi-hole server URL"
                accessibilityHint="Include http:// or https:// and hostname or IP address"
                editable={!isTesting && !isLoggingIn}
              />
              <TouchableOpacity
                style={{ marginLeft: 8 }}
                onPress={() => setShowUrlEdit(false)}
                accessibilityRole="button"
                accessibilityLabel="Save URL"
              >
                <Text style={{ color: '#2196f3', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 14, justifyContent: 'center' }}>
                <Text style={{ color: '#2196f3', fontSize: 16 }}>{baseUrl}</Text>
              </View>
              <TouchableOpacity
                style={{ marginLeft: 8 }}
                onPress={() => setShowUrlEdit(true)}
                accessibilityRole="button"
                accessibilityLabel="Customize URL"
              >
                <Text style={{ color: '#2196f3', fontWeight: 'bold' }}>Customize</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.helpText} accessibilityRole="text">
            Enter the full URL of your Pi-hole server (hostname, internal IP, or pi.hole)
          </Text>
        </View>

        {isAuthRequired === true && (
          <View style={styles.inputGroup}>
            <Text style={styles.label} accessibilityRole="text" accessibilityLabel="Pi-hole Password">
              Pi-hole Password
            </Text>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your Pi-hole web interface password"
              placeholderTextColor="#333"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Enter Pi-hole password"
              accessibilityHint="Leave empty if no password is set"
              editable={!isTesting && !isLoggingIn}
            />
            <Text style={styles.helpText} accessibilityRole="text">
              Your Pi-hole web interface password (leave empty if no password set)
            </Text>
              {isAuthRequired && isConnected && !isAuthenticated && (
                <TouchableOpacity
                  style={[styles.button, styles.loginButton, (isTesting || isLoggingIn) && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={!password.trim() || isLoggingIn || isTesting}
                  accessibilityRole="button"
                  accessibilityLabel="Login"
                  accessibilityHint="Authenticate with Pi-hole server"
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
          </View>
        )}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel} accessibilityRole="text" accessibilityLabel="Save password securely">Save password securely</Text>
          <Switch
            value={savePassword}
            onValueChange={setSavePassword}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={savePassword ? '#2196f3' : '#f4f3f4'}
            accessibilityLabel="Save password securely"
            accessibilityHint="Toggle to save or not save your password"
            disabled={isTesting || isLoggingIn}
          />
        </View>
        <Button
          style={[styles.button, styles.testButton, (isTesting || isLoggingIn) && styles.disabledButton]}
          onPress={handleTestConnection}
          disabled={isTesting || isLoggingIn}
          accessibilityRole="button"
          accessibilityLabel="Test Connection"
          accessibilityHint="Tests connection to the Pi-hole server"
          loading={isTesting}
        >
         <Text style={styles.buttonText}>Test Connection</Text>
        </Button>

        {isAuthenticated && (
          <Button
            style={[styles.button, styles.clearButton, (isTesting || isLoggingIn) && styles.disabledButton]}
            onPress={handleClearSettings}
            disabled={isTesting || isLoggingIn}
            accessibilityRole="button"
            accessibilityLabel="Logout"
            accessibilityHint="Logout and Clear all Pi-hole configuration settings"
            textColor="#fff"
          >Logout</Button>
        )}

        {isConnected && (
          <View style={[
            styles.connectionStatus,
            !isAuthenticated && isAuthRequired ? styles.authWarning : styles.connected
          ]} accessibilityLabel="Connection Status">
            <Text style={styles.connectedText} accessibilityRole="text">
              {isAuthenticated ? '✓ Authenticated' : isAuthRequired ? '⚠ Authentication Required' : '✓ Connected (No Auth)'}
            </Text>
            <Text style={styles.configText} accessibilityRole="text">Server: {baseUrl}</Text>
            {isAuthenticated && (
              <Text style={styles.configText} accessibilityRole="text">Session: Active</Text>
            )}
          </View>
        )}

        {/* Help section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle} accessibilityRole="header" accessibilityLabel="Connection Tips">Connection Tips</Text>
          <Text style={styles.helpItem} accessibilityRole="text">• Ensure your phone is on the same network as Pi-hole</Text>
          <Text style={styles.helpItem} accessibilityRole="text">• Use the exact IP address of your Pi-hole server</Text>
          <Text style={styles.helpItem} accessibilityRole="text">• Include http:// in the URL</Text>
          <Text style={styles.helpItem} accessibilityRole="text">• Password is only needed if you set one in Pi-hole web interface</Text>
          <Text style={styles.helpItem} accessibilityRole="text">• If no password is set, leave the password field empty</Text>
        </View>
      </View>
    </ScrollView>
    {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: 'Close', onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMsg}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
    infoSection: {
      marginBottom: 20,
      padding: 12,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#495057',
      marginBottom: 8,
    },
    infoCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 6,
      padding: 10,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: '#eee',
    },
    infoLabel: {
      fontWeight: '600',
      color: '#333',
      fontSize: 15,
    },
    infoValue: {
      color: '#2196f3',
      fontWeight: 'bold',
      fontSize: 15,
    },
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
  errorBox: {
    backgroundColor: '#fdecea',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 15,
    marginBottom: 4,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#d32f2f',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
    backgroundColor: '#d04a1dff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
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