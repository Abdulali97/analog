import { NitroConfig, copyPublicAssets, prerender } from 'nitropack';
import { createNitro, build, prepare } from 'nitropack';
import * as fs from 'fs';

import { Options } from './options.js';
import { addPostRenderingHooks } from './hooks/post-rendering-hook.js';

export async function buildServer(
  options?: Options,
  nitroConfig?: NitroConfig
) {
  const nitro = await createNitro({
    dev: false,
    preset: process.env['BUILD_PRESET'],
    ...nitroConfig,
  });

  if (options?.prerender?.postRenderingHooks) {
    addPostRenderingHooks(nitro, options.prerender.postRenderingHooks);
  }

  await prepare(nitro);
  await copyPublicAssets(nitro);

  if (
    nitroConfig?.prerender?.routes &&
    nitroConfig?.prerender?.routes.find((route) => route === '/')
  ) {
    // Remove the root index.html so it can be replaced with the prerendered version
    if (fs.existsSync(`${nitroConfig?.output?.publicDir}/index.html`)) {
      fs.unlinkSync(`${nitroConfig?.output?.publicDir}/index.html`);
    }
  }

  console.log(`Prerendering static pages...`);
  await prerender(nitro);

  if (!options?.static) {
    console.log('Building Server...');
    await build(nitro);
  }

  await nitro.close();
}
