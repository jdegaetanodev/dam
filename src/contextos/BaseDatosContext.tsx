import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';

const NOMBRE_BASE_DATOS = 'incidentes.db';
const VERSION_BASE_DATOS = 1;

async function inicializarBaseDatos(db: SQLiteDatabase): Promise<void> {
  const resultado = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const versionActual = resultado?.user_version ?? 0;

  if (versionActual > VERSION_BASE_DATOS) {
    throw new Error(
      `La base de datos tiene una versión más reciente (${versionActual}) que la aplicación (${VERSION_BASE_DATOS}).`
    );
  }

  if (versionActual === VERSION_BASE_DATOS) {
    return;
  }

  await db.withTransactionAsync(async () => {
    if (versionActual === 0) {
      await db.execAsync(`
        CREATE TABLE reportes (
          id TEXT PRIMARY KEY NOT NULL,
          codigo TEXT NOT NULL DEFAULT '',
          tipoId TEXT NOT NULL,
          descripcion TEXT,
          audioUrl TEXT,
          fotos TEXT NOT NULL DEFAULT '[]',
          coordenadas TEXT NOT NULL,
          direccion TEXT NOT NULL DEFAULT '',
          zonaId TEXT NOT NULL DEFAULT '',
          estado TEXT NOT NULL DEFAULT 'recibido',
          autorId TEXT NOT NULL,
          cuadrillaId TEXT,
          duplicadoDe TEXT,
          adhesiones INTEGER NOT NULL DEFAULT 0,
          creadoEn TEXT NOT NULL,
          sincronizado INTEGER NOT NULL DEFAULT 0
            CHECK (sincronizado IN (0, 1))
        );

        CREATE INDEX idx_reportes_autor_fecha
          ON reportes (autorId, creadoEn DESC);
      `);
    }

    await db.execAsync(`PRAGMA user_version = ${VERSION_BASE_DATOS}`);
  });
}

export function BaseDatosProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider
      databaseName={NOMBRE_BASE_DATOS}
      onInit={inicializarBaseDatos}
    >
      {children}
    </SQLiteProvider>
  );
}

export function useBaseDatos(): SQLiteDatabase {
  return useSQLiteContext();
}
