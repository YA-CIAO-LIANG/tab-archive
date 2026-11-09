/** Thin line icons, defined once and used with <Icon name="…" />. */
export function Icons() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
    >
      <symbol id="i-search" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.2-4.2" />
      </symbol>
      <symbol id="i-edit" viewBox="0 0 24 24">
        <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
      </symbol>
      <symbol id="i-x" viewBox="0 0 24 24">
        <path d="M6 6l12 12M18 6L6 18" />
      </symbol>
      <symbol id="i-open" viewBox="0 0 24 24">
        <path d="M9 5h10v10M19 5L6 18" />
      </symbol>
      <symbol id="i-chev" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" />
      </symbol>
      <symbol id="i-up" viewBox="0 0 24 24">
        <path d="M12 19V5M6 11l6-6 6 6" />
      </symbol>
      <symbol id="i-trash" viewBox="0 0 24 24">
        <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
      </symbol>
      <symbol id="i-plus" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </symbol>
      <symbol id="i-list" viewBox="0 0 24 24">
        <rect x="4" y="5" width="4" height="4" />
        <rect x="4" y="15" width="4" height="4" />
        <path d="M11 7h9M11 17h9" />
      </symbol>
      <symbol id="i-compact" viewBox="0 0 24 24">
        <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </symbol>
      <symbol id="i-medium" viewBox="0 0 24 24">
        <rect x="4" y="4" width="7" height="7" />
        <rect x="13" y="4" width="7" height="7" />
        <rect x="4" y="13" width="7" height="7" />
        <rect x="13" y="13" width="7" height="7" />
      </symbol>
      <symbol id="i-large" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="11" />
        <path d="M3 19h12" />
      </symbol>
      <symbol id="i-icons" viewBox="0 0 24 24">
        <rect x="4" y="4" width="4" height="4" rx="1" />
        <rect x="10" y="4" width="4" height="4" rx="1" />
        <rect x="16" y="4" width="4" height="4" rx="1" />
        <rect x="4" y="12" width="4" height="4" rx="1" />
        <rect x="10" y="12" width="4" height="4" rx="1" />
        <rect x="16" y="12" width="4" height="4" rx="1" />
      </symbol>
      <symbol id="i-gallery" viewBox="0 0 24 24">
        <rect x="3" y="3" width="8" height="11" />
        <rect x="13" y="3" width="8" height="7" />
        <rect x="13" y="12" width="8" height="9" />
        <path d="M3 18h8M3 21h5" />
      </symbol>
      <symbol id="i-capture" viewBox="0 0 24 24">
        <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" />
      </symbol>
      <symbol id="i-folder" viewBox="0 0 24 24">
        <path d="M3 7h7l2 2h9v10H3z" />
      </symbol>
      <symbol id="i-sync" viewBox="0 0 24 24">
        <path d="M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5" />
      </symbol>
      <symbol id="i-phone" viewBox="0 0 24 24">
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </symbol>
      <symbol id="i-lock" viewBox="0 0 24 24">
        <rect x="5" y="11" width="14" height="10" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </symbol>
      <symbol id="i-text" viewBox="0 0 24 24">
        <path d="M5 6h14M5 11h14M5 16h9" />
      </symbol>
    </svg>
  );
}

export function Icon({ name }: { name: string }) {
  return (
    <svg className="i" aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}
