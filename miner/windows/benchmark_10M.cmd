@echo off
cd /d "%~dp0"
fgptminer.exe --bench=10M --submit
pause
