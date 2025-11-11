import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SmallBarChartProps {
  labels: string[];
  values: number[];
  color?: string;
  maxWidth?: number; // not used directly, left for API compatibility
  maxBars?: number;
}

const SmallBarChart: React.FC<SmallBarChartProps> = ({ labels, values, color = '#2196f3', maxBars = 8 }) => {
  const trimmedLabels = labels.slice(0, maxBars);
  const trimmedValues = values.slice(0, maxBars);
  const max = Math.max(...trimmedValues, 1);

  return (
    <View style={styles.container}>
      {trimmedValues.map((v, i) => (
        <View key={`${trimmedLabels[i]}-${i}`} style={styles.row}>
          <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">{trimmedLabels[i]}</Text>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${(v / max) * 100}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.value}>{v.toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 100,
    fontSize: 12,
    color: '#333',
    marginRight: 8,
  },
  barBackground: {
    flex: 1,
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
  },
  barFill: {
    height: 12,
    borderRadius: 6,
  },
  value: {
    width: 70,
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
  },
});

export default SmallBarChart;
