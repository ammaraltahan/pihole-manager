import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';

interface BlockedDomain {
  domain: string;
  timestamp: number;
}

interface RecentlyBlockedDomainsProps {
  blockedData?: {
    blocked: string[];
    took: number;
  };
}

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) {
    return 'just now';
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const RecentlyBlockedDomains: React.FC<RecentlyBlockedDomainsProps> = ({ blockedData }) => {
  const [blockedDomains, setBlockedDomains] = useState<BlockedDomain[]>([]);
  useEffect(() => {
    if (blockedData?.blocked && blockedData.blocked.length > 0) {
      const timestamp = Date.now();
      const newDomains = blockedData.blocked.map(domain => ({
        domain,
        timestamp
      }));
      
      setBlockedDomains(prev => {
        // Combine new domains with existing ones
        const combined = [...newDomains, ...prev];
        // Remove duplicates and sort by timestamp (newest first)
        const unique = Array.from(new Map(
          combined.map(item => [item.domain, item])
        ).values());
        // Sort by timestamp (newest first)
        const sorted = unique.sort((a, b) => b.timestamp - a.timestamp);
        // Keep only the last 100 items to prevent too much memory usage
        return sorted.slice(0, 100);
      });
    }
  }, [blockedData]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recently Blocked Domains</Text>
      <FlatList 
        data={blockedDomains}
        keyExtractor={(item) => `${item.domain}-${item.timestamp}`} 
        ListEmptyComponent={<Text style={styles.emptyText}>No domains blocked yet</Text>}
        renderItem={({ item }) => (
             <View key={`${item.domain}-${item.timestamp}`} style={styles.blockedItem}>
            <Text style={styles.blockedDomain} numberOfLines={1} ellipsizeMode="middle">
              {item.domain}
            </Text>
            <View style={styles.blockedTimeBadge}>
              <Text style={styles.blockedTimeText}>
                {formatTimeAgo(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
      />
      {/* <ScrollView style={styles.blockedList} nestedScrollEnabled>

        {blockedDomains.map((item) => (
          <View key={`${item.domain}-${item.timestamp}`} style={styles.blockedItem}>
            <Text style={styles.blockedDomain} numberOfLines={1} ellipsizeMode="middle">
              {item.domain}
            </Text>
            <View style={styles.blockedTimeBadge}>
              <Text style={styles.blockedTimeText}>
                {formatTimeAgo(item.timestamp)}
              </Text>
            </View>
          </View>
        ))}
        {blockedDomains.length === 0 && (
          <Text style={styles.emptyText}>No domains blocked yet</Text>
        )}
      </ScrollView> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    minHeight: 200,
    maxHeight: 400,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  blockedList: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flex: 1,
  },
  blockedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  blockedDomain: {
    fontSize: 14,
    color: '#e74c3c',
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 8,
  },
  blockedTimeBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  blockedTimeText: {
    fontSize: 12,
    color: '#6c757d',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});

export default RecentlyBlockedDomains;