// Utility: create a URL path for an internal page name
export const createPageUrl = (pageName: string) => {
  if (!pageName) return '';

  // Normalize to a lowercase key so callers can pass 'login', 'Login', or 'LOGIN'
  const key = pageName.replace(/\s+/g, '').toLowerCase();

  const pageMap: Record<string, string> = {
    // Main pages (keys are lowercase to match normalized input)
    home: '/',
    visanavigator: '/visa-navigator',
    eligibilitycalculator: '/tools/eligibility-calculator',
    documentvalidator: '/tools/document-validator',
    currencyconverter: '/tools/currency-converter',
    costcomparison: '/tools/cost-comparison',
    immigrationmap: '/immigration/map',
    immigrationsimulator: '/immigration/simulator',
    pathwayplanner: '/tools/pathway-planner',
    packetbuilder: '/tools/packet-builder',
    documentchecklist: '/tools/document-checklist',
    ninetydaysreport: '/tools/90-day-report',
    agentcomparison: '/partner/agents-comparison',
    profile: '/profile',
    settings: '/settings',
    contact: '/contact',
    knowledgehub: '/knowledge/hub',
    knowledgepost: '/knowledge/post',
    knowledgecontributor: '/knowledge/contributor',
    becomecontributor: '/knowledge/become-contributor',
    partnerwithus: '/partner/with-us',
    termsofservice: '/terms-of-service',
    privacypolicy: '/privacy-policy',
    login: '/login',
    signup: '/signup',

    // Admin pages
    adminmanager: '/adminmanager',
    adminknowledge: '/adminmanager/knowledge',
    adminknowledgeedit: '/adminmanager/knowledge-edit',
    adminbugs: '/adminmanager/bugs',
    adminseo: '/adminmanager/seo',
    adminusers: '/adminmanager/users',
    adminpartners: '/adminmanager/partners',
    adminpricing: '/adminmanager/pricing',
    admintranslations: '/adminmanager/translations',
    admincontent: '/adminmanager/content',
  };

  return pageMap[key as keyof typeof pageMap] || '';
};