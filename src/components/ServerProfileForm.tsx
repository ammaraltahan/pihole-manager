import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { isValidUrl, isValidHostname, extractHost } from '../utils/probe';

export type ServerProfileFormProps = {
  initialUrl?: string;
  initialPassword?: string;
  onSubmit: (url: string, password: string) => void;
};

const ServerProfileForm: React.FC<ServerProfileFormProps> = ({ initialUrl = '', initialPassword = '', onSubmit }) => {
  const [url, setUrl] = useState(initialUrl);
  const [password, setPassword] = useState(initialPassword);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!isValidUrl(url)) {
      setError('Invalid URL. Must start with http:// or https://');
      return;
    }
    const host = extractHost(url);
    if (!host || !isValidHostname(host)) {
      setError('Invalid hostname or IP address.');
      return;
    }
    setError(null);
    onSubmit(url, password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label} accessibilityRole="text">Pi-hole Server URL</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="http://pi.hole"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Enter Pi-hole server URL"
      />
      <Text style={styles.label} accessibilityRole="text">Password (optional)</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password if set"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Enter Pi-hole password"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSubmit} accessibilityRole="button" accessibilityLabel="Save Server Profile">
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  error: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ServerProfileForm;
