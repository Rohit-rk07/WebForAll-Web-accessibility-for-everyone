import { useContext } from 'react';
import { AuthContext } from './AuthContextDefinition';

export const useAuth = () => useContext(AuthContext);