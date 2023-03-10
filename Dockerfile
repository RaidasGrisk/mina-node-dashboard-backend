# I always forget these so here goes:
# docker build -t eu.gcr.io/zk-snarkyjs-oracles/node-dashboard-bigquery-backend .
# docker run -p 8080:8080 eu.gcr.io/zk-snarkyjs-oracles/node-dashboard-bigquery-backend
# docker push eu.gcr.io/zk-snarkyjs-oracles/node-dashboard-bigquery-backend
# gcloud run deploy --image eu.gcr.io/zk-snarkyjs-oracles/node-dashboard-bigquery-backend


# Build dependencies
FROM node:18.12.1-alpine as dependencies
WORKDIR /app
COPY package.json .
RUN npm i
COPY index.js .
COPY queries.js .
COPY .env .
COPY key.json .

# Build production image
EXPOSE 8080
CMD npm run start
