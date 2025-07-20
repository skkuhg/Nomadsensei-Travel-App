import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const SimpleTest = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🌍 NomadSensei</Text>
        <Text style={styles.subtitle}>Smart Travel Guide & Agent</Text>
        <Text style={styles.description}>
          Your AI-powered travel companion is loading...
        </Text>
        <Text style={styles.status}>✅ App Connected Successfully!</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  status: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '600',
  },
});

export default SimpleTest;