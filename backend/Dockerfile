# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Cache Maven dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build package
COPY src ./src
RUN mvn clean package -DskipTests -B

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

# Configure container-aware JVM memory limit (384M fits comfortably in Render 512M free tier)
# and bind dynamically to $PORT to satisfy Render's port scanner instantly.
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -Xmx384m -Dserver.port=${PORT:-8080} -jar app.jar"]
