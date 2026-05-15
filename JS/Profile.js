import { auth, db } from "../firebaseConfig.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, increment, onSnapshot, deleteDoc, arrayUnion, arrayRemove, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "./config.js";

const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);

// Include your knowledge base in the System Instructions
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  systemInstruction: `You are Tupee, the AI assistant for TUP Connect. 
  Address students as 'TUPian' and use a friendly, helpful, and slightly witty Taglish tone.

  FORMATTING RULES:
  1. Use **bold text** for important names, offices, or keywords.
  2. Use bullet points (using * or -) for lists (like organizations or requirements).
  3. Use new lines/spacing to separate paragraphs.
  
  CRITICAL RULE: If a user asks for the official TUP Mission, Vision, or Core Values, provide the English text EXACTLY as written in the data below. Do not translate or summarize official university statements.
  
  UNIVERSITY KNOWLEDGE BASE:
  ${JSON.stringify([
    {
      "topic": "about tup",
      "content": "The Technological University of the Philippines (TUP) is a state university specializing in engineering, technology, and technical education."
    },
    {
      "topic": "tup manila campus",
      "content": "TUP Manila is the main campus of the Technological University of the Philippines located in Ermita, Manila."
    },
    {
      "topic": "location of tup",
      "content": "The Technological University of the Philippines – Manila is located at Ayala Blvd., corner San Marcelino St., Ermita, Manila, 1000 Metro Manila, Philippines"
    },
    {
      "topic": "tup history",
      "content": "The Technological University of the Philippines started in 1901 as the Manila Trade School. It later became the Philippine School of Arts and Trades and then the Philippine College of Arts and Trades before becoming TUP in 1978.\n\nManila Trade School or MTS (1901-1910) - The Technological University of the Philippines was first established as the Manila Trade School in 1901 upon the enactment of Act No. 74 by the United States Philippine Commision for the instruction of the Filipinos on useful trades.\nPhilippine School of Arts and Trades or PSAT (1910-1959) - evolved from a trade school into pioneering higher education institurion. By 1951, following a temporary closure during WWII, PSAT became the first school authorized to grant a four-year BS in Industrial Education, solidifying its foundation as the modern-day TUP Main campus.\nPhilippine College of Arts and Trades or PCAT (1959-1978) - On June 17, 1959, PSAT was converted into PCAT under Republic Act No.2237. This charter authorized the school to offer baccalaureate and graduate degrees, leading to the 1959 launch of a pioneering graduate program in industrial education. During this era, PCAT became nationally renowed ofr its excellence in providing high-quality industrial and technology training to Filipinos.\nTUP (1978-Present) - On June 11, 1978, PCAT was elevated to the Technological University of the Philippines by virtue of Presidential Decree No. 1518. This modern charter expanded the institution's mandate to include advanced vocational and professional education, as well as leadership in applied research and technology transfer.  "
    },
    {
      "topic": "tup type",
      "content": "The Technological University of the Philippines is a public state university funded by the Philippine government."
    },
    {
      "topic": "tup campuses",
      "content": "The Technological University of the Philippines system has campuses in Manila, Taguig, Cavite, and Visayas."
    },
    {
      "topic": "tup mission",
      "content": "TUP MISSION:\nThe University shall provide higher and advanced vocational, technical, industrial, technological and professional education and traning in industries and technology, and in practical arts leading to certificates, diplomas, and degrees. It shall provide progressive leadership in applied research, developmental studies in technical, industrial, and technological fields and production using indigenous materials; effect technology transfer in the countryside; and assist in the development of small-and-medium scale industries in indentified growth centers. "
    },
    {
      "topic": "tup vision",
      "content": "TUP VISION:\nA premier state university with recognized excellence in engineering and technology education at par with leading universities in the ASEAN region."
    },
    {
      "topic": "tup core values",
      "content": "CORE VALUES:\n\nT - Transparent and participatory governance\nU - Unity in the pursuit of TUP mission, goals and objectives\nP - Professionalism in the discharge of wuality service\nI - Integrity and commitment to maintain the good name of the University\nA - Accountability for individual and organizational quality performance\nN - Nationalism through tangible contribution to the rapid economic growth of the country\nS - Shared responsibility, hardwork, and resourcefulness in compliance to the mandates of the university"
    },
    {
      "topic": "college of engineering",
      "content": "The College of Engineering produces total quality engineers, graduate professionals, and valuable technology researchers for industry and society to maximally contribute to national development.\nPrograms Offered: \n\nUndergraduate Programs:\n- Bachelor of Science in Civil Engineering\n- Bachelor of Science in Electrical Engineering\n- Bachelor of Science in Mechanical Engineering\n- Bachelor of Science in Electronics Engineering\n\nGraduate Programs: \n- Master of Engineering Program\n- Master of Science in Civil Engineering major in General Civil Engineering\n- Master of Science in Civil Engineering major in Geotechnical Engineering\n- Master of Science in Civil Engineering major in Structural Engineering\n- Master of Science in Electrical Engineering major in Power System Engineering\n- Master of Science in Electrical Engineering major in Instrumentation and Control Engineering\n- Master of Science in Electrical Engineering major in Electronics Engineering\n- Master of Science in Electrical Engineering major in Communications Engineering\n- Master of Science in Electrical Engineering\n- Master of Science in Electrical Engineering major in Computer Engineering\n- Master of Science in Mechanical Engineering major in Energy Engineering\n- Master of Science in Mechanical Engineering major in Production Technology\n- Masters of Engineering Program in Civil Engineering major in Structural Engineering Option\n- Masters of Engineering Program in Civil Engineering major in Geotechnical Engineering Option\n- Masters of Engineering Program in Civil Engineering major in General Civil Engineering Option\n- Masters of Engineering Program in Electrical Engineering major in Power Engineering Option\n- Masters of Engineering Program in Electrical Engineering major in Instrumentation and Computer Engineering Option\n- Masters of Engineering Program in Electrical Engineering major in Electronics and Communications Engineering Option\n- Masters of Engineering Program in Mechanical Engineering major in Refrigeration and Airconditioning Option\n- Masters of Engineering Program in Mechanical Engineering major in Heat Power Option\n- Masters of Engineering Program in Mechanical Engineering major in Manufacturing and Production Option"
    },
    {
      "topic": "college of science",
      "content": "The College of Science prepares students to become fully integrated individuals, scientifically literate, and technically competent to assume dynamic and responsible leadership for the country's scientific and technological development in the improvement of man's well being and the quality of the environment. Programs Offered: \n\nUndergraduate Programs:\n- Bachelor of Applied Science in Laboratory Technology\n- Bachelor of Science in Computer Science\n- Bachelor of Science in Environmental Science\n- Bachelor of Science in Information System\n- Bachelor of Science in Information Technology\n\nGraduate Programs:\n-Master of Arts in Teaching major in Physics\n- Master of Arts in Teaching major in Mathematics\n- Master of Arts in Teaching major in General Science\n- Master of Arts in Teaching major in Chemistry\n- Master of Information Technology"
    },
    {
      "topic": "college of industrial technology",
      "content": "The College of Industrial Technology develop highly skilled technicians, technologist, and applied researchers who are needed to sustain industrial growth and develop for the enhancement of the quality of life.\nPrograms Offered: \n\nUndergraduate Programs:\n-Bachelor of Science in Food Technology\n- Bachelor of Engineering Technology major in Computer Engineering Technology\n- Bachelor of Engineering Technology major in Civil Technology\n- Bachelor of Engineering Technology major in Electrical Technology\n- Bachelor of Engineering Technology major in Electronics Communication Technology\n- Bachelor of Engineering Technology major in Electronics Technology\n- Bachelor of Engineering Technology major in Instrumentation and Control Technology\n- Bachelor of Engineering Technology major in Mechanical Technology\n- Bachelor of Engineering Technology major in Mechatronics Technology\n- Bachelor of Engineering Technology major in Railway Technology\n- Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Automotive Technology\n- Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Foundry Technology\n- Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Heating Ventilating & Air-Conditioning / Refrigeration Technology\n- Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Power Plant Technology\n- Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Welding Technology\n- Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Dies and Moulds Technology\n- Bachelor of Technology in Apparel and Fashion\n- Bachelor of Technology in Nutrition and Food Technology\n- Bachelor of Technology in Print Media Technology\n\nGraduate Program:\n- Master of technology"
    },
    {
      "topic": "college of architecture and fine arts",
      "content": "The College of Architecture and Fine Arts develops competitive architects, artist, designers, and draftsmen for industry and related sectors toward an improved quality of life.\nPrograms Offered:\n\nUndergraduate Programs:\n- Bachelor of Science in Architecture\n- Bachelor of Fine Arts\n- Bachelor in Graphics Technology major in Architecture Technology\n- Bachelor in Graphics Technology major in Industrial Design\n- Bachelor in Graphics Technology major in Mechanical Drafting Technology\n\nGraduate Programs:\n- Master in Architecture major in Construction Technology Management\n- Master in Graphics Technology"
    },
    {
      "topic": "college of industrial education",
      "content": "The College of Industrial Education commits itself to develop highly competent teachers/trainors, leaders, managers, and innovators in industrial and technology education adn training, as well as industry through responsive and relevant programs and proactive human resources in an environment of change.\nPrograms Offered:\n\nUndergraduate Programs:\n- Bachelor of Technology and Livelihood Education major in Information and Communication Technology\n- Bachelor of Technology and Livelihood Education major in Home Economics\n- Bachelor of Technology and Livelihood Education major in Industrial Arts\n- Bachelor of Technical Vocational Teachers Education major in Animation\n- Bachelor of Technical Vocational Teachers Education major in Beauty Care and Wellness\n- Bachelor of Technical Vocational Teachers Education major in Computer Programming\n- Bachelor of Technical Vocational Teachers Education major in Electrical\n- Bachelor of Technical Vocational Teachers Education major in Electronics\n- Bachelor of Technical Vocational Teachers Education major in Food Service Management\n- Bachelor of Technical Vocational Teachers Education major in Fashion and Garment\n- Bachelor of Technical Teacher Education\n\nGraduate Programs:\n- Doctor of Education major in Industrial Education Management\n- Doctor of Education major in Career Guidance\n- Doctor of Technology\n- Doctor of Philosophy major in Technology Management\n- Master of Arts in Industrial Education major in Curriculum and Instruction\n- Master of Arts in Industrial Education major in Educational Technology\n- Master of Arts in Industrial Education major in Administration and Supervision\n- Master of Arts in Industrial Education major in Guidance and Counseling\n- Master of Arts in Teaching major in Technology and Home Economics\n- Master of Technology Education\n "
    },
    {
      "topic": "college of liberal arts",
      "content": "The College of Liberal Arts shall provide basic quality education and turn out highly competent managers and enterpreneurs who will provide leadership and job oportunities in a rapidly changing environment and ensure its continued relevance and rsponsiveness to the challenges of globalization,\nPrograms Offered:\n\nUndergraduate Programs:\n- Bachelor of Arts in Management major in Industrial Management\n- Bachelor of Science in Entrepreneurship Management\n- Bachelor of Science in Hospitality Management\n\nGraduate Programs:\n-Doctor of Management Science\n- Master in Management"
    },
    {
      "topic": "student organizations",
      "content": "TUP students can join various student organizations related to academics, culture, leadership, and sports.\nList of Accredited Organization inside TUP:\n\nCollege of Architecture and Fine Arts:\n- ASIA - Architectural Students’ Association of the Philippines\n- THREADS - Technology Hoist Related Excellent Alliance of Drafting Students\n- UAPSA - United Architects of the Philippines - Students’ Auxiliary - TUP Chapter\n\nCollege of Indistrial Education:\n-ASIA - Association of Students in Industrial Arts\n- FHEBSA - Food Services Management, Home Economics and Beauty Care and Wellness Student Association (formerly ASHEFSM)\n- INTEL - Information Technology Educators League\n- PRESA - Professional Education Students Association\n- ICT Club (TUP B-CIE Extn Program) - Information and Communications Technology Club\n- HE Club (TUP B-CIE Extn Program) - Home Economics Club\n- IA Club (TUP B-CIE Extn Program) - Industrial Arts Club\n\nCollege of Industrial Technology:\n- ACETS - Association of Civil Engineering Technology Students\n- ACTS - Association of Culinary Technology Students (Formerly NAFTA)\n- GAPTSA - Graphic Arts and Painting Technology Students Association\n- ICETSA  - Institute of Computer Engineering Technologist Student Association\n- TUP - ISET - TUP Innovative Society for Electronics Technologist\n- JDC - Junior Designer’s Club\n- METALS - Mechanical Technologists and Leader’s Society\n- PAFT - OMEGA - Philippine Association of Food Technologist-Omega\n- RACS - Radio Amateurs Communication Society\n- RETRACKS - Railway Engineering Technology Recognize Alliance of Competent and Keen Students\n- SAFHYR - Student Association of Future Young Hotelier and Restaurateur\n- USSAT - Unified Student Society of Automation Technology\n\nCollege of Liberal Arts:\n- CPAG - College of Liberal Arts Performing Arts Group\n- FUMAS - Future Managers’ Society\n- PE Club - Physical Education Club\n- SSO - Social Science Organization\n\nCollege of Engineering:\n- TUP EES - TUP Electrical Engineering Society\n- TUPCES - TUP Civil Engineering Society\n- OECES - Organization of Electronics Engineering Students\n- PSME TUPSU - Philippine Society of Mechanical Engineers-TUP Student Unit\n\nCollege of Science:\n- CHEMSOC - TUP Chemical Society\n- COMPASS - TUP Computer Students’ Association\n- GREEN SOC - TUP Green Society\n- AWSLC - Amazon Web Services Learning Club - TUP Manila\n- GDGoC - Google Developer Groups on Campus - TUP Manila\n\nNon College-Based:\n- Artisan\n- BOLTUP - Boluntaryong TUPians\n- CYC - College Y Club\n- TUP Debate Society\n- DOST Scholar’s Club\n- TUP Dugong Bughaw\n- TUP GRABOTS - Grayhawks Robotics\n- TUP GEAR - TUP Gaming Enthusiast Association Ring\n- TUP-IVC - TUP Institute for Visual Communication\n- LALI - Life Coaching and Leadership Initiative\n- TUP MathSoc - TUP Math Society\n- TUPM-RCY - TUP Manila Red Cross Youth\n- SMERS - Students’ Multimedia Event Reporters Society\n- TUP TG - TUP Tech Guild\n- OSESH - Organization of Students for Environmental Safety and Health\n- TUP UIC - University Integrity Crusaders\n\nReligious:\n- TUP SONS - Seeds of the Nations"
    },
    {
      "topic": "tup enrollment",
      "content": "Process of Enrollment\n For First Year Student:\n1. Secure Notice of Admission from the Office of the Admissions upon presentations of the following documents:\n- High School Card (Form 138) and Transcript of Records for Transferees (original)\n- Certificate of Good Moral\n- Test Permit\n2. With your Notice of Admission and Medical Certificate, proceed to the Office of Admission for profiling\n3. Proceed to your course adviser for enlistment\n4. Students availing scholarship, report to the Office of Student Affairs for scholarship notation\n5. Proceed to the Accounting office for assessment and secure registration form\n6. With your Registration Form, present original requirements stated in step #1 to the Registrar’s Office for confirmation\n7. Report to the University Clinic and Secure Medical Certificate\n8. Proceed to the Office of Student Affairs for Identification card (ID) processing\n\nFor Old Students (2nd - 5th Year)\nOnline Enrollment:\n1. Students shall send online their last semester rating slips to their department heads\n2. Department Head is responsible for enlistment and assessment of fees\n3. Registrar confirms enrollment\n4. First Semester Certificate of Registration (COR) can be accessed thru the ERS\n5. All COR'S will be forwarded to the respective Department Heads by Second Week of Classes\n\nOnsite Enrollment:\n1. Graduate Students (New & Old)\n2. Returning Students (Report to Registrar to Secure Checklist and to Guidance Office for Clearance for Returning Student, Warning Agreement for students under probation)\n3. All Irregular Students (2nd to 5th year) for face to face compliance of Enrollment Requirements. (Warning Agreement if necessary)\n4. Process:\na.Student presents rating slips to Department Heads/Enlistment Adviser\nb. Completion of Warning Agreements if necessary\n3. Department Head is responsible for enlistment and assessment of fees\n5. Registrar confirms and issues Certificate of Registration (COR) thru the Department Heads"
    },
    {
      "topic": "tup transfer of students",
      "content": "1. A Student from a campus of a University is allowed to transfer to another TUP campus; provided that he satisfies the admission requirements of the program in the college concerned.\n2. A transfer student from other SUCs may be admitted provided that he has no failed / dropped mark and he satisfies the admission requirements of the program in the college concerned.\n3. A transfer student from private institutions may be admitted to any three-year program of the University provided that he has no failed / dropped mark and he satisfies the admission requirements of the program in the college concerned.\n4. Any student who intends to transfer to another school, college or university must be cleared of all liabilities and responsibilities (administrative, academic, and financial) in the University. The necessary documents for transfer could be secured from the Office of the Registrar."
    },
    {
      "topic": "tup add subject",
      "content": "A student may add a subject upon the recommendation of the Department Head and approved by the Dean under the following conditions:\n1. The student is not carrying the maximum unit load per semester/term prescribed in the curriculum\n2. He has not met the authorized load for probationary students\n3. For graduating undergraduate student, he may be allowed to add subject/s not more than six(6) units on top of the semester/term load"
    },
    {
      "topic": "tup drop subject",
      "content": "A student may drop a subject or subjects anytime before the midterm following the procedure below:\n1. A student must write a letter noted (whenever applicable) by the parent/guardian (specifying the reason/s for dropping). The Dean of the college must approve the dropping of the subject/s\n2. The approved letter must be presented to the guidance personnel and a dropping form must be secured\n3. The dropping form must be accomplished and the subject professor and the Dean of the college must sign it.\n4. Copies of the dropping form must be presented to the offices concerned."
    },
    {
      "topic": "tup academic failure",
      "content": "1. Probationary Status: A student is placed on probationary status under any of the following circumstances:\na. He obtains a rating of 5.0% in two subjects in a semester/term\nb. He drops unofficially three or more or all of a subjects without a written consent from the parents\n3. He fails to pass at least 75% of the load for the term\n\n2. Dismissal: A student who is not in the last two years of a five year course or in the last year of a four (4) or three (3) year course is considered dismissed from the official roll of the university under any of the following conditions:\na. He obtains a rating of 5.0 in three (3) subjects\nb. He obtains a dropped or failing grade in one subject while under probation"
    },
    {
      "topic": "tup academic honors",
      "content": "1. A student who completes his course as prescribed by his curriculum shall be rewarded with the corresponding honors provided that he has no grade lower than 2.75 in any of the subject and has not been found guilty of any major offense:\na. Baccalaureatte Programs\n- Summa Cum Laude - 1.00 - 1.20\n- Magna Cum Laude - 1.21-1.45\n- Cum laude - 1.46-1.75/\nb. Pre-Baccalaureatte Programs\n- With Highest Honors - 1.00-1.20\n- With High Honors - 1.21-1.45\n- With Honors - 1.46-1.75\n\n2. A transfer student vying for honors must have completed at least 75% of the total number of academic units of the curriculum in the University"
    },
    {
      "topic": "tup id validation",
      "content": "Process of ID validation:\n1. Present the Certificate of Registration (COR) together with your school ID (ensure the old sticker has been removed).\n2. Accomplish the logbook for proper recording.\n3. Claim your school ID affixed with the new sticker for the current school year"
    },
    {
      "topic": "tup id lost",
      "content": "How to request for ID if lost:\n1. He secures an affidavit of loss of ID.\n2. He gets an application form at the Office of Student Affairs.\n3. He pays the required ID fee at the Cashier’s office.\n4. He proceeds to the ID room for photo and signature capturing"
    },
    {
      "topic": "tup scholarship",
      "content": "Scholarship and educational grants offered by the University are categorized as follows:\n1. Institutionally funded / Internal grants\n2. TUP Employees / Legal Dependents  under the Collective Negotiation Agreement (CNA)\n3. External Grants\n- Industry\n- Non-Government Organization\n- Government, Agencies / Organization\n\nHow to Apply for Scholarship:\n1. The students fill-up the application form available at the Office of Student Affairs (OSA). Attach one ID picture.\n2. Present the following requirements together with the duly accomplished application form:\na. A photocopy of a high school card (for freshmen applicants) or the rating slip from the Office of the Registrar (for sophomore to senior students)\nb. A photocopy of a Registration Form\nc. The Income Tax Return (ITR) of the parents/guardian\nd. The Notice of Admission\ne. A certification of good moral character\nf. An essay - My Autobiography\n3. Interview"
    },
    {
      "topic": "tup leave of absence",
      "content": "Process of Requesting Leave of Absence (LOA):\n\n1. A student may take a leave of absence by submitting a  written request addressed to the  Dean/ Assistant to the  Director of Academic Affairs (ADAA) indicating the reasons and duration for the leave of absence which must not exceed one academic year (2 semesters or 3 terms). The intention of the leave of absence shall be presented to the faculty  adviser/ department head concerned for appropriate action and shall be subject to the approval of the Dean/ Assistant  to the Director of Academic Affairs (ADAA).\n2. No leave of absence shall be granted two weeks before the  last day of classes of a semester/ term. If the inability of the student to continue attending classes within the above period is for reasons of health or similar justifiable cause, the absence shall be considered “excused”. The student shall then be required to present to the faculty members concerned a letter of excuse and to make up for lessons/work missed.\n3. Returning students who did not apply for a leave of absence and have been out of the campus beyond the allowable maximum period of one (1) academic year shall be readmitted on probationary basis within the maximum residency rule."
    },
    {
      "topic": "request certified true copy",
      "content": "How to request for certified true copy:\n1. Proceed to the Office of the Registrar and present the document that needs to be certified true copy (CTC).\n2. Secure and accomplish the form provided by the registrar.\n3. Go to the Cashier’s Office at the Administration Building and pay the fee of ₱100 for the CTC.\n4. Return to the Office of the Registrar and submit the accomplished form together with the official receipt. You will then be issued a claim slip indicating the date when you may claim your CTC (processing usually takes 3–5 working days, depending on the volume of requests)."
    },
    {
      "topic": "request good moral",
      "content": "How to request for Certificate of Good Moral:\n1. Proceed to the Office of Students Affairs (OSA) and request for the Certificate of Good Moral\n2. Secure and accomplish the form provided by the OSA.\n3. Go to the Cashier’s Office at the Administration Building and pay the fee of ₱100 for the Certificate of Good Moral.\n4. Return to the OSA and submit the accomplished form together with the official receipt. You will then be issued a claim slip indicating the date when you may claim your Certificate of Good Moral (processing usually takes 3–5 working days, depending on the volume of requests)."
    },
    {
      "topic": "unaccomplished faculty evaluation",
      "content": "How to request for rating slip if was not able to complete Faculty Evaluation:\n1. Proceed to the Department Head of your College and request your rating slip, stating that you were unable to complete the faculty evaluation.\n2. Complete the required community service for one to two hours.\n3. After completing the community service, return to the Department Head of your College to receive the printed copy of your rating slip."
    },
    {
      "topic": "tup library",
      "content": "The University Library is an important educational repository. It supports the instructional curricula and provides the research needs of the students. The collection of books fall under the following sections:\nGround Floor – Arts and Technology, General Reference Collections;\nSecond Floor – Research Outputs, Graduate School, Filipiniana; Third\nFloor – Archives, Special Collections and Periodicals.\n\nLibrary Hours: Monday to Friday / 7:00am - 7:00pm\nSaturday - 8:00am - 12:00pm ; 1:00pm - 5:00pm\n\nLocation: Between CLA and CIE building"
    },
    {
      "topic": "office of admission",
      "content": "The TUP Office of Admission handles student applications, evaluates requirements, manages entrance exams, provides information to applicants, and releases admission results.\nLocated at the lobby of the College of Science building"
    },
    {
      "topic": "office of Student Affairs",
      "content": "The Office of Student Affairs is one of the  service units under the Vice President for Academic Affairs. It is responsible for providing programs and activities designed to meet the needs of every student, specifically that of having a healthy and productive student life..\nLocated at the lobby of the College of Science building beside office of admission."
    },
    {
      "topic": "tup clinic",
      "content": "The TUP-Medical and Dental Clinic provides health-related services  to the University. It is a team consisting of a physician, dentists, nurses and other trained paramedical staff. They provide routine medical and dental services such as consultations, perform the necessary basic procedures, facilitate the referral of patients to the specialized institutions, conduct the annual medical and dental evaluation of students and employees and provide lectures and other health related activities in cooperation with the other units or organizations of the school.\nLocated at the lobby of the COS building near Gate 1"
    },
    {
      "topic": "tup registrar",
      "content": "The Office of the University Registrar (OUR), with administrative and academic functions, is an inherent and integral part of the institution. The University Registrar is a member of the recommending bodies of the University: the Administrative Council and the Academic Council.\nThe OUR serves as the primary custodian of the school records of all students and alumni. It administers operations in the areas of enrolment, load requirements, credits earned, subject sequence, promotion, graduation, transfer, suspension and the dismissal of students.\nLocated at the lobby of the College of Liberal Arts building"
    },
    {
      "topic": "university information technology center uitc",
      "content": "The University Information Technology Center (UITC) assumes direct responsibility for the development and implementation of all information and communications technology systems, programs and policies that produce meaningful results and allow the possibility of attaining the vision, mission and goals of the University. The Center is supported by the network and telephone management, web development, applications development, the management information system and computer repair and maintenance management units."
    },
    {
      "topic": "covered court",
      "content": "TUP Covered Court serves as a multi-purpose facility that provides a safe and convenient space for various activities. It is primarily used for sports and physical education classes, ensuring that games and exercises can continue regardless of weather conditions. Beyond athletics, it also functions as a venue for student assemblies, cultural events, ceremonies, and other extracurricular activities. In some cases, it can even be utilized for community programs or as an emergency shelter, making it an essential facility that supports both academic and non-academic needs of the university.\n Located in front of College of Industrial Technology"
    },
    {
      "topic": "tup grounds",
      "content": "TUP Grounds serve as a vital open space that supports both academic and non-academic activities. It is commonly used for outdoor sports such as soccer, track and field, and other large-scale athletic events, as well as physical education classes that require wide areas. Beyond athletics, the field also functions as a venue for university celebrations, cultural programs, and community gatherings. In addition, it provides students with space for recreation, relaxation, and social interaction, while also contributing greenery and a healthy environment within the campus.\nLocated beside covered court"
    },
    {
      "topic": "integrated research and training center irtc",
      "content": "IRTC is the research, training and extension arm of the Technological University of the Philippines. It also provides valuable services to local and international industries and educational institutions.\nLocation: "
    },
    {
      "topic": "university information technology center uitc",
      "content": "University Information Trchnology Center assumes direct responsibility for the development and implementation of all information and communications technology systems, programs, and policies that produce meaningful results. The center is supported by the network and telephone management, web development, application development, the management information system and computer repair and maintenance management untis.\nLocation: CIT builging 1st floor, near gate 4"
    },
    {
      "topic": "industrial relations and job placement office irjp",
      "content": "The Industrial Relations and Job Placement Office provides the students with an opportunity to gain valuable practical experience in their field of specialization through internship in industry. The Supervised Industrial/On-the-Job training is the unique part of the University curriculum where the students are provided with a real understanding of the demands of industry and a practical application of what they have learned.\nLocation: COS building 1st floor, in front of Office of Student Affairs"
    },
    {
      "topic": "tup president",
      "content": "Dr. Reynaldo P. Ramos"
    },
    {
      "topic": "basic industrial technology head",
      "content": "Assoc. Prof. Andrew John A. Mabaquiao\n\nEmail: andrewjohn_mabaquiao@tup.edu.ph\nOffice: Basic Industrial Technology (CIT buulding)"
    },
    {
      "topic": "food and apparel technology head",
      "content": "Assoc. Prof. Bernadeth Gilbor\n\nEmail: bernadeth_gilbor@tup.edu.ph\nOffice: Food and Apparel Technology (CIT building)"
    },
    {
      "topic": "graphic and arts head",
      "content": "Assoc. Prof. Lotis Palma-Buco\n\nEmail: lotis_buco@tup.edu.ph\nOffice: Graphics and Arts Department (CAFA building)"
    },
    {
      "topic": "mechanical technology head",
      "content": "Assoc. Prof. Jerry R. Ligaya\n\nEmail: jerry_ligaya@tup.edu.ph\nOffice: Mechanical Engineering Technology (CIT building)"
    },
    {
      "topic": "electrical technology head",
      "content": "Assoc. Prof. Jennifer D. Andador\n\nEmail: jennifer_andador@tup.edu.ph or eet@tup.edu.ph\nOffice: Electrical Engineering Technology (CIT building)"
    },
    {
      "topic": "civil technology head",
      "content": "Assoc. Prof. Samuel M. Pacba\n\nEmail: samuel_pacba@tup.edu.ph or eet@tup.edu.ph\nOffice: Civil Engineering Technology (CIT building)"
    },
    {
      "topic": "electronic technology 0ic-head",
      "content": "Assoc. Prof. Aimee G. Acoba\n\nEmail: aimee_acoba@tup.edu.ph or eet@tup.edu.ph\nOffice: Electronic Engineering Technology (CIT building)"
    },
    {
      "topic": "industrial technology dean",
      "content": "Assoc. Prof. Mary Ann R. Codera\n\nEmail: mayann_codera@tup.edu.ph\n Office: Located in CIT building"
    },
    {
      "topic": "industrial education dean",
      "content": "Dr. Apollo P. Portez\n\nEmail: apollo_portez@tup.edu.ph or cie@tup.edu.ph\nOffice: Located in CIE building"
    },
    {
      "topic": "industrial education secretary",
      "content": "Asst. Prof. Nestor M. Muricia\n\nEmail: nestor_muricia or cie@tup.edu.ph\nOffice: Located in CIE building"
    },
    {
      "topic": "student teaching head",
      "content": "Assoc. Prof. Dr. Sylvia B. Guevarra\n\nEmail: sylvia_guevarra@tup.edu.ph or st@tup.edu.ph\nOffice: Student Teaching Department in CIE building"
    },
    {
      "topic": "technical arts head",
      "content": "Assoc. Prof. Allan Villariza\n\nEmail: allan_villariza@tup.edu.ph or tad@tup.edu.ph\nOffice: Technical Arts Department in CIE building"
    },
    {
      "topic": "home economics head",
      "content": "Assoc. Prof. Dorothy Manalansan\n\nEmail: dorothy_manalansan@tup.edu.ph or he@tup.edu.ph\nOffice: Home Economics Department in CIE building"
    },
    {
      "topic": "college of engineering dean",
      "content": "Dr. Lean karlo S. Tolentinon\nEmail: leankarlo_tolentino@tup.edu.ph or coe@tup.edu.ph\nOffice: Located in COE building"
    },
    {
      "topic": "college of engineering secretary",
      "content": "Engr. Jessica Velasco\n\nEmail: jessica_velascon@tup.edu.ph\nOffice: Located in COE building"
    },
    {
      "topic": "electrical engineering head",
      "content": "Engr. Roel M. Mendoza\n\nEmail: roel_mendoza@tup.edu.ph\nOffice: Electrical Engineering Department in COE building"
    },
    {
      "topic": "mechanical engineering head",
      "content": "Engr. Sandra A. Hollman\n\nEmail: sandra_hollman@tup.edu.ph or mechanical@tup.edu.ph\nOffice: Mechanical Engineering Department in COE building"
    },
    {
      "topic": "civil engineering head",
      "content": "Engr. Marjun Macasilhig\n\nEmail: marjun_macasilhig@tup.edu.ph or civil@tup.edu.ph\nOffice: Civil Engineering Department in COE building"
    },
    {
      "topic": "college of science acting dean",
      "content": "Dr. Joshua T. Soriano\n\nEmail: joshua_soriano@tup.edu.ph or cos@tup.edu.ph\nOffice: Located in COS bulding"
    },
    {
      "topic": "college of science college secretary",
      "content": "Dr. Mary Sheenalyn P. Rodil\n\nEmail: marysheenalyn_rodil@tup.edu.ph or cossec@tup.edu.ph\nOffice: Located in COS building"
    },
    {
      "topic": "chemistry department head",
      "content": "Asst. Prof. Maria Carmelita G. Sapina\n\nEmail: mariacarmelita_sapina@tup.edu.ph or chemistry@tup.edu.ph\nOffice: Chemistry Department in COS building"
    },
    {
      "topic": "computer studies head",
      "content": "Asst. Prof. Dolores Montesines\n\nEmail: dolores_montesines@tup.edu.ph or computer@tup.edu.ph\nOffice: Computer Studies Department in COS building 3rd floor"
    },
    {
      "topic": "mathematics department head",
      "content": "Dr. Melchor G. Pacer\n\nEmail: melchor_pacer@tup.edu.ph or math@tup.edu.ph\nOffice: Mathematics Department in COS building 3rd floor"
    },
    {
      "topic": "physics department head",
      "content": "Asst. Prof. Dr. Aldrin G. Chang\n\nEmail: aldrin_chang@tup.edu.ph or physics@tup.edu.ph\nOffice: Physics Department in COS building 3rd floor"
    },
    {
      "topic": "college of architecture and fine arts dean",
      "content": "Assoc. Prof. Elpidio T. Balais, Jr.\n\nEmail: elpidio_balais@tup.edu.ph or cafa@tup.edu.ph\nOffice: Located in CAFA building"
    },
    {
      "topic": "cafa college secretary",
      "content": "Ar. Kenneth V. Tributo\n\nEmail: kenneth_tributo@tup.edu.ph or cafa@tup.edu.ph\nOffice: Located in CAFA building"
    },
    {
      "topic": "graphics head",
      "content": "Prof. Melvin G. Mojica\n\nEmail: melvin_mojica@tup.edu.ph\nOffice: Graphics Department in CAFA building"
    },
    {
      "topic": "architecture head",
      "content": "Asst. Prof. Rosellia Rowena A. Manzano\n\nEmail: roselliarowena_manzano@tup.edu.ph or architecture@tup.edu.ph\nOffice: Architecture Department in CAFA building"
    },
    {
      "topic": "fine arts department head",
      "content": "Asst. Prof. Wilma Enriquez\n\nEmail: wilma_enriquez@tup.edu.ph or finearts@tup.edu.ph\nOffice: Fine Arts Department in CAFA building"
    },
    {
      "topic": "college of liberal arts dean",
      "content": "Dr. Michael Bhobet Baluyot\n\nEmail: michaelbhobet_baluyot@tup.edu.ph or cla@tup.edu.ph\nOffice: Located in CLA building"
    },
    {
      "topic": "college of liberal arts college secretary",
      "content": "Ms. Rose Ann Panti\n\nEmail: roseann_panti@tup.edu.ph or cla@tup.edu.ph\nOffice: Located in CLA building"
    },
    {
      "topic": "languages head",
      "content": "Asst. Prof. Marie Jo Tess Ragos\n\nEmail: mariejotess_ragos@tup.edu.ph\nOffice: Languages Department in CLA building"
    },
    {
      "topic": "social science head",
      "content": "Prof. Noemie Bunye\n\nEmail: noemie_bunye@tup.edu.ph\nOffice: Social Science Department in CLA building"
    },
    {
      "topic": "entrepreneurship and management head",
      "content": "Asst. Prof. Jerson A. Monsad\n\nEmail: jerson_monsad@tup.edu.ph or dem@tup.edu.ph\nOffice: Entrepreneurship and Management Department in CLA building"
    },
    {
      "topic": "hospitality management head",
      "content": "Dr. Ma. Dina D. Jimenez\n\nEmail: madina_jimenez@tup.edu.ph\nOffice: Hospitality Management Department in CLA building"
    },
    {
      "topic": "physical education department head",
      "content": "Asst. Prof. Bernadette L. Alvazo\n\nEmail: bernadette_alvazo@tup.edu.ph or pe@tup.edu.ph\nOffice: Physical Education Department in CLA lobby"
    },
    {
      "topic": "university registrar",
      "content": "Prof. Dr. Rosemarie Theresa M. Cruz\n\nEmail: rosemarietheresa_cruz@tup.edu.ph or registrar@tup.edu.ph\nOffice: Registrar Office at CLA lobby"
    },
    {
      "topic": "admission office head",
      "content": "Prof. Dr. Rosemarie Theresa M. Cruz\n\nEmail: rosemarietheresa_cruz@tup.edu.ph or registrar@tup.edu.ph\nOffice: COS lobby"
    },
    {
      "topic": "nstp director",
      "content": "Mr. Reggie Campomanes\n\nEmail: reggie_campomanes@tup.edu.ph or nstp@tup.edu.ph"
    },
    {
      "topic": "guidance head",
      "content": "Dr. Enrico T. Lucena\n\nEmail: enrico_lucena@tup.edu.ph, guidance@tup.edu.ph\nOffice: COS lobby"
    },
    {
      "topic": "how to go to tup via lrt",
      "content": "If you are using LRT-1, get off at United Nations Avenue Station. From the station, walk towards Taft Avenue and turn right to Ayala Boulevard. TUP Manila is about 5–10 minutes walk from the station."
    },
    {
      "topic": "how to go to tup from north",
      "content": "If you are coming from the North (Quezon City, Caloocan, or Monumento), you can take the LRT-1 southbound and get off at United Nations Avenue Station. You can also ride a jeep or bus going to Manila City Hall or Taft Avenue and walk to Ayala Boulevard where TUP Manila is located."
    },
    {
      "topic": "how to go to tup from south",
      "content": "If you are coming from the South (Pasay, Parañaque, Las Piñas, or Cavite), you can take the LRT-1 northbound and get off at United Nations Avenue Station. You may also ride a bus or jeep going to Lawton, Manila City Hall, or Taft Avenue and walk towards Ayala Boulevard to reach TUP Manila."
    },
    {
      "topic": "how to go to tup via jeep",
      "content": "You can ride jeepneys going to Lawton, Manila City Hall, or SM Manila. From there, walk along Ayala Boulevard until you reach the Technological University of the Philippines (TUP) Manila campus."
    },
    {
      "topic": "how to go to tup via bus",
      "content": "Ride a bus going to Lawton, Manila City Hall, or Taft Avenue. Get off near Manila City Hall or SM Manila and walk towards Ayala Boulevard. TUP Manila is located along Ayala Boulevard near these landmarks."
    }
  ])}`
});


