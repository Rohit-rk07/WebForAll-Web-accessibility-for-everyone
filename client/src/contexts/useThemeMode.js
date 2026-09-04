import { useContext } from 'react';
import { ThemeContext } from './ThemeContextDefinition';

export const useThemeMode = () => useContext(ThemeContext);