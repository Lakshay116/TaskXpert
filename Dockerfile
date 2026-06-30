# Stage 1: Build the React Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Node.js Backend
FROM node:22-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy backend source code
COPY backend/ ./

# Copy the built frontend static files into the expected location
# (The backend expects it at ../frontend/dist)
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 5000
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