async function compressImage(file, maxWidth = 1200, maxHeight = 1200) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
}


let USER = {
  name: "TUPian",
  photoSrc: "../assets/images/anon_avatar.jpg"
};
let allPosts = [];
let lastPhotoClick = 0;
const PHOTO_DEBOUNCE = 500; // ms

// ========================
// INSTANT UI PRE-FILL (STALE-WHILE-REVALIDATE)
// ========================
(function () {
  const cache = localStorage.getItem('tup_user_meta');
  if (cache) {
    try {
      const data = JSON.parse(cache);
      // Sync global USER object so subsequent renders (posts) use it
      USER.name = data.fullName || USER.name;
      USER.photoSrc = data.photoURL || USER.photoSrc;

      // Pre-fill UI so it's instant
      document.addEventListener('DOMContentLoaded', () => {
        updateProfileUI(data, data.email || '');

        // Apply anonymity preference
        const isAnon = getAnonymityPreference();
        ['anonToggle', 'repostAnonToggle'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.checked = isAnon;
        });
        updateAnonUI(isAnon, 'modal-user-name', 'modal-avatar');
        updateAnonUI(isAnon, 'repost-user-name', 'repost-user-avatar');
      });
    } catch (e) { }
  } else {
    // Even if no cache, apply anon pref if exists
    document.addEventListener('DOMContentLoaded', () => {
      const isAnon = getAnonymityPreference();
      ['anonToggle', 'repostAnonToggle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = isAnon;
      });
    });
  }
})();

