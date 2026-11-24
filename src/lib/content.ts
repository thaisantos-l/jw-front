export type Media = {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
  srcSet: string;
};
export type Link = { label: string; url: string; newTab: boolean };
export type Heading = { eyebrow: string; title: string; highlight: string };
export type Item = {
  title: string;
  description: string;
  subtitle?: string;
  icon?: Media | null;
};
export type Property = {
  id: number;
  title: string;
  image: Media | null;
  location: string;
  kind: string;
  ticket: string;
  status: string;
  link: Link;
};
export type Legal = {
  title: string;
  slug: "privacidade" | "termos";
  body: string;
};
export type Home = {
  id: number;
  hero: Heading & {
    description: string;
    image: Media | null;
    primary: Link;
    secondary: Link;
  };
  about: Heading & { body: string };
  institutional: { image: Media | null; decorative: boolean };
  activities: Heading & { items: Item[] };
  thesis: Heading & { items: Item[] };
  criteria: Heading & { items: Item[] };
  portfolio: Heading & { enabled: boolean; properties: Property[] };
  steps: Heading & { items: Item[] };
  faq: Heading & { items: { question: string; answer: string }[] };
  contact: Heading & { submitLabel: string };
};
export type Content = {
  home: Home | null;
  site: {
    identity: {
      name: string;
      seoTitle: string;
      seoDescription: string;
      logo: Media | null;
      footerMark: Media | null;
      footerWordmark: Media | null;
      socialImage: Media | null;
    };
    contacts: {
      email: string;
      phone: string;
      instagramHandle: string;
      instagramUrl: string;
      channelsLabel: string;
      formEnabled: boolean;
      addresses: { title: string; address: string }[];
    };
    footer: {
      description: string;
      copyright: string;
      navigationTitle: string;
      contactTitle: string;
      contactLink: Link;
    };
    headerMenu: Link[];
    footerMenu: Link[];
    privacy: Legal | null;
    terms: Legal | null;
  };
};
export type Snapshot = {
  schemaVersion: 1;
  revision: string;
  digest: string;
  generatedAt: string;
  data: Content;
};

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): string =>
  typeof value === "string" ? value : "";
export function safeUrl(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    /[\s\\\u0000-\u001f]/u.test(value)
  )
    return "";
  if (/^(#[A-Za-z][\w-]*|\/(?!\/)[^<>]*)$/.test(value)) return value;
  try {
    const url = new URL(value);
    return !url.username &&
      !url.password &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)))
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export const validLink = (link: Link | null | undefined): link is Link =>
  Boolean(link?.label && safeUrl(link.url));
export function media(value: unknown): Media | null {
  if (
    !record(value) ||
    !safeUrl(value.src) ||
    typeof value.width !== "number" ||
    typeof value.height !== "number" ||
    value.width <= 0 ||
    value.height <= 0
  )
    return null;
  const candidates = text(value.srcSet)
    .split(",")
    .map((v) => v.trim())
    .filter((v) => {
      const match = v.match(/^(\S+)\s+(\d+)w$/);
      return match && safeUrl(match[1]) && Number(match[2]) > 0;
    });
  return {
    id: Number(value.id),
    src: safeUrl(value.src),
    alt: text(value.alt),
    width: value.width,
    height: value.height,
    srcSet: [...new Set(candidates)].join(", "),
  };
}

type Shape =
  | "string"
  | "number"
  | "boolean"
  | { nullable: Shape }
  | { list: Shape }
  | { object: Record<string, Shape> };
const imageShape: Shape = {
  nullable: {
    object: {
      id: "number",
      src: "string",
      alt: "string",
      width: "number",
      height: "number",
      srcSet: "string",
    },
  },
};
const linkShape: Shape = {
  object: { label: "string", url: "string", newTab: "boolean" },
};
const headingShape: Record<string, Shape> = {
  eyebrow: "string",
  title: "string",
  highlight: "string",
};
const itemShape: Record<string, Shape> = {
  title: "string",
  description: "string",
};
const sectionShape = (extra: Record<string, Shape>): Shape => ({
  object: { ...headingShape, ...extra },
});
const legalShape: Shape = {
  nullable: { object: { title: "string", slug: "string", body: "string" } },
};
const contentShape: Shape = {
  object: {
    home: {
      nullable: {
        object: {
          id: "number",
          hero: sectionShape({
            description: "string",
            image: imageShape,
            primary: linkShape,
            secondary: linkShape,
          }),
          about: sectionShape({ body: "string" }),
          institutional: {
            object: { image: imageShape, decorative: "boolean" },
          },
          activities: sectionShape({
            items: { list: { object: { ...itemShape, subtitle: "string" } } },
          }),
          thesis: sectionShape({ items: { list: { object: itemShape } } }),
          criteria: sectionShape({
            items: { list: { object: { ...itemShape, icon: imageShape } } },
          }),
          portfolio: sectionShape({
            enabled: "boolean",
            properties: {
              list: {
                object: {
                  id: "number",
                  title: "string",
                  image: imageShape,
                  location: "string",
                  kind: "string",
                  ticket: "string",
                  status: "string",
                  link: linkShape,
                },
              },
            },
          }),
          steps: sectionShape({ items: { list: { object: itemShape } } }),
          faq: sectionShape({
            items: {
              list: { object: { question: "string", answer: "string" } },
            },
          }),
          contact: sectionShape({ submitLabel: "string" }),
        },
      },
    },
    site: {
      object: {
        identity: {
          object: {
            name: "string",
            seoTitle: "string",
            seoDescription: "string",
            logo: imageShape,
            footerMark: imageShape,
            footerWordmark: imageShape,
            socialImage: imageShape,
          },
        },
        contacts: {
          object: {
            email: "string",
            phone: "string",
            instagramHandle: "string",
            instagramUrl: "string",
            channelsLabel: "string",
            formEnabled: "boolean",
            addresses: {
              list: { object: { title: "string", address: "string" } },
            },
          },
        },
        footer: {
          object: {
            description: "string",
            copyright: "string",
            navigationTitle: "string",
            contactTitle: "string",
            contactLink: linkShape,
          },
        },
        headerMenu: { list: linkShape },
        footerMenu: { list: linkShape },
        privacy: legalShape,
        terms: legalShape,
      },
    },
  },
};
function matches(value: unknown, shape: Shape): boolean {
  if (typeof shape === "string")
    return (
      typeof value === shape && (shape !== "number" || Number.isFinite(value))
    );
  if ("nullable" in shape)
    return value === null || matches(value, shape.nullable);
  if ("list" in shape)
    return (
      Array.isArray(value) &&
      value.length <= 40 &&
      value.every((item) => matches(item, shape.list))
    );
  return (
    record(value) &&
    Object.entries(shape.object).every(([key, child]) =>
      matches(value[key], child),
    )
  );
}

/** Reject partial envelopes; keep the last valid page instead of rendering a broken update. */
export function parseSnapshot(value: unknown): Snapshot | null {
  if (
    !record(value) ||
    value.schemaVersion !== 1 ||
    typeof value.revision !== "string" ||
    !/^[a-f\d]{64}$/.test(text(value.digest)) ||
    typeof value.generatedAt !== "string" ||
    !record(value.data)
  )
    return null;
  if (!matches(value.data, contentShape)) return null;
  return value as Snapshot;
}
