import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="home" 
        options={{ 
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          title: 'Home'
        }} 
      />
      {/* <Tabs.Screen 
        name="friends" 
        options={{ 
          tabBarIcon: ({ color }) => <FontAwesome name="users" size={24} color={color} />,
          title: 'Friends'
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          tabBarIcon: ({ color }) => <FontAwesome name="cog" size={24} color={color} />,
          title: 'Settings'
        }} 
      /> */}
    </Tabs>
  );
}