// ========================
// AUTH STATE
// ========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUid = urlParams.get('id') || user.uid;
    const isOwnProfile = targetUid === user.uid;

    // 1. Parallel: Load posts immediately
    loadUserPosts(targetUid);

    // 2. Parallel: Fetch target user doc to refresh UI
    const userDocRef = doc(db, "users", targetUid);
    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Redirect if Admin (only for own profile)
        if (isOwnProfile && (userData.role === 'USG' || userData.role === 'Admin')) {
          window.location.href = '../pages/admin_profile.html';
          return;
        }

        // Sync global USER object (always own data)
        if (isOwnProfile) {
          USER.name = userData.fullName || user.displayName || "TUPian";
          USER.photoSrc = userData.photoURL || user.photoURL || "../assets/images/anon_avatar.jpg";

          // Update Cache
          const cache = {
            ...userData,
            email: user.email,
            uid: user.uid,
            photoURL: USER.photoSrc,
            fullName: USER.name
          };
          localStorage.setItem('tup_user_meta', JSON.stringify(cache));
        }

        // Update UI with fresh data
        updateProfileUI(userData, isOwnProfile ? user.email : (userData.email || ''), isOwnProfile);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  } else {
    window.location.href = "../index.html";
  }
});

// ========================
// PROFILE UI UPDATE
// ========================
function updateProfileUI(userData, email, isOwnProfile = true) {
  const photoURL = userData.photoURL || userData.photoSrc || (isOwnProfile ? USER.photoSrc : "../assets/images/anon_avatar.jpg");
  const fullName = userData.fullName || userData.name || (isOwnProfile ? USER.name : "TUPian");

  // 1. Only update Global USER if it's our own profile
  if (isOwnProfile) {
    USER.name = fullName;
    USER.photoSrc = photoURL;
  }

  // 2. Profile & Banner
  const profileImg = document.querySelector('.profile-avatar-inner');
  if (profileImg) profileImg.src = photoURL;

  const bannerImg = document.querySelector('.banner-img');
  if (bannerImg && userData.coverURL) bannerImg.src = userData.coverURL;
  else if (bannerImg) bannerImg.src = "../assets/images/cover_photo.jpg"; // Default

  const nameEl = document.querySelector('.profile-name');
  const idEl = document.querySelector('.profile-id');
  const emailEl = document.querySelector('.profile-email');
  if (nameEl) nameEl.textContent = fullName;
  if (idEl) idEl.textContent = userData.studentID || "TUPM-XX-XXXX";
  if (emailEl) emailEl.textContent = email || userData.email || '';

  // Remove skeletons
  document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));

  // 3. Sidebar
  const sidebarImg = document.querySelector('.sidebar-avatar-img');
  if (sidebarImg) sidebarImg.src = photoURL;

  // 4. Create Post Input & Modal
  const postInputImg = document.querySelector('.post-input-img');
  if (postInputImg) postInputImg.src = photoURL;

  const isAnon = getAnonymityPreference();
  const displayPhoto = isAnon ? "../assets/images/anon_avatar.jpg" : photoURL;
  const displayName = isAnon ? "Anonymous Puto" : fullName;

  const modalAvatarEl = document.getElementById('modal-avatar');
  if (modalAvatarEl) {
    modalAvatarEl.innerHTML = `<img src="${displayPhoto}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;image-rendering:high-quality;">`;
  }
  const modalNameEl = document.getElementById('modal-user-name');
  if (modalNameEl) modalNameEl.textContent = displayName;

  // Sync repost modal as well
  const rAvatarEl = document.getElementById('repost-user-avatar');
  if (rAvatarEl) {
    rAvatarEl.innerHTML = `<img src="${displayPhoto}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; image-rendering:high-quality;">`;
  }
  const rNameEl = document.getElementById('repost-user-name');
  if (rNameEl) rNameEl.textContent = displayName;

  // 5. Hide owner-only actions if viewing someone else
  const changePhotoWrap = document.querySelector('.change-photo-wrap');
  if (changePhotoWrap) changePhotoWrap.style.display = isOwnProfile ? 'block' : 'none';

  const postInputWrap = document.querySelector('.post-input-wrap');
  if (postInputWrap) postInputWrap.style.display = isOwnProfile ? 'flex' : 'none';

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.style.display = isOwnProfile ? 'flex' : 'none';

  // 6. Comment Section (Modal & Input)
  const commentModalInputAv = document.querySelector('.comment-modal-avatar img');
  if (commentModalInputAv) commentModalInputAv.src = photoURL;

  document.querySelectorAll('.comment-input-row .comment-avatar img').forEach(img => {
    img.src = photoURL;
  });

  // 6. Existing Feed Items
  document.querySelectorAll('.post-card').forEach(card => {
    const postData = card.dataset;
    // Update my own posts' avatars ONLY if they are NOT anonymous
    if (postData.userId === auth.currentUser?.uid && postData.isAnonymous !== 'true') {
      const av = card.querySelector('.post-avatar img');
      if (av) av.src = photoURL;
    }
    updateFeedCommentPreview(card);
  });
}

