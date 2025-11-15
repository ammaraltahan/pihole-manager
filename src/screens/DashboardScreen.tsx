import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  useGetSummaryQuery, 
  useGetBlockingStatusQuery, 
  useEnableBlockingMutation, 
  useDisableBlockingMutation,
  useGetRecentBlockedQuery, 
  useCheckAuthRequiredQuery
} from '../store/api/piholeApi';

import StatusCard from '../components/StatusCard';
import ToggleButton from '../components/ToggleButton';
import RecentlyBlockedDomains from '../components/RecentlyBlockedDomains';
import { setAuthRequired } from '../store/slices/settingsSlice';

const DashboardScreen: React.FC = () => {
  const { piHoleConfig } = useAppSelector((state) => state.settings);
  const dispatch = useAppDispatch();

  const {isAuthenticated, data: authStatus, error: authError} = useCheckAuthRequiredQuery(undefined, { selectFromResult: (result) => ({
    isAuthenticated: result.data?.session?.valid === true,
    ...result
  })});

  // RTK Query hooks - these will use the baseUrl from the store
  const {
    data: summary,
    error: summaryError,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetSummaryQuery(undefined, {
    skip: !piHoleConfig || !isAuthenticated,
    pollingInterval: 30000,
  });

  const {
    data: blockingStatus,
    error: statusError,
    isLoading: isStatusLoading,
  } = useGetBlockingStatusQuery(undefined, {
    skip: !piHoleConfig || !isAuthenticated,
  });

  const {
    data: recentBlocked,
  } = useGetRecentBlockedQuery(undefined, {
    skip: !piHoleConfig || !isAuthenticated,
    pollingInterval: 10000, // Refresh recent blocked more frequently
  });

  const [enableBlocking, { isLoading: isEnabling }] = useEnableBlockingMutation();
  const [disableBlocking, { isLoading: isDisabling }] = useDisableBlockingMutation();

  useEffect(() => {
    if (authError || (authStatus && !authStatus.session?.valid)) {
      console.warn('Authentication check error:', authError);
      dispatch(setAuthRequired(true));
    }
  }, [authError]);

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
        if (piHoleConfig && isAuthenticated) {
          refetchSummary();
        }
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle blocking status');
      console.error('Toggle error:', error);
    }
  };

  const onRefresh = () => {
    if (piHoleConfig && isAuthenticated) {
      refetchSummary();
    }
  };

  const isLoading = isSummaryLoading || isStatusLoading;
  const isToggleLoading = isEnabling || isDisabling;
  
  return (
    <View style={styles.container}>
      <StatusCard 
        summary={summary || undefined} 
        isConnected={isAuthenticated}
        isLoading={isLoading}
        recentBlocked={recentBlocked}
      />
      
      {isAuthenticated && !summaryError && (
        <>
          <RecentlyBlockedDomains blockedData={recentBlocked} onRefresh={onRefresh} isLoading={isSummaryLoading} />
          
          <ToggleButton
            isEnabled={blockingStatus?.blocking === 'enabled'}
            onToggle={handleToggle}
            isLoading={isToggleLoading}
          />
        </>
      )}

      {!isAuthenticated && (
        <View style={styles.authWarning}>
          <Text style={styles.warningText}>
            Authentication required. Please check your password in Settings.
          </Text>
        </View>
      )}

      {(!summaryError) && (
        <View style={styles.connectionWarning}>
          <Text style={styles.warningText}>
            {!piHoleConfig 
              ? 'Please configure your Pi-hole server in Settings'
              : 'Failed to connect to Pi-hole. Check your configuration.'}
          </Text>
        </View>
      )}
    </View>
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