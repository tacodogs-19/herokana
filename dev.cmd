@echo off
rem Wrapper for the Claude preview launcher, which cannot spawn executables
rem whose paths contain spaces. Keeps Vite's root at the real long path.
rem Honours the launcher's assigned PORT (autoPort) so two sessions can run.
cd /d "C:\Users\Nebula PC\HeroKana"
if "%PORT%"=="" (npm run dev) else (npm run dev -- --port %PORT%)