// ========================
// CHANGE PHOTO MENU
// ========================
function toggleChangePhotoMenu(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('changePhotoDropdown');
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  dropdown.style.top = (rect.bottom + 8) + 'px';
  dropdown.style.right = (window.innerWidth - rect.right) + 'px';
  dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.change-photo-wrap');
  const dropdown = document.getElementById('changePhotoDropdown');
  if (dropdown && wrap && !wrap.contains(e.target)) dropdown.classList.remove('open');
});

// ========================
// PHOTO UPLOAD → FIREBASE
// ========================
document.getElementById('profilePhotoInput').addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('changePhotoDropdown').classList.remove('open');
  const base64 = await compressImage(file, 800, 800);
  updateUserPhotosInFirebase('photoURL', base64);
});

document.getElementById('coverPhotoInput').addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const base64 = await compressImage(file, 1920, 640);
  updateUserPhotosInFirebase('coverURL', base64);
});

async function updateUserPhotosInFirebase(field, base64String) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await updateDoc(doc(db, "users", user.uid), { [field]: base64String });
    window.showToast("Photo updated successfully!", "success");

    if (field === 'photoURL') {
      updateProfileUI({ photoURL: base64String }, user.email);

      // Sync past posts in Firebase (Background)
      const postsQuery = query(collection(db, "posts"), where("userId", "==", user.uid));
      getDocs(postsQuery).then(snapshot => {
        if (snapshot.empty) return;
        const batch = writeBatch(db);
        snapshot.forEach(postDoc => {
          batch.update(doc(db, "posts", postDoc.id), { photoURL: base64String });
        });
        return batch.commit();
      }).catch(err => console.error("Error syncing past posts:", err));
    } else if (field === 'coverURL') {
      const bannerImg = document.querySelector('.banner-img');
      if (bannerImg) bannerImg.src = base64String;
    }
  } catch (error) {
    console.error("Error updating photo:", error);
    window.showToast("Failed to update photo.", "error");
  }
}

// ========================
// TOAST
// ========================

// ========================
// HELPERS
// ========================
function getTemplate(id) {
  const tpl = document.getElementById(id);
  if (!tpl) return '';
  const div = document.createElement('div');
  div.appendChild(tpl.content.cloneNode(true));
  return div.innerHTML;
}

