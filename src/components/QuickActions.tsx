import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import {
  useEnableBlockingMutation,
  useDisableBlockingMutation,
  useFlushLogsMutation,
  useRestartDNSMutation,
  useGetBlockingStatusQuery
} from '../store/api/piholeApi';

export type QuickActionsProps = {
  isConnected: boolean;
};

const QuickActions: React.FC<QuickActionsProps> = ({ isConnected }) => {
  const { data: blockingStatus, isLoading: isBlockingLoading } = useGetBlockingStatusQuery(undefined, { skip: !isConnected });
  const [enableBlocking, { isLoading: isEnabling }] = useEnableBlockingMutation();
  const [disableBlocking, { isLoading: isDisabling }] = useDisableBlockingMutation();
  const [flushLogs, { isLoading: isFlushing }] = useFlushLogsMutation();
  const [restartDNS, { isLoading: isRestarting }] = useRestartDNSMutation();

  const handleToggleBlocking = async () => {
    if (blockingStatus?.blocking === 'enabled') {
      await disableBlocking({}).unwrap();
    } else {
      await enableBlocking().unwrap();
    }
  };

  const handleFlushLogs = async () => {
    await flushLogs().unwrap();
  };

  const handleRestartDNS = async () => {
    await restartDNS().unwrap();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, isBlockingLoading && styles.disabledButton]}
          onPress={handleToggleBlocking}
          disabled={!isConnected || isBlockingLoading || isEnabling || isDisabling}
          accessibilityRole="button"
          accessibilityLabel="Toggle Blocking"
        >
          {(isEnabling || isDisabling || isBlockingLoading) ? (
            <ActivityIndicator color="#2196f3" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {blockingStatus?.blocking === 'enabled' ? 'Disable Blocking' : 'Enable Blocking'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, isFlushing && styles.disabledButton]}
          onPress={handleFlushLogs}
          disabled={!isConnected || isFlushing}
          accessibilityRole="button"
          accessibilityLabel="Flush Logs"
        >
          {isFlushing ? (
            <ActivityIndicator color="#2196f3" size="small" />
          ) : (
            <Text style={styles.buttonText}>Flush Logs</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, isRestarting && styles.disabledButton]}
          onPress={handleRestartDNS}
          disabled={!isConnected || isRestarting}
          accessibilityRole="button"
          accessibilityLabel="Restart DNS"
        >
          {isRestarting ? (
            <ActivityIndicator color="#2196f3" size="small" />
          ) : (
            <Text style={styles.buttonText}>Restart DNS</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default QuickActions;
