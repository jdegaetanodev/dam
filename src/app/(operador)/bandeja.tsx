import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { InsigniaEstado } from '../../componentes/InsigniaEstado';
import { useAuth } from '../../contextos/AuthContext';
import {
  EstadoAbierto,
  FiltrosBandeja,
  ZONA_TODAS,
  obtenerBandeja,
  obtenerZonas,
} from '../../servicios/operador';
import { obtenerTiposDeReporte } from '../../servicios/reportes';
import { Reporte, TipoDeReporte, Zona } from '../../tipos';
import { ETIQUETAS_ESTADO } from '../../utilidades/estados';

const ESTADOS_DE_LA_BANDEJA: EstadoAbierto[] = ['recibido', 'en_revision', 'asignado'];

const obtenerClave = (reporte: Reporte) => reporte.id;

const textoAdhesiones = (cantidad: number) =>
  cantidad === 1 ? '1 vecino se sumó' : `${cantidad} vecinos se sumaron`;

//Botón de filtro

interface OpcionProps {
  grupo: string;
  texto: string;
  seleccionada: boolean;
  onPress: () => void;
}

function OpcionDeFiltro({ grupo, texto, seleccionada, onPress }: OpcionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[estilos.opcion, seleccionada && estilos.opcionSeleccionada]}
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionada }}
      accessibilityLabel={`Filtrar por ${grupo}: ${texto}`}
    >
      <Text style={[estilos.textoOpcion, seleccionada && estilos.textoOpcionSeleccionada]}>
        {texto}
      </Text>
    </Pressable>
  );
}

// Pantalla 

