import { execa, Options, ResultPromise } from 'execa';
import type { Context } from './@types/semantic-release';
import { DefaultConfig } from './default-options';
import { PluginConfig } from './types';
import { pipe } from './util.js';

function publishPackage(
  srcDir: string,
  distDir: string,
  repoUrl: string,
  gpgSign: boolean,
  gpgIdentity?: string,
  options?: Options,
): ResultPromise {
  const signArgs = gpgSign ? ['--sign'] : [];
  if (gpgIdentity) {
    signArgs.push('--identity', gpgIdentity);
  }

  return execa(
    'python3',
    [
      '-m',
      'twine',
      'upload',
      '--repository-url',
      repoUrl,
      '--non-interactive',
      '--skip-existing',
      '--verbose',
      ...signArgs,
      `${distDir}/*`,
    ].filter((arg) => arg !== null),
    {
      ...options,
      cwd: srcDir,
      env: {
        ...options?.env,
        TWINE_USERNAME: process.env['PYPI_USERNAME']
          ? process.env['PYPI_USERNAME']
          : '__token__',
        TWINE_PASSWORD: process.env['PYPI_TOKEN'],
      },
    },
  );
}

async function publish(pluginConfig: PluginConfig, context: Context) {
  const { logger } = context;
  const { srcDir, distDir, pypiPublish, gpgSign, gpgIdentity, repoUrl } =
    new DefaultConfig(pluginConfig);

  if (pypiPublish !== false) {
    logger.log(`Publishing package to ${repoUrl}`);
    const result = publishPackage(
      srcDir,
      distDir,
      process.env['PYPI_REPO_URL'] ?? repoUrl,
      gpgSign,
      gpgIdentity,
      pipe(context),
    );
    await result;
  } else {
    logger.log('Not publishing package due to requested configuration');
  }
}

export { publish, publishPackage };
