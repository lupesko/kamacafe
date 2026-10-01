import { ArrowIcon } from './arrow-icon';

interface BackLinkProps {
  href: string;
  label: string;
}

export function BackLink({ href, label }: BackLinkProps) {
  return <a class="back-link" href={href}><ArrowIcon direction="left" />{label}</a>;
}
