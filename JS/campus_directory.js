import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain: "tup-connect-b162d.firebaseapp.com",
  projectId: "tup-connect-b162d",
  storageBucket: "tup-connect-b162d.firebasestorage.app",
  messagingSenderId: "193141013544",
  appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
      "content": "The College of Architecture and Fine Arts develops competitive architects, artist, designers, and draftsmen for industry and related sectors toward an improved quality of life.\nPrograms Offered: \n\nUndergraduate Programs:\n- Bachelor of Science in Architecture\n- Bachelor of Fine Arts\n- Bachelor in Graphics Technology major in Architecture Technology\n- Bachelor in Graphics Technology major in Industrial Design\n- Bachelor in Graphics Technology major in Mechanical Drafting Technology\n\nGraduate Programs:\n- Master in Architecture major in Construction Technology Management\n- Master in Graphics Technology"
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

// ========================
// DIRECTORY DATA
// ========================
const directoryData = {
  'COS Building': {
    img: '../assets/images/COS.jpeg',
    desc: 'The College of Science prepares students to become fully integrated individuals, scientifically literate and technically competent to assume dynamic and responsible leadership for the country\'s scientific and technological development in the improvement of man\'s well-being and the quality of environment.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Applied Science in Laboratory Technology',
        'Bachelor of Science in Computer Science',
        'Bachelor of Science in Environmental Science',
        'Bachelor of Science in Information System',
        'Bachelor of Science in Information Technology',
      ],
      'For Graduate Programs:': [
        'Master of Arts in Teaching major in Physics',
        'Master of Arts in Teaching major in Mathematics',
        'Master of Arts in Teaching major in General Science',
        'Master of Arts in Teaching major in Chemistry',
        'Master of Information Technology',
      ],
    },
  },
  'CAFA Building': {
    img: '../assets/images/cafa.jpg',
    desc: 'The College of Architecture and Fine Arts offers programs that develop creative and technically skilled professionals in architecture, industrial design, and the fine arts.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Science in Architecture',
        'Bachelor of Fine Arts',
        'Bachelor in Graphics Technology major in Architecture Technology',
        'Bachelor in Graphics Technology major in Industrial Design',
        'Bachelor in Graphics Technology major in Mechanical Drafting Technology'
      ],
      'For Graduate Programs:': [
        'Master in Architecture major in Construction Technology Management',
        'Master in Graphics Technology'
      ],
    },
  },
  'CIT Building': {
    img: '../assets/images/cit.jpg',
    desc: 'The College of Industrial Technology trains highly skilled technologists and technicians who are competent in their fields, ready to contribute to national development.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Science in Food Technology',
        'Bachelor of Engineering Technology major in Computer Engineering Technology',
        'Bachelor of Engineering Technology major in Civil Technology',
        'Bachelor of Engineering Technology major in Electrical Technology',
        'Bachelor of Engineering Technology major in Electronics Communication Technology',
        'Bachelor of Engineering Technology major in Electronics Technology',
        'Bachelor of Engineering Technology major in Instrumentation and Control Technology',
        'Bachelor of Engineering Technology major in Mechanical Technology',
        'Bachelor of Engineering Technology major in Mechatronics Technology',
        'Bachelor of Engineering Technology major in Railway Technology',
        'Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Automotive Technology',
        'Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Foundry Technology',
        'Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Heating Ventilating & Air-Conditioning / Refrigeration Technology',
        'Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Power Plant Technology',
        'Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Welding Technology',
        'Bachelor of Engineering Technology major in Mechanical Engineering Technology option in Dies and Moulds Technology',
        'Bachelor of Technology in Apparel and Fashion',
        'Bachelor of Technology in Nutrition and Food Technology',
        'Bachelor of Technology in Print Media Technology'
      ],
      'For Graduate Programs:': [
        'Master of Technology'
      ]
    },
  },
  'CIE Building': {
    img: '../assets/images/cie.jpg',
    desc: 'The College of Industrial Education focuses on developing effective technology teachers and trainers for secondary and post-secondary education institutions.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Technology and Livelihood Education major in Information and Communication Technology',
        'Bachelor of Technology and Livelihood Education major in Home Economics',
        'Bachelor of Technology and Livelihood Education major in Industrial Arts',
        'Bachelor of Technical Vocational Teachers Education major in Animation',
        'Bachelor of Technical Vocational Teachers Education major in Beauty Care and Wellness',
        'Bachelor of Technical Vocational Teachers Education major in Computer Programming',
        'Bachelor of Technical Vocational Teachers Education major in Electrical',
        'Bachelor of Technical Vocational Teachers Education major in Electronics',
        'Bachelor of Technical Vocational Teachers Education major in Food Service Management',
        'Bachelor of Technical Vocational Teachers Education major in Fashion and Garment',
        'Bachelor of Technical Teacher Education'
      ],
        'For Graduate Programs:': [
          'Doctor of Education major in Industrial Education Management',
          'Doctor of Education major in Career Guidance',
          'Doctor of Technology',
          'Doctor of Philosophy major in Technology Management',
          'Master of Arts in Industrial Education major in Curriculum and Instruction',
          'Master of Arts in Industrial Education major in Educational Technology',
          'Master of Arts in Industrial Education major in Administration and Supervision',
          'Master of Arts in Industrial Education major in Guidance and Counseling',
          'Master of Arts in Teaching major in Technology and Home Economics'
        ]
    },
  },
  'COE Building': {
    img: '../assets/images/coe.jpg',
    desc: 'The College of Engineering develops engineers who apply scientific and mathematical principles to design and build systems, machines, and structures for industry.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Science in Civil Engineering',
        'Bachelor of Science in Electrical Engineering',
        'Bachelor of Science in Electronics Engineering',
        'Bachelor of Science in Mechanical Engineering',
      ],
      'For Graduate Programs:': [
        'Master of Engineering Program',
        'Master of Science in Civil Engineering major in General Civil Engineering',
        'Master of Science in Civil Engineering major in Geotechnical Engineering',
        'Master of Science in Civil Engineering major in Structural Engineering',
        'Master of Science in Electrical Engineering major in Power System Engineering',
        'Master of Science in Electrical Engineering major in Instrumentation and Control Engineering',
        'Master of Science in Electrical Engineering major in Electronics Engineering',
        'Master of Science in Electrical Engineering major in Communications Engineering',
        'Master of Science in Electrical Engineering',
        'Master of Science in Electrical Engineering major in Computer Engineering',
        'Master of Science in Mechanical Engineering major in Energy Engineering',
        'Master of Science in Mechanical Engineering major in Production Technology',
        'Masters of Engineering Program in Civil Engineering major in Structural Engineering Option',
        'Masters of Engineering Program in Civil Engineering major in Geotechnical Engineering Option',
        'Masters of Engineering Program in Civil Engineering major in General Civil Engineering Option',
        'Masters of Engineering Program in Electrical Engineering major in Power Engineering Option',
        'Masters of Engineering Program in Electrical Engineering major in Instrumentation and Computer Engineering Option',
        'Masters of Engineering Program in Electrical Engineering major in Electronics and Communications Engineering Option',
        'Masters of Engineering Program in Mechanical Engineering major in Refrigeration and Airconditioning Option',
        'Masters of Engineering Program in Mechanical Engineering major in Heat Power Option',
        'Masters of Engineering Program in Mechanical Engineering major in Manufacturing and Production Option'
      ]
    },
  },
  'CLA Building': {
    img: '../assets/images/cla.jpg',
    desc: 'The College of Liberal Arts provides foundational education in humanities, social sciences, and communication, developing well-rounded and critical-thinking graduates.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Arts in Management major in Industrial Management',
        'Bachelor of Science in Entrepreneurship Management', 
        'Bachelor of Science in Hospitality Management' 
      ],
      'For Graduate Programs:': [
        'Doctor of Management Science',
        'Master in Management',
      ]

    },
  },
  'Administration Building': {
    img: '../assets/images/administration.jpeg',
    desc: 'The Administration Building houses the central administrative offices of the university, including the offices of the President, Vice Presidents, and other key administrative departments that oversee the overall management and operations of the institution.',
    courses: {},
  },
  'IRTC Building': {
    img: '../assets/images/irtc.jpg',
    desc: 'The Instructional Resources and Technology Center supports teaching and learning through technology-enhanced resources, facilities, and instructional media services.',
    courses: {},
  },
  'Cashier Office': {
    img: '../assets/images/cashier.jpeg',
    desc: 'The Cashier\'s Office handles all financial transactions of the university, including payment of tuition fees, miscellaneous fees, and other university-related payments.',
    courses: {},
  },
  'Office of Admissions': {
    img: '../assets/images/admission.jpeg',
    desc: 'The Office of Admissions manages the admission processes for incoming students and coordinates enrollment procedures across all colleges of the university.',
    courses: {},
  },
  'Office of Student Affair': {
    img: '../assets/images/OSA.jpeg',
    desc: 'The Office of Student Affairs oversees student welfare, discipline, co-curricular activities, and student organizations to foster a healthy and engaging campus life.',
    courses: {},
  },
  'University Clinic': {
    img: '../assets/images/clinic.jpeg',
    desc: 'The University Clinic provides basic medical and health services to students, faculty, and staff, promoting a healthy university community.',
    courses: {},
  },
  'ROTC': {
    img: '../assets/images/rotc.jpeg',
    desc: 'The Reserve Officers\' Training Corps (ROTC) program provides military training and civic education to students as part of the National Service Training Program.',
    courses: {},
  },
  'Library': {
    img: '../assets/images/library.jpg',
    desc: 'The University Library provides access to a vast collection of academic materials, journals, and digital resources to support the research and learning needs of the TUP community.',
    courses: {},
  },
  'Registrar Office': {
    img: '../assets/images/Registrar.jpeg',
    desc: 'The Registrar\'s Office is responsible for maintaining all official academic records of students, processing requests for certifications, and managing enrollment and graduation procedures.',
    courses: {},
  },      
};

