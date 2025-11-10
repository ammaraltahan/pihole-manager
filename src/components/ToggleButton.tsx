import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ToggleButtonProps {
  isEnabled: boolean;
  onToggle: (enable: boolean) => void;
  isLoading?: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ 
  isEnabled, 
  onToggle, 
  isLoading = false 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isEnabled ? styles.enabledButton : styles.disabledButton
      ]}
      onPress={() => onToggle(!isEnabled)}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.buttonText}>
          {isEnabled ? 'DISABLE' : 'ENABLE'} PI-HOLE
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    minHeight: 50,
  },
  enabledButton: {
    backgroundColor: '#4caf50',
  },
  disabledButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ToggleButton;