import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../App';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setPiHoleConfig,
  clearPiHoleConfig,
} from '../store/slices/settingsSlice';
import { setAuthRequired, setAuthentication, clearAuth, setAuthenticationStatus } from '../store/slices/authSlice';
import {
  useCheckAuthRequiredQuery,
  useLazyTestConnectionQuery,
  useLoginMutation,
} from '../store/api/piholeApi';

type Status =
  | { kind: 'idle' }
  | { kind: 'connecting' }
  | { kind: 'error'; message: string };

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<SettingsStackParamList>>();
  const dispatch = useAppDispatch();
  const { piHoleConfig } = useAppSelector((state) => state.settings);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [baseUrl, setBaseUrl] = useState(piHoleConfig?.baseUrl ?? 'http://');
  const [password, setPassword] = useState(piHoleConfig?.password ?? '');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const [testConnection] = useLazyTestConnectionQuery();
  const [login] = useLoginMutation();

  const sid = password.trim() ? password : piHoleConfig?.password ?? '';
  const {data: authRequiredData, isError, error, status: authStatus} = useCheckAuthRequiredQuery({ baseUrl, sid }, {
    skip: !sid && !isAuthenticated
  });

  useEffect(() => {
   if(authRequiredData && !isError) {
     dispatch(setAuthRequired(!authRequiredData?.session?.valid));
     dispatch(setAuthentication({
       isAuthenticated: !authRequiredData?.session?.valid,
       sid: authRequiredData.session?.sid
     }));
   }
  }, [authRequiredData, dispatch]);

  console.log('Auth required check', { authRequiredData, isError, authStatus });

  const fullyConnected = isAuthenticated;
  const isBusy = status.kind === 'connecting';
  const inputsChanged =
    baseUrl.trim() !== (piHoleConfig?.baseUrl ?? '') ||
    password !== (piHoleConfig?.password ?? '');

  console.log('Render SettingsScreen', isAuthenticated, status);
  const handleConnect = async () => {
    const url = baseUrl.trim();
    if (!url) return;

    setStatus({ kind: 'connecting' });

    try {
      const result = await testConnection({ baseUrl: url }).unwrap();

      console.log('Test connection result', result);

      if (!result?.connected) {
        setStatus({ kind: 'error', message: result?.message ?? 'Cannot reach Pi-hole server' });
        dispatch(setAuthenticationStatus(false));
        return;
      }

      dispatch(setPiHoleConfig({ baseUrl: url, password: password.trim() || undefined }));

      if (!result.requiresAuth) {
        console.log('No authentication required by Pi-hole');
        dispatch(setAuthRequired(false));
        dispatch(setAuthenticationStatus(true));
        setStatus({ kind: 'idle' });
        return;
      }

      dispatch(setAuthRequired(true));

      if (!password.trim()) {
        setStatus({ kind: 'error', message: 'Password required for this Pi-hole' });
        dispatch(setAuthenticationStatus(false));
        return;
      }

      const loginResult = await login({ password: password.trim() }).unwrap();

      if (loginResult.session?.valid && loginResult.session?.sid) {
        dispatch(setAuthentication({ isAuthenticated: true, sid: loginResult.session.sid }));
        dispatch(setAuthenticationStatus(true));
        setStatus({ kind: 'idle' });
      } else {
        setStatus({
          kind: 'error',
          message: loginResult.session?.message ?? 'Incorrect password',
        });
        dispatch(setAuthenticationStatus(false));
      }
    } catch (err: any) {
      setStatus({
        kind: 'error',
        message: err?.message ?? 'Connection failed',
      });
      dispatch(setAuthenticationStatus(false));
    }
  };

  const handleDisconnect = () => {
    setPassword('');
    dispatch(clearPiHoleConfig());
    dispatch(clearAuth());
    setStatus({ kind: 'idle' });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={[styles.healthRow, !fullyConnected && styles.healthRowDisabled]}
        onPress={() => navigation.navigate('Health')}
        disabled={!fullyConnected}
        activeOpacity={0.6}
      >
        <View style={styles.healthRowLeft}>
          <Text style={[styles.healthRowTitle, !fullyConnected && styles.disabledText]}>
            System Health
          </Text>
          <Text style={[styles.healthRowSub, !fullyConnected && styles.disabledSubText]}>
            {fullyConnected ? 'CPU, memory, uptime' : 'Connect to view'}
          </Text>
        </View>
        <Text style={[styles.healthRowChevron, !fullyConnected && styles.disabledText]}>›</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pi-hole Server</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL</Text>
          <TextInput
            style={styles.textInput}
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="http://192.168.1.100"
            placeholderTextColor="#bbb"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isBusy && !isAuthenticated}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Pi-hole password"
            placeholderTextColor="#bbb"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isBusy && !isAuthenticated}
          />
        </View>

        <TouchableOpacity
          style={[styles.connectButton, isAuthenticated && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={isBusy || isAuthenticated}
          activeOpacity={0.8}
        >
          {isBusy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.connectButtonText}>Connect</Text>
          )}
        </TouchableOpacity>

        {status.kind === 'error' && (
          <Text style={styles.statusError}>{status.message}</Text>
        )}

        {fullyConnected && status.kind !== 'error' && (
          <Text style={styles.statusSuccess}>Connected to {piHoleConfig?.baseUrl}</Text>
        )}

        {fullyConnected && (
          <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectLink} activeOpacity={0.5}>
            <Text style={styles.disconnectLinkText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  healthRow: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  healthRowDisabled: {
    opacity: 0.6,
  },
  healthRowLeft: {
    gap: 2,
  },
  healthRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  healthRowSub: {
    fontSize: 12,
    color: '#999',
  },
  healthRowChevron: {
    fontSize: 22,
    color: '#ccc',
    lineHeight: 26,
  },
  disabledText: {
    color: '#bbb',
  },
  disabledSubText: {
    color: '#bbb',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  connectButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 50,
  },
  connectButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSuccess: {
    color: '#2e7d32',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },
  statusError: {
    color: '#c62828',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },
  disconnectLink: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 6,
  },
  disconnectLinkText: {
    color: '#999',
    fontSize: 14,
  },
});

export default SettingsScreen;
