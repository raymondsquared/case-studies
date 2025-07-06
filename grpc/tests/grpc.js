import { check } from 'k6';
import exec from 'k6/execution';
import grpc from 'k6/net/grpc';

export const options = {
  iterations: 1000,
  vus: 100,
  summaryTrendStats: [
    'avg',
    'min',
    'med',
    'max',
    'p(50)',
    'p(90)',
    'p(95)',
    'p(99)',
  ],
  insecureSkipTLSVerify: true,
};

const cert = open('../go/assets/tls/server-public.key');
const key = open('../go/assets/tls/server-private.key');

const client = new grpc.Client();
client.load(['../go/cmd/movie'], 'movie_services.proto');

export default () => {
  if (exec.vu.iterationInScenario == 0) {
    client.connect('localhost:50051', {
      tls: {
        cert: cert,
        key: key,
        ca: cert,
      },
    });
  }
  const data = { minimum_ratings_score: 0.0 };
  const response = client.invoke('/movie.Getter/GetMoviesByRatings', data, {
    metadata: {
      'x-api-key': 'abcd-efgh-1234-5678',
    },
  });

  check(response, {
    'status is OK': (r) => r && r.status === grpc.StatusOK,
  });

  // console.log(JSON.stringify(response));

  // Ideally, we should close the client on each VU after on its last run.
  // client.close();
};
