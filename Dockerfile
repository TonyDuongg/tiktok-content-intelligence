FROM node:24-bookworm-slim AS frontend
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_BASE_URL=""
RUN npm run lint && npm test && npm run build

FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /workspace/backend
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
COPY --from=frontend /workspace/frontend/dist /workspace/frontend/dist
RUN mvn -B -Pbundle-web -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN groupadd --system creator && useradd --system --gid creator --home-dir /app creator
COPY --from=backend /workspace/backend/target/tiktok-content-intelligence-0.0.1-SNAPSHOT.jar /app/app.jar
COPY LICENSE THIRD-PARTY-NOTICES.md /app/
USER creator
ENV SPRING_PROFILES_ACTIVE=production
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-jar", "/app/app.jar"]
