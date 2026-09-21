import { expect, test } from '@playwright/test';

test('standalone OG renderer ships its WASM and produces a full-size PNG', async ({ request }) => {
  const response = await request.get('/api/og-image?title=Runtime%20verification');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
  const png = await response.body();
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});
