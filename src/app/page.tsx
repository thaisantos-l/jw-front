import { Home } from "@/components/Home";
import { endpoints } from "@/lib/server";
export const metadata = { alternates: { canonical: "/" } };
export default function Page() {
  return <Home contactEndpoint={endpoints().contact} />;
}
