FROM node:18

# Instala Python y herramientas necesarias
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install openpyxl

# Añade el entorno virtual al PATH
ENV PATH="/opt/venv/bin:$PATH"

# Establece el directorio de trabajo
WORKDIR /app

# Copia archivos de dependencias Node
COPY package.json package-lock.json ./

# Instala dependencias Node.js
RUN npm install --legacy-peer-deps

# Copia el resto del proyecto
COPY . .

# Expone el puerto
EXPOSE 3000

# Comando por defecto
CMD ["npm", "run", "dev"]
