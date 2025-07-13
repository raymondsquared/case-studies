import { Testing } from 'cdktf';

process.env.NODE_ENV = 'local';

jest.setTimeout(30000);

Testing.setupJest();

(global as any).testUtils = {};

console.log('Jest setup file loaded');
