const defaultRepositoryUrl = 'https://github.com/lupesko/kamacafe';

function requireHttpsUrl(value: string | undefined, fallback: string, variable: string): string {
  const candidate = value?.trim() || fallback;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${variable} must be an absolute URL`);
  }
  if (url.protocol !== 'https:') throw new Error(`${variable} must use HTTPS`);
  return url.toString().replace(/\/$/, '');
}

export const repositoryUrl = requireHttpsUrl(
  import.meta.env.VITE_REPOSITORY_URL,
  defaultRepositoryUrl,
  'VITE_REPOSITORY_URL',
);
export const contributingUrl = requireHttpsUrl(
  import.meta.env.VITE_CONTRIBUTING_URL,
  `${repositoryUrl}/blob/main/CONTRIBUTING.md`,
  'VITE_CONTRIBUTING_URL',
);
