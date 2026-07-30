const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// livekit-client (y algunos otros paquetes modernos) declaran un mapa
// "exports" en su package.json que el resolver de Metro no arma bien en
// Windows (dice que el archivo no existe, aunque sí está en disco) — cae
// a la resolución clásica por "main"/"module", que sí funciona.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
