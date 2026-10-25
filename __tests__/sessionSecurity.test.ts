import {AxiosError, type InternalAxiosRequestConfig} from 'axios';
import {bumpSessionGeneration, createHttpClient, persistTokens, tokenStore, wipeTokens} from '../src/core/api/http';
import {queryClient} from '../src/core/query';
import {useSessionStore} from '../src/core/session';

const tokens = {accessToken: 'old', accountId: 'learner-a', expiresAt: '2099-01-01T00:00:00Z'};
const response = (config: InternalAxiosRequestConfig, data: unknown) => ({data, status: 200, statusText: 'OK', headers: {}, config});
const unauthorized = (config: InternalAxiosRequestConfig) => Promise.reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {...response(config, {}), status: 401}));

beforeEach(async () => { await wipeTokens(); queryClient.clear(); });
afterAll(async () => { await wipeTokens(); queryClient.clear(); });

it('sends the learner token only to routes marked learner-authenticated', async () => {
  await persistTokens(tokens);
  const client = createHttpClient();
  client.defaults.adapter = async config => response(config, {
    authorization: config.headers.Authorization,
  });
  const me = await client.get('/me');
  const home = await client.get('/home');
  const login = await client.post('/auth/login', {email: 'learner@example.com', password: 'secret1'});
  expect(me.data.authorization).toBe('Bearer old');
  expect(home.data.authorization).toBeUndefined();
  expect(login.data.authorization).toBeUndefined();
});

it('discards an old response when the account changes', async () => {
  await persistTokens(tokens);
  const client = createHttpClient();
  let finish!: () => void;
  client.defaults.adapter = config => new Promise(resolve => { finish = () => resolve(response(config, {private: true})); });
  const request = client.get('/me');
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  bumpSessionGeneration();
  finish();
  await expect(request).rejects.toMatchObject({code: 'session_changed'});
});

it('clears the learner token after an authenticated 401 without refreshing', async () => {
  await persistTokens(tokens);
  const client = createHttpClient();
  client.defaults.adapter = config => unauthorized(config);
  await expect(client.get('/me')).rejects.toMatchObject({httpStatus: 401});
  expect(tokenStore.getAccessToken()).toBeNull();
});

it('does not forward the access token to absolute third-party URLs', async () => {
  await persistTokens(tokens);
  const client = createHttpClient();
  const adapter = jest.fn();
  client.defaults.adapter = adapter;
  await expect(client.get('https://files.example.org/resource')).rejects.toMatchObject({code: 'unsafe_url'});
  expect(adapter).not.toHaveBeenCalled();
});

it('clears personalized catalogue, signed playback and result caches on logout', async () => {
  queryClient.setQueryData(['course', 'paid'], {access: 'granted'});
  queryClient.setQueryData(['lesson', 'private'], {playbackUrl: 'signed-url'});
  queryClient.setQueryData(['result', 'learner-a'], {score: 42});
  await useSessionStore.getState().logout();
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(useSessionStore.getState().status).toBe('loggedOut');
});
