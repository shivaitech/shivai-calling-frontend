/**
 * Industry presets for Appointment Scheduling CRM — hospitals, clinics, schools, etc.
 * Each preset defines terminology, services, default branches, and booking fields.
 */

import { useEffect, useState } from "react";

export interface CustomField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "phone" | "email";
  options?: string[];
  required?: boolean;
}

export interface BranchSeed {
  name: string;
  address?: string;
}

export interface AppointmentIndustryPreset {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  terms: {
    customer: string;
    customers: string;
    appointment: string;
    appointments: string;
    provider: string;
    providers: string;
    branch: string;
    branches: string;
    agent: string;
    department: string;
    departments: string;
    staff: string;
    staffPlural: string;
  };
  appointmentTypes: string[];
  services: string[];
  staffRoles: string[];
  defaultFields: CustomField[];
  defaultBranches: BranchSeed[];
  slotDurationMin: number;
  reminderChannels: ("sms" | "voice" | "email" | "whatsapp")[];
}

export const APPOINTMENT_INDUSTRY_PRESETS: AppointmentIndustryPreset[] = [
  {
    id: "hospital",
    name: "Hospital",
    tagline: "OPD, diagnostics, specialists & multi-department scheduling.",
    icon: "hospital",
    terms: {
      customer: "Patient",
      customers: "Patients",
      appointment: "Appointment",
      appointments: "Appointments",
      provider: "Doctor",
      providers: "Doctors",
      branch: "Campus",
      branches: "Campuses",
      agent: "Scheduling Coordinator",
      department: "Department",
      departments: "Departments",
      staff: "Staff",
      staffPlural: "Staff",
    },
    appointmentTypes: ["OPD Consultation", "Follow-up Visit", "Diagnostics", "Procedure", "Vaccination", "Emergency Triage"],
    services: ["General Medicine", "Cardiology", "Orthopedics", "Pediatrics", "Radiology", "Pathology"],
    staffRoles: ["Senior Doctor", "Junior Doctor", "Nurse", "Receptionist", "Coordinator", "Technician"],
    defaultFields: [
      { key: "uhid", label: "UHID / Patient ID", type: "text" },
      { key: "department", label: "Department", type: "select", options: ["General Medicine", "Cardiology", "Orthopedics", "Pediatrics", "Emergency"] },
      { key: "insurance", label: "Insurance / TPA", type: "text" },
    ],
    defaultBranches: [
      { name: "Main Hospital", address: "Primary campus" },
      { name: "Outpatient Block", address: "OPD wing" },
    ],
    slotDurationMin: 20,
    reminderChannels: ["sms", "voice", "whatsapp"],
  },
  {
    id: "clinic",
    name: "Clinic / Polyclinic",
    tagline: "Single or multi-specialty clinics with fast booking flows.",
    icon: "clinic",
    terms: {
      customer: "Patient",
      customers: "Patients",
      appointment: "Booking",
      appointments: "Bookings",
      provider: "Practitioner",
      providers: "Practitioners",
      branch: "Clinic",
      branches: "Clinics",
      agent: "Receptionist",
      department: "Department",
      departments: "Departments",
      staff: "Staff",
      staffPlural: "Staff",
    },
    appointmentTypes: ["Consultation", "Follow-up", "Health Check-up", "Lab Sample", "Procedure"],
    services: ["General Practice", "Dental", "Dermatology", "Physiotherapy", "ENT"],
    staffRoles: ["Practitioner", "Dental Hygienist", "Physiotherapist", "Receptionist", "Lab Technician"],
    defaultFields: [
      { key: "reason", label: "Visit Reason", type: "text", required: true },
      { key: "preferred_doctor", label: "Preferred Doctor", type: "text" },
    ],
    defaultBranches: [{ name: "Main Clinic" }],
    slotDurationMin: 15,
    reminderChannels: ["sms", "voice"],
  },
  {
    id: "school",
    name: "School / Education",
    tagline: "Parent meetings, admissions, counseling & campus visits.",
    icon: "school",
    terms: {
      customer: "Parent / Student",
      customers: "Families",
      appointment: "Meeting",
      appointments: "Meetings",
      provider: "Staff Member",
      providers: "Staff",
      branch: "Campus",
      branches: "Campuses",
      agent: "Front Office",
      department: "Office",
      departments: "Offices",
      staff: "Staff Member",
      staffPlural: "Staff",
    },
    appointmentTypes: ["Parent-Teacher Meeting", "Admission Interview", "Counseling Session", "Campus Tour", "Fee Consultation"],
    services: ["Admissions", "Academic Counseling", "Administration", "Transport Desk"],
    staffRoles: ["Teacher", "Counselor", "Admin Officer", "Admissions Lead", "Front Desk"],
    defaultFields: [
      { key: "student_name", label: "Student Name", type: "text", required: true },
      { key: "grade", label: "Grade / Class", type: "text" },
      { key: "guardian_phone", label: "Guardian Phone", type: "phone", required: true },
    ],
    defaultBranches: [
      { name: "Main Campus" },
      { name: "Junior Wing" },
    ],
    slotDurationMin: 30,
    reminderChannels: ["sms", "email", "voice"],
  },
  {
    id: "dental",
    name: "Dental / Orthodontics",
    tagline: "Chair time, cleanings, orthodontics & treatment plans.",
    icon: "dental",
    terms: {
      customer: "Patient",
      customers: "Patients",
      appointment: "Appointment",
      appointments: "Appointments",
      provider: "Dentist",
      providers: "Dentists",
      branch: "Practice",
      branches: "Practices",
      agent: "Dental Coordinator",
      department: "Department",
      departments: "Departments",
      staff: "Dentist",
      staffPlural: "Dental Team",
    },
    appointmentTypes: ["Check-up", "Cleaning", "Filling", "Root Canal", "Orthodontic Adjustment", "Emergency"],
    services: ["General Dentistry", "Orthodontics", "Cosmetic", "Pediatric Dental"],
    staffRoles: ["Dentist", "Orthodontist", "Hygienist", "Dental Assistant", "Receptionist"],
    defaultFields: [
      { key: "last_visit", label: "Last Visit Date", type: "date" },
      { key: "treatment_plan", label: "Treatment Plan Ref", type: "text" },
    ],
    defaultBranches: [{ name: "Dental Studio" }],
    slotDurationMin: 30,
    reminderChannels: ["sms", "voice", "whatsapp"],
  },
  {
    id: "salon",
    name: "Salon / Spa / Wellness",
    tagline: "Stylists, therapists, packages & walk-in slots.",
    icon: "salon",
    terms: {
      customer: "Client",
      customers: "Clients",
      appointment: "Booking",
      appointments: "Bookings",
      provider: "Stylist / Therapist",
      providers: "Team",
      branch: "Outlet",
      branches: "Outlets",
      agent: "Booking Assistant",
      department: "Zone",
      departments: "Zones",
      staff: "Stylist",
      staffPlural: "Team",
    },
    appointmentTypes: ["Haircut", "Color / Treatment", "Spa Session", "Manicure / Pedicure", "Package Session"],
    services: ["Hair", "Skin", "Nails", "Massage", "Bridal Packages"],
    staffRoles: ["Senior Stylist", "Junior Stylist", "Therapist", "Nail Artist", "Receptionist"],
    defaultFields: [
      { key: "preferred_staff", label: "Preferred Staff", type: "text" },
      { key: "package", label: "Package / Membership", type: "text" },
    ],
    defaultBranches: [
      { name: "Flagship Salon" },
      { name: "Spa Lounge" },
    ],
    slotDurationMin: 45,
    reminderChannels: ["sms", "whatsapp"],
  },
  {
    id: "fitness",
    name: "Gym / Fitness Studio",
    tagline: "Trainer sessions, classes, assessments & trials.",
    icon: "fitness",
    terms: {
      customer: "Member",
      customers: "Members",
      appointment: "Session",
      appointments: "Sessions",
      provider: "Trainer",
      providers: "Trainers",
      branch: "Center",
      branches: "Centers",
      agent: "Membership Desk",
      department: "Zone",
      departments: "Zones",
      staff: "Trainer",
      staffPlural: "Trainers",
    },
    appointmentTypes: ["Personal Training", "Group Class", "Fitness Assessment", "Trial Session", "Nutrition Consult"],
    services: ["Strength", "Yoga", "CrossFit", "Swimming", "Rehab"],
    staffRoles: ["Head Trainer", "Personal Trainer", "Yoga Instructor", "Nutritionist", "Front Desk"],
    defaultFields: [
      { key: "membership_id", label: "Membership ID", type: "text" },
      { key: "goal", label: "Fitness Goal", type: "select", options: ["Weight Loss", "Muscle Gain", "Rehab", "General Fitness"] },
    ],
    defaultBranches: [{ name: "Main Center" }],
    slotDurationMin: 60,
    reminderChannels: ["sms", "voice"],
  },
  {
    id: "legal",
    name: "Legal / Law Firm",
    tagline: "Client consultations, case reviews & court-date reminders.",
    icon: "legal",
    terms: {
      customer: "Client",
      customers: "Clients",
      appointment: "Consultation",
      appointments: "Consultations",
      provider: "Advocate",
      providers: "Advocates",
      branch: "Office",
      branches: "Offices",
      agent: "Legal Assistant",
      department: "Practice Area",
      departments: "Practice Areas",
      staff: "Associate",
      staffPlural: "Associates",
    },
    appointmentTypes: ["Initial Consultation", "Case Review", "Document Signing", "Court Prep", "Follow-up"],
    services: ["Corporate Law", "Family Law", "Criminal Defense", "Property Law", "Immigration"],
    staffRoles: ["Senior Partner", "Associate Advocate", "Paralegal", "Legal Secretary", "Receptionist"],
    defaultFields: [
      { key: "case_ref", label: "Case Reference", type: "text" },
      { key: "practice_area", label: "Practice Area", type: "select", options: ["Corporate Law", "Family Law", "Criminal Defense", "Property Law", "Immigration"] },
    ],
    defaultBranches: [{ name: "Main Office" }],
    slotDurationMin: 45,
    reminderChannels: ["sms", "email", "voice"],
  },
  {
    id: "realestate",
    name: "Real Estate",
    tagline: "Property viewings, site visits & buyer consultations.",
    icon: "realestate",
    terms: {
      customer: "Client",
      customers: "Clients",
      appointment: "Viewing",
      appointments: "Viewings",
      provider: "Agent",
      providers: "Agents",
      branch: "Office",
      branches: "Offices",
      agent: "Sales Coordinator",
      department: "Team",
      departments: "Teams",
      staff: "Agent",
      staffPlural: "Agents",
    },
    appointmentTypes: ["Property Viewing", "Site Visit", "Buyer Consultation", "Valuation", "Document Signing"],
    services: ["Residential Sales", "Commercial Leasing", "Rentals", "Valuations"],
    staffRoles: ["Senior Agent", "Sales Agent", "Leasing Consultant", "Coordinator", "Receptionist"],
    defaultFields: [
      { key: "property_ref", label: "Property Reference", type: "text" },
      { key: "budget", label: "Budget Range", type: "text" },
    ],
    defaultBranches: [{ name: "Main Office" }],
    slotDurationMin: 45,
    reminderChannels: ["sms", "voice", "whatsapp"],
  },
  {
    id: "veterinary",
    name: "Veterinary Clinic",
    tagline: "Pet check-ups, vaccinations, grooming & emergency slots.",
    icon: "veterinary",
    terms: {
      customer: "Pet Owner",
      customers: "Pet Owners",
      appointment: "Appointment",
      appointments: "Appointments",
      provider: "Veterinarian",
      providers: "Veterinarians",
      branch: "Clinic",
      branches: "Clinics",
      agent: "Front Desk",
      department: "Department",
      departments: "Departments",
      staff: "Staff",
      staffPlural: "Staff",
    },
    appointmentTypes: ["Check-up", "Vaccination", "Grooming", "Surgery", "Emergency", "Follow-up"],
    services: ["General Vet Care", "Surgery", "Dental", "Grooming", "Boarding"],
    staffRoles: ["Veterinarian", "Vet Technician", "Groomer", "Receptionist", "Assistant"],
    defaultFields: [
      { key: "pet_name", label: "Pet Name", type: "text", required: true },
      { key: "pet_species", label: "Species / Breed", type: "text" },
    ],
    defaultBranches: [{ name: "Main Clinic" }],
    slotDurationMin: 20,
    reminderChannels: ["sms", "voice", "whatsapp"],
  },
  {
    id: "homeservices",
    name: "Home Services",
    tagline: "Repairs, cleaning, installations & on-site technician visits.",
    icon: "homeservices",
    terms: {
      customer: "Customer",
      customers: "Customers",
      appointment: "Service Visit",
      appointments: "Service Visits",
      provider: "Technician",
      providers: "Technicians",
      branch: "Service Area",
      branches: "Service Areas",
      agent: "Dispatch Coordinator",
      department: "Team",
      departments: "Teams",
      staff: "Technician",
      staffPlural: "Technicians",
    },
    appointmentTypes: ["Repair Visit", "Installation", "Maintenance", "Inspection", "Emergency Callout"],
    services: ["Plumbing", "Electrical", "Cleaning", "AC / HVAC", "Pest Control", "Appliance Repair"],
    staffRoles: ["Senior Technician", "Technician", "Dispatcher", "Support Agent"],
    defaultFields: [
      { key: "address", label: "Service Address", type: "text", required: true },
      { key: "issue", label: "Issue Description", type: "text" },
    ],
    defaultBranches: [{ name: "Main Service Area" }],
    slotDurationMin: 60,
    reminderChannels: ["sms", "voice", "whatsapp"],
  },
  {
    id: "consulting",
    name: "Consulting / Coaching",
    tagline: "1:1 sessions, discovery calls & strategy consultations.",
    icon: "consulting",
    terms: {
      customer: "Client",
      customers: "Clients",
      appointment: "Session",
      appointments: "Sessions",
      provider: "Consultant",
      providers: "Consultants",
      branch: "Office",
      branches: "Offices",
      agent: "Client Coordinator",
      department: "Practice",
      departments: "Practices",
      staff: "Consultant",
      staffPlural: "Consultants",
    },
    appointmentTypes: ["Discovery Call", "Strategy Session", "Coaching Session", "Follow-up", "Workshop"],
    services: ["Business Consulting", "Career Coaching", "Financial Advisory", "Life Coaching"],
    staffRoles: ["Senior Consultant", "Consultant", "Coach", "Client Coordinator"],
    defaultFields: [
      { key: "goal", label: "Session Goal", type: "text" },
      { key: "referral", label: "Referred By", type: "text" },
    ],
    defaultBranches: [{ name: "Main Office" }],
    slotDurationMin: 45,
    reminderChannels: ["email", "sms", "voice"],
  },
  {
    id: "automotive",
    name: "Automotive Service",
    tagline: "Car servicing, repairs, inspections & test drives.",
    icon: "automotive",
    terms: {
      customer: "Customer",
      customers: "Customers",
      appointment: "Service Booking",
      appointments: "Service Bookings",
      provider: "Mechanic",
      providers: "Mechanics",
      branch: "Service Center",
      branches: "Service Centers",
      agent: "Service Advisor",
      department: "Bay",
      departments: "Bays",
      staff: "Mechanic",
      staffPlural: "Mechanics",
    },
    appointmentTypes: ["General Service", "Repair", "Inspection", "Test Drive", "Insurance Claim"],
    services: ["Car Servicing", "Body Repair", "Detailing", "Tyres & Batteries", "Diagnostics"],
    staffRoles: ["Senior Mechanic", "Mechanic", "Service Advisor", "Detailer", "Receptionist"],
    defaultFields: [
      { key: "vehicle_number", label: "Vehicle Number", type: "text", required: true },
      { key: "vehicle_model", label: "Make / Model", type: "text" },
    ],
    defaultBranches: [{ name: "Main Service Center" }],
    slotDurationMin: 60,
    reminderChannels: ["sms", "voice", "whatsapp"],
  },
  {
    id: "events",
    name: "Photography / Events",
    tagline: "Shoots, event consultations & studio bookings.",
    icon: "events",
    terms: {
      customer: "Client",
      customers: "Clients",
      appointment: "Booking",
      appointments: "Bookings",
      provider: "Photographer",
      providers: "Photographers",
      branch: "Studio",
      branches: "Studios",
      agent: "Booking Manager",
      department: "Team",
      departments: "Teams",
      staff: "Photographer",
      staffPlural: "Team",
    },
    appointmentTypes: ["Studio Shoot", "Event Consultation", "On-location Shoot", "Delivery Review"],
    services: ["Weddings", "Portraits", "Corporate Events", "Product Photography"],
    staffRoles: ["Lead Photographer", "Photographer", "Editor", "Booking Manager"],
    defaultFields: [
      { key: "event_date", label: "Event Date", type: "date" },
      { key: "package", label: "Package", type: "text" },
    ],
    defaultBranches: [{ name: "Main Studio" }],
    slotDurationMin: 60,
    reminderChannels: ["email", "sms", "whatsapp"],
  },
  {
    id: "coworking",
    name: "Coworking / Meeting Rooms",
    tagline: "Desk bookings, meeting rooms & facility tours.",
    icon: "coworking",
    terms: {
      customer: "Member",
      customers: "Members",
      appointment: "Booking",
      appointments: "Bookings",
      provider: "Host",
      providers: "Hosts",
      branch: "Location",
      branches: "Locations",
      agent: "Community Manager",
      department: "Floor",
      departments: "Floors",
      staff: "Host",
      staffPlural: "Hosts",
    },
    appointmentTypes: ["Meeting Room", "Day Pass Tour", "Facility Tour", "Event Space Booking"],
    services: ["Hot Desks", "Private Cabins", "Meeting Rooms", "Event Spaces"],
    staffRoles: ["Community Manager", "Front Desk", "Facilities Lead"],
    defaultFields: [
      { key: "company", label: "Company Name", type: "text" },
      { key: "attendees", label: "No. of Attendees", type: "number" },
    ],
    defaultBranches: [{ name: "Main Location" }],
    slotDurationMin: 30,
    reminderChannels: ["email", "sms"],
  },
  {
    id: "immigration",
    name: "Immigration / Visa Services",
    tagline: "Visa consultations, document reviews & application follow-ups.",
    icon: "immigration",
    terms: {
      customer: "Applicant",
      customers: "Applicants",
      appointment: "Consultation",
      appointments: "Consultations",
      provider: "Consultant",
      providers: "Consultants",
      branch: "Office",
      branches: "Offices",
      agent: "Case Coordinator",
      department: "Visa Category",
      departments: "Visa Categories",
      staff: "Consultant",
      staffPlural: "Consultants",
    },
    appointmentTypes: ["Initial Consultation", "Document Review", "Application Follow-up", "Interview Prep"],
    services: ["Student Visa", "Work Visa", "PR / Immigration", "Tourist Visa", "Citizenship"],
    staffRoles: ["Senior Consultant", "Visa Consultant", "Case Coordinator", "Document Officer"],
    defaultFields: [
      { key: "case_ref", label: "Case Reference", type: "text" },
      { key: "visa_type", label: "Visa Type", type: "select", options: ["Student Visa", "Work Visa", "PR / Immigration", "Tourist Visa", "Citizenship"] },
    ],
    defaultBranches: [{ name: "Main Office" }],
    slotDurationMin: 30,
    reminderChannels: ["sms", "email", "whatsapp"],
  },
  {
    id: "financial",
    name: "Financial / Tax Advisory",
    tagline: "Tax filing, financial planning & audit consultations.",
    icon: "financial",
    terms: {
      customer: "Client",
      customers: "Clients",
      appointment: "Consultation",
      appointments: "Consultations",
      provider: "Advisor",
      providers: "Advisors",
      branch: "Office",
      branches: "Offices",
      agent: "Client Coordinator",
      department: "Practice",
      departments: "Practices",
      staff: "Advisor",
      staffPlural: "Advisors",
    },
    appointmentTypes: ["Tax Filing", "Financial Planning", "Audit Consultation", "Investment Review"],
    services: ["Tax Advisory", "Wealth Management", "Audit & Assurance", "Business Accounting"],
    staffRoles: ["Senior Advisor", "Financial Advisor", "Accountant", "Client Coordinator"],
    defaultFields: [
      { key: "pan_gst", label: "PAN / GST No.", type: "text" },
      { key: "service_type", label: "Service Type", type: "text" },
    ],
    defaultBranches: [{ name: "Main Office" }],
    slotDurationMin: 30,
    reminderChannels: ["email", "sms", "voice"],
  },
  {
    id: "generic",
    name: "Other / Custom",
    tagline: "Set up your own terminology, services & booking types from scratch.",
    icon: "generic",
    terms: {
      customer: "Customer",
      customers: "Customers",
      appointment: "Appointment",
      appointments: "Appointments",
      provider: "Staff",
      providers: "Staff",
      branch: "Location",
      branches: "Locations",
      agent: "Scheduling Agent",
      department: "Department",
      departments: "Departments",
      staff: "Staff",
      staffPlural: "Staff",
    },
    appointmentTypes: ["Consultation", "Service Visit", "Follow-up", "Demo", "On-site Visit"],
    services: ["General", "Premium", "Support"],
    staffRoles: ["Manager", "Specialist", "Associate", "Receptionist", "Coordinator"],
    defaultFields: [{ key: "reference", label: "Reference", type: "text" }],
    defaultBranches: [{ name: "Main Office" }],
    slotDurationMin: 30,
    reminderChannels: ["sms", "email", "voice"],
  },
];

