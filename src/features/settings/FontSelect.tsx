import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SelectRow } from '../../ui/SelectRow';
import { FONT_OPTIONS, fontFamilyFor } from '../../ui/fonts';
import { useThemeControls } from '../../ui/ThemeProvider';
import { spacing } from '../../ui/tokens';

export function FontSelect() {
  const { fontKey, setFontKey } = useThemeControls();

  return (
    <View style={styles.container}>
      <SelectRow
        label="Font"
        value={fontKey}
        onChange={(next) => void setFontKey(next)}
        options={FONT_OPTIONS.map((option) => ({
          value: option.key,
          label: option.label,
          fontFamily: fontFamilyFor(option.key),
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});
