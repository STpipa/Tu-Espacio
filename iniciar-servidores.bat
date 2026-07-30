@echo off
REM Doble clic en este archivo levanta los dos servidores de desarrollo de
REM Tu Espacio (el server de Colyseus y la app de Expo web) cada uno en su
REM propia ventana, para poder ver los logs y cerrarlos por separado.

start "Tu Espacio - Server (Colyseus, puerto 2567)" cmd /k "cd /d %~dp0server && npm run dev"
start "Tu Espacio - App web (Expo, puerto 8081)" cmd /k "cd /d %~dp0 && npm run web"

echo Se abrieron dos ventanas nuevas: una para el server y otra para la app.
echo Esperá a que las dos digan que estan escuchando/listas.
echo Despues abri http://localhost:8081 en el navegador.
echo.
echo (Para cerrar todo: cerra esas dos ventanas nuevas, o usa Ctrl+C adentro de cada una.)
pause