// ========================
// SHOW DETAIL CARD
// ========================
async function showDetail(name, isOrg = false, orgUid = null) {
  let data = directoryData[name];
  
  // If it's an org and not in static data, we can create a dummy object or fetch it
  if (isOrg && !data) {
    data = {
      img: '../assets/images/anon_avatar.jpg', // Default, will be updated if we have org data
      desc: 'Loading organization details...',
      courses: {}
    };
  }

  if (!data) return;

  const bannerImg  = document.getElementById('banner-img');
  const searchWrap = document.getElementById('banner-search-wrap');
  const carousel   = document.getElementById('carousel-track');
  const card       = document.getElementById('detail-card');
  const feedWrap   = document.getElementById('detail-card-feed');

  // 1. Swap banner image first
  if (bannerImg) {
    bannerImg.classList.add('fading');
    setTimeout(() => {
      bannerImg.src = data.img;
      bannerImg.classList.remove('fading');
    }, 200);
  }

  // Hide search bar
  if (searchWrap) searchWrap.style.display = 'none';

  // 2. Wait for banner to finish, THEN show detail card
  setTimeout(async () => {
    if (carousel) carousel.style.display = 'none';

    // Populate card
    document.getElementById('detail-card-title').textContent = name;
    document.getElementById('detail-card-desc').textContent  = data.desc;

    const coursesEl = document.getElementById('detail-card-courses');
    coursesEl.innerHTML = '';

    if (data.courses && Object.keys(data.courses).length > 0) {
      const sectionTitle = document.createElement('div');
      sectionTitle.className   = 'detail-card-section-title';
      sectionTitle.textContent = 'Offered Courses';
      coursesEl.appendChild(sectionTitle);

      for (const [heading, list] of Object.entries(data.courses)) {
        const sub = document.createElement('div');
        sub.className   = 'detail-card-subheading';
        sub.textContent = heading;
        coursesEl.appendChild(sub);

        const ul = document.createElement('ul');
        ul.className = 'detail-card-list';
        list.forEach(course => {
          const li = document.createElement('li');
          li.textContent = course;
          ul.appendChild(li);
        });
        coursesEl.appendChild(ul);
      }
    }

    // Handle Organization Feed
    if (isOrg && orgUid) {
      feedWrap.innerHTML = `
        <div class="detail-feed-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Latest Posts from ${name}
        </div>
        <div id="org-posts-container">Loading posts...</div>
      `;
      feedWrap.classList.add('active');
      loadOrgPosts(orgUid);
    } else {
      feedWrap.classList.remove('active');
      feedWrap.innerHTML = '';
    }

    // Show card after banner has settled
    if (card) {
      card.style.display = 'block';
      card.classList.add('active');
    }
  }, 200);
}

