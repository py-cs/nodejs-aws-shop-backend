import express, { Response, Request } from 'express';
import { env } from './env';

const port = env.PORT;

const app = express();
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
    headers: { authorization: headers.authorization },
  };

  if (body && Object.keys(body).length) {
    requestParams.body = JSON.stringify(body);
  }

  const endpoint = `${serviceUrl}/${rest.join('/')}`;

  fetch(endpoint, requestParams)
    .then((res) => res.json())
    .then((json) => {
      console.log(json);
      response.status(200).json(json);
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
