// src/screens/HealthDashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart, PieChart, pieDataItem } from 'react-native-gifted-charts';
import { useGetSystemInfoQuery } from '../store/api/piholeApi';

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

  const { data: info, error, isLoading } = useGetSystemInfoQuery(undefined, {pollingInterval: 5000});

  const [system, setSystem] = useState<SystemInfo | null>(null);

  useEffect(() => {
    if(info)  {
      
      setSystem({
        uptime: info.system.uptime,
        cpuLoad: info.system.cpu.load.raw,
        cpuPercent: info.system.cpu['%cpu'],
        memoryUsed: info.system.memory.ram.used,
        memoryTotal: info.system.memory.ram.total,
        memoryFree: info.system.memory.ram.free,
        memoryAvailable: info.system.memory.ram.available,
        memoryUsedPercent: info.system.memory.ram['%used'],
        procs: info.system.procs,
        ftlCpu: info.system.ftl['%cpu'],
        ftlMem: info.system.ftl['%mem'],
      });
    }
  }, [info]);


  if (!system) return <Text>Loading...</Text>;

  const cpuData = system.cpuLoad.map((val, idx) => ({
    value: val * 100,
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