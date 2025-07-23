# Build stage
FROM maven:3.9-eclipse-temurin-24 AS build
WORKDIR /app

# Install Node.js 18 (required for frontend build)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Copy Maven files and source
COPY pom.xml .
COPY src ./src

# Build with frontend included
RUN mvn clean package -DskipTests -DskipFrontend=false -Pdocker-build-local

# Verify frontend files are included
RUN echo "Checking JAR contents:" && \
    jar -tf target/*.jar | grep -E "(index\.html|static/)" | head -10 || \
    echo "WARNING: No static files found in JAR!"

# Run stage
FROM eclipse-temurin:24-jre
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]