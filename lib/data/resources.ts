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
    url: "https://whereto.catie.ca/",
    phone: null,
    category: "find-testing",
    region: "national",
    priority: 1,
  },
  {
    id: "maple",
    title: "Maple",
    description: "Virtual STI consultations available nationally",
    url: "https://www.getmaple.ca/conditions/sexually-transmitted-infections-treatment/",
    phone: null,
    category: "find-testing",
    region: "national",
    priority: 2,
  },
  {
    id: "tia-health",
    title: "Tia Health",
    description: "Telehealth including sexual health services",
    url: "https://tiahealth.com/online-medical-conditions/online-std-diagnosis/",
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
    url: "https://www.actioncanadashr.org/sexual-health-hub/sti-testing",
    phone: null,
    category: "learn-more",
    region: "national",
    priority: 4,
  },
  {
    id: "catie-testing-frequency",
    title: "Testing Frequency Guide",
    description: "How often to get tested based on your risk level",
    url: "https://www.actioncanadashr.org/resources/sexual-health-hub/sexually-transmitted-infections/how-often-should-i-get-tested",
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
    id: "action-canada-access-line",
    title: "Action Canada Access Line",
    description: "Sexual and reproductive health information and referrals",
    url: "https://www.actioncanadashr.org/access-line",
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
    id: "sexualhealthontario-clinic",
    title: "Sexual Health Ontario Clinic Finder",
    description: "Find sexual health clinics near you",
    url: "https://sexualhealthontario.ca/en/find-clinic",
    phone: null,
    category: "find-testing",
    region: "ON",
    priority: 1,
  },
  {
    id: "hasslefreeclinic",
    title: "Hassle Free Clinic, Toronto",
    description: "Walk-in, anonymous STI testing",
    url: "https://hasslefreeclinic.org",
    phone: null,
    category: "find-testing",
    region: "ON",
    priority: 2,
  },
  {
    id: "ontario-sexual-health-clinics",
    title: "Ontario Sexual Health Clinics",
    description: "Find sexual health clinics through Ontario.ca",
    url: "https://www.ontario.ca/page/sexual-health-clinics",
    phone: null,
    category: "find-testing",
    region: "ON",
    priority: 3,
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
    id: "sexual-health-infoline-ontario",
    title: "Sexual Health Infoline Ontario",
    description:
      "Free, anonymous and inclusive eChat and phone service with counsellors providing sexual health information, support and referrals",
    url: "https://sexualhealthontario.ca/en/chat",
    phone: null,
    category: "get-support",
    region: "ON",
    priority: 1,
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
