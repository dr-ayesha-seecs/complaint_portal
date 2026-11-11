export type DepartmentSeed = {
  id: string;
  code: string;
  name: string;
  nameUr: string;
  chairpersonName: string;
  chairpersonEmail: string;
};

export type FacultySeed = {
  id: string;
  code: string;
  name: string;
  nameUr: string;
  deanName: string;
  deanEmail: string;
  departments: DepartmentSeed[];
};

function department(
  facultyId: string,
  slug: string,
  name: string,
  nameUr: string,
  chairpersonName = "Office of the Chairperson",
): DepartmentSeed {
  return {
    id: `${facultyId}-${slug}`,
    code: `${facultyId}-${slug}`.toUpperCase(),
    name,
    nameUr,
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
  nameUr: string,
  departments: DepartmentSeed[],
  deanName = "Office of the Dean",
): FacultySeed {
  return {
    id,
    code: id.toUpperCase(),
    name,
    nameUr,
    deanName,
    deanEmail: OFFICIAL_DEAN_EMAILS[id] ?? `placeholder+${id}-dean@mnsuam.invalid`,
    departments,
  };
}

/**
 * Seed structure drawn from the MNSUAM website and the 2025 undergraduate prospectus.
 * The six academic faculties use official dean office addresses (dean.<faculty>@mnsuam.edu.pk).
 * Department chairs and University Administration remain placeholders on the reserved
 * `.invalid` domain until they are replaced in Dashboard → Contacts. The database, not
 * this file, is the source of truth once rows exist.
 */
export const organisation: FacultySeed[] = [
  faculty(
    "faes",
    "Faculty of Agriculture and Environmental Sciences",
    "فیکلٹی آف ایگریکلچر اینڈ انوائرنمنٹل سائنسز",
    [
      department("faes", "agronomy", "Department of Agronomy", "شعبہ ایگرونومی"),
      department("faes", "forestry", "Department of Forestry and Range Management", "شعبہ جنگلات و چراگاہ"),
      department("faes", "horticulture", "Department of Horticulture", "شعبہ باغبانی"),
      department("faes", "soil", "Department of Soil and Environmental Sciences", "شعبہ زمین و ماحولیاتی علوم"),
      department("faes", "ipbb", "Institute of Plant Breeding and Biotechnology", "انسٹی ٹیوٹ آف پلانٹ بریڈنگ اینڈ بائیوٹیکنالوجی"),
      department("faes", "ipp", "Institute of Plant Protection", "انسٹی ٹیوٹ آف پلانٹ پروٹیکشن"),
    ],
  ),
  faculty(
    "ffhs",
    "Faculty of Food and Home Sciences",
    "فیکلٹی آف فوڈ اینڈ ہوم سائنسز",
    [
      department("ffhs", "fst", "Department of Food Science and Technology", "شعبہ فوڈ سائنس اینڈ ٹیکنالوجی"),
      department("ffhs", "hnd", "Department of Human Nutrition and Dietetics", "شعبہ ہیومن نیوٹریشن اینڈ ڈائیٹیکس"),
      department("ffhs", "home", "Department of Home Sciences", "شعبہ ہوم سائنسز"),
    ],
  ),
  faculty(
    "fssh",
    "Faculty of Social Sciences and Humanities",
    "فیکلٹی آف سوشل سائنسز اینڈ ہیومینٹیز",
    [
      department("fssh", "are", "Department of Agricultural and Resource Economics", "شعبہ زرعی و وسائلی معاشیات"),
      department("fssh", "aed", "Department of Agribusiness and Entrepreneurship Development", "شعبہ ایگری بزنس اینڈ انٹرپرینیورشپ"),
      department("fssh", "doce", "Department of Outreach and Continuing Education", "شعبہ آؤٹ ریچ اینڈ کنٹینیونگ ایجوکیشن"),
      department("fssh", "extension", "Department of Agricultural Extension", "شعبہ زرعی ترویج"),
      department("fssh", "islamic", "Department of Islamic Studies", "شعبہ اسلامی علوم"),
      department("fssh", "english", "Department of English", "شعبہ انگریزی"),
      department("fssh", "statistics", "Department of Statistics", "شعبہ شماریات"),
      department("fssh", "cassp", "Center for Agricultural Sustainability in South Punjab", "مرکز برائے زرعی پائیداری، جنوبی پنجاب"),
    ],
  ),
  faculty(
    "fvas",
    "Faculty of Veterinary and Animal Sciences",
    "فیکلٹی آف ویٹرنری اینڈ اینیمل سائنسز",
    [
      department("fvas", "pathobiology", "Department of Pathobiology and Biomedical Sciences", "شعبہ پیتھوبائیولوجی اینڈ بائیومیڈیکل سائنسز"),
      department("fvas", "animal", "Department of Animal and Dairy Sciences", "شعبہ اینیمل اینڈ ڈیری سائنسز"),
      department("fvas", "clinical", "Department of Clinical Sciences", "شعبہ کلینیکل سائنسز"),
      department("fvas", "zwf", "Department of Zoology, Wildlife and Fisheries", "شعبہ زولوجی، وائلڈ لائف اینڈ فشریز"),
      department("fvas", "biochem", "Department of Biochemistry and Biotechnology", "شعبہ بائیو کیمسٹری اینڈ بائیوٹیکنالوجی"),
      department("fvas", "poultry", "Department of Poultry Science", "شعبہ پولٹری سائنس"),
      department("fvas", "pharmacy", "Department of Pharmacy", "شعبہ فارمیسی"),
    ],
  ),
  faculty(
    "fabset",
    "Faculty of Agricultural Biosystems Engineering and Technology",
    "فیکلٹی آف ایگریکلچرل بایو سسٹمز انجینئرنگ اینڈ ٹیکنالوجی",
    [
      department("fabset", "agen", "Department of Agricultural Engineering", "شعبہ زرعی انجینئرنگ"),
      department("fabset", "aiet", "Department of Agro-Industrial Engineering Technology", "شعبہ ایگرو انڈسٹریل انجینئرنگ ٹیکنالوجی"),
      department("fabset", "energy", "Department of Energy Systems Engineering", "شعبہ انرجی سسٹمز انجینئرنگ"),
    ],
  ),
  faculty(
    "foc",
    "Faculty of Computing",
    "فیکلٹی آف کمپیوٹنگ",
    [
      department("foc", "cs", "Department of Computer Science", "شعبہ کمپیوٹر سائنس"),
      department("foc", "it", "Department of Information Technology", "شعبہ انفارمیشن ٹیکنالوجی"),
      department(
        "foc",
        "aids",
        "Department of Artificial Intelligence and Data Science",
        "شعبہ مصنوعی ذہانت و ڈیٹا سائنس",
        "Prof. Dr. Ayesha Hakim",
      ),
    ],
  ),
  faculty(
    "admin",
    "University Administration",
    "یونیورسٹی انتظامیہ",
    [
      department("admin", "registrar", "Office of the Registrar", "دفتر رجسٹرار", "Office of the Registrar"),
      department("admin", "treasurer", "Office of the Treasurer", "دفتر خزانچی", "Office of the Treasurer"),
      department("admin", "dsa", "Directorate of Students Affairs", "ڈائریکٹوریٹ آف سٹوڈنٹس افیئرز"),
      department("admin", "hostel", "Hostel Administration", "ہاسٹل انتظامیہ"),
      department("admin", "transport", "Transport", "ٹرانسپورٹ"),
      department("admin", "library", "Central Library", "مرکزی لائبریری"),
      department("admin", "its", "IT Services", "آئی ٹی سروسز"),
      department("admin", "security", "Campus Security", "کیمپس سیکیورٹی"),
      department("admin", "access", "Disability and Accessibility Coordination", "معذوری و رسائی رابطہ دفتر"),
      department("admin", "qec", "Quality Enhancement Cell", "کوالٹی انہانسمنٹ سیل"),
    ],
    "University Administration",
  ),
];

export type PublicDepartment = { id: string; name: string; nameUr: string };
export type PublicFaculty = { id: string; name: string; nameUr: string; departments: PublicDepartment[] };
export type PublicOrg = { faculties: PublicFaculty[] };

export function toPublicOrg(source: FacultySeed[] = organisation): PublicOrg {
  return {
    faculties: source.map((item) => ({
      id: item.id,
      name: item.name,
      nameUr: item.nameUr,
      departments: item.departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        nameUr: dept.nameUr,
      })),
    })),
  };
}
