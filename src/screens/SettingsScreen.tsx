  // ...existing code...
  // Declare recentErrors just before render usage
import React, { useState, useEffect } from 'react';
import { Card, Text, Divider, IconButton, ActivityIndicator } from 'react-native-paper';
import { FlatList } from 'react-native';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  // ActivityIndicator removed (duplicate)
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
  useLoginMutation,
  useGetBlockingStatusQuery,
  useGetVersionQuery,
  useGetSystemInfoQuery,
  useGetSummaryQuery
} from '../store/api/piholeApi';
// ...existing code...
import QuickActionsWithError from '../components/QuickActionsWithError';

// Helper to extract host name from a URL
function extractHost(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    // Fallback: try to parse manually
    const match = url.match(/^(?:https?:\/\/)?([^:/?#]+)(?:[/:?#]|$)/i);
    return match ? match[1] : undefined;
  }
}

// Helper to extract IP address from a URL (if host is an IP)
function extractIp(url: string): string | undefined {
  const host = extractHost(url);
  if (!host) return undefined;
  // Simple IPv4/IPv6 regex
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([a-fA-F\d]{0,4}:){2,7}[a-fA-F\d]{0,4}$/;
  if (ipv4.test(host) || ipv6.test(host)) {
    return host;
  }
  return undefined;
}

const PI_HOLE_DEFAULT_URL = 'http://pi.hole';

const SettingsScreen: React.FC = () => {
      // State for toggling URL edit mode
      const [showUrlEdit, setShowUrlEdit] = useState(false);
    // Helper: Format health status
    const getHealthStatus = () => {
      if (!isConnected) return 'Disconnected';
      if (isSystemLoading) return 'Checking...';
      // Use systemInfo presence for health (customize as needed)
      if (systemInfo) return 'Healthy';
      return 'Unhealthy';
    };

    // Helper: Format blocking status
    const getBlockingStatus = () => {
      if (isBlockingLoading) return 'Loading...';
      if (!blockingStatus) return 'Unknown';
      return blockingStatus.blocking === 'enabled' ? 'Enabled' : 'Disabled';
    };

    // Helper: Format version info
      const getVersionInfo = () => {
        if (isVersionLoading) return 'Loading...';
        if (!version) return 'Unknown';
        const {version: {core: {remote: v}}} = version;
        // version is a string, not an object
        return `Pi-hole ${v?.version || 'N/A'}`;
      };

    // Helper: Recent errors (stub, replace with actual error fetch if available)
    // Declare after hooks and state
  const dispatch = useAppDispatch();
  const { piHoleConfig, isConnected } = useAppSelector((state) => state.settings);
  const { isAuthenticated, requiresAuth } = useAppSelector((state) => state.auth);

  const [baseUrl, setBaseUrl] = useState(piHoleConfig?.baseUrl || PI_HOLE_DEFAULT_URL);
  const [password, setPassword] = useState(piHoleConfig?.password || '');
  const [savePassword, setSavePassword] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  // RTK Query hooks
  const [testConnection, {isLoading: isTesting}] = useLazyTestConnectionQuery();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  // Pi-hole info hooks
  const { data: blockingStatus, isLoading: isBlockingLoading } = useGetBlockingStatusQuery(undefined, { skip: !isConnected });
  const { data: version, isLoading: isVersionLoading } = useGetVersionQuery(undefined, { skip: !isConnected });
  const { data: systemInfo, recentErrors, isLoading: isSystemLoading } = useGetSystemInfoQuery(undefined, { skip: !isConnected, selectFromResult(state) {
    const recentErrors = (state.data && state.data?.recentErrors) ? state.data?.recentErrors : [];
    return { ...state, recentErrors };
  }, });

  // Check if auth is required for this Pi-hole
  const { data: authStatus, refetch: checkAuth } = useCheckAuthRequiredQuery(undefined, {
    skip: !piHoleConfig || !isConnected,
  });

  // Update auth requirement when we get the status
  useEffect(() => {
    if (authStatus !== undefined) {
          const shouldRequireAuth = authStatus.session?.valid === false;
      // Only dispatch if the value actually changes
      if (requiresAuth !== shouldRequireAuth) {
        dispatch(setAuthRequired(shouldRequireAuth));
      }
      if (authStatus.session?.valid === true && !isAuthenticated) {
        dispatch(setAuthentication({ isAuthenticated: true, sid: authStatus.session?.sid }));
      }
    }
  }, [authStatus, isAuthenticated, dispatch]);

  // Remove all multi-profile actions

  const handleTestConnection = async () => {
    setErrorMsg(null);
    setShowRetry(false);
    if (!baseUrl.trim()) {
      setErrorMsg('Please enter your Pi-hole server URL');
      return;
    }
    try {
      const connectionResult = await testConnection({ baseUrl: baseUrl.trim() }).unwrap();
      if (connectionResult?.connected) {
        dispatch(setConnectionStatus(true));
        const config = {
          baseUrl: baseUrl.trim(),
          password: savePassword ? password.trim() : undefined,
        };
        dispatch(setPiHoleConfig(config));
        dispatch(setAuthRequired(connectionResult.requiresAuth || false));
        if (connectionResult.requiresAuth === false) {
          dispatch(setAuthenticationStatus(true));
        }
        setErrorMsg(null);
        Alert.alert(
          'Success',
          `Connected to Pi-hole successfully!${
            connectionResult.requiresAuth
              ? '\n\nAuthentication is required. Please login below.'
              : '\n\nNo authentication required.'
          }`
        );
        if (connectionResult.requiresAuth && password.trim()) {
          await handleLogin();
        }
      } else {
        setErrorMsg('Failed to connect to Pi-hole. Please check your URL and ensure Pi-hole is running.');
        setShowRetry(true);
        dispatch(setConnectionStatus(false));
        dispatch(setAuthRequired(false));
      }
    } catch (error: any) {
      setErrorMsg('Unable to reach Pi-hole server. Check your network connection.');
      setShowRetry(true);
      console.error('Connection test failed:', error);
      dispatch(setConnectionStatus(false));
      dispatch(setAuthRequired(false));
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
        dispatch(setAuthentication({
          isAuthenticated: true,
          sid: result.session.sid,
        }));
        dispatch(setAuthenticationStatus(true));
        setErrorMsg(null);
        Alert.alert('Success', 'Logged in successfully!');
        if (savePassword) {
          const updatedProfile = {
            baseUrl: baseUrl.trim(),
            password: password.trim(),
          };
          dispatch(setPiHoleConfig(updatedProfile));
        }
      } else {
        setErrorMsg(result.session.message || 'Invalid password. Please check your Pi-hole password.');
        dispatch(setAuthenticationStatus(false));
      }
    } catch (error: any) {
      setErrorMsg('Failed to authenticate with Pi-hole. Please check your password.');
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
            setBaseUrl(PI_HOLE_DEFAULT_URL);
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
        <Card style={styles.infoSection} accessibilityRole="header" accessibilityLabel="Server Information">
              <Card.Content>
                <Text variant='titleLarge' style={styles.infoTitle}>Server Health</Text>
                <View style={styles.infoCard}>
                  <Text variant='bodyMedium' style={styles.infoLabel}>Status:</Text>
                  <Text variant='bodyMedium' style={styles.infoValue}>{getHealthStatus()}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text variant='bodyMedium' style={styles.infoLabel}>Blocking:</Text>
                  <Text variant='bodyMedium' style={styles.infoValue}>{getBlockingStatus()}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text variant='bodyMedium' style={styles.infoLabel}>Version:</Text>
                  <Text variant='bodyMedium' style={styles.infoValue}>{getVersionInfo()}</Text>
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <Text variant='titleLarge' style={styles.infoTitle}>Recent Errors</Text>
                <FlatList
                    data={recentErrors.slice(0, 5)}
                    scrollEnabled={false}
                    keyExtractor={(_, idx) => idx.toString()}
                    ListEmptyComponent={<Text variant='bodyMedium' style={styles.infoLabel}>No recent errors.</Text>}
                    renderItem={({ item }) => (
                      <View style={styles.infoCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
                          <Text
                            variant='bodyMedium'
                            style={[styles.infoLabel, { flex: 1 }]}
                            numberOfLines={0}
                          >
                            {item}
                          </Text>
                          <IconButton
                            icon="alert-circle"
                            size={20}
                            iconColor="#d32f2f"
                            accessibilityLabel="Error"
                            style={{ marginLeft: 8, marginTop: 2 }}
                          />
                        </View>
                      </View>
                    )}
                  />
              </Card.Content>
            </Card>

        {/* Quick Actions with error notification */}
        <QuickActionsWithError isConnected={isConnected} />

        {/* Inline error feedback */}
        {errorMsg && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{errorMsg}</Text>
            {showRetry && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleTestConnection}
                accessibilityRole="button"
                accessibilityLabel="Retry Connection"
                accessibilityHint="Retry connecting to the Pi-hole server"
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Remove multi-profile UI. Only show single server config fields below. */}

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

        {requiresAuth === true && (
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
        <TouchableOpacity
          style={[styles.button, styles.testButton, (isTesting || isLoggingIn) && styles.disabledButton]}
          onPress={handleTestConnection}
          disabled={isTesting || isLoggingIn}
          accessibilityRole="button"
          accessibilityLabel="Test Connection"
          accessibilityHint="Tests connection to the Pi-hole server"
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

        <TouchableOpacity
          style={[styles.button, styles.clearButton, (isTesting || isLoggingIn) && styles.disabledButton]}
          onPress={handleClearSettings}
          disabled={isTesting || isLoggingIn}
          accessibilityRole="button"
          accessibilityLabel="Clear Settings"
          accessibilityHint="Clear all Pi-hole configuration settings"
        >
          <Text style={styles.buttonText}>Clear Settings</Text>
        </TouchableOpacity>

        {isConnected && (
          <View style={[
            styles.connectionStatus,
            !isAuthenticated && requiresAuth ? styles.authWarning : styles.connected
          ]} accessibilityLabel="Connection Status">
            <Text style={styles.connectedText} accessibilityRole="text">
              {isAuthenticated ? '✓ Authenticated' : requiresAuth ? '⚠ Authentication Required' : '✓ Connected (No Auth)'}
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
    backgroundColor: '#ff9800',
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