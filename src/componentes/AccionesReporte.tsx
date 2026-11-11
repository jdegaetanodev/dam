import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Boton } from './Boton';
import { CamaraModal } from './CamaraModal';
import {
  agregarFotoDelArreglo,
  asignarCuadrilla,
  cambiarEstado,
  marcarDuplicado,
  obtenerCuadrillas,
  obtenerReportePorCodigo,
} from '../servicios/operador';
import { Cuadrilla, Reporte } from '../tipos';
import { ESTADOS_SIGUIENTES, ETIQUETAS_ESTADO } from '../utilidades/estados';

interface Props {
  reporte: Reporte;
  onCambio: () => void; // la pantalla vuelve a pedir el reporte
}

// Acciones del operador sobre un reporte: cambiar el estado, asignar cuadrilla,
// marcar duplicado y agregar la foto del arreglo.
export function AccionesReporte({ reporte, onCambio }: Props) {
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);
  const [comentario, setComentario] = useState('');
  const [codigoOriginal, setCodigoOriginal] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camaraVisible, setCamaraVisible] = useState(false);

  // Las cuadrillas que se pueden elegir son las activas de la zona del reporte.
  useEffect(() => {
    obtenerCuadrillas(reporte.zonaId)
      .then(setCuadrillas)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.'));
  }, [reporte.zonaId]);

  // Qué acciones se ofrecen, según las reglas de la API (R11 a R15).
  const estadosSiguientes = ESTADOS_SIGUIENTES[reporte.estado];
  const puedeAsignar = reporte.estado === 'en_revision' || reporte.estado === 'asignado';
  const puedeMarcarDuplicado = estadosSiguientes.includes('rechazado');
  const fotosDelArreglo = reporte.fotos.filter((f) => f.momento === 'arreglo');
  const puedeAgregarFoto =
    (reporte.estado === 'asignado' || reporte.estado === 'resuelto') && fotosDelArreglo.length < 3;

  if (estadosSiguientes.length === 0 && !puedeAsignar && !puedeAgregarFoto) return null;

  // Ejecuta una acción: si sale bien, limpia los campos y avisa a la pantalla;
  // si sale mal, muestra el mensaje de error (por ejemplo, rechazar sin motivo).
  const ejecutar = async (accion: () => Promise<unknown>) => {
    setProcesando(true);
    setError(null);
    try {
      await accion();
      setComentario('');
      setCodigoOriginal('');
      onCambio();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setProcesando(false);
    }
  };

  // El operador escribe el número de seguimiento del original; la API pide su id.
  const marcarComoDuplicado = () =>
    ejecutar(async () => {
      const original = await obtenerReportePorCodigo(codigoOriginal.trim());
      await marcarDuplicado(reporte.id, original.id);
    });

  return (
    <View style={estilos.seccion}>
      <Text style={estilos.titulo} accessibilityRole="header">
        Gestionar el reporte
      </Text>

      {error ? (
        <Text style={estilos.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {estadosSiguientes.length > 0 || puedeAsignar ? (
        <TextInput
          value={comentario}
          onChangeText={setComentario}
          placeholder="Comentario (obligatorio para rechazar)"
          placeholderTextColor="#64748B"
          multiline
          style={estilos.campo}
          accessibilityLabel="Comentario del cambio. Obligatorio para rechazar."
        />
      ) : null}

      {estadosSiguientes.map((estado) => (
        <Boton
          key={estado}
          texto={`Pasar a ${ETIQUETAS_ESTADO[estado]}`}
          onPress={() => ejecutar(() => cambiarEstado(reporte.id, estado, comentario))}
          deshabilitado={procesando}
        />
      ))}

      {puedeAsignar ? (
        <>
          <Text style={estilos.subtitulo}>Asignar cuadrilla</Text>
          {cuadrillas.map((cuadrilla) => {
            const esLaActual = cuadrilla.id === reporte.cuadrillaId;
            return (
              <Boton
                key={cuadrilla.id}
                texto={esLaActual ? `${cuadrilla.nombre} (asignada)` : cuadrilla.nombre}
                onPress={() => ejecutar(() => asignarCuadrilla(reporte.id, cuadrilla.id, comentario))}
                deshabilitado={procesando || esLaActual}
              />
            );
          })}
        </>
      ) : null}

      {puedeMarcarDuplicado ? (
        <>
          <Text style={estilos.subtitulo}>Marcar como duplicado</Text>
          <TextInput
            value={codigoOriginal}
            onChangeText={setCodigoOriginal}
            placeholder="Código del reporte original (GCHU-...)"
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
            style={estilos.campo}
            accessibilityLabel="Código del reporte original"
          />
          <Boton
            texto="Marcar como duplicado"
            onPress={marcarComoDuplicado}
            deshabilitado={procesando || codigoOriginal.trim() === ''}
          />
        </>
      ) : null}

      {puedeAgregarFoto ? (
        <Boton
          texto="Agregar foto del arreglo"
          onPress={() => setCamaraVisible(true)}
          deshabilitado={procesando}
        />
      ) : null}

      {/* Cámara del equipo: devuelve la foto ya guardada en el teléfono. */}
      <CamaraModal
        visible={camaraVisible}
        onClose={() => setCamaraVisible(false)}
        onFotoTomada={(uri) => {
          setCamaraVisible(false);
          ejecutar(() => agregarFotoDelArreglo(reporte.id, uri));
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { padding: 16, gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  subtitulo: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 8 },
  error: { fontSize: 16, color: '#B91C1C' },
  campo: { minHeight: 48, padding: 12, fontSize: 16, color: '#1E293B', borderWidth: 1, borderColor: '#64748B', borderRadius: 8 },
});