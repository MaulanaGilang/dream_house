type Props = { className?: string; title?: string };

/** The La Casa mark: a maroon arch with a silver inner arch. */
export function ArchMark({ className, title }: Props) {
  return (
    <svg viewBox="0 0 40 48" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d="M2 48V20a18 18 0 0 1 36 0v28z" fill="var(--color-maroon)" />
      <path d="M9.5 48V21a10.5 10.5 0 0 1 21 0v27" fill="none" stroke="var(--color-silver)" strokeWidth="2.4" />
    </svg>
  );
}