function formatRelativeTime(val) {
  if (!val) return 'Just now';
  let date;
  if (val && typeof val.toDate === 'function') date = val.toDate();
  else if (val instanceof Date) date = val;
  else if (val && val.seconds) date = new Date(val.seconds * 1000);
  else date = new Date(val);

  if (!date || isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
}



function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// ========================
// REACTIONS BAR
// ========================
function buildReactions(postId, likes = 0, comments = 0, reposts = 0, isLikedByMe = false) {
  return `
    <div class="feed-reactions">
      <button class="feed-reaction-btn ${isLikedByMe ? 'heart-active' : ''}" data-id="${postId}" data-type="like">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="likes-count">${fmt(likes)}</span> Heart
      </button>
      <button class="feed-reaction-btn" data-id="${postId}" data-type="comment">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="comments-count">${fmt(comments)}</span> Comments
      </button>
      <button class="feed-reaction-btn" data-id="${postId}" data-type="repost">
        <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        <span class="reposts-count">${fmt(reposts)}</span> Repost
      </button>
    </div>`;
}

// ========================
// RENDER POST (from Firebase)
// ========================
function renderPost(data, postId) {
  const feed = document.getElementById('feed');
  const postCard = document.createElement('div');
  postCard.className = 'post-card';
  const userId = data.userId || data.uid || data.authorId;
  const isOwnPost = auth.currentUser && (userId === auth.currentUser.uid);
  const isAnonymous = data.isAnonymous === true;
  postCard.dataset.id = postId;
  postCard.dataset.userId = userId;
  postCard.dataset.isAnonymous = isAnonymous;

  const likeCount = data.likedBy ? data.likedBy.length : 0;
  const commentCount = data.comments || 0;
  const repostCount = data.repostedBy ? data.repostedBy.length : 0;
  const isLikedByMe = data.likedBy && data.likedBy.includes(auth.currentUser?.uid);
  const menuId = 'menu-' + postId;

  let bodyHtml = '';
  if (data.repostOf) {
    const repostText = data.repostText || '';
    const repostHTML = escapeHTML(repostText).replace(/\n/g, '<br>');
    const isDeleted = data.originalDeleted || false;

    bodyHtml = `
      ${data.text ? `<div class="repost-quote-text">${escapeHTML(data.text).replace(/\n/g, '<br>')}</div>` : ''}
      <div class="repost-quote-card ${isDeleted ? 'original-deleted' : ''}" id="repost-card-${postId}">
        <div class="repost-quote-header">
          <div class="repost-quote-avatar">
            <img src="${isDeleted ? '../assets/images/anon_avatar.jpg' : (data.repostAuthorPhoto || '../assets/images/anon_avatar.jpg')}" alt="${data.repostAuthor}" style="image-rendering: high-quality;">
          </div>
          <div class="repost-quote-meta">
            <div class="repost-quote-author">${isDeleted ? 'Original post deleted' : data.repostAuthor}</div>
            <div class="repost-quote-time" style="font-size:11px; color:var(--muted);">${isDeleted ? '' : (data.repostTime || '')}</div>
          </div>
        </div>
        <div class="repost-quote-content">
          ${!isDeleted && data.repostTitle ? `<div class="repost-quote-title" style="font-weight: 800; font-size: 14px; margin-bottom: 4px; color: var(--text);">${escapeHTML(data.repostTitle)}</div>` : ''}
          <div class="repost-quote-body clamped" id="body-${postId}">
            ${isDeleted ? 'This content is no longer available.' : repostHTML}
          </div>
          ${isDeleted ? '' : `<button class="view-more-btn" id="btn-vm-${postId}">View more ▾</button>`}
        </div>
        ${!isDeleted ? (
        (data.repostImageURLs && data.repostImageURLs.length > 0)
          ? renderPhotoGrid(data.repostImageURLs)
          : (data.repostImage ? `<div class="post-images lightbox-trigger" data-src="${data.repostImage}" style="display:flex; justify-content:center; align-items:center; text-align: center; cursor:pointer;"><img src="${data.repostImage}" class="post-image" style="image-rendering: high-quality;"></div>` : '')
      ) : ''}
      </div>`;

    // Async check for original post existence
    if (!isDeleted && data.repostOf) {
      setTimeout(async () => {
        try {
          const results = await Promise.allSettled([
            getDoc(doc(db, "posts", data.repostOf)),
            getDoc(doc(db, "announcements", data.repostOf))
          ]);

          // If all checks that succeeded say the document doesn't exist,
          // and we didn't get any successes, then it's deleted.
          const exists = results.some(r => r.status === 'fulfilled' && r.value.exists());

          if (!exists) {
            const card = postCard.querySelector(`#repost-card-${postId}`);
            if (card) {
              card.classList.add('original-deleted');
              const authorEl = card.querySelector('.repost-quote-author');
              if (authorEl) authorEl.textContent = 'Original post deleted';
              const timeEl = card.querySelector('.repost-quote-time');
              if (timeEl) timeEl.textContent = '';
              const titleEl = card.querySelector('.repost-quote-title');
              if (titleEl) titleEl.remove();
              const bodyEl = card.querySelector('.repost-quote-body');
              if (bodyEl) {
                bodyEl.innerHTML = 'This content is no longer available.';
                bodyEl.classList.remove('clamped');
              }
              const btnVm = card.querySelector('.view-more-btn');
              if (btnVm) btnVm.remove();
              const imgEl = card.querySelector('.post-images');
              if (imgEl) imgEl.remove();
            }
          }
        } catch (err) {
          console.warn("Original post check failed:", err);
        }
      }, 1000);
    }
  } else {
    const postText = data.text || '';
    const postHTML = escapeHTML(postText).replace(/\n/g, '<br>');
    bodyHtml = `
      <div class="post-body clamped" id="body-${postId}">${postHTML}</div>
      <button class="view-more-btn" id="btn-vm-${postId}">View more ▾</button>
      ${data.imageURLs && data.imageURLs.length > 0 ? renderPhotoGrid(data.imageURLs) : ''}
    `;
  }

  postCard.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        <img src="${data.photoURL || '../assets/images/anon_avatar.jpg'}" alt="Avatar" style="image-rendering: high-quality; object-fit: cover;">
      </div>
      <div class="post-meta">
        <div class="post-author">
          ${data.repostOf ? `<svg viewBox="0 0 24 24" style="width:12px; height:12px; stroke:var(--muted); fill:none; stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; vertical-align:middle; margin-right:4px; margin-top:-2px;"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>` : ''}
          ${data.author || "TUPian"}
          ${data.repostOf ? `<span style="font-weight:600; color:var(--muted); font-size: 13px; margin-left: 4px;">reposted</span>` : ''}
        </div>
        <div class="post-time">${formatRelativeTime(data.createdAt)}</div>
      </div>
      ${isOwnPost ? `
      <button class="post-menu" onclick="toggleMenu(event, '${menuId}')">
        <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
        <div class="dropdown-menu" id="${menuId}">${getTemplate('menu-template')}</div>
      </button>` : ''}
    </div>
    ${bodyHtml}
    <div class="comments-data" style="display:none;"></div>
    <div class="reposts-data"  style="display:none;"></div>
    ${buildReactions(postId, likeCount, commentCount, repostCount, isLikedByMe)}
    <div class="post-repost-info" onclick="viewReposts(event)" style="display:none;">
      <svg width="193px" height="193px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M14.2893 5.70708C13.8988 5.31655 13.2657 5.31655 12.8751 5.70708L7.98768 10.5993C7.20729 11.3805 7.2076 12.6463 7.98837 13.427L12.8787 18.3174C13.2693 18.7079 13.9024 18.7079 14.293 18.3174C14.6835 17.9269 14.6835 17.2937 14.293 16.9032L10.1073 12.7175C9.71678 12.327 9.71678 11.6939 10.1073 11.3033L14.2893 7.12129C14.6799 6.73077 14.6799 6.0976 14.2893 5.70708Z" fill="#0F0F0F"></path> </g></svg>
      <span class="repost-info-text"></span>
    </div>`;

  feed.appendChild(postCard);
  wireViewMore(`body-${postId}`, `btn-vm-${postId}`);
  loadRepostsForPost(postId, postCard);
}

function wireViewMore(bodyId, btnId) {
  const body = document.getElementById(bodyId);
  const btn = document.getElementById(btnId);
  if (!body || !btn) return;
  requestAnimationFrame(() => {
    // Check if content overflows (clamped height is exceeded)
    if (body.scrollHeight > body.clientHeight + 5) {
      btn.classList.add('visible');
    }
  });
  let expanded = false;
  btn.addEventListener('click', () => {
    expanded = !expanded;
    body.classList.toggle('clamped', !expanded);
    btn.textContent = expanded ? 'Show less ▴' : 'View more ▾';
  });
}

async function loadCommentsForPost(postId, postCard) {
  if (!postCard) return;
  const commentsStore = postCard.querySelector('.comments-data');
  if (!commentsStore) return;

  try {
    const commentsQuery = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(commentsQuery);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const cd = document.createElement('div');
      cd.className = 'comment-data';
      cd.dataset.commentId = docSnap.id;
      cd.dataset.userId = data.userId || '';
      cd.dataset.author = data.author || 'Anonymous';
      cd.dataset.avatar = data.photoURL || '../assets/images/anon_avatar.jpg';
      cd.dataset.text = data.text || '';
      cd.dataset.time = data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      cd.dataset.isOwn = data.userId === auth.currentUser?.uid ? 'true' : 'false';
      commentsStore.appendChild(cd);
    });
    updateFeedCommentPreview(postCard);
  } catch (error) {
    console.error('Could not load comments for post', postId, error);
  }
}

async function loadRepostsForPost(postId, postCard) {
  const repostsStore = postCard.querySelector('.reposts-data');
  if (!repostsStore) return;

  try {
    const repostsQuery = query(
      collection(db, "posts"),
      where("repostOf", "==", postId)
    );
    const snapshot = await getDocs(repostsQuery);
    const sortedDocs = snapshot.docs.sort((a, b) => {
      const aTime = (a.data().createdAt && a.data().createdAt.toDate) ? a.data().createdAt.toDate().getTime() : (a.data().createdAt?.seconds * 1000 || 0);
      const bTime = (b.data().createdAt && b.data().createdAt.toDate) ? b.data().createdAt.toDate().getTime() : (b.data().createdAt?.seconds * 1000 || 0);
      return aTime - bTime;
    });

    sortedDocs.forEach((docSnap) => {
      const data = docSnap.data();
      const rd = document.createElement('div');
      rd.className = 'repost-data';
      rd.dataset.repostDocId = docSnap.id;
      rd.dataset.author = data.author || 'Unknown';
      rd.dataset.avatar = data.photoURL || '../assets/images/anon_avatar.jpg';
      rd.dataset.quote = data.text || '';
      rd.dataset.hasQuote = data.text ? 'true' : 'false';
      rd.dataset.time = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt.seconds * 1000 || data.createdAt).toISOString()) : new Date().toISOString();
      repostsStore.appendChild(rd);
    });

    updateRepostInfo(postCard);

    const user = auth.currentUser;
    if (user) {
      const alreadyReposted = [...repostsStore.querySelectorAll('.repost-data')]
        .some(rd => rd.dataset.author === USER.name);
      if (alreadyReposted) {
        const btn = postCard.querySelector('[data-type="repost"]');
        if (btn) {
          btn.classList.add('repost-active');
          btn.lastChild.textContent = ' Reposted';
        }
      }
    }
  } catch (error) {
    console.error('Could not load reposts for post', postId, error);
  }
}

// ========================
// LOAD USER POSTS
// ========================
function loadUserPosts(userId) {
  const feedContainer = document.getElementById('feed');
  const q = query(
    collection(db, "posts"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      feedContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="empty-state-title">No posts yet</div>
          <div class="empty-state-sub">Your posts will show up here.</div>
        </div>
      `;
      return;
    }

    const changes = snapshot.docChanges();
    const isInitialLoad = !feedContainer.querySelector('.post-card');
    const hasStructureChange = changes.some(c => c.type === 'added' || c.type === 'removed');

    // If it's just a modification (like count change), update in place to avoid flicker
    if (!isInitialLoad && !hasStructureChange) {
      changes.forEach(change => {
        if (change.type === 'modified') {
          updatePostInPlace(change.doc.id, change.doc.data());
        }
      });
      return;
    }

    // Full render for structure changes or initial load
    feedContainer.innerHTML = '';
    allPosts = [];
    snapshot.forEach((d) => {
      const p = { id: d.id, ...d.data() };
      allPosts.push(p);
      renderPost(p, d.id);
    });

    setTimeout(() => {
      const user = auth.currentUser;
      if (user) {
        document.querySelectorAll('.comment-data').forEach(cd => {
          if (cd.dataset.author === USER.name) cd.dataset.avatar = USER.photoSrc;
        });
        document.querySelectorAll('.post-card').forEach(card => {
          updateFeedCommentPreview(card);
        });
        wireLightboxTriggers();
      }
    }, 500);

  }, (error) => {
    console.error("Feed Error:", error);
  });
}

/**
 * Updates a specific post's UI elements without re-rendering the whole card.
 * Prevents flickering during likes/comments updates.
 */
function updatePostInPlace(postId, data) {
  const card = document.querySelector(`.post-card[data-id="${postId}"]`);
  if (!card) return;

  const user = auth.currentUser;
  const currentUid = user ? user.uid : null;

  // 1. Update Likes
  const likes = data.likedBy || [];
  const isLikedByMe = currentUid && likes.includes(currentUid);
  const likeBtn = card.querySelector('.feed-reaction-btn[data-type="like"]');
  if (likeBtn) {
    likeBtn.classList.toggle('heart-active', isLikedByMe);
    const countSpan = likeBtn.querySelector('.likes-count');
    if (countSpan) countSpan.textContent = fmt(likes.length);
  }

  // 2. Update Comments
  const rawComments = data.comments;
  let commentsCount = 0;
  if (Array.isArray(rawComments)) {
    commentsCount = rawComments.length;
  } else if (typeof rawComments === 'number') {
    commentsCount = rawComments;
  } else {
    commentsCount = 0;
  }

  const commentBtn = card.querySelector('.feed-reaction-btn[data-type="comment"]');
  if (commentBtn) {
    const countSpan = commentBtn.querySelector('.comments-count');
    if (countSpan) countSpan.textContent = fmt(commentsCount);
  }

  // 3. Update Reposts
  const reposts = data.repostedBy || [];
  const isRepostedByMe = currentUid && reposts.includes(currentUid);
  const repostBtn = card.querySelector('.feed-reaction-btn[data-type="repost"]');
  if (repostBtn) {
    repostBtn.classList.toggle('repost-active', isRepostedByMe);
    const countSpan = repostBtn.querySelector('.reposts-count');
    if (countSpan) countSpan.textContent = fmt(reposts.length);
  }

  // 4. Update specific data attributes and preview
  updateFeedCommentPreview(card);
}

// ========================
// LIKE TOGGLE → FIREBASE
// ========================

// ========================
// REPOST CLICK
// ========================
function handleRepostClick(btn) {
  const isActive = btn.classList.toggle('repost-active');

  if (isActive) {
    btn.lastChild.textContent = ' Reposted';
    openRepostModal(btn);
  } else {
    const user = auth.currentUser;
    const originalCard = btn.closest('.post-card');
    const originalPostId = originalCard.dataset.id;
    const repostsStore = originalCard.querySelector('.reposts-data');

    // Find the repost-data belonging to the current user
    const myRepostData = repostsStore
      ? [...repostsStore.querySelectorAll('.repost-data')].find(rd => rd.dataset.author === USER.name)
      : null;

    if (myRepostData) {
      const repostDocId = myRepostData.dataset.repostDocId;
      if (repostDocId && user) {
        // Delete repost post doc
        deleteDoc(doc(db, "posts", repostDocId)).catch(console.error);
        // Remove user from repostedBy on original post
        updateDoc(doc(db, "posts", originalPostId), {
          repostedBy: arrayRemove(user.uid)
        }).catch(console.error);
      }
      myRepostData.remove();
    }

    const countSpan = btn.querySelector('.reaction-reposts-count');
    if (countSpan) countSpan.textContent = fmt(Math.max(0, parseInt(countSpan.textContent) - 1));
    btn.lastChild.textContent = ' Repost';
    updateRepostInfo(originalCard);
    window.showToast('Repost removed!', 'repost');
  }
}

// ========================
// DROPDOWN MENU
// ========================
function toggleMenu(e, id) {
  e.stopPropagation();
  document.querySelectorAll('.dropdown-menu').forEach(m => {
    if (m.id !== id) m.classList.remove('open');
  });
  document.getElementById(id)?.classList.toggle('open');
}

document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
});

