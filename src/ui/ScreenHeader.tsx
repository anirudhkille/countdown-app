import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { control, radius, typography } from './tokens';
import { useTheme } from './ThemeProvider';

export function ScreenHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        <View style={styles.titleWrap}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[typography.display, styles.title, { color: theme.text }]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[typography.label, { color: theme.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </View>
  );
}

export function HeaderIconButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: control.gutter, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  titleWrap: { flex: 1, gap: 2 },
  title: { fontFamily: 'SpaceGrotesk_700Bold' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
