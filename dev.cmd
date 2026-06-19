@echo off
rem Wrapper for the Claude preview launcher, which cannot spawn executables
rem whose paths contain spaces. Keeps Vite's root at the real long path.
cd /d "C:\Users\Nebula PC\HeroKana"
npm run dev
