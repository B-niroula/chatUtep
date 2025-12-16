// UTEP knowledge base shared with the RAG backend
// Mirrors the client-side knowledge snippets but lives on the server for retrieval
const utepKnowledge = [
  {
    category: "Admissions",
    topic: "Freshman Admission Requirements",
    content:
      "UTEP admits freshmen who graduate in the top 25% of their high school class or have a minimum SAT score of 1070 (ERW+M) or ACT composite of 23. Students must complete the Texas Success Initiative (TSI) requirements.",
    url: "https://www.utep.edu/admissions/freshmen/",
  },
  {
    category: "Admissions",
    topic: "Application Deadlines",
    content:
      "Fall semester: July 1 (priority: March 1), Spring semester: December 1, Summer semester: May 1. International students should apply at least 3 months before the semester starts.",
    url: "https://www.utep.edu/admissions/apply/",
  },
  {
    category: "Academics",
    topic: "Colleges and Schools",
    content:
      "UTEP has 9 colleges: College of Business Administration, College of Education, College of Engineering, College of Health Sciences, College of Liberal Arts, College of Science, School of Nursing, School of Pharmacy, and Graduate School.",
    url: "https://www.utep.edu/academics/",
  },
  {
    category: "Academics",
    topic: "Popular Majors",
    content:
      "Top programs include Engineering (Mechanical, Electrical, Civil), Nursing, Business Administration, Psychology, Biology, Criminal Justice, and Computer Science. UTEP is designated as a Hispanic-Serving Institution (HSI).",
    url: "https://www.utep.edu/academics/programs.html",
  },
  {
    category: "Campus Life",
    topic: "Student Organizations",
    content:
      "UTEP has over 200 student organizations including academic clubs, Greek life, cultural organizations, and special interest groups. Students can join through MinerConnect.",
    url: "https://www.utep.edu/student-affairs/student-engagement/",
  },
  {
    category: "Campus Life",
    topic: "Athletics",
    content:
      "UTEP Miners compete in NCAA Division I (Conference USA). Sports include football, basketball, track and field, soccer, volleyball, and more. The Sun Bowl Stadium hosts football games.",
    url: "https://www.utep.edu/athletics/",
  },
  {
    category: "Financial Aid",
    topic: "Scholarships",
    content:
      "UTEP offers merit-based scholarships, need-based aid, and departmental scholarships. The Gold Nugget Scholarship provides full tuition for qualifying students. FAFSA deadline is priority March 15.",
    url: "https://www.utep.edu/student-affairs/financialaid/scholarships/",
  },
  {
    category: "Financial Aid",
    topic: "Tuition and Fees",
    content:
      "For 2024-25, undergraduate tuition is approximately $8,000/year for Texas residents and $25,000/year for non-residents (15 credit hours per semester). Additional fees apply.",
    url: "https://www.utep.edu/student-affairs/financialaid/cost.html",
  },
  {
    category: "Student Services",
    topic: "Academic Advising",
    content:
      "Each college has dedicated academic advisors. Students can schedule appointments through Navigate or walk-in during office hours. Advising helps with course selection, degree planning, and graduation requirements.",
    url: "https://www.utep.edu/student-affairs/advising/",
  },
  {
    category: "Student Services",
    topic: "Tutoring Services",
    content:
      "Free tutoring available at the University Library Learning Commons, Math Resource Center, and Writing Center. Supplemental Instruction (SI) sessions offered for difficult courses.",
    url: "https://www.utep.edu/student-affairs/univ-college/tutoring.html",
  },
  {
    category: "Campus Facilities",
    topic: "Library",
    content:
      "The University Library offers study spaces, computer labs, research assistance, and access to databases. Open 24/5 during fall/spring semesters. Special Collections houses rare books and archives.",
    url: "https://www.utep.edu/library/",
  },
  {
    category: "Campus Facilities",
    topic: "Recreation Center",
    content:
      "The Larry K. Durham Sports Center includes fitness equipment, basketball courts, swimming pool, rock climbing wall, and group fitness classes. Free for students with valid ID.",
    url: "https://www.utep.edu/campusrec/",
  },
  {
    category: "Housing",
    topic: "On-Campus Housing",
    content:
      "UTEP offers residence halls including Miner Village, Miner Heights, and traditional dorms. Housing includes meal plans. Applications open in February for fall semester.",
    url: "https://www.utep.edu/student-affairs/housing/",
  },
  {
    category: "Career Services",
    topic: "Career Center",
    content:
      "The Career Center provides resume reviews, mock interviews, job search assistance, and career fairs. Handshake platform connects students with employers and internship opportunities.",
    url: "https://www.utep.edu/student-affairs/careers/",
  },
  {
    category: "General Info",
    topic: "Location and Campus",
    content:
      "UTEP is located in El Paso, Texas, on the US-Mexico border. The campus features distinctive Bhutanese architecture. Enrollment is approximately 24,000 students.",
    url: "https://www.utep.edu/about/",
  },
  {
    category: "Academics",
    topic: "Course Schedule and Registration",
    content:
      "To find current course offerings including CS graduate courses, use the Class Schedule Search. Select the semester (Fall, Spring, or Summer) and search by subject code (CS for Computer Science). Graduate courses are numbered 5000 and above.",
    url: "https://www.utep.edu/student-affairs/registrar/students/class-schedules.html",
  },
  {
    category: "Academics",
    topic: "Computer Science Graduate Programs",
    content:
      "The Computer Science Department offers MS and PhD programs. For graduate course listings, curriculum requirements, and program information, visit the CS department website or check the graduate catalog.",
    url: "https://www.utep.edu/cs/academics/graduate/index.html",
  },
  {
    category: "Academics",
    topic: "Graduate Catalog",
    content:
      "The Graduate Catalog contains detailed information about all graduate programs, course descriptions, degree requirements, and academic policies.",
    url: "https://catalog.utep.edu/",
  },
  {
    category: "Academics",
    topic: "Graduate Graduation Application Deadlines",
    content:
      "Graduate students (including Computer Science) must file a graduation application by the Graduate School deadlines listed for each term. Deadlines are posted on the Graduate School site; submit early and confirm any departmental requirements.",
    url: "https://www.utep.edu/graduate/graduate-school/",
  },
  {
    category: "Academics",
    topic: "Registrar Graduation Guidance",
    content:
      "Graduation and degree conferral are coordinated through the Registrar in partnership with the Graduate School. Review the Registrar site for graduation steps, forms, and term-specific dates, then submit the graduation application by the posted deadlines.",
    url: "https://www.utep.edu/student-affairs/registrar/",
  },
];

module.exports = { utepKnowledge };
