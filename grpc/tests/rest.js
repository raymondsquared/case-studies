import http from 'k6/http';
import { check } from 'k6';

export const options = {
  iterations: 1000,
  vus: 100,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(50)', 'p(90)', 'p(95)', 'p(99)'],
  tlsAuth: [
    {
      domains: ['localhost'],
      cert: open('../go/assets/certificate.crt'),
      key: open('../go/assets/private.key'),
    },
  ],
  insecureSkipTLSVerify: true,
};

export default function () {
  let res = http.get('https://localhost:8080/movies?min_rating=0.0');
  check(res, { 'status is 200': (res) => res.status === 200 });
}
