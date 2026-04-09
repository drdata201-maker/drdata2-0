export const RESEARCH_DOMAINS = [
  "health_sciences", "public_health", "medicine", "nursing", "pharmacy",
  "economics", "management", "finance", "accounting", "marketing",
  "sociology", "psychology", "education",
  "computer_science", "engineering", "agriculture",
  "law", "mathematics", "statistics",
  "communication", "political_science", "environmental_science",
  "biology", "chemistry", "physics",
];

export const LICENCE_PROJECT_TYPES = [
  "memoir_licence", "academic_project", "questionnaire_analysis",
  "field_survey_analysis", "descriptive_analysis",
];

export const MASTER_PROJECT_TYPES = [
  "memoir_master", "research_project", "scientific_article",
  "comparative_analysis", "quantitative_research", "qualitative_research",
];

export const DOCTORATE_PROJECT_TYPES = [
  "phd_thesis", "scientific_research", "scientific_publication",
  "advanced_analysis", "scientific_modeling", "experimental_research",
];

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};
