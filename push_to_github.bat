@echo off
cd /d "%~dp0"
echo ========================================================
echo   Pushing UAV Nadir InSAR Studio to GitHub: DroneSAR
echo   Remote: https://github.com/hamed-javadi/DroneSAR.git
echo ========================================================
echo.
git branch -M main
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Successfully pushed to https://github.com/hamed-javadi/DroneSAR !
    echo.
    echo Next step to activate the live website:
    echo 1. Go to https://github.com/hamed-javadi/DroneSAR/settings/pages
    echo 2. Under 'Branch', select 'main' and '/ (root)'
    echo 3. Click Save. Your website will be live in 1-2 minutes!
) else (
    echo [NOTICE] Push failed or requires authentication.
    echo If prompted to sign in in your browser, please complete the sign-in.
)
echo.
pause
