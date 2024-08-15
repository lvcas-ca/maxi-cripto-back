# Usar Node.js 16 como base
FROM node:16

# Añadir Playwright (usando la imagen oficial de Playwright basada en Ubuntu Focal)
FROM mcr.microsoft.com/playwright:focal

# Instalar Playwright con dependencias
RUN npx playwright install --with-deps

# Establecer el directorio de trabajo en la imagen
WORKDIR /app

# Configurar el PATH
ENV PATH /app/node_modules/.bin:$PATH

# Exponer el puerto 3000 para que la aplicación sea accesible
EXPOSE 3000

# Copiar los archivos de la aplicación al contenedor
COPY package*.json /app/
COPY src/ /app/src/
COPY server.js /app/  
# Si tienes más archivos necesarios, también debes copiarlos, como index.js si lo usas.

# Instalar dependencias
RUN npm install

# Comando para iniciar la aplicación
CMD ["nodemon", "server.js"]
