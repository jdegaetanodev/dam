import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { InsigniaEstado } from '../../../componentes/InsigniaEstado';
import { useAuth } from '../../../contextos/AuthContext';
import {
  ESTADOS_ABIERTOS,
  EstadoAbierto,
  FiltrosBandeja,
  ZONA_TODAS,
  obtenerBandeja,
  obtenerZonas,
} from '../../../servicios/operador';
import { obtenerTiposDeReporte } from '../../../servicios/reportes';
import { Reporte, TipoDeReporte, Zona } from '../../../tipos';
import { ETIQUETAS_ESTADO } from '../../../utilidades/estados';
import { textoAdhesiones } from '../../../utilidades/formato';

// Una fila de filtros: el título, la opción "Todos" y una opción por cada valor.
// La opción "Todos" usa el valor null.
interface FilaProps {
  titulo: string;
  textoTodos: string;
  opciones: { valor: string; texto: string }[];
  elegida: string | null;
  onElegir: (valor: string | null) => void;
}

function FilaDeFiltro({ titulo, textoTodos, opciones, elegida, onElegir }: FilaProps) {
  const todas = [{ valor: null, texto: textoTodos }, ...opciones];

  return (
    <>
      <Text style={estilos.tituloFiltro}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila}>
        {todas.map((opcion) => {
          const seleccionada = opcion.valor === elegida;
          return (
            <Pressable
              key={opcion.valor ?? 'todos'}
              onPress={() => onElegir(opcion.valor)}
              style={[estilos.opcion, seleccionada && estilos.opcionSeleccionada]}
              accessibilityRole="button"
              accessibilityState={{ selected: seleccionada }}
              accessibilityLabel={`Filtrar por ${titulo.toLowerCase()}: ${opcion.texto}`}
            >
              <Text style={[estilos.textoOpcion, seleccionada && estilos.textoSeleccionado]}>
                {opcion.texto}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

export default function BandejaScreen() {
  const { usuario } = useAuth();

  // Por defecto se ve la zona del operador
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

  // Carga al entrar a la pestaña, al volver del detalle y cada vez que cambia un filtro.
  useFocusEffect(
    useCallback(() => {
      // Si llega una respuesta de un pedido anterior, se descarta.
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
          if (vigente) setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
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
    const estado = ETIQUETAS_ESTADO[item.estado];
    const adhesiones = textoAdhesiones(item.adhesiones);

    return (
      <Pressable
        onPress={() => router.push({ pathname: '/(operador)/reporte/[id]', params: { id: item.id } })}
        style={({ pressed }) => [estilos.tarjeta, pressed && estilos.tarjetaPresionada]}
        accessibilityRole="button"
        accessibilityLabel={`Reporte ${item.codigo}. ${tipo}, ${item.direccion}. Estado: ${estado}. ${zona}. ${adhesiones}.`}
        accessibilityHint="Abre el detalle del reporte"
      >
        <Text style={estilos.codigo}>{item.codigo}</Text>
        <Text style={estilos.titulo}>
          {tipo} - {item.direccion}
        </Text>
        <InsigniaEstado estado={item.estado} />
        <Text style={estilos.dato}>
          {zona} · {adhesiones}
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
          style={estilos.boton}
          accessibilityRole="button"
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
        keyExtractor={(reporte) => reporte.id}
        renderItem={renderReporte}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={<Text style={estilos.textoVacio}>No hay reportes con estos filtros.</Text>}
      />
    );
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.filtros}>
        <FilaDeFiltro
          titulo="Estado"
          textoTodos="Todos"
          opciones={ESTADOS_ABIERTOS.map((e) => ({ valor: e, texto: ETIQUETAS_ESTADO[e] }))}
          elegida={filtros.estado}
          // Las opciones salen de ESTADOS_ABIERTOS, así que el valor siempre es un estado abierto.
          onElegir={(valor) => setFiltros({ ...filtros, estado: valor as EstadoAbierto | null })}
        />
        <FilaDeFiltro
          titulo="Tipo"
          textoTodos="Todos"
          opciones={tipos.map((t) => ({ valor: t.id, texto: t.nombre }))}
          elegida={filtros.tipoId}
          onElegir={(valor) => setFiltros({ ...filtros, tipoId: valor })}
        />
        <FilaDeFiltro
          titulo="Zona"
          textoTodos="Todas"
          opciones={zonas.map((z) => ({ valor: z.id, texto: z.nombre }))}
          elegida={filtros.zonaId === ZONA_TODAS ? null : filtros.zonaId}
          onElegir={(valor) => setFiltros({ ...filtros, zonaId: valor ?? ZONA_TODAS })}
        />
      </View>

      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F8FAFC' },
  filtros: { paddingVertical: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tituloFiltro: { fontSize: 14, fontWeight: '700', color: '#475569', marginHorizontal: 16, marginTop: 4 },
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
  textoSeleccionado: { color: '#FFFFFF', fontWeight: '700' },
  lista: { padding: 16, gap: 12 },
  tarjeta: { padding: 16, gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  tarjetaPresionada: { backgroundColor: '#F1F5F9' },
  codigo: { fontSize: 14, color: '#475569' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  dato: { fontSize: 16, color: '#475569' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  textoError: { fontSize: 18, color: '#B91C1C', textAlign: 'center' },
  boton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#0369A1' },
  textoBoton: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  textoVacio: { fontSize: 18, color: '#475569', textAlign: 'center', marginTop: 32 },
});