export default function BandejaScreen() {
  const { usuario } = useAuth();

  // Por defecto se ve la zona del operador (como la API).
  const [filtros, setFiltros] = useState<FiltrosBandeja>({
    estado: null,
    tipoId: null,
    zonaId: usuario?.zonaId ?? ZONA_TODAS,
  });

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);

  // Se carga al entrar a la pestaña, al volver del detalle y cada vez que cambia un filtro.
  useFocusEffect(
    useCallback(() => {
      // Si el operador cambia de filtro antes de que llegue la respuesta,
      // la respuesta vieja se descarta.
      let vigente = true;

      setCargando(true);
      setError(null);

      Promise.all([obtenerBandeja(filtros), obtenerTiposDeReporte(), obtenerZonas()])
        .then(([datos, listaTipos, listaZonas]) => {
          if (!vigente) return;
          setReportes(datos);
          setTipos(listaTipos);
          setZonas(listaZonas);
        })
        .catch((e) => {
          if (!vigente) return;
          setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
        })
        .finally(() => {
          if (vigente) setCargando(false);
        });

      return () => {
        vigente = false;
      };
    }, [filtros, recargas])
  );

  const nombreDeTipo = (id: string) => tipos.find((t) => t.id === id)?.nombre ?? '';
  const nombreDeZona = (id: string) => zonas.find((z) => z.id === id)?.nombre ?? '';

  const renderReporte = ({ item }: { item: Reporte }) => {
    const tipo = nombreDeTipo(item.tipoId);
    const zona = nombreDeZona(item.zonaId);

    return (
      <Pressable
        onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: item.id } })}
        style={({ pressed }) => [estilos.tarjeta, pressed && estilos.tarjetaPresionada]}
        accessibilityRole="button"
        accessibilityLabel={`Reporte ${item.codigo}. ${tipo}, ${item.direccion}. Estado: ${
          ETIQUETAS_ESTADO[item.estado]
        }. ${zona}. ${textoAdhesiones(item.adhesiones)}.`}
        accessibilityHint="Abre el detalle del reporte"
      >
        <Text style={estilos.codigo}>{item.codigo}</Text>
        <Text style={estilos.titulo}>
          {tipo} - {item.direccion}
        </Text>
        <InsigniaEstado estado={item.estado} />
        <Text style={estilos.dato}>
          {zona} · {textoAdhesiones(item.adhesiones)}
        </Text>
      </Pressable>
    );
  };

  let contenido;
  if (cargando) {
    contenido = (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color="#0369A1" accessibilityLabel="Cargando reportes" />
      </View>
    );
  } else if (error) {
    contenido = (
      <View style={estilos.centro}>
        <Text style={estilos.textoError} accessibilityRole="alert">
          {error}
        </Text>
        <Pressable
          onPress={() => setRecargas((n) => n + 1)}
          style={estilos.botonReintentar}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          accessibilityHint="Vuelve a pedir los reportes"
        >
          <Text style={estilos.textoBoton}>Reintentar</Text>
        </Pressable>
      </View>
    );
  } else {
    contenido = (
      <FlatList
        data={reportes}
        keyExtractor={obtenerClave}
        renderItem={renderReporte}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <Text style={estilos.textoVacio}>No hay reportes con estos filtros.</Text>
        }
      />
    );
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.filtros}>
        <Text style={estilos.etiquetaFiltro}>Estado</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila}>
          <OpcionDeFiltro
            grupo="estado"
            texto="Todos"
            seleccionada={filtros.estado === null}
            onPress={() => setFiltros((f) => ({ ...f, estado: null }))}
          />
          {ESTADOS_DE_LA_BANDEJA.map((estado) => (
            <OpcionDeFiltro
              key={estado}
              grupo="estado"
              texto={ETIQUETAS_ESTADO[estado]}
              seleccionada={filtros.estado === estado}
              onPress={() => setFiltros((f) => ({ ...f, estado }))}
            />
          ))}
        </ScrollView>

        <Text style={estilos.etiquetaFiltro}>Tipo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila}>
          <OpcionDeFiltro
            grupo="tipo"
            texto="Todos"
            seleccionada={filtros.tipoId === null}
            onPress={() => setFiltros((f) => ({ ...f, tipoId: null }))}
          />
          {tipos.map((tipo) => (
            <OpcionDeFiltro
              key={tipo.id}
              grupo="tipo"
              texto={tipo.nombre}
              seleccionada={filtros.tipoId === tipo.id}
              onPress={() => setFiltros((f) => ({ ...f, tipoId: tipo.id }))}
            />
          ))}
        </ScrollView>

        <Text style={estilos.etiquetaFiltro}>Zona</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila}>
          <OpcionDeFiltro
            grupo="zona"
            texto="Todas"
            seleccionada={filtros.zonaId === ZONA_TODAS}
            onPress={() => setFiltros((f) => ({ ...f, zonaId: ZONA_TODAS }))}
          />
          {zonas.map((zona) => (
            <OpcionDeFiltro
              key={zona.id}
              grupo="zona"
              texto={zona.nombre}
              seleccionada={filtros.zonaId === zona.id}
              onPress={() => setFiltros((f) => ({ ...f, zonaId: zona.id }))}
            />
          ))}
        </ScrollView>
      </View>

      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F8FAFC' },
  filtros: {
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  etiquetaFiltro: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginHorizontal: 16,
    marginTop: 4,
  },
  fila: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  opcion: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#64748B',
    backgroundColor: '#FFFFFF',
  },
  opcionSeleccionada: { backgroundColor: '#0369A1', borderColor: '#0369A1' },
  textoOpcion: { fontSize: 16, color: '#1E293B' },
  textoOpcionSeleccionada: { color: '#FFFFFF', fontWeight: '700' },
  lista: { padding: 16, gap: 12 },
  tarjeta: {
    padding: 16,
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tarjetaPresionada: { backgroundColor: '#F1F5F9' },
  codigo: { fontSize: 14, color: '#475569' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  dato: { fontSize: 16, color: '#475569' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  textoError: { fontSize: 18, color: '#B91C1C', textAlign: 'center' },
  botonReintentar: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#0369A1',
  },
  textoBoton: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  textoVacio: { fontSize: 18, color: '#475569', textAlign: 'center', marginTop: 32 },
});