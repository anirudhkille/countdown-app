import React from 'react';
import { Segmented } from '../../ui/Segmented';
import type { ViewMode } from '../../data/settings';
import type { Theme } from '../../ui/themes';

export function ViewToggle({
  theme,
  value,
  onChange,
}: {
  theme: Theme;
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  return (
    <Segmented
      theme={theme}
      value={value}
      onChange={onChange}
      options={[
        { value: 'grid', label: 'Grid' },
        { value: 'list', label: 'List' },
      ]}
    />
  );
}
