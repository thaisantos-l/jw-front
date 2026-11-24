/* eslint-disable @next/next/no-img-element -- Preserve native CMS srcset and original SVG assets in the static export. */
import type { ReactNode } from "react";
import {
  media,
  safeUrl,
  type Heading,
  type Link,
  type Media,
} from "@/lib/content";
import styles from "./Site.module.scss";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${styles.container} ${className}`}>{children}</div>;
}
export function Picture({
  image,
  decorative = false,
  className = "",
  sizes,
  eager = false,
}: {
  image: Media | null | undefined;
  decorative?: boolean;
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const value = media(image);
  if (!value || (!decorative && !value.alt.trim())) return null;
  // Native CMS srcset is intentionally preserved without a remote optimizer.
  return (
    <img
      className={className}
      src={value.src}
      alt={decorative ? "" : value.alt}
      width={value.width}
      height={value.height}
      srcSet={value.srcSet || undefined}
      sizes={value.srcSet ? sizes : undefined}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
    />
  );
}
export function Decor({
  file,
  className = "",
  width,
  height,
}: {
  file: string;
  className?: string;
  width: number;
  height: number;
}) {
  return (
    <img
      src={`/icons/${file}`}
      alt=""
      aria-hidden="true"
      className={className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}
export function Title({
  title,
  highlight,
}: {
  title: string;
  highlight: string;
}) {
  const index = highlight ? title.indexOf(highlight) : -1;
  return index < 0 ? (
    title
  ) : (
    <>
      {title.slice(0, index)}
      <span className={styles.highlight}>{highlight}</span>
      {title.slice(index + highlight.length)}
    </>
  );
}
export function SectionHeading({ value, id }: { value: Heading; id: string }) {
  return (
    <div className={styles.heading}>
      {value.eyebrow && <p className={styles.eyebrow}>{value.eyebrow}</p>}
      {value.title && (
        <h2 id={id}>
          <Title title={value.title} highlight={value.highlight} />
        </h2>
      )}
    </div>
  );
}
export function SiteLink({
  link,
  children,
  className = "",
  onClick,
}: {
  link: Link;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const rawHref = safeUrl(link.url);
  const href = rawHref.startsWith("#") ? "/" + rawHref : rawHref;
  return href ? (
    <a
      href={href}
      target={link.newTab ? "_blank" : undefined}
      rel={link.newTab ? "noopener noreferrer" : undefined}
      className={className}
      onClick={onClick}
    >
      {children ?? link.label}
    </a>
  ) : (
    <>{children ?? link.label}</>
  );
}
export function RichText({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  return html ? (
    <div
      className={`${styles.rich} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : null;
}
