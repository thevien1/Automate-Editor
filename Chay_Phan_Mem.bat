@echo off
title GPM Automate Editor v3.0.8-stable
cd /d "%~dp0"
echo ======================================================
echo    Dang khoi dong GPM Automate Editor v3.0.8-stable...
echo ======================================================
node ./node_modules/electron/cli.js .
if %errorlevel% neq 0 (
    echo Co loi khi khoi dong ung dung.
    pause
)
