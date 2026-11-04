export interface WhoMedicine {
  name: string;
  type: string;
  evidenceCert: 'HIGH' | 'MODERATE';
  description: string;
  whoNote: string;
}

export const WHO_MEDICINES: WhoMedicine[] = [
  {
    name: 'Combination Nicotine Replacement Therapy (NRT)',
    type: 'Dual First-Line',
    evidenceCert: 'MODERATE',
    description: 'Combining a long-acting transdermal patch (continuous 16–24 hr basal saturation) with a fast-acting form (gum or lozenge for acute breakthrough spikes).',
    whoNote: 'WHO 2024 notes combination NRT is significantly more effective than single-form NRT monotherapy.',
  },
  {
    name: 'Varenicline',
    type: 'Oral First-Line Non-Nicotine',
    evidenceCert: 'HIGH',
    description: 'Partial agonist at alpha-4-beta-2 nicotinic receptors. Relieves physical withdrawal while blunting nicotine reward if a slip happens.',
    whoNote: 'Strong WHO 2024 recommendation with high certainty of evidence. Highest single-agent efficacy in clinical trials.',
  },
  {
    name: 'Cytisine',
    type: 'Plant-derived Alkaloid',
    evidenceCert: 'MODERATE',
    description: 'Natural alpha-4-beta-2 partial agonist with a long track record in Europe and international trials.',
    whoNote: 'Strong WHO 2024 recommendation. High cost-effectiveness; availability varies by country.',
  },
  {
    name: 'Bupropion SR',
    type: 'Oral Non-Nicotine (NDRI)',
    evidenceCert: 'HIGH',
    description: 'Norepinephrine-dopamine reuptake inhibitor and nicotinic receptor antagonist that curbs cravings and dampens post-quit weight surge.',
    whoNote: 'Strong WHO 2024 recommendation. Can also be combined with NRT under doctor guidance.',
  },
];

export const DOCTOR_SAFETY_CHECKLIST = [
  {
    condition: 'Pregnant or breastfeeding',
    guidance: 'Behavioral support is the recommended first-line approach. Consult an obstetrician or midwife before using any pharmacological aids.',
  },
  {
    condition: 'Recent heart attack, stroke, or unstable angina',
    guidance: 'Speak with your cardiologist or primary care physician before beginning high-dose nicotine replacement.',
  },
  {
    condition: 'Current or past mental health conditions',
    guidance: 'Mood changes can accompany withdrawal. Staying closely connected with your care team ensures smooth recovery.',
  },
  {
    condition: 'Taking Clozapine, Olanzapine, Theophylline, or Warfarin',
    guidance: 'CRITICAL: Tobacco smoke induces the hepatic CYP1A2 metabolic enzyme. Quitting smoking can cause blood concentrations of these medications to rise significantly. Your doctor must monitor levels and adjust doses.',
  },
  {
    condition: 'Heavy coffee or tea consumption',
    guidance: 'Caffeine clearance slows down after stopping tobacco. A normal cup of coffee may feel twice as stimulating, triggering artificial jitteriness often mistaken for nicotine cravings. Consider halving your caffeine intake.',
  },
];

export const RED_FLAG_CRISIS_ALERTS = [
  'Severe persistent low mood or thoughts of self-harm or suicide (Call emergency services or reach out to a trusted person immediately).',
  'Unexplained acute chest pain or tightness radiating to arm or jaw.',
  'Coughing up blood or persistent blood in sputum.',
  'Severe shortness of breath that does not ease with rest.',
];

export const DISCLAIMER_FOOTER = 'Information, not medical advice. Consult a qualified physician or pharmacist for medical diagnosis or prescription dosage.';
