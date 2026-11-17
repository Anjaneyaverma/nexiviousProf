"use client";

import { useEffect, useState } from "react";
import {
  defaultServices,
  defaultSettings,
  defaultTechnologies,
} from "../lib/default-content";

const steps = [
  {
    number: "01",
    title: "Get to know your goals",
    text: "We listen, ask useful questions, and get clear on your users, business priorities, and what success should look like.",
  },
  {
    number: "02",
    title: "Plan the right solution",
    text: "Together, we shape the scope, product experience, technical approach, and delivery plan before the build begins.",
  },
  {
    number: "03",
    title: "Build, test, refine",
    text: "You see progress throughout. We build in focused iterations, test carefully, and use your feedback to make the product better.",
  },
  {
    number: "04",
    title: "Launch and keep growing",
    text: "We help you launch with confidence and can continue to improve, support, and scale your product as your needs evolve.",
  },
];

function Icon({ name, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    web: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 6.5h.01M6 6.5h.01M10 14h8M10 17h5" />
      </>
    ),
    mobile: (
      <>
        <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
        <path d="M10 5h4M11 18.5h2" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
      </>
    ),
    cloud: (
      <>
        <path d="M7.5 18.5a5 5 0 0 1-.7-9.9A6.5 6.5 0 0 1 19.5 10a4.3 4.3 0 0 1-.5 8.5h-11Z" />
        <path d="m9 14 3-3 3 3M12 11v7" />
      </>
    ),
    support: (
      <>
        <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 13h3v6H6a2 2 0 0 1-2-2v-4ZM20 13h-3v6h1a2 2 0 0 0 2-2v-4ZM17 19a5 5 0 0 1-5 2" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Brand({ footer = false }) {
  return (
    <a className={`brand${footer ? " brand--footer" : ""}`} href="#top" aria-label="Nexivious home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className="brand-word">nexivious</span>
    </a>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [services, setServices] = useState(defaultServices);
  const [technologies, setTechnologies] = useState(defaultTechnologies);
  const [formStatus, setFormStatus] = useState({ state: "idle", message: "" });
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    let active = true;
    fetch("/api/content")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load the latest website content.");
        return response.json();
      })
      .then((content) => {
        if (!active) return;
        setSettings(content.settings);
        setServices(content.services);
        setTechnologies(content.technologies);
      })
      .catch((error) => {
        if (active) setFormStatus({ state: "content-error", message: error.message });
      });

    return () => {
      active = false;
    };
  }, []);

  async function submitInquiry(event) {
    event.preventDefault();
    setFormStatus({ state: "sending", message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          project: formData.get("project"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your message could not be sent.");

      form.reset();
      setFormStatus({ state: "success", message: result.message });
    } catch (error) {
      setFormStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Your message could not be sent.",
      });
    }
  }

  return (
    <main id="top">
      <header className="site-header">
        <div className="container nav-wrap">
          <Brand />
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
          <nav className={`main-nav${menuOpen ? " main-nav--open" : ""}`} aria-label="Main navigation">
            <a href="#services" onClick={closeMenu}>Services</a>
            <a href="#approach" onClick={closeMenu}>Our approach</a>
            <a href="#technologies" onClick={closeMenu}>Technologies</a>
            <a className="nav-cta" href="#contact" onClick={closeMenu}>
              Let&apos;s talk <Icon name="arrow" size={16} />
            </a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-orb hero-orb--one" />
        <div className="hero-orb hero-orb--two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR IDEAS, ENGINEERED FOR WHAT&apos;S NEXT</div>
            <h1>{settings.heroTitle} <span>{settings.heroAccent}</span></h1>
            <p className="hero-lead">{settings.heroDescription}</p>
            <div className="hero-actions">
              <a className="button button--primary" href="#contact">
                Tell us what you&apos;re building <Icon name="arrow" size={18} />
              </a>
              <a className="text-link" href="#services">Explore what we do <span>↓</span></a>
            </div>
            <div className="hero-note">
              <span className="note-icon"><Icon name="pin" size={17} /></span>
              <span>Based in {settings.contactLocation} <i /> Building for everywhere</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Illustration of connected digital product interfaces">
            <div className="visual-glow" />
            <div className="visual-grid" />
            <div className="visual-card visual-card--main">
              <div className="mock-topbar">
                <span className="mock-dots"><i /><i /><i /></span>
                <span className="mock-address">your-next-big-idea.com</span>
                <span className="mock-menu">···</span>
              </div>
              <div className="mock-content">
                <div className="mock-heading-line" />
                <div className="mock-heading-line mock-heading-line--short" />
                <div className="mock-description-line" />
                <div className="mock-description-line mock-description-line--short" />
                <div className="mock-button"><span /> <Icon name="arrow" size={12} /></div>
                <div className="mock-chart">
                  <div className="chart-label"><span>Product growth</span><strong>+38.6%</strong></div>
                  <svg viewBox="0 0 340 100" role="img" aria-label="Illustrative upward growth chart">
                    <defs>
                      <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#46a8ed" stopOpacity=".24" />
                        <stop offset="100%" stopColor="#46a8ed" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 78 C28 75 29 60 58 66 S96 55 112 58 S145 35 169 44 S200 51 223 35 S255 39 276 22 S315 21 340 5 V100 H0Z" fill="url(#chartFill)" />
                    <path d="M0 78 C28 75 29 60 58 66 S96 55 112 58 S145 35 169 44 S200 51 223 35 S255 39 276 22 S315 21 340 5" fill="none" stroke="#38a7ed" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="340" cy="5" r="4" fill="#38a7ed" />
                  </svg>
                  <div className="chart-axis"><span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span></div>
                </div>
              </div>
            </div>
            <div className="floating-card floating-card--top">
              <span className="floating-icon"><Icon name="spark" size={17} /></span>
              <span><strong>Made for people</strong><small>Designed with intention</small></span>
              <span className="mini-check"><Icon name="check" size={13} /></span>
            </div>
            <div className="floating-card floating-card--bottom">
              <span className="status-pulse" />
              <span><strong>Built to scale</strong><small>Ready for what&apos;s next</small></span>
              <span className="status-bars"><i /><i /><i /><i /></span>
            </div>
            <div className="visual-caption"><span /> Thoughtful design. Dependable engineering.</div>
          </div>
        </div>
        <div className="container hero-bottom">
          <span>FROM A FIRST IDEA TO A PRODUCT PEOPLE LOVE</span>
          <a href="#services">See how we can help <span>↓</span></a>
        </div>
      </section>

      <section className="intro-section">
        <div className="container intro-grid">
          <p className="section-kicker">A TECHNOLOGY PARTNER, NOT JUST A VENDOR</p>
          <div>
            <h2>{settings.introTitle} <span>{settings.introAccent}</span></h2>
            <p className="intro-body">{settings.introDescription}</p>
          </div>
        </div>
      </section>

      <section className="services-section section-pad" id="services">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="section-kicker">WHAT WE DO</p>
              <h2>Everything you need to <span>build with confidence.</span></h2>
            </div>
            <p>One collaborative team for the thinking, design, development, and ongoing care your product needs.</p>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service.number}>
                <div className="service-top">
                  <span className="service-icon"><Icon name={service.icon} size={23} /></span>
                  <span className="service-number">{service.number}</span>
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <div className="tag-list">
                  {service.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </article>
            ))}
          </div>
          <div className="services-foot">
            <span>Not sure where to start? That&apos;s a good place to start.</span>
            <a href="#contact">Talk through your idea <Icon name="arrow" size={16} /></a>
          </div>
        </div>
      </section>

      <section className="approach-section section-pad" id="approach">
        <div className="container approach-grid">
          <div className="approach-intro">
            <p className="section-kicker">HOW WE WORK</p>
            <h2>A clear path from <span>first conversation</span> to launch day.</h2>
            <p>
              Good collaboration makes better products. You work directly with a team
              that keeps the process transparent, decisions grounded, and progress moving.
            </p>
            <a className="text-link text-link--dark" href="#contact">Start a conversation <Icon name="arrow" size={16} /></a>
          </div>
          <div className="steps-list">
            {steps.map((step) => (
              <article className="step" key={step.number}>
                <span className="step-number">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="technology-section section-pad" id="technologies">
        <div className="container technology-grid">
          <div className="technology-intro">
            <p className="section-kicker">THE RIGHT TOOLS FOR THE JOB</p>
            <h2>Flexible by design. <span>Practical by default.</span></h2>
            <p>
              There is no one-size-fits-all tech stack. We select proven languages,
              frameworks, and platforms based on your product, team, timeline, and plans
              for the future.
            </p>
          </div>
          <div className="technology-list">
            {technologies.map((technology, index) => (
              <div className="technology-row" key={technology.title}>
                <span className="technology-index">0{index + 1}</span>
                <div><h3>{technology.title}</h3><p>{technology.items}</p></div>
                <Icon name="arrow" size={17} />
              </div>
            ))}
            <p className="technology-note">And more, chosen to fit your requirements rather than a trend.</p>
          </div>
        </div>
      </section>

      <section className="audience-section">
        <div className="container audience-inner">
          <div>
            <p className="section-kicker">BUILT AROUND YOUR BUSINESS</p>
            <h2>Whether you&apos;re starting fresh or scaling what works.</h2>
          </div>
          <div className="audience-items">
            <div><span className="audience-dot" /><p><strong>Founders & startups</strong><br />Validate your idea, launch a focused MVP, and learn from real users.</p></div>
            <div><span className="audience-dot" /><p><strong>Growing businesses</strong><br />Give your customers better digital experiences and your team smarter tools.</p></div>
            <div><span className="audience-dot" /><p><strong>Established teams</strong><br />Modernize systems, extend your capacity, and move important initiatives forward.</p></div>
          </div>
        </div>
      </section>

      <section className="contact-section section-pad" id="contact">
        <div className="container contact-grid">
          <div className="contact-copy">
            <p className="section-kicker">LET&apos;S MAKE SOMETHING MEANINGFUL</p>
            <h2>Your next great product starts with <span>a conversation.</span></h2>
            <p>
              Tell us what you have in mind, what&apos;s getting in the way, or what you
              want to make possible. We&apos;ll get back to you to learn more and talk through
              a practical next step.
            </p>
            <div className="contact-location"><span><Icon name="pin" size={18} /></span><div><strong>Based in {settings.contactLocation}</strong><small>Working with teams wherever they are.</small></div></div>
          </div>
          <form
            className="contact-form"
            onSubmit={submitInquiry}
          >
            <div className="form-heading"><span>01 / SAY HELLO</span><span className="form-indicator"><i /> OPEN TO NEW PROJECTS</span></div>
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" type="text" placeholder="How should we address you?" autoComplete="name" required />
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
            <label htmlFor="project">A little about your project</label>
            <textarea id="project" name="project" rows="4" placeholder="What are you hoping to build or improve?" required />
            <button className="button button--primary form-submit" type="submit" disabled={formStatus.state === "sending"}>
              {formStatus.state === "sending" ? "Sending..." : "Start the conversation"} <Icon name="arrow" size={17} />
            </button>
            <p className={`form-note${formStatus.state === "error" || formStatus.state === "content-error" ? " form-note--error" : ""}`} role="status" aria-live="polite">
              {formStatus.message || "Your details are only used to respond to your inquiry."}
            </p>
          </form>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand-block">
            <Brand footer />
            <p>Digital products, thoughtfully engineered.<br />Made in Noida. Built for what&apos;s next.</p>
          </div>
          <div className="footer-links">
            <div><span>EXPLORE</span><a href="#services">Services</a><a href="#approach">Our approach</a><a href="#technologies">Technologies</a></div>
            <div><span>GET IN TOUCH</span><a href="#contact">Start a project</a><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a><a href="#top"><Icon name="pin" size={14} /> {settings.contactLocation}</a></div>
          </div>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} Nexivious. All rights reserved.</span><a href="#top">Back to top ↑</a><span>Thoughtful technology. Real-world impact.</span></div>
      </footer>
    </main>
  );
}
