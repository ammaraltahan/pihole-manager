import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';

interface RecentlyBlockedDomainsProps {
  blockedData?: {
    blocked: string[];
    took: number;
  };
  onRefresh?: () => void;
  isLoading?: boolean;
}

const RecentlyBlockedDomains: React.FC<RecentlyBlockedDomainsProps> = ({ blockedData, onRefresh, isLoading }) => {
  const domains = blockedData?.blocked ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recently Blocked</Text>
      <FlatList
        data={domains}
        keyExtractor={(item, index) => `${item}-${index}`}
        ListEmptyComponent={<Text style={styles.emptyText}>No domains blocked yet</Text>}
        refreshControl={
          <RefreshControl
            refreshing={isLoading ?? false}
            onRefresh={onRefresh}
            colors={['#2196f3']}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.blockedItem}>
            <Text style={styles.blockedDomain} numberOfLines={1} ellipsizeMode="middle">
              {item}
            </Text>
          </View>
        )}
      />
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
    minHeight: 200,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  blockedItem: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  blockedDomain: {
    fontSize: 13,
    color: '#e74c3c',
    fontFamily: 'monospace',
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
