export interface AcademicSource {
  title: string;
  authors: string;
  journal: string;
  year: number;
  url: string;
  takeaway: string;
}

export const ACADEMIC_SOURCES: AcademicSource[] = [
  {
    title: 'Tobacco: Health benefits of smoking cessation',
    authors: 'World Health Organization (WHO)',
    journal: 'WHO Health Topics',
    year: 2024,
    url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    takeaway: 'Global consensus on hemodynamic, carboxyhemoglobin, and long-term oncology/cardiovascular recovery trajectories.',
  },
  {
    title: 'WHO Clinical Treatment Guideline for Tobacco Cessation in Adults',
    authors: 'World Health Organization (WHO)',
    journal: 'WHO Guidelines Approved by the Guidelines Review Committee',
    year: 2024,
    url: 'https://www.ncbi.nlm.nih.gov/books/n/who377825/fm-ch2/',
    takeaway: 'First WHO clinical guideline recommending Varenicline, Cytisine, Combination NRT, and Bupropion, plus digital self-management adjuncts.',
  },
  {
    title: 'Smoking cessation for improving mental health',
    authors: 'Taylor GMJ, Lindson N, Farley A, et al.',
    journal: 'Cochrane Database of Systematic Reviews',
    year: 2021,
    url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013522.pub2/full',
    takeaway: 'Proves quitting tobacco reduces anxiety, depression, and stress with effect sizes comparable to antidepressants.',
  },
  {
    title: 'Predicting smoking cessation. Who will quit with and without the nicotine patch',
    authors: 'Kenford SL, Fiore MC, Jorenby DE, et al.',
    journal: 'JAMA (Journal of the American Medical Association)',
    year: 1994,
    url: 'https://pubmed.ncbi.nlm.nih.gov/8301790/',
    takeaway: 'Identified week-2 complete abstinence as the single most powerful predictor of long-term smoke-free success.',
  },
  {
    title: 'Shape of the relapse curve and long-term abstinence among untreated smokers',
    authors: 'Hughes JR, Keely J, Naud S.',
    journal: 'Addiction',
    year: 2004,
    url: 'https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1360-0443.2004.00540.x',
    takeaway: 'Demonstrated untreated relapse concentrates heavily in the first 8 days post-quit, justifying intensive early sprint support.',
  },
  {
    title: 'The "not a puff" rule: briefing paper',
    authors: 'National Centre for Smoking Cessation and Training (NCSCT)',
    journal: 'NCSCT Briefings',
    year: 2026,
    url: 'https://www.ncsct.co.uk/library/view/pdf/not-a-puff-rule.pdf',
    takeaway: 'Explains why planned "smoking windows" damage recovery and why slips must be converted immediately into zero without shame.',
  },
  {
    title: 'Effects of abstinence from tobacco: valid symptoms and time course',
    authors: 'Hughes JR.',
    journal: 'Nicotine & Tobacco Research',
    year: 2007,
    url: 'https://pubmed.ncbi.nlm.nih.gov/17365760/',
    takeaway: 'Gold standard categorization of valid withdrawal symptoms, establishing peak course in week 1 and resolution in 2-4 weeks.',
  },
  {
    title: 'Weight gain in smokers after quitting: meta-analysis',
    authors: 'Aubin HJ, Farley A, Lycett D, et al.',
    journal: 'BMJ (British Medical Journal)',
    year: 2012,
    url: 'https://www.bmj.com/content/345/bmj.e4439',
    takeaway: 'Established average post-cessation weight gain (4.67 kg at 12 months) and emphasized that cardiac benefits far outweigh minor weight gains.',
  },
  {
    title: '21st-century hazards of smoking and benefits of cessation in the United States',
    authors: 'Jha P, Ramasundarahettige C, Landsman V, et al.',
    journal: 'New England Journal of Medicine',
    year: 2013,
    url: 'https://www.nejm.org/doi/full/10.1056/nejmsa1211128',
    takeaway: 'Large cohort demonstrating that quitting at ages 25-34 gains ~10 years of life, 35-44 gains ~9 years, 45-54 gains ~6 years.',
  },
  {
    title: 'Estimating the number of quit attempts it takes to quit smoking successfully',
    authors: 'Chaiton M, Diemert L, Cohen JE, et al.',
    journal: 'BMJ Open',
    year: 2016,
    url: 'https://bmjopen.bmj.com/content/6/6/e011045',
    takeaway: 'Demonstrated the typical successful quitter required 30 or more previous attempts, disproving "one and done" myths.',
  },
  {
    title: 'Cigarette smoking cuts life expectancy by 20 minutes per cigarette',
    authors: 'Jackson SE, Jarvis MJ, West R.',
    journal: 'Addiction',
    year: 2025,
    url: 'https://onlinelibrary.wiley.com/journal/13600443',
    takeaway: 'Refined modern metric of ~20 minutes of life saved per cigarette avoided.',
  },
];
