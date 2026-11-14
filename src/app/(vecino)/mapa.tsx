import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View,} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from 'expo-router';
import { obtenerReportes, obtenerTiposDeReporte, sumarAdhesion,} from '../../servicios/reportes';
import { Reporte, TipoDeReporte,} from '../../tipos';
import { MOCK_ZONAS } from '../../mocks/zonas.mock';

export default function MapaScreen() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);

  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);

  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<string | null>(null);

  const [estadoSeleccionado, setEstadoSeleccionado] =
    useState<string | null>(null);

  // Actualiza los reportes cada vez que volvemos al mapa.
  useFocusEffect(
    useCallback(() => {
      let activo = true;

      async function cargarReportes() {
        try {
          setCargando(true);

          const [
            datosReportes,
            datosTipos,
          ] = await Promise.all([
            obtenerReportes(),
            obtenerTiposDeReporte(),
          ]);

          if (activo) {
            setReportes(datosReportes);
            setTipos(datosTipos);
          }
        } catch (error) {
          console.log(
            'Error al cargar reportes:',
            error
          );
        } finally {
          if (activo) {
            setCargando(false);
          }
        }
      }

      cargarReportes();

      return () => {
        activo = false;
      };
    }, [])
  );

  // Filtra los reportes según el tipo y el estado seleccionados.
  const reportesFiltrados = reportes.filter(
    (reporte) => {
      const coincideTipo =
        !tipoSeleccionado ||
        reporte.tipoId === tipoSeleccionado;

      const coincideEstado =
        !estadoSeleccionado ||
        reporte.estado === estadoSeleccionado;

      return coincideTipo && coincideEstado;
    }
  );

  async function manejarMensaje(event: any) {
    try {
      const datos = JSON.parse(
        event.nativeEvent.data
      );

      if (datos.tipo === 'SUMARSE_RECLAMO') {
        const reporteActualizado =
          await sumarAdhesion(
            datos.reporteId
          );

        setReportes(
          (reportesActuales) =>
            reportesActuales.map(
              (reporte) =>
                reporte.id ===
                reporteActualizado.id
                  ? reporteActualizado
                  : reporte
            )
        );

        Alert.alert(
          '¡Te sumaste al reclamo!',
          `${reporteActualizado.codigo} ahora tiene ${reporteActualizado.adhesiones} adhesión(es).`
        );
      }
    } catch (error) {
      console.log(
        'Error al sumarse al reclamo',
        error
      );

      const mensaje =
        error instanceof Error
          ? error.message
          : 'No se pudo registrar tu adhesión.';

      Alert.alert(
        mensaje ===
          'Ya estás adherido a este reclamo.'
          ? 'Ya estás adherido'
          : 'Error',
        mensaje
      );
    }
  }

  if (cargando) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const marcadores = reportesFiltrados
    .map((reporte) => {
      let color = '#2563EB';

      if (reporte.estado === 'resuelto') {
        color = '#16A34A';
      }

      if (reporte.estado === 'rechazado') {
        color = '#DC2626';
      }

      if (reporte.estado === 'en_revision') {
        color = '#EAB308';
      }

      return `
        L.marker(
          [
            ${reporte.coordenadas.latitud},
            ${reporte.coordenadas.longitud}
          ],
          {
            icon: L.divIcon({
              className: 'marcador-contenedor',
              html:
                '<div class="marcador" style="background:${color};"></div>',
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            })
          }
        )
        .addTo(map)
        .bindPopup(
          '<div style="font-family: Arial; min-width: 220px;">' +

            '<strong style="font-size: 20px;">' +
              '${reporte.codigo}' +
            '</strong>' +

            '<br/><br/>' +

            '<strong>Estado:</strong> ' +
              '${reporte.estado}' +

            '<br/>' +

            '${reporte.direccion ?? ''}' +

            '<br/><br/>' +

            '${reporte.descripcion ?? ''}' +

            '<br/><br/>' +

            '<strong>👥 Vecinos adheridos:</strong> ' +
              '${reporte.adhesiones}' +

            '<br/><br/>' +

            '<button ' +
              'onclick="sumarmeAlReclamo(\\'${reporte.id}\\')"' +
              'style="' +
                'background:#166534;' +
                'color:white;' +
                'border:none;' +
                'padding:12px;' +
                'border-radius:8px;' +
                'font-size:15px;' +
                'font-weight:bold;' +
                'width:100%;' +
                'cursor:pointer;' +
              '"' +
            '>' +
              'Sumarme a este reclamo' +
            '</button>' +

          '</div>'
        );
      `;
    })
    .join('');

  const zonas = MOCK_ZONAS
    .map(
      (zona) => `
        L.polygon(
          [
            ${zona.limite
              .map(
                (punto) =>
                  `[${punto.latitud}, ${punto.longitud}]`
              )
              .join(',')}
          ],
          {
            color: '#7B2CBF',
            fillColor: '#9D4EDD',
            fillOpacity: 0.18,
            weight: 2
          }
        )
        .addTo(map)
        .bindPopup(
          '<strong>${zona.nombre}</strong><br/>${zona.referente}'
        );
      `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <style>
          html,
          body,
          #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
          }

          .marcador-contenedor {
            background: transparent;
            border: none;
          }

          .marcador {
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <script>
          const map = L.map('map').setView(
            [-33.0089, -58.5142],
            13
          );

          function sumarmeAlReclamo(reporteId) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                tipo: 'SUMARSE_RECLAMO',
                reporteId: reporteId
              })
            );
          }

          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19
            }
          ).addTo(map);

          ${zonas}

          ${marcadores}
        </script>
      </body>
    </html>
  `;

  return (
    <View style={estilos.contenedor}>

      <View style={estilos.filtros}>
        <Text style={estilos.tituloFiltros}>
          Filtrar reportes
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={estilos.scrollFiltros}
        >
          <Pressable
            style={[
              estilos.botonFiltro,
              !tipoSeleccionado &&
                estilos.botonFiltroActivo,
            ]}
            onPress={() =>
              setTipoSeleccionado(null)
            }
          >
            <Text>Todos</Text>
          </Pressable>

          {tipos.map((tipo) => (
            <Pressable
              key={tipo.id}
              style={[
                estilos.botonFiltro,
                tipoSeleccionado === tipo.id &&
                  estilos.botonFiltroActivo,
              ]}
              onPress={() =>
                setTipoSeleccionado(tipo.id)
              }
            >
              <Text>
                {tipo.nombre}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={estilos.scrollFiltros}
        >
          {[
            null,
            'en_revision',
            'resuelto',
            'rechazado',
          ].map((estado) => (
            <Pressable
              key={
                estado ??
                'todos-estados'
              }
              style={[
                estilos.botonFiltro,
                estadoSeleccionado === estado &&
                  estilos.botonFiltroActivo,
              ]}
              onPress={() =>
                setEstadoSeleccionado(estado)
              }
            >
              <Text>
                {estado
                  ? estado.replace('_', ' ')
                  : 'Todos los estados'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={estilos.mapa}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={manejarMensaje}
      />

    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },

  filtros: {
    padding: 10,
    backgroundColor: '#FFFFFF',
  },

  tituloFiltros: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  scrollFiltros: {
    marginBottom: 8,
  },

  botonFiltro: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 20,
    marginRight: 8,
  },

  botonFiltroActivo: {
    backgroundColor: '#DDEBFF',
    borderColor: '#2563EB',
  },

  mapa: {
    flex: 1,
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});