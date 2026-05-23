import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../App';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  addServer,
  updateServer,
  removeServer,
  setActiveServer,
  setServerSession,
  clearServerSession,
  selectActiveServer,
} from '../store/slices/serversSlice';
import { Server, ServersState } from '../store/types';
import { useLazyTestConnectionQuery, useLoginMutation } from '../store/api/piholeApi';

type Nav = StackNavigationProp<SettingsStackParamList, 'ServerEditor'>;
type Route = RouteProp<SettingsStackParamList, 'ServerEditor'>;

type Status =
  | { kind: 'idle' }
  | { kind: 'connecting' }
  | { kind: 'error'; message: string };

function nameFromUrl(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const ServerEditorScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();

  const serverId = route.params?.serverId;
  const isEditing = !!serverId;

  const servers = useAppSelector((s: { servers: ServersState }) => s.servers.servers);
  const sessions = useAppSelector((s: { servers: ServersState }) => s.servers.sessions);
  const activeServer = useAppSelector(selectActiveServer);

  const server = isEditing ? servers.find(s => s.id === serverId) : undefined;
  const session = serverId ? sessions[serverId] : undefined;
  const isConnected = session?.isConnected ?? false;
  const isAuthenticated = session?.isAuthenticated ?? false;
  const fullyConnected = isConnected && isAuthenticated;
  const isActive = serverId === activeServer?.id;

  const [baseUrl, setBaseUrl] = useState(server?.baseUrl ?? 'http://');
  const [password, setPassword] = useState(server?.password ?? '');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const [testConnection] = useLazyTestConnectionQuery();
  const [login] = useLoginMutation();

  const isBusy = status.kind === 'connecting';
  const inputsChanged =
    baseUrl.trim() !== (server?.baseUrl ?? '') ||
    password !== (server?.password ?? '');
  const canConnect = baseUrl.trim().length > 0 && !isBusy && (!fullyConnected || inputsChanged);

  const handleConnect = async () => {
    const url = baseUrl.trim();
    if (!url) return;
    setStatus({ kind: 'connecting' });

    try {
      const result = await testConnection({ baseUrl: url }).unwrap();

      if (!result?.connected) {
        setStatus({ kind: 'error', message: result?.message ?? 'Cannot reach Pi-hole server' });
        if (serverId) dispatch(setServerSession({ id: serverId, session: { isConnected: false, isAuthenticated: false } }));
        return;
      }

      const id = serverId ?? genId();
      const updated: Server = {
        id,
        name: nameFromUrl(url),
        baseUrl: url,
        password: password.trim() || undefined,
      };

      if (isEditing) {
        dispatch(updateServer(updated));
      } else {
        dispatch(addServer(updated));
      }

      dispatch(setServerSession({ id, session: { isConnected: true } }));

      if (!result.requiresAuth) {
        dispatch(setServerSession({ id, session: { isAuthenticated: true, requiresAuth: false, sid: undefined } }));
        setStatus({ kind: 'idle' });
        return;
      }

      dispatch(setServerSession({ id, session: { requiresAuth: true } }));

      if (!password.trim()) {
        setStatus({ kind: 'error', message: 'Password required for this Pi-hole' });
        dispatch(setServerSession({ id, session: { isAuthenticated: false } }));
        return;
      }

      const loginResult = await login({ password: password.trim() }).unwrap();

      if (loginResult.session?.valid && loginResult.session?.sid) {
        dispatch(setServerSession({ id, session: { isAuthenticated: true, sid: loginResult.session.sid } }));
        setStatus({ kind: 'idle' });
      } else {
        setStatus({ kind: 'error', message: loginResult.session?.message ?? 'Incorrect password' });
        dispatch(setServerSession({ id, session: { isAuthenticated: false } }));
      }
    } catch (err: any) {
      setStatus({ kind: 'error', message: err?.message ?? 'Connection failed' });
      if (serverId) dispatch(setServerSession({ id: serverId, session: { isConnected: false, isAuthenticated: false } }));
    }
  };

  const handleSetActive = () => {
    if (serverId) dispatch(setActiveServer(serverId));
  };

  const handleDisconnect = () => {
    setPassword('');
    if (serverId) dispatch(clearServerSession(serverId));
    setStatus({ kind: 'idle' });
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Server',
      `Remove "${server?.name ?? baseUrl}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (serverId) dispatch(removeServer(serverId));
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
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
            editable={!isBusy}
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
            editable={!isBusy}
          />
        </View>

        <TouchableOpacity
          style={[styles.connectButton, !canConnect && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={!canConnect}
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
          <Text style={styles.statusSuccess}>Connected to {server?.baseUrl ?? baseUrl}</Text>
        )}
      </View>

      {isEditing && fullyConnected && !isActive && (
        <TouchableOpacity style={styles.actionRow} onPress={handleSetActive} activeOpacity={0.7}>
          <Text style={styles.actionRowText}>Set as Active Server</Text>
        </TouchableOpacity>
      )}

      {isEditing && fullyConnected && (
        <TouchableOpacity style={styles.actionRow} onPress={handleDisconnect} activeOpacity={0.7}>
          <Text style={[styles.actionRowText, { color: '#999' }]}>Disconnect</Text>
        </TouchableOpacity>
      )}

      {isEditing && (
        <TouchableOpacity style={[styles.actionRow, styles.deleteRow]} onPress={handleDelete} activeOpacity={0.7}>
          <Text style={styles.deleteText}>Remove Server</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 40 },

  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: { marginBottom: 16 },
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
    marginTop: 4,
    minHeight: 50,
  },
  connectButtonDisabled: { backgroundColor: '#b0bec5' },
  connectButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  statusSuccess: { color: '#2e7d32', fontSize: 13, textAlign: 'center', marginTop: 14 },
  statusError: { color: '#c62828', fontSize: 13, textAlign: 'center', marginTop: 14 },

  actionRow: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionRowText: { fontSize: 15, fontWeight: '600', color: '#2196f3' },
  deleteRow: { marginTop: 24 },
  deleteText: { fontSize: 15, fontWeight: '600', color: '#c62828' },
});

export default ServerEditorScreen;
