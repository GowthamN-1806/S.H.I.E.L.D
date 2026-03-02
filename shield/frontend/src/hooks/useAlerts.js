import { useContext } from 'react';
import { AlertContext } from '../context/AlertContext';
export default function useAlerts() { return useContext(AlertContext); }
