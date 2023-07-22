import express, { Response, Request } from 'express';
import { env } from './env';
import cors from 'cors';

const PRODUCTS_ENDPOINT = `${env.product}/products`;
let productsCache: string | null = null;

const port = env.PORT;

const app = express();
app.use(cors());
app.use(express.json());

app.all('*', (request: Request, response: Response) => {
  const { originalUrl, body, method, headers } = request;
  const [_, service, ...rest] = originalUrl.split('/');

  const serviceUrl = env[service];
  if (!serviceUrl) {
    return response.status(502).send('Cannot process request');
  }

  const requestParams: RequestInit = {
    method,
    headers: {
      authorization: headers.authorization,
      'Content-Type': 'application/json',
    },
  };

  if (body && Object.keys(body).length) {
    requestParams.body = JSON.stringify(body);
  }

  const endpoint = `${serviceUrl}/${rest.join('/')}`;

  if (endpoint === PRODUCTS_ENDPOINT && productsCache) {
    return response.status(200).send(productsCache);
  }

  fetch(endpoint, requestParams)
    .then((res) => {
      response.status(res.status);
      return res.json();
    })
    .then((data) => {
      if (endpoint === PRODUCTS_ENDPOINT) {
        productsCache = data;
        setTimeout(
          () => {
            productsCache = null;
          },
          env.CACHE_TIME * 60 * 1_000,
        );
      }
      response.send(data);
    })
    .catch((err) =>
      response.status(err.status || 500).send(err.message || err.toString()),
    );
});

app.listen(port, () => {
  console.log(`BFF listening on port ${port}`);
});
