import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
  useGetBlockingStatusQuery,
  useEnableBlockingMutation,
  useDisableBlockingMutation,
  useFlushLogsMutation,
  useRestartDNSMutation
} from '../store/api/piholeApi';

const QuickActionsWithError: React.FC<{ isConnected: boolean }> = ({ isConnected }) => {
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  const { data: blockingStatus, isLoading: isBlockingLoading } = useGetBlockingStatusQuery(undefined, { skip: !isConnected });
  const [enableBlocking] = useEnableBlockingMutation();
  const [disableBlocking] = useDisableBlockingMutation();
  const [flushLogs] = useFlushLogsMutation();
  const [restartDNS] = useRestartDNSMutation();

  const handleToggleBlocking = async () => {
    try {
      if (blockingStatus?.blocking === 'enabled') {
        await disableBlocking({}).unwrap();
      } else {
        await enableBlocking().unwrap();
      }
      setActionError(null);
    } catch (err: any) {
      setActionError('Failed to toggle blocking.');
      setRetryAction(() => handleToggleBlocking);
    }
  };

  const handleFlushLogs = async () => {
    try {
      await flushLogs().unwrap();
      setActionError(null);
    } catch (err: any) {
      setActionError('Failed to flush logs.');
      setRetryAction(() => handleFlushLogs);
    }
  };

  const handleRestartDNS = async () => {
    try {
      await restartDNS().unwrap();
      setActionError(null);
    } catch (err: any) {
      setActionError('Failed to restart DNS.');
      setRetryAction(() => handleRestartDNS);
    }
  };

  return (
    <View>
      {actionError && (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{actionError}</Text>
          {retryAction && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryAction}
              accessibilityRole="button"
              accessibilityLabel="Retry Action"
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.quickActionsWrapper}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleBlocking}
          disabled={!isConnected || isBlockingLoading}
          accessibilityRole="button"
          accessibilityLabel="Toggle Blocking"
        >
          <Text style={styles.buttonText}>
            {blockingStatus?.blocking === 'enabled' ? 'Disable Blocking' : 'Enable Blocking'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleFlushLogs}
          disabled={!isConnected}
          accessibilityRole="button"
          accessibilityLabel="Flush Logs"
        >
          <Text style={styles.buttonText}>Flush Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRestartDNS}
          disabled={!isConnected}
          accessibilityRole="button"
          accessibilityLabel="Restart DNS"
        >
          <Text style={styles.buttonText}>Restart DNS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: '#fdecea',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 15,
    marginBottom: 4,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#d32f2f',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  quickActionsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
});

export default QuickActionsWithError;
