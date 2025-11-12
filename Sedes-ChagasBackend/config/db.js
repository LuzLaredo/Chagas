import mysql from "mysql2";

// ✅ Configuración principal de Railway (producción)
const dbConfig = {
  host: "metro.proxy.rlwy.net",
  port: 15229,
  user: "root",
  password: "PNsjISxbRhUSISYtudCXLkmkIrcWqFLj", 
  database: "railway",
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  keepAliveInitialDelay: 60000,
  enableKeepAlive: true,
  multipleStatements: true, // por si haces selects combinados
};

// Crear conexión
let db = mysql.createConnection(dbConfig);

// 🔁 Función para reconectar en caso de pérdida
const reconnect = () => {
  console.log("🔄 Intentando reconectar a la base de datos...");
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error("❌ Error al reconectar:", err.message);
      setTimeout(reconnect, 10000);
    } else {
      console.log("✅ Reconexión exitosa a Railway MySQL");
    }
  });

  // Volver a registrar el listener de errores
  db.on("error", handleDBError);
};

// Manejar errores de conexión
const handleDBError = (err) => {
  console.error("❌ Error de BD:", err.message);

  if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
    reconnect();
  } else {
    console.error("💥 Error grave no recuperable:", err);
  }
};

db.connect((err) => {
  if (err) {
    console.error("❌ Error inicial de conexión:", err.message);
    console.log("🔁 Reintentando conexión en 5 segundos...");
    setTimeout(reconnect, 5000);
  } else {
    console.log("✅ Conectado correctamente a Railway MySQL");
  }
});

db.on("error", handleDBError);

// ✅ Verificar conexión (versión híbrida: callback o Promise)
export const verifyConnection = (callback) => {
  return new Promise((resolve, reject) => {
    db.ping((err) => {
      if (err) {
        console.warn("⚠️ Ping fallido, reconectando...");
        reconnect();
        if (callback) callback(err);
        reject(err);
      } else {
        if (callback) callback(null);
        resolve(true);
      }
    });
  });
};

// ✅ Verificar conexión (solo Promise)
export const verifyConnectionPromise = () => {
  return new Promise((resolve, reject) => {
    db.ping((err) => {
      if (err) {
        console.warn("⚠️ Conexión caída, reconectando...");
        reconnect();
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

export default db;
