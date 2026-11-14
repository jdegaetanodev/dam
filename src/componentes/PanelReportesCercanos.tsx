import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { ReporteCercano } from '../utilidades/reportesCercanos';
import { TipoDeReporte } from '../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../utilidades/estados';

interface Props {
  candidatos: ReporteCercano[];
  tipos: TipoDeReporte[];
  onAdherir: (reporte: ReporteCercano) => void;
  onCrearNuevo?: () => void;
  textoCrearNuevo?: string;
  descripcionCrearNuevo?: string;
  disabled?: boolean;
}

export function PanelReportesCercanos({
  candidatos,
  tipos,
  onAdherir,
  onCrearNuevo,
  textoCrearNuevo,
  descripcionCrearNuevo,
  disabled = false,
}: Props) {
  const nombreTipo = (tipoId: string) =>
    tipos.find((tipo) => tipo.id === tipoId)?.nombre ?? 'Reporte municipal';

  return (
    <View style={estilos.panel}>
      <View style={estilos.encabezado}>
        <Ionicons name="alert-circle-outline" size={22} color="#92400E" />
        <Text style={estilos.titulo} accessibilityRole="header">
          Hay reportes cerca
        </Text>
      </View>
      <Text style={estilos.descripcion}>
        ¿Alguno describe el mismo problema? Si elegís uno, te sumaremos a ese reporte y no se creará otro.
      </Text>

      {candidatos.map((reporte) => (
        <View key={reporte.id} style={estilos.candidato}>
          <View style={estilos.detalleCandidato}>
            <Text style={estilos.tipo}>{nombreTipo(reporte.tipoId)}</Text>
            <Text style={estilos.direccion}>
              {reporte.direccion || 'Ubicación registrada en el mapa'}
            </Text>
            <Text style={estilos.meta}>
              {reporte.codigo} · {Math.round(reporte.distanciaMetros)} m
            </Text>
            <Text
              style={[
                estilos.estado,
                { color: COLORES_ESTADO[reporte.estado] ?? '#475569' },
              ]}
            >
              {ETIQUETAS_ESTADO[reporte.estado] ?? reporte.estado}
            </Text>
            {reporte.descripcion ? (
              <Text style={estilos.descripcionCandidato} numberOfLines={3}>
                {reporte.descripcion}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => onAdherir(reporte)}
            disabled={disabled}
            style={[estilos.botonAdherir, disabled && estilos.deshabilitado]}
            accessibilityRole="button"
            accessibilityLabel={`Sumarme al reporte ${reporte.codigo}`}
          >
            <Text style={estilos.textoBotonAdherir}>Es el mismo problema</Text>
          </Pressable>
        </View>
      ))}

      {onCrearNuevo && textoCrearNuevo ? (
        <Pressable
          onPress={onCrearNuevo}
          disabled={disabled}
          style={[estilos.botonCrear, disabled && estilos.deshabilitado]}
          accessibilityRole="button"
        >
          <Text style={estilos.textoBotonCrear}>{textoCrearNuevo}</Text>
        </Pressable>
      ) : null}
      {descripcionCrearNuevo ? (
        <Text style={estilos.ayudaCrear}>{descripcionCrearNuevo}</Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  panel: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { flex: 1, color: '#78350F', fontSize: 17, fontWeight: '800' },
  descripcion: { color: '#78350F', fontSize: 14, lineHeight: 20 },
  candidato: {
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  detalleCandidato: { gap: 3 },
  tipo: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  direccion: { color: '#334155', fontSize: 14 },
  meta: { color: '#64748B', fontSize: 13 },
  estado: { fontSize: 13, fontWeight: '700' },
  descripcionCandidato: { color: '#475569', fontSize: 14 },
  botonAdherir: {
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0B3A5D',
  },
  textoBotonAdherir: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  botonCrear: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#92400E',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  textoBotonCrear: { color: '#78350F', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  ayudaCrear: { color: '#78350F', fontSize: 12, textAlign: 'center' },
  deshabilitado: { opacity: 0.55 },
});
