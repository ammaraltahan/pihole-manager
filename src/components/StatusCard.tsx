import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PiHoleSummary, RecentBlocked } from '../types/pihole';

interface StatusCardProps {
  summary: PiHoleSummary | undefined;
  isConnected: boolean;
  isLoading?: boolean;
  recentBlocked?: RecentBlocked;
}

const StatusCard: React.FC<StatusCardProps> = ({ summary, isConnected, isLoading = false }) => {
  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Connecting to Pi-hole...</Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={styles.errorText}>Not connected to Pi-hole</Text>
        <Text style={styles.errorSubtext}>Check your settings and connection</Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.card}>
        <Text>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pi-hole Status</Text>
      
      {/* Main Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.queries.blocked.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Blocked Today</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.queries.total.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Queries</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.queries.percent_blocked.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Blocked</Text>
        </View>
      </View>

      {/* Secondary Stats */}
      <View style={styles.secondaryStats}>
        <View style={styles.row}>
          <View style={styles.detailStat}>
            <Text style={styles.detailLabel}>Cached</Text>
            <Text style={styles.detailValue}>{summary.queries.cached.toLocaleString()}</Text>
          </View>
          <View style={styles.detailStat}>
            <Text style={styles.detailLabel}>Forwarded</Text>
            <Text style={styles.detailValue}>{summary.queries.forwarded.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.detailStat}>
            <Text style={styles.detailLabel}>Domains Blocked</Text>
            <Text style={styles.detailValue}>{summary.gravity.domains_being_blocked.toLocaleString()}</Text>
          </View>
          <View style={styles.detailStat}>
            <Text style={styles.detailLabel}>Active Clients</Text>
            <Text style={styles.detailValue}>{summary.clients.active}/{summary.clients.total}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorCard: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '500',
  },
  errorSubtext: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  secondaryStats: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailStat: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

export default StatusCard;