const STORAGE_KEY = "shivai_appointmentcrm_industry";
const CUSTOM_PRESET_KEY = "shivai_appointmentcrm_custom_preset";
const INDUSTRY_EVENT = "shivai:appointment-industry-changed";

export function getActiveIndustryId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "clinic";
  } catch {
    return "clinic";
  }
}

export function setActiveIndustryId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent(INDUSTRY_EVENT));
  } catch {
    /* ignore */
  }
}

// ── Fully custom preset ──────────────────────────────────────────────────────
// Lets a business that doesn't fit any preset define its own terminology,
// services & booking types instead of using the generic defaults. Stored
// separately from the fixed preset list so it survives even if the user
// switches away and back.
export interface CustomPresetInput {
  customerLabel: string;
  appointmentLabel: string;
  providerLabel: string;
  branchLabel: string;
  services: string[];
  appointmentTypes: string[];
}

function pluralize(word: string): string {
  const w = word.trim();
  if (!w) return w;
  if (/[sxz]$|[cs]h$/i.test(w)) return `${w}es`;
  if (/[^aeiou]y$/i.test(w)) return `${w.slice(0, -1)}ies`;
  return `${w}s`;
}

export function buildCustomPreset(input: CustomPresetInput): AppointmentIndustryPreset {
  const customer = input.customerLabel.trim() || "Customer";
  const appointment = input.appointmentLabel.trim() || "Appointment";
  const provider = input.providerLabel.trim() || "Staff";
  const branch = input.branchLabel.trim() || "Location";
  const services = input.services.map((s) => s.trim()).filter(Boolean);
  const appointmentTypes = input.appointmentTypes.map((s) => s.trim()).filter(Boolean);

  return {
    id: "generic",
    name: "Other / Custom",
    tagline: "Your own terminology, services & booking types.",
    icon: "generic",
    terms: {
      customer,
      customers: pluralize(customer),
      appointment,
      appointments: pluralize(appointment),
      provider,
      providers: pluralize(provider),
      branch,
      branches: pluralize(branch),
      agent: "Scheduling Agent",
      department: "Department",
      departments: "Departments",
      staff: provider,
      staffPlural: pluralize(provider),
    },
    appointmentTypes: appointmentTypes.length ? appointmentTypes : ["Consultation", "Service Visit", "Follow-up"],
    services: services.length ? services : ["General"],
    staffRoles: ["Manager", "Specialist", "Associate", "Receptionist", "Coordinator"],
    defaultFields: [{ key: "reference", label: "Reference", type: "text" }],
    defaultBranches: [{ name: `Main ${branch}` }],
    slotDurationMin: 30,
    reminderChannels: ["sms", "email", "voice"],
  };
}

export function saveCustomPreset(input: CustomPresetInput): void {
  try {
    localStorage.setItem(CUSTOM_PRESET_KEY, JSON.stringify(input));
  } catch {
    /* ignore */
  }
}

export function readCustomPresetInput(): CustomPresetInput | null {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESET_KEY);
    return raw ? (JSON.parse(raw) as CustomPresetInput) : null;
  } catch {
    return null;
  }
}

export function getActivePreset(): AppointmentIndustryPreset {
  const id = getActiveIndustryId();
  if (id === "generic") {
    const customInput = readCustomPresetInput();
    if (customInput) return buildCustomPreset(customInput);
  }
  return APPOINTMENT_INDUSTRY_PRESETS.find((p) => p.id === id) ?? APPOINTMENT_INDUSTRY_PRESETS[1];
}

export function useAppointmentIndustry() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(INDUSTRY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INDUSTRY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const preset = getActivePreset();
  return {
    preset,
    terms: preset.terms,
    services: preset.services,
    appointmentTypes: preset.appointmentTypes,
    fields: preset.defaultFields,
    activeId: preset.id,
    setIndustry: setActiveIndustryId,
  };
}