// ========================
// HIDE DETAIL CARD (reset)
// ========================
function hideDetail() {
  const carousel = document.getElementById('carousel-track');
  const card     = document.getElementById('detail-card');
  const bannerImg = document.getElementById('banner-img');
  const searchWrap = document.getElementById('banner-search-wrap');
  const feedWrap   = document.getElementById('detail-card-feed');

  if (card) {
    card.classList.remove('active');
    card.style.display = 'none';
  }
  if (carousel) carousel.style.display = '';
  if (searchWrap)  searchWrap.style.display = '';
  if (feedWrap) {
    feedWrap.classList.remove('active');
    feedWrap.innerHTML = '';
  }

  // Restore default banner image
  if (bannerImg) {
    bannerImg.classList.add('fading');
    setTimeout(() => {
      bannerImg.src = '../assets/images/TUP_bg.png';
      bannerImg.classList.remove('fading');
    },200);
  }
}

// ========================
// DOM READY
// ========================
document.addEventListener('DOMContentLoaded', () => {

  // Load Organizations
  loadOrganizations();

  // ========================
  // SEARCH BAR
  // ========================
  const searchInput = document.querySelector('.banner-search-input');
  const searchOuter = document.querySelector('.banner-search-bar');

  const suggestions = [
    'COS Building', 'CAFA Building', 'CIT Building',
    'CIE Building', 'COE Building', 'CLA Building',
    'Office of Admissions', 'Cashier Office',
    'Office of Student Affair', 'University Clinic',
    'ROTC', 'Library', 'Registrar Office',
    'Student Affairs Office', 'Finance Office',
  ];

  let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

  const dropdown = document.createElement('div');
  dropdown.classList.add('search-dropdown');
  document.body.appendChild(dropdown);

  function positionDropdown() {
    const rect = searchOuter.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top      = (rect.bottom + 8) + 'px';
    dropdown.style.left     = rect.left + 'px';
    dropdown.style.width    = rect.width + 'px';
  }

  function saveRecent(term) {
    if (!term) return;
    recentSearches = [term, ...recentSearches.filter(r => r !== term)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }

  function renderDropdown(items, isRecent = false) {
    dropdown.innerHTML = '';
    if (items.length === 0) { dropdown.style.display = 'none'; return; }

    if (isRecent) {
      const label = document.createElement('div');
      label.classList.add('search-dropdown-label');
      label.textContent = 'Recent';
      dropdown.appendChild(label);
    }

    items.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('search-dropdown-item');
      div.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-dropdown-icon">
          ${isRecent
            ? '<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>'
            : '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'}
        </svg>
        <span>${item}</span>
      `;
      div.addEventListener('click', () => {
        searchInput.value = item;
        saveRecent(item);
        dropdown.style.display = 'none';
        showDetail(item); // ← triggers banner swap + card
      });
      dropdown.appendChild(div);
    });

    dropdown.style.display = 'block';
  }

  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      positionDropdown();
      renderDropdown(recentSearches, true);

      const backBtn = document.querySelector('.banner-search-back-btn');
      if (backBtn) backBtn.style.display = 'block'; 
    });

    searchInput.addEventListener('input', () => {
      positionDropdown();
      const query = searchInput.value.toLowerCase().trim();
      if (query === '') {
        renderDropdown(recentSearches, true);
        const backBtn = document.querySelector('.banner-search-back-btn');
        if (backBtn) backBtn.style.display = 'block';
        return;
      }
      const filtered = suggestions.filter(s => s.toLowerCase().startsWith(query));
      renderDropdown(filtered, false);

      const backBtn = document.querySelector('.banner-search-back-btn');
      if (backBtn) backBtn.style.display = query !== '' ? 'block' : 'none';
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        saveRecent(val);
        dropdown.style.display = 'none';
        showDetail(val);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (searchOuter && !searchOuter.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  window.addEventListener('scroll', positionDropdown);
  window.addEventListener('resize', positionDropdown);

  // ========================
  // BACK BUTTON IN SEARCH BAR
  // ========================
  const backBtn = document.querySelector('.banner-search-back-btn');
  if (backBtn) {
    backBtn.style.display = 'none';

    backBtn.addEventListener('click', function () {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      this.style.display = 'none';
      searchInput.blur();
      dropdown.style.display = 'none';
    });
  }

  // ========================
  // DETAIL CLOSE BUTTON
  // ========================
  const detailCloseBtn = document.getElementById('detail-close-btn');
  if (detailCloseBtn) {
    detailCloseBtn.addEventListener('click', () => {
      hideDetail();
    });
  }

  // ========================
  // DIRECTORY PANEL — click to show detail
  // ========================
  document.querySelectorAll('.directory-item').forEach(item => {
    item.addEventListener('click', () => {
      showDetail(item.textContent.trim());
    });
  });

  // ========================
  // CAROUSEL IMAGES — click to show detail
  // ========================
  document.querySelectorAll('.carousel-img').forEach(img => {
    img.style.pointerEvents = 'all'; // override the CSS none
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      const name = img.getAttribute('data-name');
      if (name) showDetail(name);
    });
  });

  // ========================
  // DIRECTORY PANEL — per-card scroll
  // ========================
  document.querySelectorAll('.directory-list').forEach(list => {
    list.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      list.scrollBy({ top: e.deltaY, behavior: 'smooth' });
    }, { passive: false });
  });

  // ========================
  // CAROUSEL ARROWS
  // ========================
  const carouselImages = document.querySelector('.carousel-images');
  const leftArrow      = document.querySelector('.carousel-arrow.left');
  const rightArrow     = document.querySelector('.carousel-arrow.right');
  const scrollAmount   = 300;

  if (leftArrow && rightArrow && carouselImages) {
    leftArrow.addEventListener('click',  () => carouselImages.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    rightArrow.addEventListener('click', () => carouselImages.scrollBy({ left:  scrollAmount, behavior: 'smooth' }));
  }

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

  // ========================
  // ORGANIZATION LOGIC
  // ========================
  async function loadOrganizations() {
    const orgList = document.getElementById('org-list');
    if (!orgList) return;

    try {
      const q = query(collection(db, "users"), where("role", "==", "organization"));
      const querySnapshot = await getDocs(q);
      
      orgList.innerHTML = '';
      
      if (querySnapshot.empty) {
        orgList.innerHTML = '<li class="directory-item">No organizations found</li>';
        return;
      }

      querySnapshot.forEach((docSnap) => {
        const orgData = docSnap.data();
        const li = document.createElement('li');
        li.className = 'directory-item';
        li.innerHTML = `
          <svg class="directory-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          ${orgData.fullName || "Unnamed Org"}
        `;
        li.addEventListener('click', () => {
          // Temporarily add to directoryData if not exists to allow showDetail to work
          if (!directoryData[orgData.fullName]) {
            directoryData[orgData.fullName] = {
              img: orgData.coverURL || '../assets/images/TUP_bg.png',
              desc: orgData.description || `${orgData.fullName} is a student organization at TUP.`,
              courses: {} // Or maybe list their college affiliation here
            };
          }
          showDetail(orgData.fullName, true, docSnap.id);
        });
        orgList.appendChild(li);
      });
    } catch (error) {
      console.error("Error loading organizations:", error);
      orgList.innerHTML = '<li class="directory-item danger">Failed to load organizations</li>';
    }
  }

  async function loadOrgPosts(orgUid) {
    const container = document.getElementById('org-posts-container');
    if (!container) return;

    try {
      const q = query(collection(db, "posts"), where("userId", "==", orgUid), orderBy("createdAt", "desc"), limit(5));
      const querySnapshot = await getDocs(q);
      
      container.innerHTML = '';
      
      if (querySnapshot.empty) {
        container.innerHTML = '<div class="no-posts">No recent posts from this organization.</div>';
        return;
      }

      querySnapshot.forEach((docSnap) => {
        const post = docSnap.data();
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        
        const dateStr = post.createdAt ? post.createdAt.toDate().toLocaleDateString() : 'Just now';

        postCard.innerHTML = `
          <div class="post-header">
            <div class="post-avatar">
              <img src="${post.photoURL || '../assets/images/anon_avatar.jpg'}" alt="Avatar">
            </div>
            <div class="post-meta">
              <div class="post-author">${post.author}</div>
              <div class="post-time">${dateStr}</div>
            </div>
          </div>
          <div class="post-body">${post.text || ''}</div>
          ${post.imageURL ? `<img src="${post.imageURL}" class="post-image">` : ''}
        `;
        container.appendChild(postCard);
      });
    } catch (error) {
      console.error("Error loading org posts:", error);
      container.innerHTML = '<div class="error-msg">Failed to load posts.</div>';
    }
  }

});