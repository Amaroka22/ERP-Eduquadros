import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';

const COLORS = {
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  destructive: '#EF4444',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  foreground: '#0F172A',
  muted: '#64748B',
  primaryBg: '#EFF6FF',
};

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  color?: string;
  bgColor?: string;
}

function MetricCard({ title, value, change, changePositive, color = COLORS.primary, bgColor = COLORS.primaryBg }: MetricCardProps) {
  return (
    <View style={[styles.metricCard, { flex: 1 }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {change && (
        <Text style={[styles.metricChange, { color: changePositive ? COLORS.success : COLORS.destructive }]}>
          {changePositive ? '↑' : '↓'} {change}
        </Text>
      )}
    </View>
  );
}

const pedidos = [
  { id: 'PED-0041', cliente: 'Confecção Brasil', valor: 'R$ 3.200,00', status: 'Em Produção', statusColor: COLORS.primary },
  { id: 'PED-0040', cliente: 'Marca Ativa', valor: 'R$ 1.800,00', status: 'Aguardando', statusColor: COLORS.warning },
  { id: 'PED-0039', cliente: 'Magazine Têxtil', valor: 'R$ 5.600,00', status: 'Entregue', statusColor: COLORS.success },
];

const alertas = [
  { tipo: 'vencimento', msg: 'Tintas & Cores — R$ 4.800,00 vence hoje', cor: COLORS.warning },
  { tipo: 'atraso', msg: 'OP-0021 Fashion Store — Produção atrasada', cor: COLORS.destructive },
];

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Edu Quadros</Text>
            <Text style={styles.date}>quarta-feira, 15 de abril</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>EQ</Text>
          </View>
        </View>

        {/* Métricas */}
        <Text style={styles.sectionTitle}>Visão Geral</Text>
        <View style={styles.metricsRow}>
          <MetricCard title="Receita Mês" value="R$ 48.750" change="+12.5%" changePositive color={COLORS.success} />
          <MetricCard title="A Receber" value="R$ 23.400" change="-3.2%" changePositive={false} />
        </View>
        <View style={[styles.metricsRow, { marginTop: 8 }]}>
          <MetricCard title="A Pagar" value="R$ 11.200" color={COLORS.destructive} />
          <MetricCard title="Pedidos Abertos" value="14" change="+4%" changePositive color={COLORS.warning} />
        </View>

        {/* Alertas */}
        {alertas.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alertas</Text>
            {alertas.map((a, i) => (
              <View key={i} style={[styles.alertCard, { borderLeftColor: a.cor }]}>
                <Text style={[styles.alertDot, { color: a.cor }]}>●</Text>
                <Text style={styles.alertText}>{a.msg}</Text>
              </View>
            ))}
          </>
        )}

        {/* Pedidos recentes */}
        <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
        <View style={styles.card}>
          {pedidos.map((p, i) => (
            <View key={p.id} style={[styles.pedidoRow, i > 0 && styles.pedidoRowBorder]}>
              <View style={styles.pedidoInfo}>
                <Text style={styles.pedidoId}>{p.id}</Text>
                <Text style={styles.pedidoCliente}>{p.cliente}</Text>
              </View>
              <View style={styles.pedidoRight}>
                <Text style={styles.pedidoValor}>{p.valor}</Text>
                <View style={[styles.statusBadge, { backgroundColor: p.statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: p.statusColor }]}>{p.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Produção resumo */}
        <Text style={styles.sectionTitle}>Produção Hoje</Text>
        <View style={styles.card}>
          <View style={styles.producaoRow}>
            <View style={styles.producaoItem}>
              <Text style={[styles.producaoNum, { color: COLORS.primary }]}>1</Text>
              <Text style={styles.producaoLabel}>Em Produção</Text>
            </View>
            <View style={styles.producaoItem}>
              <Text style={[styles.producaoNum, { color: COLORS.warning }]}>1</Text>
              <Text style={styles.producaoLabel}>Em Gravação</Text>
            </View>
            <View style={styles.producaoItem}>
              <Text style={[styles.producaoNum, { color: COLORS.success }]}>2</Text>
              <Text style={styles.producaoLabel}>Concluídas</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '700', color: COLORS.foreground },
  date: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.foreground, marginTop: 20, marginBottom: 10 },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  metricTitle: { fontSize: 11, color: COLORS.muted, fontWeight: '500' },
  metricValue: { fontSize: 20, fontWeight: '700', marginTop: 4, color: COLORS.foreground },
  metricChange: { fontSize: 11, marginTop: 3, fontWeight: '500' },
  card: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  alertCard: { backgroundColor: COLORS.card, borderRadius: 10, padding: 12, marginBottom: 6, borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertDot: { fontSize: 10 },
  alertText: { flex: 1, fontSize: 12, color: COLORS.foreground },
  pedidoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  pedidoRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  pedidoInfo: { flex: 1 },
  pedidoId: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  pedidoCliente: { fontSize: 13, color: COLORS.foreground, marginTop: 2 },
  pedidoRight: { alignItems: 'flex-end', gap: 4 },
  pedidoValor: { fontSize: 13, fontWeight: '600', color: COLORS.foreground },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600' },
  producaoRow: { flexDirection: 'row', padding: 16 },
  producaoItem: { flex: 1, alignItems: 'center' },
  producaoNum: { fontSize: 28, fontWeight: '700' },
  producaoLabel: { fontSize: 11, color: COLORS.muted, marginTop: 4, textAlign: 'center' },
});