// ========================
async function deletePost(e) {
  const card = e.target.closest('.post-card');
  const postId = card.dataset.id;
  const user = auth.currentUser;
  if (!user) return;

  window.showConfirm({
    title: '🗑️ Delete this post?',
    confirmText: 'Delete',
    onConfirm: async () => {
      try {
        const postRef = doc(db, "posts", postId);
        const snap = await getDoc(postRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.repostOf) {
            try {
              const originalRef = doc(db, "posts", data.repostOf);
              await updateDoc(originalRef, {
                repostedBy: arrayRemove(user.uid)
              });
            } catch (e1) {
              try {
                const annRef = doc(db, "announcements", data.repostOf);
                await updateDoc(annRef, {
                  reposts: arrayRemove(user.uid)
                });
              } catch (e2) {
                console.warn("Could not sync original post/announcement count (likely permission restricted):", e2);
              }
            }
          }
        }

        // Always attempt to delete the actual document regardless of sync results
        await deleteDoc(postRef);
        card.style.transition = 'opacity 0.28s, transform 0.28s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.93)';
        setTimeout(() => card.remove(), 300);
        window.showToast('Post deleted', 'success');
      } catch (error) {
        console.error('Delete error:', error);
        window.showToast('Error deleting post.', 'error');
      }
    }
  });
}
// ========================
// EDIT POST
// ========================
async function editPost(e) {
  const card = e.target.closest('.post-card');
  const postId = card.dataset.id;
  const bodyEl = card.querySelector('.post-body');
  if (!bodyEl) return;

  const originalText = bodyEl.innerHTML
    .replace(/<br>/g, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  bodyEl.style.display = 'none';
  const editWrap = document.createElement('div');
  editWrap.className = 'post-edit-wrap';
  editWrap.innerHTML = `
    <textarea class="post-edit-textarea">${originalText}</textarea>
    <div class="post-edit-buttons">
      <button class="post-edit-save">Save</button>
      <button class="post-edit-cancel">Cancel</button>
    </div>`;
  bodyEl.parentNode.insertBefore(editWrap, bodyEl.nextSibling);
  editWrap.querySelector('.post-edit-textarea').focus();

  editWrap.querySelector('.post-edit-save').addEventListener('click', async () => {
    const newText = editWrap.querySelector('.post-edit-textarea').value.trim();
    if (!newText) return;
    try {
      await updateDoc(doc(db, "posts", postId), { text: newText });
      bodyEl.innerHTML = escapeHTML(newText).replace(/\n/g, '<br>');
      editWrap.remove();
      bodyEl.style.display = '';
      window.showToast('Post updated', 'success');
    } catch (error) {
      console.error('Edit post error:', error);
      window.showToast('Error updating post.', 'error');
    }
  });

  editWrap.querySelector('.post-edit-cancel').addEventListener('click', () => {
    editWrap.remove();
    bodyEl.style.display = '';
  });
}

// ========================
// POST MODAL
// ========================
const fileInput = document.getElementById('modal-file-input');
const attachWrap = document.getElementById('modal-attachments');
const submitBtn = document.getElementById('modal-submit-btn');
const textarea = document.getElementById('postContent') || document.getElementById('post-textarea');

const repostFileInput = document.getElementById('repost-file-input');
const repostAttachWrap = document.getElementById('repost-modal-attachments');
const repostTextarea = document.getElementById('repostContent');

function updateSubmitButton() {
  // Main Post
  if (textarea && submitBtn) {
    const hasContent = textarea.value.trim().length > 0;
    // Text is mandatory as per user request
    submitBtn.disabled = !hasContent;
  }
  // Repost Quote
  const rSubmitBtn = document.getElementById('repost-submit-btn');
  if (repostTextarea && rSubmitBtn) {
    const hasContent = repostTextarea.value.trim().length > 0;
    rSubmitBtn.disabled = !hasContent;
  }
}

if (textarea) textarea.addEventListener('input', updateSubmitButton);
if (repostTextarea) repostTextarea.addEventListener('input', updateSubmitButton);

document.getElementById('btn-add-photo')?.addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();

  const now = Date.now();
  if (now - lastPhotoClick < PHOTO_DEBOUNCE) return;
  lastPhotoClick = now;

  openPostModal();
  setTimeout(() => {
    if (fileInput) fileInput.click();
  }, 250);
});

document.getElementById('modal-add-photo-btn')?.addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();

  const now = Date.now();
  if (now - lastPhotoClick < PHOTO_DEBOUNCE) return;
  lastPhotoClick = now;

  if (fileInput) fileInput.click();
});

document.getElementById('anonToggle')?.addEventListener('change', function () {
  setAnonymityPreference(this.checked);
  updateAnonUI(this.checked, 'modal-user-name', 'modal-avatar');
});

document.getElementById('repostAnonToggle')?.addEventListener('change', function () {
  setAnonymityPreference(this.checked);
  updateAnonUI(this.checked, 'repost-user-name', 'repost-user-avatar');
});

function setAnonymityPreference(isAnon) {
  localStorage.setItem('tup_anon_pref', isAnon);
  // Sync all other toggles
  ['anonToggle', 'repostAnonToggle'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = isAnon;
  });
}

function getAnonymityPreference() {
  return localStorage.getItem('tup_anon_pref') === 'true';
}

function updateAnonUI(isAnon, nameId, avatarId) {
  const modalName = document.getElementById(nameId);
  const modalAvatar = document.getElementById(avatarId);
  if (modalName) modalName.textContent = isAnon ? "Anonymous Puto" : USER.name;
  if (modalAvatar) {
    modalAvatar.innerHTML = `<img src="${isAnon ? '../assets/images/anon_avatar.jpg' : USER.photoSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%; image-rendering: high-quality;">`;
  }
}

fileInput?.addEventListener('change', async function () {
  const files = Array.from(this.files);
  for (const file of files) {
    try {
      const compressedBase64 = await compressImage(file, 1000, 1000);
      const wrapper = document.createElement('div');
      wrapper.className = 'modal-attach-thumb-wrapper';
      wrapper.style.cssText = 'position:relative; width:80px; height:80px; flex-shrink:0;';

      wrapper.innerHTML = `
        <img src="${compressedBase64}" class="modal-attach-thumb" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">
        <button class="modal-attach-remove" style="position:absolute; top:-5px; right:-5px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; z-index:10;">✕</button>
      `;

      wrapper.querySelector('.modal-attach-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        wrapper.remove();
        updateSubmitButton();
      });

      attachWrap.appendChild(wrapper);
    } catch (err) {
      console.error("Compression error:", err);
    }
  }

  updateSubmitButton();
  fileInput.value = '';
});



function openPostModal() {
  const overlay = document.getElementById('postModal');
  const modalName = document.getElementById('modal-user-name');
  const modalAvatar = document.getElementById('modal-avatar');
  const anonToggle = document.getElementById('anonToggle');

  if (overlay) overlay.classList.add('open');

  // Apply anonymity preference
  const isAnon = getAnonymityPreference();
  if (anonToggle) anonToggle.checked = isAnon;
  updateAnonUI(isAnon, 'modal-user-name', 'modal-avatar');

  setTimeout(() => document.getElementById('postContent')?.focus(), 120);
  updateSubmitButton();
}

function closePostModal() {
  const overlay = document.getElementById('postModal');
  if (overlay) overlay.classList.remove('open');
  const attachWrap = document.getElementById('modal-attachments');
  if (attachWrap) attachWrap.innerHTML = '';
  const fileInput = document.getElementById('modal-file-input');
  if (fileInput) fileInput.value = '';
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('postModal')) closePostModal();
}

window.submitPost = async function () {
  const content = document.getElementById('postContent').value.trim();
  const attachWrap = document.getElementById('modal-attachments');
  const thumbs = Array.from(attachWrap.querySelectorAll('.modal-attach-thumb'));
  const anonToggle = document.getElementById('anonToggle');
  const isAnonymous = anonToggle ? anonToggle.checked : false;

  if (!content && thumbs.length === 0) { window.showToast('Write something first!', 'warning'); return; }

  const user = auth.currentUser;
  if (!user) return;

  const btn = document.getElementById('modal-submit-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner"></span> Posting...`;
  }

  try {
    const imageURLs = [];
    for (let i = 0; i < thumbs.length; i++) {
      const thumb = thumbs[i];
      imageURLs.push(thumb.src); // Already compressed base64 from fileInput listener
    }

    const postData = {
      userId: user.uid,
      author: isAnonymous ? "Anonymous Puto" : USER.name,
      photoURL: isAnonymous ? "../assets/images/anon_avatar.jpg" : USER.photoSrc,
      text: content,
      imageURL: imageURLs.length > 0 ? imageURLs[0] : "", // Legacy support
      imageURLs: imageURLs,
      isAnonymous: isAnonymous,
      createdAt: serverTimestamp(),
      likedBy: [],
      comments: 0,
      repostedBy: [],
      isOrg: false,
      college: USER.college || null
    };

    console.log("Saving user post to Firestore...");
    await addDoc(collection(db, "posts"), postData);
    console.log("User post saved successfully!");

    document.getElementById('postContent').value = '';
    attachWrap.innerHTML = '';
    // Persistence: Removed reset of anonToggle
    closePostModal();
    window.showToast('Post shared!', 'success');
  } catch (err) {
    console.error("Post Error:", err);
    window.showToast("Error submitting post: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Post`;
    }
  }
};

// ========================
// COMMENT MODAL
// ========================
let _currentPostCard = null;

async function openCommentModal(el) {
  const card = el.closest('.post-card');
  if (!card) return;
  _currentPostCard = card;
  const list = document.getElementById('commentModalList');
  list.innerHTML = '';

  const existingComments = card.querySelectorAll('.comment-data');
  if (existingComments.length === 0) {
    const commentCount = parseInt(card.querySelector('.comments-count')?.textContent || '0');
    if (commentCount > 0) {
      await loadCommentsForPost(card.dataset.id, card);
    }
  }

  card.querySelectorAll('.comment-data').forEach((cd, cIdx) => {
    list.appendChild(buildCommentModalItem(
      cd.dataset.author, cd.dataset.avatar,
      cd.dataset.text, cd.dataset.time,
      cd.dataset.isOwn === 'true', cIdx,
      cd.dataset.userId
    ));
  });

  bindCommentActions();

  // Set user avatar in comment input
  const modalAvatarWrap = document.querySelector('.comment-modal-avatar img');
  if (modalAvatarWrap) modalAvatarWrap.src = USER.photoSrc || '../assets/images/anon_avatar.jpg';

  document.getElementById('commentModal').classList.add('open');
  setTimeout(() => document.getElementById('commentModalInput')?.focus(), 120);
}

function buildCommentModalItem(author, avatar, text, time, isOwn, cIdx, userId = '') {
  const item = document.createElement('div');
  item.className = 'comment-modal-item';
  item.id = `comment-modal-item-${cIdx}`;
  item.dataset.userId = userId;
  item.innerHTML = `
    <div class="comment-modal-item-avatar">
      <img src="${avatar}" alt="${escapeHTML(author)}" onerror="this.parentElement.textContent='👤'">
    </div>
    <div class="comment-modal-item-content">
      <div class="comment-modal-item-bubble" id="comment-modal-bubble-${cIdx}">
        <div class="comment-modal-item-author">${escapeHTML(author)}</div>
        <div class="comment-modal-item-text" id="comment-modal-text-${cIdx}">${escapeHTML(text)}</div>
      </div>
      <div class="comment-edit-wrap" id="comment-modal-edit-${cIdx}">
        <input class="comment-edit-input" id="comment-modal-edit-input-${cIdx}" value="${escapeHTML(text)}"/>
        <button class="comment-edit-save" data-comment="${cIdx}">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
        <button class="comment-edit-cancel" data-comment="${cIdx}">✕</button>
      </div>
      <div class="comment-footer" style="display:flex; align-items:center; gap:12px; margin-top:4px;">
        <div class="comment-modal-item-time" style="margin:0;" data-timestamp="${time}">${formatRelativeTime(new Date(time))}</div>
        ${isOwn ? `
        <div class="comment-item-actions" style="display:flex; align-items:center; gap:8px;">
          <button class="comment-action-btn edit-btn" data-comment="${cIdx}" style="margin:0; padding:0; background:none;">
            <svg viewBox="0 0 24 24" width="13" height="13" style="stroke:currentColor;fill:none;stroke-width:2.5;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
          </button>
          <button class="comment-action-btn delete-btn" data-comment="${cIdx}" style="margin:0; padding:0; background:none;">
            <svg viewBox="0 0 24 24" width="13" height="13" style="stroke:currentColor;fill:none;stroke-width:2.5;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete
          </button>
        </div>` : ''}
      </div>
    </div>`;
  return item;
}

function bindCommentActions() {
  const list = document.getElementById('commentModalList');

  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const c = this.dataset.comment;
      document.getElementById(`comment-modal-bubble-${c}`).style.display = 'none';
      document.getElementById(`comment-modal-edit-${c}`).classList.add('open');
      document.getElementById(`comment-modal-edit-input-${c}`).focus();
    });
  });

  list.querySelectorAll('.comment-edit-cancel').forEach(btn => {
    btn.addEventListener('click', function () {
      const c = this.dataset.comment;
      document.getElementById(`comment-modal-bubble-${c}`).style.display = '';
      document.getElementById(`comment-modal-edit-${c}`).classList.remove('open');
    });
  });

  list.querySelectorAll('.comment-edit-save').forEach(btn => {
    btn.addEventListener('click', async function () {
      const c = this.dataset.comment;
      const newText = document.getElementById(`comment-modal-edit-input-${c}`).value.trim();
      if (!newText) return;

      if (_currentPostCard) {
        const postId = _currentPostCard.dataset.id;
        const cds = _currentPostCard.querySelectorAll('.comment-data');
        const commentId = cds[c]?.dataset.commentId;

        try {
          if (postId && commentId) {
            await updateDoc(doc(db, "posts", postId, "comments", commentId), { text: newText });
          }
          document.getElementById(`comment-modal-text-${c}`).textContent = newText;
          document.getElementById(`comment-modal-bubble-${c}`).style.display = '';
          document.getElementById(`comment-modal-edit-${c}`).classList.remove('open');
          if (cds[c]) cds[c].dataset.text = newText;
          updateFeedCommentPreview(_currentPostCard);
          window.showToast('Comment updated.', 'success');
        } catch (error) {
          console.error('Edit comment error:', error);
          window.showToast('Failed to update comment.', 'error');
        }
      }
    });
  });

  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const c = this.dataset.comment;
      const item = document.getElementById(`comment-modal-item-${c}`);

      if (_currentPostCard) {
        const postId = _currentPostCard.dataset.id;
        const cds = _currentPostCard.querySelectorAll('.comment-data');
        const commentId = cds[c]?.dataset.commentId;

        try {
          if (postId && commentId) {
            await deleteDoc(doc(db, "posts", postId, "comments", commentId));
            await updateDoc(doc(db, "posts", postId), { comments: increment(-1) });
          }
          item.style.transition = 'opacity 0.2s, transform 0.2s';
          item.style.opacity = '0';
          item.style.transform = 'translateX(12px)';
          setTimeout(() => item.remove(), 200);
          if (cds[c]) cds[c].remove();
          const countEl = _currentPostCard.querySelector('.comments-count');
          if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
          updateFeedCommentPreview(_currentPostCard);
          window.showToast('Comment deleted.', 'success');
        } catch (error) {
          console.error('Delete comment error:', error);
          window.showToast('Failed to delete comment.', 'error');
        }
      }
    });
  });
}

