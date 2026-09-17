# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -B

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/ai-job-agent-0.0.1-SNAPSHOT.jar app.jar

ENV PORT=8080
EXPOSE 8080

# Configure container-aware JVM memory limit (384M fits comfortably in Render 512M free tier)
# and explicitly bind to 0.0.0.0 and $PORT to satisfy Render's port scanner instantly.
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -Xmx384m -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
