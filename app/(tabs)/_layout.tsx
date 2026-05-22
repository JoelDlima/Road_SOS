import { Tabs } from 'expo-router';
import { Home, MapPin, MessageCircle, Settings } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../constants/theme';

const TAB_HEIGHT = 66;

type TabIconProps = {
  Icon: typeof Home;
  color: string;
  focused: boolean;
};

function TabIcon({ Icon, color, focused }: TabIconProps) {
  return (
    <View style={{ width: 46, height: 34, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.6 : 2} />
      {focused ? (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            width: 18,
            height: 3,
            borderRadius: 2,
            backgroundColor: Colors.sosRed,
          }}
        />
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textFaint,
        tabBarStyle: {
          position: 'absolute',
          left: Spacing.lg,
          right: Spacing.lg,
          bottom: insets.bottom + 10,
          height: TAB_HEIGHT,
          borderRadius: Radius.xxl,
          backgroundColor: 'rgba(13, 17, 23, 0.96)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: Colors.borderStrong,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.32,
          shadowRadius: 18,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: '700',
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarAccessibilityLabel: 'Emergency services tab',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={MapPin} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarAccessibilityLabel: 'AI assistant chat tab',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={MessageCircle} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings tab',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Settings} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
