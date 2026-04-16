import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

const COLORS = {
  primary: '#3B82F6', success: '#22C55E', warning: '#F59E0B',
  destructive: '#EF4444', background: '#F8FAFC', card: '#FFFFFF',
  border: '#E2E8F0', foreground: '#0F172A', muted: '#64748B',
};

const contasReceber = [
  { id: 1, desc: 'PED-0041 - Confecção Brasil', valor: 'R$ 3.200,00', venc: '20/04/2026', status: 'pendente' },
  { id: 2, desc: 'PED-0039 - Magazine Têxtil', valor: 'R$ 5.600,00', venc: '16/04/2026', status: 'pendente' },
  { id: 3, desc: 'PED-0038 - Fashion Store', valor: 'R$ 920,00', venc: '10/04/2026', status: 'vencido' },
];

const contasPagar = [
  { id: 1, desc: 'Tintas & Cores - Lote 04', valor: 'R$ 4.800,00', venc: '15/04/2026', status: 'vencido' },
  { id: 2, desc: 'Aluguel galpão - Abril', valor: 'R$ 3.500,00', venc: '20/04/2026', status: 'pendente' },
];

type Aba = 'receber' | 'pagar';

export default function FinanceiroScreen() {
  const [aba, setAba] = useState<Aba>('receber');
  const lista = aba === 'receber' ? contasReceber : contasPagar;

  const getStatusStyle = (status: string) => {
    if (status === 'vencido') return { bg: '#FEE2E2', text: COLORS.destructive, label: 'Vencido' };
    if (status === 'pendente') return { bg: '#FEF3C7', text: COLORS.warning, label: 'Pendente' };
    return { bg: '#DCFCE7', text: COLORS.success, label: 'Pago' };
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Totalizadores */}
      <View style={styles.totais}>
        <View style={[styles.totalCard, { borderColor: '#22C55E40', backgroundColor: '#F0FDF4' }]}>
          <Text style={styles.totalLabel}>A Receber</Text>
          <Text style={[styles.totalValue, { color: COLORS.success }]}>R$ 23.400</Text>
        </View>
        <View style={[styles.totalCard, { borderColor: '#EF444440', backgroundColor: '#FEF2F2' }]}>
          <Text style={styles.totalLabel}>A Pagar</Text>
          <Text style={[styles.totalValue, { color: COLORS.destructive }]}>R$ 11.200</Text>
        </View>
      </View>

      {/* Abas */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, aba === 'receber' && styles.tabActive]} onPress={() => setAba('receber')}>
          <Text style={[styles.tabText, aba === 'receber' && styles.tabTextActive]}>A Receber</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, aba === 'pagar' && styles.tabActive]} onPress={() => setAba('pagar')}>
          <Text style={[styles.tabText, aba === 'pagar' && styles.tabTextActive]}>A Pagar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {lista.map((item) => {
          const s = getStatusStyle(item.status);
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardDesc}>{item.desc}</Text>
                  <Text style={styles.cardVenc}>Vence: {item.venc}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.cardValor}>{item.valor}</Text>
                  <View style={[styles.badge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
                  </View>
                </View>
              </View>
              {item.status !== 'pago' && (
                <TouchableOpacity style={[styles.btn, { backgroundColor: aba === 'receber' ? COLORS.success : COLORS.primary }]}>
                  <Text style={styles.btnText}>{aba === 'receber' ? 'Dar Baixa' : 'Pagar'}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  totais: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  totalCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14 },
  totalLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '500' },
  totalValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 3, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: COLORS.card, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, color: COLORS.muted, fontWeight: '500' },
  tabTextActive: { color: COLORS.foreground, fontWeight: '600' },
  list: { paddingHorizontal: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  cardRow: { flexDirection: 'row', gap: 8 },
  cardDesc: { fontSize: 13, fontWeight: '600', color: COLORS.foreground },
  cardVenc: { fontSize: 11, color: COLORS.muted, marginTop: 3 },
  cardValor: { fontSize: 14, fontWeight: '700', color: COLORS.foreground },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  btn: { marginTop: 10, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
