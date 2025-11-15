// src/screens/HealthDashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart, PieChart, pieDataItem } from 'react-native-gifted-charts';
import { useGetSystemInfoQuery } from '../store/api/piholeApi';
import { useAppSelector } from '../store/hooks';

interface SystemInfo {
  uptime: number;
  cpuLoad: number[];   // 1m, 5m, 15m load averages
  cpuPercent: number;
  memoryUsed: number;
  memoryTotal: number;
  memoryFree: number;
  memoryUsedPercent: number;
  memoryAvailable: number;
  procs: number;
  ftlCpu: number;
  ftlMem: number;
}

export default function HealthDashboard() {
  const isAuthRequired = useAppSelector(state => state.settings.authRequired);

  const { system } = useGetSystemInfoQuery(undefined, {pollingInterval: 5000, skip: isAuthRequired === false, selectFromResult: (result) => {
    return{
      system: {
        uptime: result.data?.system.uptime ?? 0,
        cpuLoad: result.data?.system.cpu.load.percent ?? [0,0,0],
        cpuPercent: result.data?.system.cpu['%cpu'] ?? 0,
        memoryUsed: result.data?.system.memory.ram.used ?? 0,
        memoryTotal: result.data?.system.memory.ram.total ?? 0,
        memoryFree: result.data?.system.memory.ram.free ?? 0,
        memoryAvailable: result.data?.system.memory.ram.available ?? 0,
        memoryUsedPercent: result.data?.system.memory.ram['%used'] ?? 0,
        procs: result.data?.system.procs ?? 0,
        ftlCpu: result.data?.system.ftl['%cpu'] ?? 0,
        ftlMem: result.data?.system.ftl['%mem'] ?? 0,
      }
    }}
  });

  if (!system) return <Text>Loading...</Text>;

  const cpuData = system.cpuLoad.map((val, idx) => ({
    value: val,
    label: ['1m', '5m', '15m'][idx],
  }));

  const pieData: pieDataItem[] = [
    { value: system.memoryUsed, color: '#FF6B6B', text: 'Used', textColor: '#fff', textSize: 14, shiftTextX: -8 },
    { value: system.memoryAvailable, color: '#4CAF50', text: 'Free', textColor: '#fff', textSize: 14, shiftTextX: -8 }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pi-hole Health Dashboard</Text>

      {/* Other Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Uptime</Text>
        <Text>{Math.floor(system.uptime / 86400)} days</Text>
      </View>

      {/* CPU Load Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>CPU Load (avg)</Text>
        <View style={{width: '100%'}}>
          <LineChart
            data={cpuData}
            thickness={4}              // thicker line for readability
            height={220}               // taller chart
            curved
            hideDataPoints
            areaChart
            startFillColor="rgba(76,175,80,0.3)"
            endFillColor="rgba(76,175,80,0.05)"
            startOpacity={0.8}
            endOpacity={0.1}
            adjustToWidth={true}
            spacing={120}       // controls spacing between points
            endSpacing={10}    // trims extra space at the right edge
          />
        </View>
        <Text style={styles.meta}>Current CPU: {Math.round(system.cpuPercent)}%</Text>
      </View>

      {/* Memory Usage Pie */}
      <View style={[styles.card, { alignItems: 'center' }]}>
        <Text style={styles.cardTitle}>Memory Usage</Text>
        <PieChart
          data={pieData}
          donut
          radius={110}       // larger radius for visibility
          innerRadius={60}
          showText
          textSize={12}
        />
        <Text style={styles.meta}>{Math.round(system.memoryUsedPercent)}% used of {system.memoryTotal} MB</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Processes</Text>
        <Text>{system.procs}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>FTL Resource Usage</Text>
        <Text>CPU: {Math.round(system.ftlCpu)}% | Memory: {Math.round(system.ftlMem)}%</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,   // keep horizontal padding consistent
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  meta: { fontSize: 14, color: '#555', marginTop: 12, textAlign: 'center', paddingVertical: 8 },
});