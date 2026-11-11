import { createContext, useContext, type PropsWithChildren } from 'react';
import { useNetworkState, type NetworkState } from 'expo-network';

export interface EstadoRed {
  conectado: boolean | null;
  internetDisponible: boolean | null;
  tipoConexion: NetworkState['type'] | null;
}

const RedContext = createContext<EstadoRed | null>(null);

export function RedProvider({ children }: PropsWithChildren) {
  const estadoRed = useNetworkState();

  const valor: EstadoRed = {
    conectado: estadoRed.isConnected ?? null,
    internetDisponible: estadoRed.isInternetReachable ?? null,
    tipoConexion: estadoRed.type ?? null,
  };

  return <RedContext.Provider value={valor}>{children}</RedContext.Provider>;
}

export function useEstadoRed(): EstadoRed {
  const contexto = useContext(RedContext);

  if (!contexto) {
    throw new Error('useEstadoRed debe utilizarse dentro de un RedProvider.');
  }

  return contexto;
}
