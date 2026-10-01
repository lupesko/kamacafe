import { contributingUrl, repositoryUrl } from '../config';

export function SiteFooter() {
  return (
    <footer class="site-footer">
      <p>Make the next cup better.</p>
      <nav aria-label="Project links">
        <a href={repositoryUrl}>GitHub project</a>
        <a href={`${repositoryUrl}/issues`}>Report an issue</a>
        <a href={contributingUrl}>Contribute a recipe</a>
      </nav>
    </footer>
  );
}
