@echo off
REM ===========================================================
REM  Walimatul Urus - Azam & Nazifa
REM  Runs the invitation at http://localhost:8000
REM  Double-click this file. Close the black window to stop.
REM ===========================================================
setlocal
cd /d "%~dp0"

if not exist "index.html" goto nofile

REM find a working Python: the Windows launcher first, then python.exe
set "PY="
py -3 -c "import sys" >nul 2>nul && set "PY=py -3"
if not defined PY (
  python -c "import sys" >nul 2>nul && set "PY=python"
)
if not defined PY goto nopython

echo.
echo   ==================================================
echo    Jemputan:  http://localhost:8000
echo    Tutup tetingkap ini untuk berhenti.
echo    (Close this window to stop the server)
echo   ==================================================
echo.
echo   Fail: %CD%\index.html
echo   Untuk telefon di Wi-Fi yang sama:
echo     http://%COMPUTERNAME%:8000    atau IP dari "ipconfig"
echo.
echo   Tetingkap kecil akan terbuka dengan alamat di atas.
echo.

REM open the browser after a short delay, then serve in THIS window
start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start "" http://localhost:8000/"

%PY% -m http.server 8000 --bind 0.0.0.0

echo.
echo   Pelayan berhenti. (Server stopped.)
pause
exit /b 0

:nopython
echo.
echo   Python tidak dijumpai.
echo   Anda masih boleh membuka jemputan tanpa Python:
echo       double-click index.html
echo.
echo   Untuk versi pelayan, pasang Python dari https://www.python.org/downloads/
echo   dan tanda "Add python.exe to PATH".
echo.
pause
exit /b 1

:nofile
echo.
echo   index.html tidak dijumpai dalam folder ini:
echo       %CD%
echo   Letakkan fail .bat ini sekali dengan index.html.
echo.
pause
exit /b 1
