import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

import { Coordenadas, Zona } from '../tipos';
import { MOCK_ZONAS } from '../mocks/zonas.mock';
import { obtenerZonaPorCoordenadas } from '../utilidades/geografia';

interface Props {
  coordenadas: Coordenadas | null;
  onChange: (coordenadas: Coordenadas) => void;
}

export function SelectorUbicacion({
  coordenadas,
  onChange,
}: Props) {
  const [textoUbicacion, setTextoUbicacion] = useState(
    'Obteniendo ubicación...'
  );

  const [zona, setZona] = useState<Zona | null>(null);

  // Intentar obtener la ubicación GPS una sola vez
  useEffect(() => {
    obtenerUbicacionGPS();
  }, []);

  async function obtenerUbicacionGPS() {
    try {
      const permiso =
        await Location.requestForegroundPermissionsAsync();

      if (permiso.status !== 'granted') {
        setTextoUbicacion(
          'GPS no disponible. Tocá el mapa para seleccionar la ubicación.'
        );
        return;
      }

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordenadasGPS: Coordenadas = {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
      };

      // Solo usar automáticamente el GPS si pertenece
      // a alguna de las zonas municipales configuradas.
      const zonaGPS = obtenerZonaPorCoordenadas(
        coordenadasGPS,
        MOCK_ZONAS
      );

      if (zonaGPS) {
        onChange(coordenadasGPS);

        setTextoUbicacion(
          'Ubicación obtenida automáticamente mediante GPS.'
        );
      } else {
        setTextoUbicacion(
          'Estás fuera de las zonas municipales. Tocá o arrastrá el marcador para indicar la ubicación del incidente.'
        );
      }
    } catch {
      setTextoUbicacion(
        'No se pudo obtener el GPS. Tocá el mapa para seleccionar la ubicación.'
      );
    }
  }

  // Detectar la zona cada vez que cambian las coordenadas
  useEffect(() => {
    if (!coordenadas) {
      setZona(null);
      return;
    }

    const zonaEncontrada = obtenerZonaPorCoordenadas(
      coordenadas,
      MOCK_ZONAS
    );

    setZona(zonaEncontrada);

    setTextoUbicacion(
      `Ubicación seleccionada: ${coordenadas.latitud.toFixed(5)}, ${coordenadas.longitud.toFixed(5)}`
    );
  }, [coordenadas]);

  const zonas = MOCK_ZONAS.map(
    (zonaMapa) => `
      L.polygon(
        [
          ${zonaMapa.limite
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
          weight: 2,
          interactive: false
        }
      ).addTo(map);
    `
  ).join('');

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
          html, body, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
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

          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19
            }
          ).addTo(map);

          ${zonas}

          let marcadorSeleccionado = null;

          ${
            coordenadas
              ? `
                marcadorSeleccionado = L.marker(
                  [
                    ${coordenadas.latitud},
                    ${coordenadas.longitud}
                  ],
                  {
                    draggable: true
                  }
                ).addTo(map);

                map.setView(
                  [
                    ${coordenadas.latitud},
                    ${coordenadas.longitud}
                  ],
                  16
                );

                marcadorSeleccionado.on('dragend', function(e) {
                  const posicion = e.target.getLatLng();

                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                      latitud: posicion.lat,
                      longitud: posicion.lng
                    })
                  );
                });
              `
              : ''
          }

          map.on('click', function(e) {
            const latitud = e.latlng.lat;
            const longitud = e.latlng.lng;

            if (marcadorSeleccionado) {
              map.removeLayer(marcadorSeleccionado);
            }

            marcadorSeleccionado = L.marker(
              [latitud, longitud],
              {
                draggable: true
              }
            ).addTo(map);

            marcadorSeleccionado.on('dragend', function(e) {
              const posicion = e.target.getLatLng();

              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  latitud: posicion.lat,
                  longitud: posicion.lng
                })
              );
            });

            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                latitud,
                longitud
              })
            );
          });
        </script>
      </body>
    </html>
  `;

  function manejarMensaje(event: any) {
    try {
      const datos = JSON.parse(event.nativeEvent.data);

      if (
        typeof datos.latitud === 'number' &&
        typeof datos.longitud === 'number'
      ) {
        onChange({
          latitud: datos.latitud,
          longitud: datos.longitud,
        });
      }
    } catch {
      setTextoUbicacion(
        'No se pudo obtener la ubicación'
      );
    }
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.mapaContenedor}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.mapa}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={manejarMensaje}
        />
      </View>

      <Text style={styles.textoUbicacion}>
        {textoUbicacion}
      </Text>

      {zona ? (
        <View style={styles.zonaInfo}>
          <Text style={styles.zonaTitulo}>
            Zona asignada: {zona.nombre}
          </Text>

          <Text style={styles.zonaReferente}>
            Cuadrilla responsable: {zona.referente}
          </Text>
        </View>
      ) : coordenadas ? (
        <Text style={styles.sinZona}>
          Esta ubicación está fuera de las zonas municipales configuradas
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 10,
  },

  mapaContenedor: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },

  mapa: {
    flex: 1,
  },

  textoUbicacion: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
  },

  zonaInfo: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#9D4EDD',
  },

  zonaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#581C87',
  },

  zonaReferente: {
    marginTop: 4,
    fontSize: 15,
    color: '#6B21A8',
  },

  sinZona: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B91C1C',
    textAlign: 'center',
  },
});