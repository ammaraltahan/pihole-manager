import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  useGetSummaryQuery, 
  useGetBlockingStatusQuery, 
  useEnableBlockingMutation, 
  useDisableBlockingMutation,
  useGetRecentBlockedQuery 
} from '../store/api/piholeApi';
import { setConnectionStatus, setAuthenticationStatus } from '../store/slices/settingsSlice';
import StatusCard from '../components/StatusCard';
import ToggleButton from '../components/ToggleButton';
import RecentlyBlockedDomains from '../components/RecentlyBlockedDomains';

const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { piHoleConfig, isConnected } = useAppSelector((state) => state.settings);
  const { isAuthenticated, sid } = useAppSelector((state) => state.auth);

  // RTK Query hooks - these will use the baseUrl from the store
  const {
    data: summary,
    error: summaryError,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetSummaryQuery(undefined, {
    skip: !piHoleConfig || !isConnected || !isAuthenticated,
    pollingInterval: 30000,
  });

  const {
    data: blockingStatus,
    error: statusError,
    isLoading: isStatusLoading,
  } = useGetBlockingStatusQuery(undefined, {
    skip: !piHoleConfig || !isConnected || !isAuthenticated,
  });

  const {
    data: recentBlocked,
  } = useGetRecentBlockedQuery(undefined, {
    skip: !piHoleConfig || !isConnected || !isAuthenticated,
    pollingInterval: 10000, // Refresh recent blocked more frequently
  });

  const [enableBlocking, { isLoading: isEnabling }] = useEnableBlockingMutation();
  const [disableBlocking, { isLoading: isDisabling }] = useDisableBlockingMutation();

  // Handle connection and authentication status
  useEffect(() => {
    if (summaryError || statusError) {
      const error: any = summaryError || statusError;
      if (error.status === 401) {
        dispatch(setAuthenticationStatus(false));
      } else {
        dispatch(setConnectionStatus(false));
      }
    } else if (summary) {
      dispatch(setConnectionStatus(true));
      dispatch(setAuthenticationStatus(true));
    }
  }, [summary, summaryError, statusError, dispatch]);

  const handleToggle = async (enable: boolean) => {
    if (!piHoleConfig) return;

    try {
      if (enable) {
        await enableBlocking().unwrap();
        Alert.alert('Success', 'Pi-hole blocking has been enabled');
      } else {
        await disableBlocking({ duration: 300 }).unwrap(); // Disable for 5 minutes
        Alert.alert('Success', 'Pi-hole blocking has been disabled for 5 minutes');
      }
      
      // Refetch data after a short delay
      setTimeout(() => {
        if (piHoleConfig && isConnected && isAuthenticated) {
          refetchSummary();
        }
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle blocking status');
      console.error('Toggle error:', error);
    }
  };

  const onRefresh = () => {
    if (piHoleConfig && isConnected && isAuthenticated) {
      refetchSummary();
    }
  };

  const isLoading = isSummaryLoading || isStatusLoading;
  const isToggleLoading = isEnabling || isDisabling;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          colors={['#2196f3']}
        />
      }
    >
      <StatusCard 
        summary={summary || undefined} 
        isConnected={isConnected && isAuthenticated}
        isLoading={isLoading}
        recentBlocked={recentBlocked}
      />
      
      {isConnected && isAuthenticated && !summaryError && (
        <>
          <RecentlyBlockedDomains blockedData={recentBlocked} />

          <ToggleButton
            isEnabled={blockingStatus?.blocking === 'enabled'}
            onToggle={handleToggle}
            isLoading={isToggleLoading}
          />
        </>
      )}

      {!isAuthenticated && isConnected && (
        <View style={styles.authWarning}>
          <Text style={styles.warningText}>
            Authentication required. Please check your password in Settings.
          </Text>
        </View>
      )}

      {(!isConnected || summaryError) && (
        <View style={styles.connectionWarning}>
          <Text style={styles.warningText}>
            {!piHoleConfig 
              ? 'Please configure your Pi-hole server in Settings'
              : 'Failed to connect to Pi-hole. Check your configuration.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  connectionWarning: {
    backgroundColor: '#fff3cd',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  authWarning: {
    backgroundColor: '#ffeaa7',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#fdcb6e',
  },
  warningText: {
    color: '#856404',
    textAlign: 'center',
  },
  recentBlocked: {
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
  recentBlockedTitle: {
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

export default DashboardScreen;