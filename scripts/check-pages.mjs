// Runs in GitHub Actions with its scoped token; never print credentials.
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const api = process.env.GITHUB_API_URL || 'https://api.github.com';

if (!repository || !token) throw new Error('Run this diagnostic inside GitHub Actions.');

async function request(path) {
  const response = await fetch(`${api}/repos/${repository}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Pages API HTTP ${response.status}: ${body.message || response.statusText}`);
  return body;
}

if (process.argv[2] === 'deployment') {
  const deployment = await request(`/pages/deployments/${encodeURIComponent(process.env.GITHUB_SHA)}`);
  console.log(JSON.stringify({
    status: deployment.status,
    error: deployment.error,
    page_url: deployment.page_url,
  }, null, 2));
} else {
  const site = await request('/pages');
  console.log(JSON.stringify({
    build_type: site.build_type,
    status: site.status,
    html_url: site.html_url,
    cname: site.cname,
  }, null, 2));
  if (site.build_type !== 'workflow') {
    throw new Error('Set Settings → Pages → Source to GitHub Actions before deploying.');
  }
}
