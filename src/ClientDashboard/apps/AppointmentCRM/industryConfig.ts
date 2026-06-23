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
    id: "generic",
    name: "Other / Custom",
    tagline: "Flexible scheduling for any appointment-based business.",
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

export function getActivePreset(): AppointmentIndustryPreset {
  const id = getActiveIndustryId();
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
