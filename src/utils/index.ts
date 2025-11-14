// Utility: create a URL path for an internal page name
export const createPageUrl = (pageName: string) => {
  if (!pageName) return '';

  const pageMap: Record<string, string> = {
    // Main pages
    Home: '/',
    VisaNavigator: '/visa-navigator',
    EligibilityCalculator: '/tools/eligibility-calculator',
    DocumentValidator: '/tools/document-validator',
    CurrencyConverter: '/tools/currency-converter',
    CostComparison: '/tools/cost-comparison',
    ImmigrationMap: '/immigration/map',
    ImmigrationSimulator: '/immigration/simulator',
    PathwayPlanner: '/tools/pathway-planner',
    PacketBuilder: '/tools/packet-builder',
    DocumentChecklist: '/tools/document-checklist',
    NinetyDayReport: '/tools/90-day-report',
    AgentComparison: '/partner/agents-comparison',
    Profile: '/profile',
    Settings: '/settings',
    Contact: '/contact',
    KnowledgeHub: '/knowledge/hub',
    KnowledgePost: '/knowledge/post',
    KnowledgeContributor: '/knowledge/contributor',
    BecomeContributor: '/knowledge/become-contributor',
    PartnerWithUs: '/partner/with-us',
    TermsOfService: '/terms-of-service',
    PrivacyPolicy: '/privacy-policy',

    // Admin pages
    AdminManager: '/admin',
    AdminKnowledge: '/admin/knowledge',
    AdminKnowledgeEdit: '/admin/knowledge-edit',
    AdminBugs: '/admin/bugs',
    AdminSEO: '/admin/seo',
    AdminUsers: '/admin/users',
    AdminPartners: '/admin/partners',
    AdminPricing: '/admin/pricing',
    AdminTranslations: '/admin/translations',
    AdminContent: '/admin/content',
  };

  return pageMap[pageName as keyof typeof pageMap] || '';
};