function closeCommentModal() {
  document.getElementById('commentModal').classList.remove('open');
  const inp = document.getElementById('commentModalInput');
  if (inp) inp.value = '';
  // Persistence: Removed reset of commentAnonToggle
  _currentPostCard = null;
}

function closeCommentModalOnOverlay(e) {
  if (e.target === document.getElementById('commentModal')) closeCommentModal();
}

function handleModalCommentKey(e) {
  if (e.key === 'Enter') submitModalComment();
}

async function submitModalComment() {
  const input = document.getElementById('commentModalInput');
  const text = input.value.trim();

  if (!text) return;

  const now = new Date();
  const list = document.getElementById('commentModalList');
  const cIdx = list.querySelectorAll('.comment-modal-item').length;

  const displayAuthor = USER.name;
  const displayAvatar = USER.photoSrc || '../assets/images/anon_avatar.jpg';

  list.appendChild(buildCommentModalItem(
    displayAuthor,
    displayAvatar,
    text, now.toISOString(), true, cIdx,
    auth.currentUser?.uid || ''
  ));
  list.scrollTop = list.scrollHeight;
  bindCommentActions();

  if (!_currentPostCard) { input.value = ''; return; }

  const postId = _currentPostCard.dataset.id;
  if (!postId) { input.value = ''; return; }

  const store = _currentPostCard.querySelector('.comments-data');
  const cd = document.createElement('div');
  cd.className = 'comment-data';
  cd.dataset.commentId = '';
  cd.dataset.userId = auth.currentUser?.uid || '';
  cd.dataset.author = displayAuthor;
  cd.dataset.avatar = displayAvatar;
  cd.dataset.text = text;
  cd.dataset.time = now.toISOString();
  cd.dataset.isOwn = 'true';
  if (store) store.appendChild(cd);

  try {
    const commentRef = await addDoc(collection(db, "posts", postId, "comments"), {
      text: text,
      author: displayAuthor,
      userId: auth.currentUser?.uid || null,
      photoURL: displayAvatar,
      isAnonymous: isAnonymous,
      createdAt: serverTimestamp()
    });
    cd.dataset.commentId = commentRef.id;

    await updateDoc(doc(db, "posts", postId), {
      comments: increment(1)
    });
  } catch (error) {
    console.error('Failed to save comment:', error);
  }

  const countEl = _currentPostCard.querySelector('.comments-count');
  if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
  updateFeedCommentPreview(_currentPostCard);

  input.value = '';
  window.showToast('Comment posted!', 'success');
}

function updateFeedCommentPreview(card) {
  // Comment preview removed per user request.
  return;
}

function updateFeedCommentPreview_OLD(card) {
  const allComments = card.querySelectorAll('.comment-data');
  const count = allComments.length;
  const viewMore = card.querySelector('.view-comments');
  let preview = card.querySelector('.feed-comment-preview');

  if (viewMore) viewMore.style.display = count > 1 ? 'block' : 'none';

  if (count > 0) {
    const latest = allComments[allComments.length - 1];
    if (!preview) {
      preview = document.createElement('div');
      preview.className = 'feed-comment-preview';
      const ref = card.querySelector('.view-comments') || card.querySelector('.comment-input-row');
      card.insertBefore(preview, ref);
    }

    // Live override for current user's comments
    const currentUID = auth.currentUser?.uid;
    const isOwn = latest.dataset.userId === currentUID;
    const displayName = isOwn ? (USER.name || "TUPian") : latest.dataset.author;
    const displayAvatar = isOwn ? (USER.photoSrc || '../assets/images/anon_avatar.jpg') : latest.dataset.avatar;

    preview.innerHTML = `
      <div class="comment-modal-item" data-user-id="${latest.dataset.userId || ''}" style="cursor: pointer;" onclick="scrollToTop()">
        <div class="comment-modal-item-avatar">
          <img src="${displayAvatar}" alt="${escapeHTML(displayName)}" style="image-rendering: high-quality;" onerror="this.parentElement.textContent='👤'">
        </div>
        <div class="comment-modal-item-content">
          <div class="comment-modal-item-bubble">
            <div class="comment-modal-item-author" style="cursor: pointer;">${escapeHTML(displayName)}</div>
            <div class="comment-modal-item-text">${escapeHTML(latest.dataset.text)}</div>
          </div>
          <div class="comment-modal-item-time" data-timestamp="${latest.dataset.time}">${formatRelativeTime(new Date(latest.dataset.time))}</div>
        </div>
      </div>`;
  } else if (preview) {
    preview.remove();
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================
// REPOST MODAL
// ========================
let _currentRepostBtn = null;
let _repostSubmitted = false;

async function openRepostModal(btn) {
  _currentRepostBtn = btn;
  _repostSubmitted = false;

  const originalCard = btn.closest('.post-card');
  const postId = originalCard.dataset.id;
  const overlay = document.getElementById('hp-repost-modal-overlay');
  const modal = document.getElementById('hp-repost-modal');

  if (!overlay || !modal) return;

  // 1. Show overlay
  overlay.classList.add('open');
  overlay.style.display = 'flex';

  // 2. Clear previous data
  document.getElementById('repostContent').value = '';
  const isAnon = getAnonymityPreference();
  const rToggle = document.getElementById('repostAnonToggle');
  if (rToggle) rToggle.checked = isAnon;

  const modalName = document.getElementById('repost-user-name');
  const modalAvatar = document.getElementById('repost-user-avatar');

  if (modalName) modalName.textContent = isAnon ? "Anonymous Puto" : (USER.name || 'TUPian');
  if (modalAvatar) {
    modalAvatar.innerHTML = `<img src="${isAnon ? '../assets/images/anon_avatar.jpg' : USER.photoSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; image-rendering:high-quality;">`;
  }

  // 3. Fetch original post for preview
  const previewBody = document.getElementById('quote-preview-body');
  const previewAuthor = document.getElementById('quote-preview-author');
  const previewAvatar = document.getElementById('quote-preview-avatar');
  const previewTitle = document.getElementById('quote-preview-title');
  const previewTime = document.getElementById('quote-preview-time');

  previewBody.textContent = 'Loading...';
  previewAuthor.textContent = '...';

  try {
    const postSnap = await getDoc(doc(db, "posts", postId));
    if (postSnap.exists()) {
      const data = postSnap.data();
      previewAuthor.textContent = data.author || 'TUPian';
      previewBody.textContent = data.text || '';
      previewTitle.textContent = data.title || '';
      previewTime.textContent = formatRelativeTime(data.createdAt);

      if (data.photoURL) {
        previewAvatar.innerHTML = `<img src="${data.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; image-rendering:high-quality;">`;
      } else {
        previewAvatar.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      }

      // Add image preview if exists
      const existingImg = modal.querySelector('.cn-rm-quote-image');
      if (existingImg) existingImg.remove();
      const imageURL = data.imageURL || null;
      if (imageURL) {
        const imgEl = document.createElement('img');
        imgEl.className = 'cn-rm-quote-image';
        imgEl.src = imageURL;
        imgEl.style.cssText = 'width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-top:8px; image-rendering:high-quality;';
        document.getElementById('repost-quote-preview').appendChild(imgEl);
      }
    }
  } catch (err) {
    console.error("Error fetching for preview:", err);
    previewBody.textContent = 'Error loading preview.';
  }

  setTimeout(() => document.getElementById('repostContent').focus(), 150);
}

function closeRepostModal() {
  if (!_repostSubmitted && _currentRepostBtn) {
    _currentRepostBtn.classList.remove('repost-active');
    _currentRepostBtn.lastChild.textContent = ' Repost';
  }
  const overlay = document.getElementById('hp-repost-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }
  document.getElementById('repostContent').value = '';
  if (repostAttachWrap) repostAttachWrap.innerHTML = '';
  // Persistence: Removed reset of repostAnonToggle
  _currentRepostBtn = null;
  _repostSubmitted = false;
}

function closeRepostModalOnOverlay(e) {
  if (e.target.id === 'hp-repost-modal-overlay') closeRepostModal();
}

async function submitRepost(skipQuote = false) {
  const rToggle = document.getElementById('repostAnonToggle');
  const isAnonymous = rToggle ? rToggle.checked : false;
  const quote = document.getElementById('repostContent').value.trim();

  _repostSubmitted = true;
  if (_currentRepostBtn) {
    await createRepost(_currentRepostBtn, quote, isAnonymous);
    window.showToast('You Reposted!', 'repost');
  }
  closeRepostModal();
}

async function createRepost(btn, quote = '', isAnonymous = false) {
  const user = auth.currentUser;
  if (!user) return;

  const originalCard = btn.closest('.post-card');
  const originalPostId = originalCard.dataset.id;

  try {
    // Fetch fresh data to ensure we have all fields
    const postSnap = await getDoc(doc(db, "posts", originalPostId));
    if (!postSnap.exists()) {
      window.showToast("Original post not found.", "error");
      return;
    }
    const rawData = postSnap.data();

    const originalAuthor = rawData.author || rawData.name || 'Unknown';
    const originalText = rawData.text || rawData.body || '';
    const originalTitle = rawData.title || '';
    const originalImage = rawData.repostImage || (rawData.imageURLs && rawData.imageURLs[0]) || rawData.imageURL || null;
    const originalImages = rawData.repostImageURLs || rawData.imageURLs || (rawData.imageURL ? [rawData.imageURL] : []);
    const originalAuthorPhoto = rawData.photoURL || rawData.photoSrc || '../assets/images/anon_avatar.jpg';
    const repostRef = await addDoc(collection(db, "posts"), {
      userId: user.uid,
      author: isAnonymous ? "Anonymous Puto" : USER.name,
      photoURL: isAnonymous ? "../assets/images/anon_avatar.jpg" : USER.photoSrc,
      isAnonymous: isAnonymous,
      text: quote,
      imageURL: null,
      imageURLs: [],
      createdAt: serverTimestamp(),
      likedBy: [],
      comments: 0,
      repostOf: originalPostId,
      repostAuthor: originalAuthor,
      repostTitle: originalTitle,
      repostText: originalText,
      repostImage: originalImage,
      repostImageURLs: originalImages,
      repostAuthorPhoto: originalAuthorPhoto,
      repostTime: document.getElementById('quote-preview-time').textContent || ""
    });

    const originalPostRef = doc(db, "posts", originalPostId);
    await updateDoc(originalPostRef, {
      repostedBy: arrayUnion(user.uid)
    });

    const countSpan = btn.querySelector('.reposts-count');
    if (countSpan) countSpan.textContent = fmt(parseInt(countSpan.textContent || '0') + 1);
    btn.lastChild.textContent = ' Reposted';

    const repostsStore = originalCard.querySelector('.reposts-data');
    if (repostsStore) {
      const rd = document.createElement('div');
      rd.className = 'repost-data';
      rd.dataset.repostDocId = repostRef.id; // store doc ID
      rd.dataset.author = USER.name;
      rd.dataset.avatar = USER.photoSrc;
      rd.dataset.quote = quote;
      rd.dataset.hasQuote = quote ? 'true' : 'false';
      rd.dataset.time = new Date().toISOString();
      repostsStore.appendChild(rd);
    }

    updateRepostInfo(originalCard);

  } catch (error) {
    console.error('Repost error:', error);
    window.showToast('Failed to repost.', 'error');
  }
}

function updateRepostInfo(card) {
  const info = card.querySelector('.post-repost-info');
  if (!info) return;

  const repostDatas = Array.from(card.querySelectorAll('.reposts-data .repost-data'));
  if (repostDatas.length === 0) {
    info.style.display = 'none';
    info.classList.remove('repost-active');
    return;
  }

  const count = repostDatas.length;
  const textEl = info.querySelector('.repost-info-text');
  if (textEl) textEl.textContent = `${count} ${count === 1 ? 'student reposted' : 'students reposted'} this`;

  info.style.display = 'flex';
  info.classList.add('repost-active');
}

// ========================
// REPOST VIEW MODAL
// ========================
let _currentRepostViewCard = null;

function viewReposts(e) {
  const card = e.target.closest('.post-card');
  _currentRepostViewCard = card;

  const list = document.getElementById('repostViewModalList');
  list.innerHTML = '';

  card.querySelectorAll('.repost-data').forEach((rd, rIdx) => {
    list.appendChild(buildRepostViewItem(
      rd.dataset.author,
      rd.dataset.avatar,
      rd.dataset.quote,
      rd.dataset.hasQuote === 'true',
      rd.dataset.time,
      rIdx
    ));
  });

  document.getElementById('repostViewModal').classList.add('open');
}

function buildRepostViewItem(author, avatar, quote, hasQuote, time, rIdx) {
  const item = document.createElement('div');
  item.className = 'comment-modal-item';
  item.id = `repost-view-item-${rIdx}`;
  const dateObj = new Date(time);
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const timeFormatted = `${dateStr} at ${timeStr}`;

  item.innerHTML = `
    <div class="comment-modal-item-avatar">
      <img src="${avatar}" alt="${escapeHTML(author)}" onerror="this.parentElement.textContent='👩'">
    </div>
    <div class="comment-modal-item-content">
      <div class="comment-modal-item-bubble">
        <div class="comment-modal-item-author">${escapeHTML(author)}</div>
        ${hasQuote ? `<div class="comment-modal-item-text">${escapeHTML(quote)}</div>` : '<div class="reposted-without-quote">Reposted without quote</div>'}
      </div>
      <div class="comment-modal-item-time" data-timestamp="${time}">${timeFormatted}</div>
    </div>`;
  return item;
}

function closeRepostViewModal() {
  document.getElementById('repostViewModal').classList.remove('open');
  _currentRepostViewCard = null;
}

function closeRepostViewModalOnOverlay(e) {
  if (e.target === document.getElementById('repostViewModal')) closeRepostViewModal();
}

// ========================
// LOGOUT
// ========================
document.getElementById('btn-logout')?.addEventListener('click', () => {
  signOut(auth).then(() => {
    localStorage.clear();
    window.location.href = "../index.html";
  }).catch(console.error);
});

// ========================
// DOM CONTENT LOADED
// ========================
document.addEventListener('DOMContentLoaded', () => {

  const commentInput = document.getElementById('commentModalInput');
  const commentSubmit = document.querySelector('.comment-modal-submit');
  if (commentInput && commentSubmit) {
    commentInput.addEventListener('input', () => {
      commentSubmit.style.opacity = commentInput.value.trim() ? '1' : '0.35';
    });
  }

  const anonToggle = document.getElementById('anonToggle');
  if (anonToggle) {
    anonToggle.addEventListener('change', function () {
      const nameEl = document.getElementById('modal-user-name');
      const avatarEl = document.getElementById('modal-avatar');
      if (this.checked) {
        if (nameEl) nameEl.textContent = 'Anonymous';
        if (avatarEl) avatarEl.innerHTML = `<img src="../assets/images/anon_avatar.jpg" alt="Anonymous" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        if (nameEl) nameEl.textContent = USER.name;
        if (avatarEl) avatarEl.innerHTML = USER.photoSrc
          ? `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
          : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      }
    });
  }

  document.addEventListener('click', function (e) {
    const bubble = e.target.closest('.feed-comment-preview .comment-modal-item-bubble');
    if (bubble) openCommentModal(bubble);
  });

  setInterval(() => {
    document.querySelectorAll('.comment-modal-item-time').forEach(el => {
      if (el.dataset.timestamp) el.textContent = formatRelativeTime(new Date(el.dataset.timestamp));
    });
  }, 60000);

  // Sidebar navigation
  (function () {
    const navWrap = document.getElementById('sidebar-nav');
    const teardrop = document.getElementById('nav-teardrop');
    if (!navWrap || !teardrop) return;

    const navBtns = Array.from(navWrap.querySelectorAll('.nav-btn'));
    const profBtn = document.getElementById('sidebar-avatar-wrap');
    const allBtns = profBtn ? [...navBtns, profBtn] : [...navBtns];
    const TD_BASE_H = 66;

    function moveTo(item) {
      const wrapRect = navWrap.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      teardrop.style.top = (itemRect.top + itemRect.height / 2 - wrapRect.top - TD_BASE_H / 2) + 'px';
    }

    navBtns.forEach(item => {
      item.addEventListener('click', function () {
        allBtns.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        moveTo(this);
        const route = this.dataset.route;
        if (route === 'home') window.location.href = '../pages/homepage.html';
        if (route === 'campus news') window.location.href = '../pages/campus_news.html';
        if (route === 'campus') window.location.href = '../pages/campus_directory.html';
      });
    });

    if (profBtn) {
      profBtn.addEventListener('click', function () {
        allBtns.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        moveTo(this);
        window.location.href = '../pages/profile.html';
      });
    }

    const active = navWrap.querySelector('.nav-btn.active') || profBtn;
    if (active) {
      teardrop.style.transition = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        moveTo(active);
        teardrop.style.transition = '';
      }));
    }
  })();
});

