"use client";

import { useEffect, useState } from "react";

async function readResponse(response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}

function makeEditableContent(content) {
  return {
    ...content,
    services: content.services.map((service) => ({
      ...service,
      tagsText: service.tags.join(", "),
    })),
  };
}

export default function AdminPage() {
  const [session, setSession] = useState({ checking: true, configured: false, authenticated: false });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState("content");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const status = await readResponse(await fetch("/api/admin/session"));
        if (!active) return;
        setSession({ checking: false, ...status });
        if (status.authenticated) {
          const [content, inbox] = await Promise.all([
            fetch("/api/admin/content").then(readResponse),
            fetch("/api/admin/inquiries").then(readResponse),
          ]);
          if (!active) return;
          setDraft(makeEditableContent(content));
          setInquiries(inbox.inquiries);
        }
      } catch (requestError) {
        if (active) {
          setSession((current) => ({ ...current, checking: false }));
          setError(requestError.message);
        }
      }
    }

    initialize();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await readResponse(
        await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }),
      );
      const [content, inbox] = await Promise.all([
        fetch("/api/admin/content").then(readResponse),
        fetch("/api/admin/inquiries").then(readResponse),
      ]);
      setDraft(makeEditableContent(content));
      setInquiries(inbox.inquiries);
      setSession({ checking: false, configured: true, authenticated: true });
      setPassword("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError("");
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
      setSession({ checking: false, configured: true, authenticated: false });
      setDraft(null);
      setInquiries([]);
      setNotice("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function updateSetting(field, value) {
    setDraft((current) => ({
      ...current,
      settings: { ...current.settings, [field]: value },
    }));
  }

  function updateService(index, field, value) {
    setDraft((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, [field]: value } : service,
      ),
    }));
  }

  function updateTechnology(index, field, value) {
    setDraft((current) => ({
      ...current,
      technologies: current.technologies.map((technology, itemIndex) =>
        itemIndex === index ? { ...technology, [field]: value } : technology,
      ),
    }));
  }

  async function saveContent(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const content = {
        ...draft,
        services: draft.services.map((service) => ({
          ...service,
          tags: service.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
        })),
      };
      const result = await readResponse(
        await fetch("/api/admin/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(content),
        }),
      );
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeInquiryStatus(id, status) {
    setError("");
    try {
      await readResponse(
        await fetch("/api/admin/inquiries", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        }),
      );
      setInquiries((current) =>
        current.map((inquiry) => inquiry.id === id ? { ...inquiry, status } : inquiry),
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (session.checking) {
    return <main className="admin-page"><p className="admin-loading">Loading your workspace…</p></main>;
  }

  if (!session.configured) {
    return (
      <main className="admin-page">
        <section className="admin-login">
          <a className="admin-brand" href="/">NEXIVIOUS<span> / ADMIN</span></a>
          <span className="admin-kicker">ONE-TIME SETUP</span>
          <h1>Configure your admin access.</h1>
          <p>Set the admin credentials and session secret in <code>.env.local</code>, then restart the development server.</p>
          <pre>{`ADMIN_USERNAME=your-admin-name
ADMIN_PASSWORD=a-long-private-password
ADMIN_SESSION_SECRET=a-random-secret-at-least-32-characters`}</pre>
          <p className="admin-setup-note">For production, configure these as private environment variables in your hosting provider. Never commit secrets to source control.</p>
          <a className="admin-back-link" href="/">← Back to the website</a>
        </section>
      </main>
    );
  }

  if (!session.authenticated) {
    return (
      <main className="admin-page">
        <form className="admin-login" onSubmit={handleLogin}>
          <a className="admin-brand" href="/">NEXIVIOUS<span> / ADMIN</span></a>
          <span className="admin-kicker">PRIVATE WORKSPACE</span>
          <h1>Welcome back.</h1>
          <p>Sign in to update your website or review new project inquiries.</p>
          <label htmlFor="admin-username">Admin username</label>
          <input id="admin-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="admin-button" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
          <a className="admin-back-link" href="/">← Back to the website</a>
        </form>
      </main>
    );
  }

  if (!draft) {
    return <main className="admin-page"><p className="admin-loading">{error || "Loading your content…"}</p></main>;
  }

  const newInquiryCount = inquiries.filter((inquiry) => inquiry.status === "new").length;

  return (
    <main className="admin-page admin-dashboard">
      <header className="admin-header">
        <div><a className="admin-brand" href="/">NEXIVIOUS<span> / ADMIN</span></a><span className="admin-header-caption">Website workspace</span></div>
        <div className="admin-header-actions"><a href="/" target="_blank" rel="noreferrer">View website ↗</a><button type="button" onClick={handleLogout} disabled={busy}>Sign out</button></div>
      </header>
      <div className="admin-shell">
        <div className="admin-welcome">
          <div><span className="admin-kicker">YOUR WEBSITE, YOUR WAY</span><h1>Good work starts with a clear picture.</h1><p>Keep your public website current and stay on top of conversations with potential clients.</p></div>
          <div className="admin-stats"><strong>{inquiries.length}</strong><span>Total inquiries</span><i /><strong>{newInquiryCount}</strong><span>Need a reply</span></div>
        </div>
        {(error || notice) && <p className={error ? "admin-alert admin-alert--error" : "admin-alert"} role="status">{error || notice}</p>}
        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          <button type="button" role="tab" aria-selected={activeTab === "content"} className={activeTab === "content" ? "is-active" : ""} onClick={() => { setActiveTab("content"); setError(""); setNotice(""); }}>Website content</button>
          <button type="button" role="tab" aria-selected={activeTab === "inquiries"} className={activeTab === "inquiries" ? "is-active" : ""} onClick={() => { setActiveTab("inquiries"); setError(""); setNotice(""); }}>Inquiries <span>{newInquiryCount}</span></button>
        </div>

        {activeTab === "content" ? (
          <form className="admin-editor" onSubmit={saveContent}>
            <section className="editor-section">
              <div className="editor-section-heading"><div><span className="admin-kicker">01 / FIRST IMPRESSION</span><h2>Hero & company introduction</h2></div><p>These are the first things visitors read about Nexivious.</p></div>
              <div className="admin-field-grid">
                <label>Hero heading<input value={draft.settings.heroTitle} onChange={(event) => updateSetting("heroTitle", event.target.value)} maxLength={180} required /></label>
                <label>Highlighted heading<input value={draft.settings.heroAccent} onChange={(event) => updateSetting("heroAccent", event.target.value)} maxLength={180} required /></label>
                <label className="field-full">Hero description<textarea value={draft.settings.heroDescription} onChange={(event) => updateSetting("heroDescription", event.target.value)} maxLength={1500} rows={3} required /></label>
                <label>Introduction heading<input value={draft.settings.introTitle} onChange={(event) => updateSetting("introTitle", event.target.value)} maxLength={180} required /></label>
                <label>Highlighted heading<input value={draft.settings.introAccent} onChange={(event) => updateSetting("introAccent", event.target.value)} maxLength={180} required /></label>
                <label className="field-full">Company introduction<textarea value={draft.settings.introDescription} onChange={(event) => updateSetting("introDescription", event.target.value)} maxLength={1500} rows={4} required /></label>
                <label>Contact email<input type="email" value={draft.settings.contactEmail} onChange={(event) => updateSetting("contactEmail", event.target.value)} maxLength={254} required /></label>
                <label>Company location<input value={draft.settings.contactLocation} onChange={(event) => updateSetting("contactLocation", event.target.value)} maxLength={100} required /></label>
              </div>
            </section>

            <section className="editor-section">
              <div className="editor-section-heading"><div><span className="admin-kicker">02 / WHAT YOU OFFER</span><h2>Services</h2></div><p>Update service descriptions and comma-separated tags shown on the homepage.</p></div>
              <div className="service-editor-list">
                {draft.services.map((service, index) => (
                  <article className="service-editor-card" key={`${service.number}-${index}`}>
                    <div className="service-editor-title"><span>{String(index + 1).padStart(2, "0")}</span><input aria-label={`Service ${index + 1} title`} value={service.title} onChange={(event) => updateService(index, "title", event.target.value)} maxLength={100} required /><button type="button" aria-label={`Remove ${service.title}`} onClick={() => setDraft((current) => ({ ...current, services: current.services.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></div>
                    <label>Description<textarea value={service.description} onChange={(event) => updateService(index, "description", event.target.value)} maxLength={1000} rows={3} required /></label>
                    <label>Tags, separated by commas<input value={service.tagsText} onChange={(event) => updateService(index, "tagsText", event.target.value)} maxLength={327} placeholder="Web apps, E-commerce, CMS" /></label>
                  </article>
                ))}
              </div>
              <button className="admin-secondary-button" type="button" disabled={draft.services.length >= 12} onClick={() => setDraft((current) => ({ ...current, services: [...current.services, { title: "New service", description: "Describe how this service helps your clients.", tags: [], tagsText: "" }] }))}>+ Add a service</button>
            </section>

            <section className="editor-section">
              <div className="editor-section-heading"><div><span className="admin-kicker">03 / YOUR TOOLKIT</span><h2>Technologies</h2></div><p>Keep your technology capabilities up to date.</p></div>
              <div className="technology-editor-list">
                {draft.technologies.map((technology, index) => (
                  <div className="technology-editor-row" key={`technology-${index}`}>
                    <input aria-label={`Technology category ${index + 1}`} value={technology.title} onChange={(event) => updateTechnology(index, "title", event.target.value)} maxLength={100} required />
                    <input aria-label={`Technology list ${index + 1}`} value={technology.items} onChange={(event) => updateTechnology(index, "items", event.target.value)} maxLength={300} required />
                    <button type="button" aria-label={`Remove ${technology.title}`} onClick={() => setDraft((current) => ({ ...current, technologies: current.technologies.filter((_, itemIndex) => itemIndex !== index) }))}>×</button>
                  </div>
                ))}
              </div>
              <button className="admin-secondary-button" type="button" disabled={draft.technologies.length >= 12} onClick={() => setDraft((current) => ({ ...current, technologies: [...current.technologies, { title: "New category", items: "Add technologies" }] }))}>+ Add a technology category</button>
            </section>
            <div className="admin-save-bar"><span>Your changes appear on the public website after saving.</span><button className="admin-button" disabled={busy}>{busy ? "Saving…" : "Save website changes"}</button></div>
          </form>
        ) : (
          <section className="inquiries-panel">
            <div className="editor-section-heading"><div><span className="admin-kicker">CLIENT CONVERSATIONS</span><h2>Project inquiries</h2></div><p>Messages submitted using your website contact form.</p></div>
            {inquiries.length === 0 ? (
              <div className="empty-inquiries"><span>✦</span><h3>No inquiries yet</h3><p>New project messages will appear here as soon as someone contacts you.</p></div>
            ) : (
              <div className="inquiry-list">
                {inquiries.map((inquiry) => (
                  <article className={`inquiry-card${inquiry.status === "new" ? " inquiry-card--new" : ""}`} key={inquiry.id}>
                    <div className="inquiry-heading"><div><span className={`inquiry-status inquiry-status--${inquiry.status}`}>{inquiry.status}</span><h3>{inquiry.name}</h3><a href={`mailto:${encodeURIComponent(inquiry.email)}`}>{inquiry.email}</a></div><time dateTime={inquiry.createdAt}>{new Date(inquiry.createdAt).toLocaleString()}</time></div>
                    <p className="inquiry-message">{inquiry.project}</p>
                    <div className="inquiry-actions"><a className="admin-secondary-button" href={`mailto:${encodeURIComponent(inquiry.email)}?subject=${encodeURIComponent("Your Nexivious project inquiry")}`}>Reply by email ↗</a><label>Status<select value={inquiry.status} onChange={(event) => changeInquiryStatus(inquiry.id, event.target.value)}><option value="new">New</option><option value="read">Read</option><option value="archived">Archived</option></select></label></div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
