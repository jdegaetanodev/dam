import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

import { obtenerMisReportes } from '../../servicios/reportes';
import { Reporte } from '../../tipos';

export default function MisReportesScreen() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const cargarReportes = async () => {
    try {
      const datos = await obtenerMisReportes();

      setReportes(
        [...datos].sort(
          (a, b) =>
            new Date(b.creadoEn).getTime() -
            new Date(a.creadoEn).getTime()
        )
      );
    } catch (error) {
      console.log('Error al cargar los reportes:', error);
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarReportes();
    }, [])
  );

  const actualizar = () => {
    setActualizando(true);
    cargarReportes();
  };

  function obtenerTextoEstado(estado: string) {
    switch (estado) {
      case 'recibido':
        return 'Recibido';

      case 'en_revision':
        return 'En revisión';

      case 'asignado':
        return 'Asignado';

      case 'en_progreso':
        return 'En progreso';

      case 'resuelto':
        return 'Resuelto';

      case 'rechazado':
        return 'Rechazado';

      default:
        return estado;
    }
  }

  function obtenerColorEstado(estado: string) {
    switch (estado) {
      case 'recibido':
        return '#2563EB';

      case 'en_revision':
        return '#D97706';

      case 'asignado':
        return '#7C3AED';

      case 'en_progreso':
        return '#0891B2';

      case 'resuelto':
        return '#15803D';

      case 'rechazado':
        return '#DC2626';

      default:
        return '#64748B';
    }
  }

  if (cargando) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator size="large" />
        <Text style={estilos.cargandoTexto}>
          Cargando tus reportes...
        </Text>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Mis Reclamos</Text>

      <Text style={estilos.subtitulo}>
        Acá podés consultar el estado de tus reportes.
      </Text>

      <FlatList
        data={reportes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          reportes.length === 0
            ? estilos.listaVacia
            : estilos.lista
        }
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
          />
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Text style={estilos.vacioIcono}>📋</Text>

            <Text style={estilos.vacioTitulo}>
              Todavía no tenés reportes
            </Text>

            <Text style={estilos.vacioTexto}>
              Cuando realices un reporte municipal aparecerá acá.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={estilos.tarjeta}>
            <View style={estilos.encabezadoTarjeta}>
              <View>
                <Text style={estilos.codigo}>
                  {item.codigo}
                </Text>

                <Text style={estilos.fecha}>
                  {new Date(item.creadoEn).toLocaleDateString('es-AR')}
                </Text>
              </View>

              <View style={estilos.indicadores}>
                <View
                  style={[
                    estilos.estado,
                    {
                      backgroundColor: obtenerColorEstado(item.estado),
                    },
                  ]}
                >
                  <Text style={estilos.estadoTexto}>
                    {obtenerTextoEstado(item.estado)}
                  </Text>
                </View>

                <View
                  style={[
                    estilos.sincronizacion,
                    item.sincronizado
                      ? estilos.sincronizado
                      : estilos.pendiente,
                  ]}
                  accessibilityRole="text"
                  accessibilityLabel={
                    item.sincronizado
                      ? 'Reporte sincronizado con el servidor'
                      : 'Reporte pendiente de sincronización'
                  }
                >
                  <Ionicons
                    name={
                      item.sincronizado
                        ? 'cloud-done-outline'
                        : 'cloud-upload-outline'
                    }
                    size={14}
                    color={item.sincronizado ? '#15803D' : '#B45309'}
                  />
                  <Text
                    style={[
                      estilos.sincronizacionTexto,
                      { color: item.sincronizado ? '#15803D' : '#B45309' },
                    ]}
                  >
                    {item.sincronizado ? 'Sincronizado' : 'Pendiente'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={estilos.linea} />

            <Text style={estilos.etiqueta}>
              Descripción
            </Text>

            <Text style={estilos.descripcion}>
              {item.descripcion || 'Sin descripción adicional.'}
            </Text>

            <Text style={estilos.ubicacion}>
              📍 {item.direccion || 'Ubicación registrada en el mapa'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  subtitulo: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 16,
  },

  lista: {
    paddingBottom: 30,
    gap: 12,
  },

  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },

  indicadores: {
    alignItems: 'flex-end',
    gap: 6,
  },

  codigo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  fecha: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },

  estado: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  estadoTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  sincronizacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  sincronizado: {
    backgroundColor: '#DCFCE7',
  },

  pendiente: {
    backgroundColor: '#FEF3C7',
  },

  sincronizacionTexto: {
    fontSize: 12,
    fontWeight: '700',
  },

  linea: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },

  descripcion: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 14,
  },

  ubicacion: {
    fontSize: 15,
    color: '#475569',
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  cargandoTexto: {
    fontSize: 16,
    color: '#64748B',
  },

  vacio: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  vacioIcono: {
    fontSize: 50,
    marginBottom: 16,
  },

  vacioTitulo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },

  vacioTexto: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
});