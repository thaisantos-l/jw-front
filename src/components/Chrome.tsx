"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useContent } from "./ContentProvider";
import { Container, Picture, SiteLink } from "./Primitives";
import { validLink } from "@/lib/content";
import styles from "./Site.module.scss";

export function Header() {
  const { site } = useContent();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = site.headerMenu.filter(validLink);
  useEffect(
    function closeOnEscape() {
      function escape(event: KeyboardEvent) {
        if (event.key === "Escape" && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }
      document.addEventListener("keydown", escape);
      return () => document.removeEventListener("keydown", escape);
    },
    [open],
  );
  return (
    <header className={styles.header}>
      <Container className={styles.headerInner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label={site.identity.name || undefined}
        >
          <Picture image={site.identity.logo} eager />
        </Link>
        {menu.length > 0 && (
          <>
            <button
              ref={toggle}
              type="button"
              className={styles.menuToggle}
              aria-expanded={open}
              aria-controls="jw-menu"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              onClick={() => setOpen(!open)}
            >
              <span />
              <span />
              <span />
            </button>
            <nav
              id="jw-menu"
              aria-label="Navegação principal"
              className={`${styles.nav} ${open ? styles.navOpen : ""}`}
            >
              <ul>
                {menu.map((link, i) => (
                  <li key={`${link.url}-${i}`}>
                    <SiteLink link={link} onClick={() => setOpen(false)} />
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}
      </Container>
    </header>
  );
}

export function Footer() {
  const { site } = useContent();
  const { identity, footer } = site;
  const menu = site.footerMenu.filter(validLink);
  const legal = [site.privacy, site.terms].filter((v) => v !== null);
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <Link
              href="/"
              aria-label={identity.name || undefined}
              className={styles.footerLogo}
            >
              <Picture image={identity.footerMark} decorative />
              <Picture image={identity.footerWordmark} />
            </Link>
            {footer.description && <p>{footer.description}</p>}
          </div>
          {menu.length > 0 && (
            <nav aria-label="Navegação do rodapé">
              {footer.navigationTitle && <h2>{footer.navigationTitle}</h2>}
              <ul>
                {menu.map((link, i) => (
                  <li key={`${link.url}-${i}`}>
                    <SiteLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {(validLink(footer.contactLink) || legal.length > 0) && (
            <nav aria-label="Contato e informações legais">
              {footer.contactTitle && <h2>{footer.contactTitle}</h2>}
              <ul>
                {validLink(footer.contactLink) && (
                  <li>
                    <SiteLink link={footer.contactLink} />
                  </li>
                )}
                {legal.map((page) => (
                  <li key={page.slug}>
                    <a href={`/${page.slug}/`}>{page.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
        {footer.copyright && (
          <p className={styles.copyright}>{footer.copyright}</p>
        )}
      </Container>
    </footer>
  );
}
