FROM node:8.11.1
WORKDIR /app
COPY . /app/
RUN npm cache clean --force && npm install
CMD node --max-old-space-size=1024 app.js
EXPOSE 8081

# This default user is created in the openshift docker images image
USER 1001
