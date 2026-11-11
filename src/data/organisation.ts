export type DepartmentSeed = {
  id: string;
  code: string;
  name: string;
  chairpersonName: string;
  chairpersonEmail: string;
};

export type FacultySeed = {
  id: string;
  code: string;
  name: string;
  deanName: string;
  deanEmail: string;
  departments: DepartmentSeed[];
};

function department(
  facultyId: string,
  slug: string,
  name: string,
  chairpersonName = "Office of the Chairperson",
): DepartmentSeed {
  return {
    id: `${facultyId}-${slug}`,
    code: `${facultyId}-${slug}`.toUpperCase(),
    name,
    chairpersonName,
    chairpersonEmail: `placeholder+${facultyId}-${slug}-chair@mnsuam.invalid`,
  };
}

const OFFICIAL_DEAN_EMAILS: Record<string, string> = {
  faes: "dean.faes@mnsuam.edu.pk",
  ffhs: "dean.ffhs@mnsuam.edu.pk",
  fssh: "dean.fssh@mnsuam.edu.pk",
  fvas: "dean.fvas@mnsuam.edu.pk",
  fabset: "dean.fabset@mnsuam.edu.pk",
  foc: "dean.foc@mnsuam.edu.pk",
};

function faculty(
  id: string,
  name: string,
  departments: DepartmentSeed[],
  deanName = "Office of the Dean",
): FacultySeed {
  return {
    id,
    code: id.toUpperCase(),
    name,
    deanName,
    deanEmail: OFFICIAL_DEAN_EMAILS[id] ?? `placeholder+${id}-dean@mnsuam.invalid`,
    departments,
  };
}

/**
 * Seed structure drawn from the MNSUAM website and the 2025 undergraduate prospectus.
 * The six academic faculties use official dean office addresses (dean.<faculty>@mnsuam.edu.pk).
 * Department chairs and University Administration remain placeholders on the reserved
 * `.invalid` domain until they are replaced in Dashboard → Contacts. Names are English only.
 * The database, not this file, is the source of truth once rows exist.
 */
export const organisation: FacultySeed[] = [
  faculty(
    "faes",
    "Faculty of Agriculture and Environmental Sciences",
    [
      department("faes", "agronomy", "Department of Agronomy"),
      department("faes", "forestry", "Department of Forestry and Range Management"),
      department("faes", "horticulture", "Department of Horticulture"),
      department("faes", "soil", "Department of Soil and Environmental Sciences"),
      department("faes", "ipbb", "Institute of Plant Breeding and Biotechnology"),
      department("faes", "ipp", "Institute of Plant Protection"),
    ],
  ),
  faculty(
    "ffhs",
    "Faculty of Food and Home Sciences",
    [
      department("ffhs", "fst", "Department of Food Science and Technology"),
      department("ffhs", "hnd", "Department of Human Nutrition and Dietetics"),
      department("ffhs", "home", "Department of Home Sciences"),
    ],
  ),
  faculty(
    "fssh",
    "Faculty of Social Sciences and Humanities",
    [
      department("fssh", "are", "Department of Agricultural and Resource Economics"),
      department("fssh", "aed", "Department of Agribusiness and Entrepreneurship Development"),
      department("fssh", "doce", "Department of Outreach and Continuing Education"),
      department("fssh", "extension", "Department of Agricultural Extension"),
      department("fssh", "islamic", "Department of Islamic Studies"),
      department("fssh", "english", "Department of English"),
      department("fssh", "statistics", "Department of Statistics"),
      department("fssh", "cassp", "Center for Agricultural Sustainability in South Punjab"),
    ],
  ),
  faculty(
    "fvas",
    "Faculty of Veterinary and Animal Sciences",
    [
      department("fvas", "pathobiology", "Department of Pathobiology and Biomedical Sciences"),
      department("fvas", "animal", "Department of Animal and Dairy Sciences"),
      department("fvas", "clinical", "Department of Clinical Sciences"),
      department("fvas", "zwf", "Department of Zoology, Wildlife and Fisheries"),
      department("fvas", "biochem", "Department of Biochemistry and Biotechnology"),
      department("fvas", "poultry", "Department of Poultry Science"),
      department("fvas", "pharmacy", "Department of Pharmacy"),
    ],
  ),
  faculty(
    "fabset",
    "Faculty of Agricultural Biosystems Engineering and Technology",
    [
      department("fabset", "agen", "Department of Agricultural Engineering"),
      department("fabset", "aiet", "Department of Agro-Industrial Engineering Technology"),
      department("fabset", "energy", "Department of Energy Systems Engineering"),
    ],
  ),
  faculty(
    "foc",
    "Faculty of Computing",
    [
      department("foc", "cs", "Department of Computer Science"),
      department("foc", "it", "Department of Information Technology"),
      department(
        "foc",
        "aids",
        "Department of Artificial Intelligence and Data Science",
        "Prof. Dr. Ayesha Hakim",
      ),
    ],
  ),
  faculty(
    "admin",
    "University Administration",
    [
      department("admin", "registrar", "Office of the Registrar", "Office of the Registrar"),
      department("admin", "treasurer", "Office of the Treasurer", "Office of the Treasurer"),
      department("admin", "dsa", "Directorate of Students Affairs"),
      department("admin", "hostel", "Hostel Administration"),
      department("admin", "transport", "Transport"),
      department("admin", "library", "Central Library"),
      department("admin", "its", "IT Services"),
      department("admin", "security", "Campus Security"),
      department("admin", "access", "Disability and Accessibility Coordination"),
      department("admin", "qec", "Quality Enhancement Cell"),
    ],
    "University Administration",
  ),
];

export type PublicDepartment = { id: string; name: string };
export type PublicFaculty = { id: string; name: string; departments: PublicDepartment[] };
export type PublicOrg = { faculties: PublicFaculty[] };

export function toPublicOrg(source: FacultySeed[] = organisation): PublicOrg {
  return {
    faculties: source.map((item) => ({
      id: item.id,
      name: item.name,
      departments: item.departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
      })),
    })),
  };
}
