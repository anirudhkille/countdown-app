import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { control, radius, spacing, typography } from './tokens';
import { useTheme } from './ThemeProvider';

export function FormGroup({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const items = React.Children.toArray(children);
  return (
    <View style={styles.groupWrap}>
      {title ? (
        <Text style={[typography.micro, styles.groupTitle, { color: theme.textMuted }]}>
          {title}
        </Text>
      ) : null}
      <View
        style={[
          styles.group,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < items.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export function FormRow({
  label,
  value,
  onPress,
  onRemove,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  onRemove?: () => void;
}) {
  const theme = useTheme();
  const content = (
    <View style={styles.rowInner}>
      <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{label}</Text>
      {value ? (
        <Text numberOfLines={1} style={[typography.label, styles.value, { color: theme.textMuted }]}>
          {value}
        </Text>
      ) : null}
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          hitSlop={8}
          onPress={onRemove}
          style={({ pressed }) => (pressed ? { opacity: 0.5 } : null)}
        >
          <Ionicons name="close" size={18} color={theme.textMuted} />
        </Pressable>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: pressed ? theme.surfaceAlt : 'transparent' })}
    >
      {content}
    </Pressable>
  );
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.inputWrap, multiline ? styles.inputWrapMultiline : null]}>
      <Text style={[typography.micro, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textFaint}
        accessibilityLabel={label}
        multiline={multiline}
        selectionColor={theme.accentInk}
        style={[
          typography.body,
          styles.input,
          { color: theme.text },
          multiline ? styles.inputMultiline : null,
        ]}
      />
    </View>
  );
}

export function FormSwitch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [
        styles.rowInner,
        pressed ? { backgroundColor: theme.surfaceAlt } : null,
      ]}
    >
      <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{label}</Text>
      <View
        style={[
          styles.track,
          { backgroundColor: value ? theme.accent : theme.borderStrong },
        ]}
      >
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: value ? theme.accentText : theme.surface,
              alignSelf: value ? 'flex-end' : 'flex-start',
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

export function FormDivider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  groupWrap: { gap: spacing.sm },
  groupTitle: { marginLeft: spacing.xs },
  group: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md },
  rowInner: {
    minHeight: control.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  value: { maxWidth: '55%' },
  inputWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 13,
    gap: 2,
  },
  inputWrapMultiline: { minHeight: 108 },
  input: { padding: 0, minHeight: 22 },
  inputMultiline: { minHeight: 66, textAlignVertical: 'top' },
  track: {
    width: 46,
    height: 28,
    borderRadius: radius.pill,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: { width: 22, height: 22, borderRadius: radius.pill },
});
