import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SelectRow } from '../../ui/SelectRow';
import { THEME_OPTIONS } from '../../ui/themes';
import { useThemeControls } from '../../ui/ThemeProvider';
import { spacing } from '../../ui/tokens';

export function ThemeSelect() {
  const { themeId, setThemeId } = useThemeControls();

  return (
    <View style={styles.container}>
      <SelectRow
        label="Theme"
        value={themeId}
        onChange={(next) => void setThemeId(next)}
        options={THEME_OPTIONS.map((option) => ({
          value: option.id,
          label: option.label,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});
