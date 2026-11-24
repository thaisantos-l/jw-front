import Link from "next/link";
export default function NotFound() {
  return (
    <main id="conteudo" style={{ padding: "100px 24px", textAlign: "center" }}>
      <h1>Página não encontrada</h1>
      <p>
        <Link href="/">Voltar ao início</Link>
      </p>
    </main>
  );
}
