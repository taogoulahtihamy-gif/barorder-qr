import { useContext } from 'react';
import { I18nContext } from './I18nProvider';

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useT must be used within an I18nProvider');
  }
  return ctx;
}
