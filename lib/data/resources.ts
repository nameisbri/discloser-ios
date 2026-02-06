import type { Resource, ResourceCategory } from "../types";

export const RESOURCE_CATEGORIES: { key: ResourceCategory; label: string }[] = [
  { key: "find-testing", label: "Find Testing" },
  { key: "learn-more", label: "Learn More" },
  { key: "get-support", label: "Get Support" },
];

export const RESOURCE_REGIONS: { key: string; label: string }[] = [
  { key: "national", label: "Canada-Wide" },
  { key: "ON", label: "Ontario" },
];

export const resources: Resource[] = [
  // ─── National: Find Testing ───────────────────────────────────────────
  {
    id: "catie-find-service",
    title: "CATIE Find a Service",
    description: "Searchable database of sexual health services across Canada",
    url: "https://www.catie.ca/find-a-service",
    phone: null,
    category: "find-testing",
    region: "national",
    priority: 1,
  },
  {
    id: "maple",
    title: "Maple",
    description: "Virtual STI consultations available nationally",
    url: "https://www.getmaple.ca",
    phone: null,
    category: "find-testing",
    region: "national",
    priority: 2,
  },
  {
    id: "tia-health",
    title: "Tia Health",
    description: "Telehealth including sexual health services",
    url: "https://tiahealth.com",
    phone: null,
    category: "find-testing",
    region: "national",
    priority: 3,
  },

  // ─── National: Learn More ─────────────────────────────────────────────
  {
    id: "catie",
    title: "CATIE",
    description: "Canada's source for HIV and hepatitis C information",
    url: "https://www.catie.ca",
    phone: null,
    category: "learn-more",
    region: "national",
    priority: 1,
  },
  {
    id: "sex-and-u",
    title: "Sex & U",
    description: "Sexual health info from the Society of Obstetricians and Gynaecologists of Canada",
    url: "https://www.sexandu.ca",
    phone: null,
    category: "learn-more",
    region: "national",
    priority: 2,
  },
  {
    id: "smartsexresource",
    title: "SmartSexResource",
    description: "Evidence-based STI and sexual health information",
    url: "https://smartsexresource.com",
    phone: null,
    category: "learn-more",
    region: "national",
    priority: 3,
  },
  {
    id: "catie-testing-windows",
    title: "Testing Window Periods",
    description: "How soon after exposure each STI test is accurate",
    url: "https://www.catie.ca/prevention/testing",
    phone: null,
    category: "learn-more",
    region: "national",
    priority: 4,
  },
  {
    id: "catie-testing-frequency",
    title: "Testing Frequency Guide",
    description: "How often to get tested based on your risk level",
    url: "https://www.catie.ca/prevention/testing",
    phone: null,
    category: "learn-more",
    region: "national",
    priority: 5,
  },

  // ─── National: Get Support ────────────────────────────────────────────
  {
    id: "hope-for-wellness",
    title: "Hope for Wellness Helpline",
    description: "24/7 counselling for Indigenous peoples",
    url: null,
    phone: "1-855-242-3310",
    category: "get-support",
    region: "national",
    priority: 1,
  },
  {
    id: "egale-canada",
    title: "Egale Canada",
    description: "LGBTQ2S+ resources and support",
    url: "https://egale.ca",
    phone: null,
    category: "get-support",
    region: "national",
    priority: 2,
  },
  {
    id: "trans-lifeline",
    title: "Trans Lifeline",
    description: "Peer support for trans community",
    url: null,
    phone: "1-877-330-6366",
    category: "get-support",
    region: "national",
    priority: 3,
  },

  // ─── Ontario: Find Testing ────────────────────────────────────────────
  {
    id: "getcheckedonline",
    title: "GetCheckedOnline Ontario",
    description: "Free online STI test ordering",
    url: "https://getcheckedonline.com",
    phone: null,
    category: "find-testing",
    region: "ON",
    priority: 1,
  },
  {
    id: "sexualhealthontario-clinic",
    title: "Sexual Health Ontario Clinic Finder",
    description: "Find sexual health clinics near you",
    url: "https://sexualhealthontario.ca/en/clinic-finder",
    phone: null,
    category: "find-testing",
    region: "ON",
    priority: 2,
  },
  {
    id: "hasslefreeclinic",
    title: "Hassle Free Clinic, Toronto",
    description: "Walk-in, anonymous STI testing",
    url: "https://hasslefreeclinic.org",
    phone: null,
    category: "find-testing",
    region: "ON",
    priority: 3,
  },
  {
    id: "ontario-phu-directory",
    title: "Ontario Public Health Unit Directory",
    description: "Find your local public health unit for sexual health clinics",
    url: "https://www.ontario.ca/page/public-health-unit-locations",
    phone: null,
    category: "find-testing",
    region: "ON",
    priority: 4,
  },

  // ─── Ontario: Learn More ──────────────────────────────────────────────
  {
    id: "sexualhealthontario-info",
    title: "Sexual Health Ontario",
    description: "General sexual health information and resources",
    url: "https://sexualhealthontario.ca",
    phone: null,
    category: "learn-more",
    region: "ON",
    priority: 1,
  },

  // ─── Ontario: Get Support ─────────────────────────────────────────────
  {
    id: "sexual-health-infoline",
    title: "Sexual Health Infoline Ontario",
    description: "Free, confidential sexual health information",
    url: null,
    phone: "1-800-668-2437",
    category: "get-support",
    region: "ON",
    priority: 1,
  },
  {
    id: "lgbt-youth-line",
    title: "LGBT Youth Line",
    description: "Peer support for LGBTQ+ youth",
    url: null,
    phone: "1-800-268-9688",
    category: "get-support",
    region: "ON",
    priority: 2,
  },
  {
    id: "toronto-public-health",
    title: "Toronto Public Health",
    description: "Sexual health information and clinic services",
    url: "https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/sexual-health/",
    phone: null,
    category: "get-support",
    region: "ON",
    priority: 3,
  },
];

export function getResourcesByCategory(category: ResourceCategory): Resource[] {
  return resources
    .filter((r) => r.category === category)
    .sort((a, b) => a.priority - b.priority);
}

export function getResourcesByCategoryAndRegion(
  category: ResourceCategory,
  region: string,
): Resource[] {
  return resources
    .filter((r) => r.category === category && r.region === region)
    .sort((a, b) => a.priority - b.priority);
}
