import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f5f5f5',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#f5f5f5',
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Upload Video',
          tabBarLabel: 'Upload',
          headerTitle: 'Tennis Form Analyzer',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="cloud-upload" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Video Analysis',
          tabBarLabel: 'Analysis',
          headerTitle: 'Video Analysis',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="analytics" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
