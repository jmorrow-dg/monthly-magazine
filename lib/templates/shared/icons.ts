/**
 * Editorial section icons:inline SVG, monochrome gold, thin-line style.
 * All icons: viewBox 0 0 16 16, stroke #B8860B, stroke-width 1.2, no fill.
 */

const ICON_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12pt" height="12pt" fill="none" stroke="#B8860B" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"';

/** Pen nib:Editorial Note */
export function iconEditorial(): string {
  return `<svg ${ICON_ATTRS}>
    <path d="M10.5 2.5l3 3-8 8H2.5v-3l8-8z"/>
    <path d="M8.5 4.5l3 3"/>
  </svg>`;
}

/** Open book:Cover Story */
export function iconCoverStory(): string {
  return `<svg ${ICON_ATTRS}>
    <path d="M8 3.5c-1.5-1-3.5-1.2-5.5-1v10c2 -.2 4 0 5.5 1 1.5-1 3.5-1.2 5.5-1v-10c-2 .2-4 0-5.5 1z"/>
    <path d="M8 3.5v10"/>
  </svg>`;
}

/** Compass:Why This Matters */
export function iconWhyThisMatters(): string {
  return `<svg ${ICON_ATTRS}>
    <circle cx="8" cy="8" r="5.5"/>
    <polygon points="8,4 9.2,7 12,8 9.2,9 8,12 6.8,9 4,8 6.8,7" stroke-width="0.8" fill="#B8860B" fill-opacity="0.15"/>
  </svg>`;
}

/** Target/crosshair:Strategic Implications */
export function iconStrategicImplications(): string {
  return `<svg ${ICON_ATTRS}>
    <circle cx="8" cy="8" r="5.5"/>
    <circle cx="8" cy="8" r="2.5"/>
    <path d="M8 2v2M8 12v2M2 8h2M12 8h2"/>
  </svg>`;
}

/** Building:Enterprise Adoption */
export function iconEnterprise(): string {
  return `<svg ${ICON_ATTRS}>
    <rect x="4" y="3" width="8" height="11" rx="0.5"/>
    <path d="M6.5 6h3M6.5 8.5h3M6.5 11h1.2M9.3 11h1.2"/>
    <path d="M2 14h12"/>
  </svg>`;
}

/** Eye/radar:Industry Watch */
export function iconIndustryWatch(): string {
  return `<svg ${ICON_ATTRS}>
    <path d="M2 8c1.5-3 3.5-4.5 6-4.5s4.5 1.5 6 4.5c-1.5 3-3.5 4.5-6 4.5S3.5 11 2 8z"/>
    <circle cx="8" cy="8" r="2"/>
  </svg>`;
}

/** Broadcast signal:Strategic Signals */
export function iconStrategicSignals(): string {
  return `<svg ${ICON_ATTRS}>
    <circle cx="8" cy="12" r="1" fill="#B8860B" stroke="none"/>
    <path d="M5.5 10a3.5 3.5 0 015 0"/>
    <path d="M3.5 8a6.5 6.5 0 019 0"/>
    <path d="M1.5 6a9.5 9.5 0 0113 0"/>
  </svg>`;
}

/** Wrench:Tools Worth Watching */
export function iconTools(): string {
  return `<svg ${ICON_ATTRS}>
    <path d="M10.5 2.5a3.5 3.5 0 00-4.2 5.3L3 11.2a1.2 1.2 0 001.8 1.6l3.4-3.4a3.5 3.5 0 005.3-4.2L11.5 7.2 9 6.8l-.3-2.5z"/>
  </svg>`;
}

/** Clipboard:Operator Playbook */
export function iconPlaybook(): string {
  return `<svg ${ICON_ATTRS}>
    <rect x="3.5" y="3" width="9" height="11" rx="1"/>
    <path d="M6 3V2a2 2 0 014 0v1"/>
    <path d="M6 7h4M6 9.5h3"/>
  </svg>`;
}

/** Stacked layers:AI Native Organisation */
export function iconAiNativeOrg(): string {
  return `<svg ${ICON_ATTRS}>
    <ellipse cx="8" cy="4" rx="6" ry="2"/>
    <path d="M2 4v2.5c0 1.1 2.7 2 6 2s6-.9 6-2V4"/>
    <path d="M2 6.5V9c0 1.1 2.7 2 6 2s6-.9 6-2V6.5"/>
    <path d="M2 9v2.5c0 1.1 2.7 2 6 2s6-.9 6-2V9"/>
  </svg>`;
}

/** Chart bars:Executive Briefing */
export function iconExecutiveBriefing(): string {
  return `<svg ${ICON_ATTRS}>
    <path d="M2 14h12"/>
    <rect x="3" y="8" width="2" height="6" rx="0.3"/>
    <rect x="7" y="5" width="2" height="9" rx="0.3"/>
    <rect x="11" y="2" width="2" height="12" rx="0.3"/>
  </svg>`;
}

/** Speech bubbles:Operator Briefing Prompts */
export function iconBriefing(): string {
  return `<svg ${ICON_ATTRS}>
    <rect x="2" y="3" width="9" height="6" rx="1"/>
    <path d="M5 9v2l2.5-2"/>
    <rect x="6" y="7" width="8" height="5" rx="1"/>
    <path d="M11 12v1.5L8.5 12"/>
  </svg>`;
}

/** Forward arrow:Closing */
export function iconClosing(): string {
  return `<svg ${ICON_ATTRS}>
    <path d="M3 8h10M9 4l4 4-4 4"/>
  </svg>`;
}

/**
 * Icon registry:maps section keys to icon functions.
 */
const ICON_MAP: Record<string, () => string> = {
  'editorial': iconEditorial,
  'cover-story': iconCoverStory,
  'why-this-matters': iconWhyThisMatters,
  'strategic-implications': iconStrategicImplications,
  'enterprise': iconEnterprise,
  'industry-watch': iconIndustryWatch,
  'strategic-signals': iconStrategicSignals,
  'tools': iconTools,
  'playbook': iconPlaybook,
  'executive-briefing': iconExecutiveBriefing,
  'ai-native-org': iconAiNativeOrg,
  'briefing': iconBriefing,
  'closing': iconClosing,
};

/**
 * Get an icon SVG string by section key.
 * Returns empty string if key not found.
 */
export function getIcon(key: string): string {
  const fn = ICON_MAP[key];
  return fn ? fn() : '';
}
