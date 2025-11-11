import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  maxPoints?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ values = [], color = '#2196f3', height = 40, maxPoints = 30 }) => {
  const pts = values.slice(-maxPoints);
  const max = Math.max(...pts, 1);

  return (
    <View style={[styles.row, { height }] }>
      {pts.length === 0 ? (
        <View style={styles.empty} />
      ) : (
        pts.map((v, i) => {
          const widthPercent = `${Math.max(2, Math.floor(100 / maxPoints))}%`;
          const heightPercent = `${(v / max) * 100}%`;
          const barStyle: any = {
            width: widthPercent,
            height: heightPercent,
            backgroundColor: color,
            marginRight: 4,
            alignSelf: 'flex-end',
            borderRadius: 2,
          };

          return <View key={`s-${i}`} style={barStyle} />;
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  empty: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
});

export default Sparkline;
