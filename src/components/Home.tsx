"use client";
import { useContent } from "./ContentProvider";
import { ContactForm } from "./ContactForm";
import {
  Container,
  Decor,
  Picture,
  RichText,
  SectionHeading,
  SiteLink,
  Title,
} from "./Primitives";
import {
  media,
  safeUrl,
  validLink,
  type Heading,
  type Home as HomeContent,
} from "@/lib/content";
import styles from "./Site.module.scss";

const hasHeading = (value: Heading) => Boolean(value.eyebrow || value.title);
const labelled = (value: Heading, id: string) => (value.title ? id : undefined);
function Anchor({ id }: { id: string }) {
  return <div id={id} tabIndex={-1} />;
}

function Hero({ value }: { value: HomeContent["hero"] }) {
  if (
    !value.title &&
    !value.description &&
    !media(value.image) &&
    !validLink(value.primary) &&
    !validLink(value.secondary)
  )
    return null;
  return (
    <section
      className={styles.hero}
      aria-labelledby={value.title ? "hero-title" : undefined}
    >
      <Picture
        image={value.image}
        decorative
        eager
        className={styles.heroImage}
        sizes="100vw"
      />
      <Container>
        <div className={styles.heroCopy}>
          {value.eyebrow && <p className={styles.eyebrow}>{value.eyebrow}</p>}
          {value.title && (
            <h1 id="hero-title">
              <Title title={value.title} highlight={value.highlight} />
            </h1>
          )}
          {value.description && (
            <p className={styles.heroDescription}>{value.description}</p>
          )}
          <div className={styles.heroActions}>
            {validLink(value.primary) && (
              <SiteLink link={value.primary} className={styles.button} />
            )}{" "}
            {validLink(value.secondary) && (
              <SiteLink
                link={value.secondary}
                className={`${styles.button} ${styles.outline}`}
              >
                <Decor file="6b124.svg" width={282} height={55} />
                <span>{value.secondary.label}</span>
              </SiteLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
function About({ value }: { value: HomeContent["about"] }) {
  if (!hasHeading(value) && !value.body) return <Anchor id="sobre" />;
  return (
    <section
      id="sobre"
      tabIndex={-1}
      className={styles.about}
      aria-labelledby={labelled(value, "about-title")}
    >
      <Container className={styles.aboutGrid}>
        <SectionHeading value={value} id="about-title" />
        <RichText html={value.body} />
      </Container>
    </section>
  );
}
function Activities({ value }: { value: HomeContent["activities"] }) {
  const items = value.items.filter(
    (item) => item.title || item.description || item.subtitle,
  );
  if (!hasHeading(value) && !items.length) return null;
  return (
    <section
      className={styles.activities}
      aria-labelledby={labelled(value, "activities-title")}
    >
      <Container>
        <SectionHeading value={value} id="activities-title" />
        {items.length > 0 && (
          <ul className={styles.activitiesGrid}>
            {items.map((item, i) => (
              <li key={i}>
                {item.title && <h3>{item.title}</h3>}
                {item.subtitle && (
                  <p className={styles.subtitle}>{item.subtitle}</p>
                )}
                {item.description && (
                  <p className={styles.activityDescription}>
                    {item.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
function Thesis({ value }: { value: HomeContent["thesis"] }) {
  const items = value.items.filter((item) => item.title || item.description);
  if (!hasHeading(value) && !items.length) return <Anchor id="tese" />;
  return (
    <section
      id="tese"
      tabIndex={-1}
      className={styles.thesis}
      aria-labelledby={labelled(value, "thesis-title")}
    >
      <Container>
        <SectionHeading value={value} id="thesis-title" />
        {items.length > 0 && (
          <ul className={styles.thesisGrid}>
            {items.map((item, i) => (
              <li key={i}>
                {item.title && <h3>{item.title}</h3>}
                {item.description && <p>{item.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
function Criteria({ value }: { value: HomeContent["criteria"] }) {
  const items = value.items.filter((item) => item.title || item.description);
  if (!hasHeading(value) && !items.length) return null;
  return (
    <section
      className={styles.criteria}
      aria-labelledby={labelled(value, "criteria-title")}
    >
      <Container className={styles.criteriaLayout}>
        <SectionHeading value={value} id="criteria-title" />
        {items.length > 0 && (
          <ul className={styles.criteriaGrid}>
            {items.map((item, i) => (
              <li key={i}>
                <Picture
                  image={item.icon}
                  decorative
                  className={styles.criterionIcon}
                />
                {item.title && <h3>{item.title}</h3>}
                {item.description && <p>{item.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
function Portfolio({ value }: { value: HomeContent["portfolio"] }) {
  const items = value.properties.filter(
    (item) =>
      item.title ||
      item.location ||
      item.kind ||
      item.ticket ||
      item.status ||
      media(item.image),
  );
  if (!value.enabled || (!hasHeading(value) && !items.length)) return null;
  return (
    <section
      id="portfolio"
      tabIndex={-1}
      className={styles.portfolio}
      aria-labelledby={labelled(value, "portfolio-title")}
    >
      <Container>
        <SectionHeading value={value} id="portfolio-title" />
        {items.length > 0 && (
          <ul className={styles.properties}>
            {items.map((item, i) => {
              const card = (
                <>
                  <Picture
                    image={item.image}
                    className={styles.propertyImage}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  />
                  <div className={styles.propertyBody}>
                    {item.location && (
                      <p className={styles.propertyLocation}>{item.location}</p>
                    )}
                    {item.title && <h3>{item.title}</h3>}
                    <dl>
                      {[
                        ["TIPO", item.kind],
                        ["TICKET", item.ticket],
                        ["STATUS", item.status],
                      ].map(([label, text]) =>
                        text ? (
                          <div key={label}>
                            <Decor
                              file="389ca.svg"
                              width={339}
                              height={1}
                              className={styles.propertyDivider}
                            />
                            <dt>{label}</dt>
                            <dd>
                              {label === "STATUS" ? (
                                <span className={styles.badge}>
                                  <Decor
                                    file="6fd91.svg"
                                    width={7}
                                    height={7}
                                  />
                                  {text}
                                </span>
                              ) : (
                                text
                              )}
                            </dd>
                          </div>
                        ) : null,
                      )}
                    </dl>
                  </div>
                </>
              );
              return (
                <li key={`${item.id}-${i}`} className={styles.propertyCard}>
                  {safeUrl(item.link.url) ? (
                    <SiteLink link={item.link} className={styles.propertyLink}>
                      {card}
                    </SiteLink>
                  ) : (
                    <div>{card}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </section>
  );
}
function Steps({ value }: { value: HomeContent["steps"] }) {
  const items = value.items.filter((item) => item.title || item.description);
  if (!hasHeading(value) && !items.length) return <Anchor id="como-investir" />;
  return (
    <section
      id="como-investir"
      tabIndex={-1}
      className={styles.steps}
      aria-labelledby={labelled(value, "steps-title")}
    >
      <Container className={styles.stepsLayout}>
        <SectionHeading value={value} id="steps-title" />
        {items.length > 0 && (
          <ol className={styles.stepList}>
            {items.map((item, i) => (
              <li key={i}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  {item.title && <h3>{item.title}</h3>}
                  {item.description && <p>{item.description}</p>}
                </div>
                {i < items.length - 1 && (
                  <Decor
                    file="40e7b.svg"
                    width={539}
                    height={1}
                    className={styles.stepDivider}
                  />
                )}
              </li>
            ))}
          </ol>
        )}
      </Container>
    </section>
  );
}
function FAQ({ value }: { value: HomeContent["faq"] }) {
  const items = value.items.filter((item) => item.question && item.answer);
  if (!items.length) return null;
  return (
    <section
      className={styles.faq}
      aria-labelledby={labelled(value, "faq-title")}
    >
      <Container className={styles.faqLayout}>
        <SectionHeading value={value} id="faq-title" />
        <div className={styles.faqItems}>
          {items.map((item, i) => (
            <details key={item.question} name="jw-faq" open={i === 0}>
              <summary>
                {item.question}
                <Decor
                  file="37404.svg"
                  width={24}
                  height={24}
                  className={styles.plus}
                />
                <Decor
                  file="283b3.svg"
                  width={24}
                  height={24}
                  className={styles.minus}
                />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
export function Home({ contactEndpoint }: { contactEndpoint: string }) {
  const { home, site } = useContent();
  if (!home) return <main id="conteudo" tabIndex={-1} />;
  const { contacts } = site;
  const phone = contacts.phone.replace(/[^+0-9]/g, "");
  const showContact =
    hasHeading(home.contact) ||
    contacts.formEnabled ||
    contacts.email ||
    contacts.phone ||
    contacts.instagramHandle ||
    contacts.addresses.some((a) => a.address);
  return (
    <main id="conteudo" tabIndex={-1}>
      <Hero value={home.hero} />
      <About value={home.about} />
      {media(home.institutional.image) &&
        (home.institutional.decorative || home.institutional.image?.alt) && (
          <div className={styles.institutional}>
            <Picture
              image={home.institutional.image}
              decorative={home.institutional.decorative}
              sizes="100vw"
            />
          </div>
        )}
      <Activities value={home.activities} />
      <Thesis value={home.thesis} />
      <Criteria value={home.criteria} />
      <Portfolio value={home.portfolio} />
      <Steps value={home.steps} />
      <FAQ value={home.faq} />
      {showContact ? (
        <section
          id="contato"
          tabIndex={-1}
          className={styles.contact}
          aria-labelledby={labelled(home.contact, "contact-title")}
        >
          <Container>
            <SectionHeading value={home.contact} id="contact-title" />
            <div className={styles.contactLayout}>
              {contacts.formEnabled && (
                <ContactForm
                  endpoint={contactEndpoint}
                  label={home.contact.submitLabel}
                />
              )}
              <div className={styles.contactDetails}>
                {contacts.addresses
                  .filter((a) => a.address)
                  .map((address, i) => (
                    <div key={i} className={styles.contactBlock}>
                      {address.title && <h3>{address.title}</h3>}
                      <p>{address.address}</p>
                    </div>
                  ))}
                {(contacts.email ||
                  contacts.phone ||
                  contacts.instagramHandle) && (
                  <div className={styles.contactBlock}>
                    {contacts.channelsLabel && (
                      <h3>{contacts.channelsLabel}</h3>
                    )}
                    <ul>
                      {contacts.email && (
                        <li>
                          <a href={`mailto:${contacts.email}`}>
                            {contacts.email}
                          </a>
                        </li>
                      )}
                      {contacts.instagramHandle && (
                        <li>
                          {safeUrl(contacts.instagramUrl) ? (
                            <a
                              href={safeUrl(contacts.instagramUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {contacts.instagramHandle}
                            </a>
                          ) : (
                            contacts.instagramHandle
                          )}
                        </li>
                      )}
                      {contacts.phone && (
                        <li>
                          {/^[+]?[0-9]{8,15}$/.test(phone) ? (
                            <a href={`tel:${phone}`}>{contacts.phone}</a>
                          ) : (
                            contacts.phone
                          )}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>
      ) : (
        <Anchor id="contato" />
      )}
    </main>
  );
}
