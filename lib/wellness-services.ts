// Canonical wellness service taxonomy.
// Each service has a brand-exact name (the form Google entity-recognizes) and
// common variants users might search.

export type WellnessService = {
  id: string;
  brandExact: string;
  variants: string[];
  outcomes: string[];
};

export const WELLNESS_SERVICES: WellnessService[] = [
  {
    id: "rest_floating",
    brandExact: "REST Float Therapy",
    variants: ["float therapy", "REST floating therapy", "float tank", "sensory deprivation tank", "float pod", "isolation tank"],
    outcomes: ["chronic stress", "insomnia", "anxiety", "nervous system reset", "deep recovery"],
  },
  {
    id: "fire_ice",
    brandExact: "Fire & Ice Contrast Therapy",
    variants: ["infrared sauna and cold plunge", "contrast therapy", "sauna and cold plunge", "hot cold therapy"],
    outcomes: ["muscle recovery", "athletic recovery", "metabolic boost", "inflammation"],
  },
  {
    id: "halotherapy",
    brandExact: "Halotherapy",
    variants: ["salt therapy", "salt room", "salt cave"],
    outcomes: ["respiratory health", "asthma", "allergies", "skin"],
  },
  {
    id: "pemf",
    brandExact: "PEMF Therapy",
    variants: ["pulsed electromagnetic field", "PEMF mat", "electromagnetic therapy"],
    outcomes: ["bone healing", "depression", "inflammation", "mitochondrial function"],
  },
  {
    id: "emtt",
    brandExact: "EMTT Pulsed Magnetic Therapy",
    variants: ["EMTT", "extracorporeal magnetotransduction", "high intensity pemf"],
    outcomes: ["joint pain", "tendinopathy", "musculoskeletal recovery"],
  },
  {
    id: "red_light",
    brandExact: "Red Light Therapy",
    variants: ["red light", "near infrared therapy", "photobiomodulation", "NIR therapy"],
    outcomes: ["skin", "muscle recovery", "cortisol", "mitochondria"],
  },
  {
    id: "neurovizr",
    brandExact: "NeuroVIZR Brain Reset",
    variants: ["light and sound therapy", "brainwave entrainment", "brain reset"],
    outcomes: ["focus", "flow state", "deep rest", "meditation"],
  },
  {
    id: "pressotherapy",
    brandExact: "Pressotherapy",
    variants: ["compression therapy", "lymphatic compression", "lymph drainage boots"],
    outcomes: ["circulation", "post exercise recovery", "lymphatic drainage", "detox"],
  },
  {
    id: "rtms",
    brandExact: "rTMS",
    variants: ["transcranial magnetic stimulation", "TMS therapy", "brain stimulation"],
    outcomes: ["mood", "focus", "depression"],
  },
  {
    id: "zyto",
    brandExact: "Zyto Bioenergetic Scanning",
    variants: ["bioenergetic scan", "energy scan", "body signaling scan"],
    outcomes: ["complex symptoms", "personalized protocol", "wellness baseline"],
  },
  {
    id: "bioresonance",
    brandExact: "Bioresonance Scan",
    variants: ["bioresonance", "frequency scan", "organ system scan"],
    outcomes: ["organ imbalance", "stress patterns", "environmental load"],
  },
  {
    id: "body_comp",
    brandExact: "Body Composition Analysis",
    variants: ["body composition", "BIA scan", "body fat scan"],
    outcomes: ["longevity tracking", "muscle mass", "body fat"],
  },
  {
    id: "energy_healing",
    brandExact: "Energy Healing",
    variants: ["reiki", "hands on healing", "energy work"],
    outcomes: ["nervous system regulation", "emotional clearing"],
  },
  {
    id: "biofield",
    brandExact: "Biofield Energy Healing",
    variants: ["biofield tuning", "tuning fork therapy", "sound healing"],
    outcomes: ["emotional release", "trauma recovery", "subtle body"],
  },
  {
    id: "bowen",
    brandExact: "Bowen Therapy",
    variants: ["bowen technique", "fascial release", "fascia therapy"],
    outcomes: ["chronic pain", "postural issues", "autonomic regulation"],
  },
  {
    id: "vibration_plate",
    brandExact: "Vibration Plate Therapy",
    variants: ["vibration therapy", "whole body vibration", "vibration plate"],
    outcomes: ["circulation", "bone density", "lymphatic activation"],
  },
  {
    id: "iv_therapy",
    brandExact: "IV Therapy",
    variants: ["IV drip", "intravenous therapy", "vitamin drip", "NAD IV"],
    outcomes: ["energy", "hydration", "immune support", "longevity"],
  },
  {
    id: "cryotherapy",
    brandExact: "Whole Body Cryotherapy",
    variants: ["cryotherapy", "cryo chamber", "cold chamber"],
    outcomes: ["recovery", "inflammation", "metabolic boost"],
  },
  {
    id: "hyperbaric",
    brandExact: "Hyperbaric Oxygen Therapy",
    variants: ["HBOT", "hyperbaric chamber", "oxygen therapy"],
    outcomes: ["healing", "brain recovery", "athletic performance", "long covid"],
  },
  {
    id: "acupuncture",
    brandExact: "Acupuncture",
    variants: ["acupuncture", "TCM", "traditional chinese medicine"],
    outcomes: ["pain", "fertility", "stress", "hormonal balance"],
  },
  {
    id: "massage",
    brandExact: "Therapeutic Massage",
    variants: ["massage", "deep tissue massage", "lymphatic massage"],
    outcomes: ["pain relief", "stress relief", "recovery"],
  },
  {
    id: "functional_medicine",
    brandExact: "Functional Medicine Consultation",
    variants: ["functional medicine", "integrative medicine", "root cause medicine"],
    outcomes: ["autoimmune", "hashimoto", "hormonal", "gut health", "fatigue"],
  },
];
