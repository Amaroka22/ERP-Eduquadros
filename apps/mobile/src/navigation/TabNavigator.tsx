import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import ClientesScreen from '../screens/ClientesScreen';
import FinanceiroScreen from '../screens/FinanceiroScreen';

const COLORS = { primary: '#3B82F6', muted: '#64748B', border: '#E2E8F0', card: '#FFFFFF' };

type TabKey = 'dashboard' | 'clientes' | 'financeiro';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { key: 'clientes', label: 'Clientes', icon: '👥' },
  { key: 'financeiro', label: 'Financeiro', icon: '💳' },
];

export default function TabNavigator() {
  const [activeTab, setActiveTab] = React.useState<TabKey>('dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'clientes': return <ClientesScreen />;
      case 'financeiro': return <FinanceiroScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Screen content */}
      <View style={styles.screen}>{renderScreen()}</View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4, position: 'relative' },
  tabIcon: { fontSize: 18, marginBottom: 2, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '500' },
  tabLabelActive: { color: COLORS.primary, fontWeight: '600' },
  tabIndicator: { position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, backgroundColor: COLORS.primary, borderRadius: 1 },
});
