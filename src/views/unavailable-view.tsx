export function UnavailableView({ hash }: { hash: string }) {
  return (
    <main class="page unavailable-view">
      <p class="eyebrow">Coffee guide</p>
      <h1>Page unavailable</h1>
      <p>There is no published coffee category or drink at <code>{hash || '#'}</code>.</p>
      <a class="home-link" href="#">Return home</a>
    </main>
  );
}
