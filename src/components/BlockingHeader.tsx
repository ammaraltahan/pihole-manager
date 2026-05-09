import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

const TIMER_OPTIONS = [
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: 'Indefinite', seconds: 0 },
];

interface Props {
  isEnabled: boolean;
  isLoading: boolean;
  onEnable: () => void;
  onDisable: (seconds: number) => void;
}

const BlockingHeader: React.FC<Props> = ({ isEnabled, isLoading, onEnable, onDisable }) => {
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  const handleTimerSelect = (seconds: number) => {
    setShowTimerPicker(false);
    onDisable(seconds);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.pill, isEnabled ? styles.pillOn : styles.pillOff]}>
        <View style={[styles.dot, isEnabled ? styles.dotOn : styles.dotOff]} />
        <Text style={[styles.pillText, isEnabled ? styles.pillTextOn : styles.pillTextOff]}>
          {isEnabled ? 'Blocking On' : 'Blocking Off'}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2196f3" style={styles.loader} />
      ) : isEnabled ? (
        showTimerPicker ? (
          <View style={styles.timerPicker}>
            <Text style={styles.timerLabel}>Disable for:</Text>
            <View style={styles.timerRow}>
              {TIMER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={styles.timerChip}
                  onPress={() => handleTimerSelect(opt.seconds)}
                >
                  <Text style={styles.timerChipText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowTimerPicker(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.btnDisable]}
            onPress={() => setShowTimerPicker(true)}
          >
            <Text style={styles.btnText}>Disable Pi-hole</Text>
          </TouchableOpacity>
        )
      ) : (
        <TouchableOpacity style={[styles.btn, styles.btnEnable]} onPress={onEnable}>
          <Text style={styles.btnText}>Enable Pi-hole</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 12,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  pillOn: { backgroundColor: '#e8f5e9' },
  pillOff: { backgroundColor: '#ffebee' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotOn: { backgroundColor: '#4caf50' },
  dotOff: { backgroundColor: '#f44336' },
  pillText: { fontSize: 15, fontWeight: '600' },
  pillTextOn: { color: '#2e7d32' },
  pillTextOff: { color: '#c62828' },
  loader: { marginTop: 8 },
  btn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnEnable: { backgroundColor: '#4caf50' },
  btnDisable: { backgroundColor: '#f44336' },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  timerPicker: { width: '100%', alignItems: 'center' },
  timerLabel: { fontSize: 14, color: '#555', marginBottom: 12 },
  timerRow: { flexDirection: 'row', gap: 8, marginBottom: 16, width: '100%' },
  timerChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f44336',
    alignItems: 'center',
  },
  timerChipText: { color: 'white', fontWeight: '600', fontSize: 12 },
  cancel: { color: '#999', fontSize: 14 },
});

export default BlockingHeader;