// ========================
// EXPOSE TO HTML onclick
// ========================
window.toggleChangePhotoMenu = toggleChangePhotoMenu;
window.toggleMenu = toggleMenu;
window.deletePost = deletePost;
window.editPost = editPost;
window.openPostModal = openPostModal;
window.closePostModal = closePostModal;
window.closeModalOnOverlay = closeModalOnOverlay;
window.submitPost = submitPost;
window.openCommentModal = openCommentModal;
window.closeCommentModal = closeCommentModal;
window.closeCommentModalOnOverlay = closeCommentModalOnOverlay;
window.handleModalCommentKey = handleModalCommentKey;
window.submitModalComment = submitModalComment;
window.openRepostModal = openRepostModal;
window.closeRepostModal = closeRepostModal;
window.closeRepostModalOnOverlay = closeRepostModalOnOverlay;
window.submitRepost = submitRepost;

// ========================
// LIGHTBOX
// ========================
function initLightbox() {
  if (!document.getElementById('cn-lightbox')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="cn-lightbox">
        <span id="cn-lightbox-close">✕</span>
        <img id="cn-lightbox-img" src=""/>
        <button id="lb-prev" class="lb-nav">❮</button>
        <button id="lb-next" class="lb-nav">❯</button>
        <div id="lb-counter"></div>
      </div>
    `);
  }
  const lb = document.getElementById('cn-lightbox');
  document.getElementById('cn-lightbox-close')?.addEventListener('click', () => lb.classList.remove('open'));
  lb?.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });

  document.getElementById('lb-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.currentIndex = (window.currentIndex > 0) ? window.currentIndex - 1 : window.currentGallery.length - 1;
    updateLightbox();
  });
  document.getElementById('lb-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.currentIndex = (window.currentIndex < window.currentGallery.length - 1) ? window.currentIndex + 1 : 0;
    updateLightbox();
  });
}

function updateLightbox() {
  const lb = document.getElementById('cn-lightbox');
  const img = document.getElementById('cn-lightbox-img');
  const counter = document.getElementById('lb-counter');
  if (lb && img) {
    img.src = window.currentGallery[window.currentIndex];
    lb.classList.add('open');
    if (counter) counter.textContent = `${window.currentIndex + 1} / ${window.currentGallery.length}`;
    lb.dataset.count = window.currentGallery.length;
  }
}

function wireLightboxTriggers() {
  document.querySelectorAll('.lightbox-trigger').forEach(el => {
    const fresh = el.cloneNode(true); el.replaceWith(fresh);
    fresh.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = fresh.dataset.src;
      if (!src) return;

      const card = fresh.closest('.post-card');
      const pid = card?.dataset.id;
      const post = allPosts.find(p => p.id === pid);

      if (post && post.imageURLs && post.imageURLs.length > 0) {
        window.currentGallery = post.imageURLs;
        window.currentIndex = post.imageURLs.indexOf(src);
        if (window.currentIndex === -1) window.currentIndex = 0;
        updateLightbox();
      } else {
        window.currentGallery = [src];
        window.currentIndex = 0;
        updateLightbox();
      }
    });
  });
}

function renderPhotoGrid(imgs) {
  const count = imgs.length;
  const clampedCount = Math.min(count, 5);
  const extra = count > 5 ? count - 5 : 0;
  const borderRadius = '18px';
  const gap = '8px';

  if (clampedCount === 1) {
    return `<div class="lightbox-trigger" data-src="${imgs[0]}" style="cursor:pointer; margin-top:12px; border-radius:${borderRadius}; overflow:hidden; display:block;">
              <img src="${imgs[0]}" style="width:100%; display:block; object-fit:cover; max-height:500px;" />
            </div>`;
  }

  let style = `display: grid !important; height: 340px !important; gap: ${gap} !important; width: 100% !important; margin-top:12px; border-radius:${borderRadius}; overflow:hidden;`;
  if (clampedCount === 2) style += ` grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr !important;`;
  else if (clampedCount === 3) style += ` grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;`;
  else if (clampedCount === 4) style += ` grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;`;
  else style += ` grid-template-columns: 2fr 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;`;

  let gridHtml = `<div class="photo-grid collage-${clampedCount}" style="${style}">`;

  const cellsHtml = imgs.slice(0, 5).map((src, i) => {
    let cellStyle = "position: relative !important; overflow: hidden !important; min-width: 0 !important; min-height: 0 !important; width: 100% !important; height: 100% !important; cursor:pointer;";
    if (clampedCount === 3 && i === 0) cellStyle += " grid-row: 1 / 3 !important;";
    else if (clampedCount === 5 && i === 0) cellStyle += " grid-column: 1 / 2 !important; grid-row: 1 / 3 !important;";

    const overlayHtml = (i === 4 && extra > 0)
      ? `<div class="photo-more-overlay" style="position: absolute !important; inset: 0 !important; background: rgba(0,0,0,0.5) !important; display: flex !important; align-items: center !important; justify-content: center !important; color: #fff !important; font-size: 24px !important; font-weight: 700 !important; z-index: 2 !important; pointer-events: none !important; font-family: 'Montserrat', sans-serif;">+${extra}</div>`
      : '';

    return `
      <div class="collage-cell lightbox-trigger" data-src="${src}" style="${cellStyle}">
        <img src="${src}" style="position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important;" />
        ${overlayHtml}
      </div>`;
  }).join('');

  return gridHtml + cellsHtml + `</div>`;
}

// Boot lightbox
initLightbox();
window.viewReposts = viewReposts;
window.closeRepostViewModal = closeRepostViewModal;
window.closeRepostViewModalOnOverlay = closeRepostViewModalOnOverlay;
window.askSuggestion = askSuggestion;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;

// ========================
// FEED CLICK HANDLER
// ========================
document.getElementById('feed').addEventListener('click', async (e) => {
  const btn = e.target.closest('.feed-reaction-btn');
  if (!btn) return;

  const postId = btn.dataset.id;
  const type = btn.dataset.type;
  const user = auth.currentUser;
  if (!user) { window.showToast('Login to interact!', 'warning'); return; }

  const postRef = doc(db, "posts", postId);

  try {
    if (type === 'like') {
      const isLiked = btn.classList.contains('heart-active');
      if (!isLiked) {
        await updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
        btn.classList.add('heart-active');
      } else {
        await updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
        btn.classList.remove('heart-active');
      }
    } else if (type === 'comment') {
      openCommentModal(btn);
    } else if (type === 'repost') {
      handleRepostClick(btn);
    }
  } catch (error) {
    console.error('Reaction error:', error);
    window.showToast('Failed to update reaction.', 'error');
  }
});

// ========================
// CHATBOT
// ========================

window.askSuggestion = askSuggestion;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;

function toggleChat() {
  const modal = document.getElementById('chatModal');
  if (modal) modal.classList.toggle('active');
}

function askSuggestion(text) {
  const input = document.getElementById('userInput');
  if (input) {
    input.value = text;
    sendMessage();
  }
}

window.toggleChat = toggleChat;

async function sendMessage() {
  const input = document.getElementById('userInput');
  const body = document.getElementById('chatBody');
  const text = input.value.trim();
  if (!text) return;

  // 1. Show User Message
  const userMsg = document.createElement('div');
  userMsg.className = 'user-message';
  userMsg.textContent = text;
  body.appendChild(userMsg);
  input.value = '';
  body.scrollTop = body.scrollHeight;

  try {
    // 2. Get Response from Gemini
    const result = await model.generateContent(text);
    const response = await result.response;
    const botText = response.text();

    // ════════════════════════════════════════
    // 3. FORMATTING LOGIC (Dito ilalagay)
    // ════════════════════════════════════════
    let formattedResponse = botText
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/^\* /gm, '• ')
      .replace(/\n/g, '<br>');

    const botRow = document.createElement('div');
    botRow.className = 'bot-row';
    botRow.innerHTML = `
      <img src="../assets/images/Tupee_logo.png" class="bot-row-avatar">
      <div class="bot-message">${formattedResponse}</div>
    `;
    body.appendChild(botRow);
    body.scrollTop = body.scrollHeight;

  } catch (error) {
    console.error("Gemini Error:", error);
  }
}
