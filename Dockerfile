FROM eclipse-temurin:24-jre
WORKDIR /app

# Copy the built JAR from the artifact downloaded by GitHub Actions
COPY target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]