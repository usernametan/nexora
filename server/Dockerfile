FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S cosmos && adduser -S cosmos -G cosmos \
    && mkdir -p /app/data/uploads \
    && chown -R cosmos:cosmos /app

COPY --from=build /app/target/*.jar /app/app.jar

USER cosmos
EXPOSE 8080
ENV APP_FILE_STORAGE_DIR=/app/data/uploads
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
