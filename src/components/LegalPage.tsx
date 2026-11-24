"use client";
import { useContent } from "./ContentProvider";
import { Container, RichText } from "./Primitives";
import styles from "./Site.module.scss";
export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { site } = useContent();
  const page = site[kind];
  return (
    <main id="conteudo" tabIndex={-1} className={styles.legal}>
      <Container>
        {page ? (
          <>
            <h1>{page.title}</h1>
            <RichText html={page.body} />
          </>
        ) : (
          <p>Este conteúdo ainda não foi publicado.</p>
        )}
      </Container>
    </main>
  );
}
