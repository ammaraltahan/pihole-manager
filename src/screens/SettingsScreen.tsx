import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../App';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  removeServer,
  setActiveServer,
  selectActiveServer,
} from '../store/slices/serversSlice';
import { Server, ServersState } from '../store/types';

const SERVER_COLORS = ['#3b5bdb', '#2f9e44', '#e67700', '#c92a2a', '#5f3dc4'];

function serverColor(index: number): string {
  return SERVER_COLORS[index % SERVER_COLORS.length];
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<SettingsStackParamList>>();
  const dispatch = useAppDispatch();
  const servers = useAppSelector((state: { servers: ServersState }) => state.servers.servers);
  const sessions = useAppSelector((state: { servers: ServersState }) => state.servers.sessions);
  const activeServer = useAppSelector(selectActiveServer);

  const fullyConnected =
    !!activeServer &&
    (sessions[activeServer.id]?.isConnected ?? false) &&
    (sessions[activeServer.id]?.isAuthenticated ?? false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={[styles.healthRow, !fullyConnected && styles.healthRowDisabled]}
        onPress={() => navigation.navigate('Health')}
        disabled={!fullyConnected}
        activeOpacity={0.6}
      >
        <View style={styles.healthRowLeft}>
          <Text style={[styles.healthRowTitle, !fullyConnected && styles.dimText]}>
            System Health
          </Text>
          <Text style={[styles.healthRowSub, !fullyConnected && styles.dimText]}>
            {fullyConnected ? `CPU, memory, uptime · ${activeServer?.name}` : 'Connect to view'}
          </Text>
        </View>
        <Text style={[styles.chevron, !fullyConnected && styles.dimText]}>›</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Servers</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ServerEditor', {})}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {servers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No servers added yet.</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => navigation.navigate('ServerEditor', {})}
              activeOpacity={0.8}
            >
              <Text style={styles.addFirstButtonText}>Add your first Pi-hole</Text>
            </TouchableOpacity>
          </View>
        ) : (
          servers.map((server: Server, index: number) => {
            const session = sessions[server.id];
            const connected = session?.isConnected && session?.isAuthenticated;
            const isActive = server.id === activeServer?.id;
            const color = serverColor(index);

            return (
              <TouchableOpacity
                key={server.id}
                style={styles.serverRow}
                onPress={() => navigation.navigate('ServerEditor', { serverId: server.id })}
                activeOpacity={0.6}
              >
                <View style={[styles.statusDot, { backgroundColor: connected ? '#2e7d32' : '#ccc' }]} />
                <View style={styles.serverInfo}>
                  <View style={styles.serverNameRow}>
                    <Text style={[styles.serverName, { color }]}>{server.name}</Text>
                    {isActive && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>ACTIVE</Text></View>}
                  </View>
                  <Text style={styles.serverUrl} numberOfLines={1}>{server.baseUrl}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 32 },

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
  healthRowDisabled: { opacity: 0.5 },
  healthRowLeft: { gap: 2, flex: 1 },
  healthRowTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  healthRowSub: { fontSize: 12, color: '#999' },

  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  addButton: {
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: { fontSize: 13, fontWeight: '600', color: '#2196f3' },

  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyText: { fontSize: 14, color: '#aaa', marginBottom: 16 },
  addFirstButton: {
    backgroundColor: '#2196f3',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addFirstButtonText: { color: 'white', fontWeight: '600', fontSize: 15 },

  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  serverInfo: { flex: 1, gap: 3 },
  serverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serverName: { fontSize: 15, fontWeight: '600' },
  serverUrl: { fontSize: 12, color: '#999' },
  activeBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: '#2e7d32', letterSpacing: 0.5 },

  chevron: { fontSize: 20, color: '#ccc', lineHeight: 24 },
  dimText: { color: '#bbb' },
});

export default SettingsScreen;
