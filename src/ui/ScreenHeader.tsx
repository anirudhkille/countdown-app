import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { control, typography } from './tokens';
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

const styles = StyleSheet.create({
  container: { paddingHorizontal: control.gutter, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  titleWrap: { flex: 1, gap: 2 },
  title: { fontFamily: 'SpaceGrotesk_700Bold' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
});
