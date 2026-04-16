import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';

const COLORS = {
  primary: '#3B82F6', success: '#22C55E', background: '#F8FAFC',
  card: '#FFFFFF', border: '#E2E8F0', foreground: '#0F172A', muted: '#64748B',
};

const clientes = [
  { id: 1, nome: 'Confecção Brasil Ltda', cnpj: '12.345.678/0001-95', cidade: 'São Paulo/SP', pedidos: 48, status: 'ativo' },
  { id: 2, nome: 'Marca Ativa Indústria', cnpj: '98.765.432/0001-01', cidade: 'Rio de Janeiro/RJ', pedidos: 32, status: 'ativo' },
  { id: 3, nome: 'Magazine Têxtil S.A.', cnpj: '11.223.344/0001-55', cidade: 'Belo Horizonte/MG', pedidos: 65, status: 'ativo' },
  { id: 4, nome: 'Fashion Store Moda', cnpj: '55.667.788/0001-33', cidade: 'Curitiba/PR', pedidos: 12, status: 'inativo' },
  { id: 5, nome: 'Roupas & Cia', cnpj: '99.887.766/0001-77', cidade: 'Porto Alegre/RS', pedidos: 28, status: 'ativo' },
];

export default function ClientesScreen() {
  const [search, setSearch] = useState('');
  const filtered = clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Buscar cliente..." value={search} onChangeText={setSearch} placeholderTextColor={COLORS.muted} />
        </View>
        <ScrollView>
          {filtered.map((c) => (
            <TouchableOpacity key={c.id} style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{c.nome.slice(0, 2).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{c.nome}</Text>
                  <Text style={styles.cnpj}>{c.cnpj}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: c.status === 'ativo' ? '#DCFCE7' : '#F1F5F9' }]}>
                  <Text style={[styles.badgeText, { color: c.status === 'ativo' ? COLORS.success : COLORS.muted }]}>
                    {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>📍 {c.cidade}</Text>
                <Text style={styles.footerText}>📦 {c.pedidos} pedidos</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: COLORS.foreground },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  nome: { fontSize: 14, fontWeight: '600', color: COLORS.foreground },
  cnpj: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12, color: COLORS.muted },
});
