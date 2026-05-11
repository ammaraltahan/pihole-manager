import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  useGetSummaryQuery,
  useGetBlockingStatusQuery,
  useEnableBlockingMutation,
  useDisableBlockingMutation,
  useGetRecentBlockedQuery,
} from '../store/api/piholeApi';
import BlockingHeader from '../components/BlockingHeader';
import RecentlyBlockedDomains from '../components/RecentlyBlockedDomains';

const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { piHoleConfig } = useAppSelector((state) => state.settings);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const skip = !piHoleConfig || !isAuthenticated;

  const {
    data: summary,
    error: summaryError,
    isLoading: isSummaryLoading,
    refetch,
  } = useGetSummaryQuery(undefined, { skip, pollingInterval: 30000 });

  const {
    data: blockingStatus,
    error: statusError,
    isLoading: isStatusLoading,
  } = useGetBlockingStatusQuery(undefined, { skip });

  const { data: recentBlocked } = useGetRecentBlockedQuery(undefined, {
    skip,
    pollingInterval: 10000,
  });

  const [enableBlocking, { isLoading: isEnabling }] = useEnableBlockingMutation();
  const [disableBlocking, { isLoading: isDisabling }] = useDisableBlockingMutation();

  const handleEnable = async () => {
    try {
      await enableBlocking().unwrap();
    } catch {
      Alert.alert('Error', 'Failed to enable blocking');
    }
  };

  const handleDisable = async (seconds: number) => {
    try {
      await disableBlocking({ duration: seconds || undefined }).unwrap();
    } catch (err: any) {
      if (err?.status === 403) {
        Alert.alert(
          'Permission Denied',
          'Your Pi-hole has "Allow destructive API calls" disabled. Enable it under Settings → API in the Pi-hole web interface.'
        );
      } else {
        Alert.alert('Error', 'Failed to disable blocking');
      }
    }
  };

  if (!piHoleConfig) {
    return (
      <View style={styles.centeredMessage}>
        <Text style={styles.messageText}>
          Configure your Pi-hole server in Settings to get started.
        </Text>
      </View>
    );
  }

  if ((!isAuthenticated && !isSummaryLoading)) {
    return (
      <View style={styles.centeredMessage}>
        <Text style={styles.messageText}>
          {!isAuthenticated
            ? 'Authentication required. Check your password in Settings.'
            : 'Cannot connect to Pi-hole. Check your configuration in Settings.'}
        </Text>
      </View>
    );
  }

  const isToggleLoading = isEnabling || isDisabling || isStatusLoading;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isSummaryLoading} onRefresh={refetch} colors={['#2196f3']} />
      }
    >
      <BlockingHeader
        isEnabled={blockingStatus?.blocking === 'enabled'}
        isLoading={isToggleLoading}
        onEnable={handleEnable}
        onDisable={handleDisable}
      />

      {summary && (
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary.queries.blocked.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Blocked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary.queries.total.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Queries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary.queries.percent_blocked.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Block Rate</Text>
            </View>
          </View>
          <View style={styles.statsFooter}>
            <Text style={styles.footerText}>
              {summary.gravity.domains_being_blocked.toLocaleString()} domains in blocklist
              {'  ·  '}
              {summary.clients.active} active client{summary.clients.active !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}

      <RecentlyBlockedDomains blockedData={recentBlocked} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  messageText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  statsFooter: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#aaa',
  },
});

export default DashboardScreen;
