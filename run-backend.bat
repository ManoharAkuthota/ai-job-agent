@echo off
title AI Job Agent - Spring Boot Backend
cd /d "%~dp0backend"
echo ========================================================
echo   Starting AI Job Agent Backend (Spring Boot + MySQL)
echo ========================================================
echo   Make sure MySQL service is running on port 3306!
echo   Connecting to jdbc:mysql://localhost:3306/job_portal_agent
echo ========================================================
.\mvnw.cmd spring-boot:run
pause
