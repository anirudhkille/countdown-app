import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radius, spacing, typography } from './tokens';
import { useTheme } from './ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function FieldShell({
  label,
  icon,
  onPress,
  children,
  style,
}: {
  label: string;
  icon: IconName;
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const body = (
    <View style={[styles.field, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }, style]}>
      {children}
    </View>
  );

  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={22} color={theme.text} />
      </View>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          style={styles.fieldWrapper}
        >
          {body}
        </Pressable>
      ) : (
        <View style={styles.fieldWrapper}>{body}</View>
      )}
    </View>
  );
}

/** A labelled field with a chevron, matching the reference's dropdown rows. */
export function FieldRow({
  label,
  icon,
  value,
  onPress,
  placeholder,
  style,
}: {
  label: string;
  icon: IconName;
  value: string;
  onPress?: () => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <FieldShell label={label} icon={icon} onPress={onPress} style={style}>
      <View style={styles.fieldInner}>
        <View style={styles.fieldText}>
          <Text style={[typography.caption, { color: theme.textMuted }]}>{label}</Text>
          <Text
            numberOfLines={1}
            style={[typography.body, !value ? { color: theme.textMuted } : null]}
          >
            {value || placeholder || '—'}
          </Text>
        </View>
        {onPress ? <Ionicons name="chevron-down" size={18} color={theme.textMuted} /> : null}
      </View>
    </FieldShell>
  );
}

/** A free-text field with a leading icon, matching the reference's input rows. */
export function TextField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  icon: IconName;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, multiline ? styles.alignTop : null]}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={22} color={theme.text} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={theme.textMuted}
        accessibilityLabel={label}
        multiline={multiline}
        style={[
          typography.body,
          styles.input,
          { color: theme.text, backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          multiline ? styles.inputMultiline : null,
        ]}
      />
    </View>
  );
}

/** A labelled toggle row. */export function ToggleRow({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: IconName;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <FieldShell label={label} icon={icon} onPress={() => onChange(!value)}>
      <View style={styles.fieldInner}>
        <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{label}</Text>
        <View
          accessibilityRole="switch"
          accessibilityState={{ checked: value }}
          accessibilityLabel={label}
          style={[
            styles.track,
            { backgroundColor: value ? theme.accent : theme.border },
          ]}
        >
          <View
            style={[
              styles.thumb,
              { backgroundColor: theme.text, alignSelf: value ? 'flex-end' : 'flex-start' },
            ]}
          />
        </View>
      </View>
    </FieldShell>
  );
}

/** A label sitting on the top border of a field, as in the reference. */
export function BorderedLabel({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.borderedLabel}>
      <Text style={[typography.caption, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 28, alignItems: 'center' },
  fieldWrapper: { flex: 1 },
  field: { borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth },
  fieldInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldText: { flex: 1, gap: 2 },
  alignTop: { alignItems: 'flex-start' },
  input: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputMultiline: { minHeight: 88, paddingTop: spacing.md, textAlignVertical: 'top' },
  track: { width: 48, height: 28, borderRadius: radius.pill, padding: 3, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: radius.pill },
  borderedLabel: { position: 'absolute', top: -8, left: spacing.md, backgroundColor: 'transparent', paddingHorizontal: 4 },
});
