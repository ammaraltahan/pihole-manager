import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAddToAllowlistMutation } from '../store/api/piholeApi';

interface RecentlyBlockedDomainsProps {
  blockedData?: {
    blocked: string[];
    took: number;
  };
}

interface DomainEntry {
  domain: string;
  count: number;
}

function toDedupedList(domains: string[]): DomainEntry[] {
  const counts: Record<string, number> = {};
  for (const d of domains) {
    counts[d] = (counts[d] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
}

const RecentlyBlockedDomains: React.FC<RecentlyBlockedDomainsProps> = ({ blockedData }) => {
  const raw = blockedData?.blocked ?? [];
  const entries = toDedupedList(raw);
  const [addToAllowlist] = useAddToAllowlistMutation();
  const [pendingDomain, setPendingDomain] = useState<string | null>(null);

  const handleDomainPress = (domain: string) => {
    Alert.alert(
      'Allow Domain',
      `Add "${domain}" to your allowlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Allow', onPress: () => confirmAllow(domain) },
      ]
    );
  };

  const confirmAllow = async (domain: string) => {
    setPendingDomain(domain);
    try {
      await addToAllowlist({ domain }).unwrap();
      Alert.alert('Allowed', `"${domain}" has been added to your allowlist.`);
    } catch (err: any) {
      if (err?.status === 403) {
        Alert.alert(
          'Permission Denied',
          'Your Pi-hole has "Allow destructive API calls" disabled. Enable it under Settings → API in the Pi-hole web interface.'
        );
      } else {
        Alert.alert('Error', `Failed to allowlist "${domain}".`);
      }
    } finally {
      setPendingDomain(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recently Blocked</Text>
      {entries.length === 0 ? (
        <Text style={styles.emptyText}>No domains blocked yet</Text>
      ) : (
        entries.map(({ domain, count }) => {
          const isLoading = pendingDomain === domain;
          return (
            <TouchableOpacity
              key={domain}
              style={styles.row}
              onPress={() => handleDomainPress(domain)}
              disabled={isLoading}
              activeOpacity={0.6}
            >
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{count}</Text>
              </View>
              <Text style={styles.domain} numberOfLines={1} ellipsizeMode="middle">
                {domain}
              </Text>
              {isLoading ? (
                <ActivityIndicator size="small" color="#4caf50" />
              ) : (
                <Text style={styles.allowHint}>Allow</Text>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  countBadge: {
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b5bdb',
  },
  domain: {
    fontSize: 13,
    color: '#e74c3c',
    fontFamily: 'monospace',
    flex: 1,
  },
  allowHint: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    paddingVertical: 20,
    fontStyle: 'italic',
    fontSize: 13,
  },
});

export default RecentlyBlockedDomains;
