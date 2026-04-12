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

let USER = {
  name: "Loading...",
  email: "",
  studentId: "",
  photoSrc: null,
  logoSrc:   "../assets/images/logo.png",
};

let POST = null;
let FEED_POSTS = [];

(function () {

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */

  /** Format large numbers: 1200 → "1.2k" */
  function fmt(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : n;
  }

  /** Build avatar HTML for a given photoSrc and name */
  function avatarHtmlFor(photoSrc, name) {
    return photoSrc
      ? `<img src="${photoSrc}" alt="${name}"/>`
      : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }

  /* ════════════════════════════════════════
     TOAST
  ════════════════════════════════════════ */

  let toastTimer = null;

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  /* ════════════════════════════════════════
     LOGO
  ════════════════════════════════════════ */

  if (USER.logoSrc) {
    document.getElementById('sidebar-logo-inner').outerHTML =
      `<img class="TUP-Konek-logo" src="${USER.logoSrc}" alt="TUP Konek logo"/>`;
  }

  /* ════════════════════════════════════════
     USER DATA
  ════════════════════════════════════════ */

  document.getElementById('profile-name').textContent    = USER.name      || '—';
  document.getElementById('profile-email').textContent   = USER.email     || '—';
  document.getElementById('profile-id').textContent      = USER.studentId || '—';
  document.getElementById('modal-user-name').textContent = USER.name      || 'Guest';

  if (USER.photoSrc) {
    document.getElementById('profile-photo-wrap').innerHTML =
      `<img class="profile-photo" src="${USER.photoSrc}" alt="Profile photo"/>`;

    const navProfileAvatar = document.getElementById('nav-profile-avatar');
    if (navProfileAvatar) {
      navProfileAvatar.innerHTML =
        `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }

    const el = document.getElementById('comment-avatar-wrap');
    el.innerHTML = `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;

    document.getElementById('modal-avatar').innerHTML =
      `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }

  /* ════════════════════════════════════════
     PINNED ANNOUNCEMENT
  ════════════════════════════════════════ */

  if (POST) {
    document.getElementById('count-likes').textContent    = fmt(POST.likes);
    document.getElementById('count-thumbsup').textContent = fmt(POST.thumbsUp);
    document.getElementById('count-reposts').textContent  = fmt(POST.reposts);
    document.getElementById('post-timestamp').textContent = POST.timestamp;
    document.getElementById('post-title').textContent     = POST.title;
    document.getElementById('post-body').innerHTML        = POST.body.map(p => `<p>${p}</p>`).join('');
    document.getElementById('poster-org').textContent      = POST.posterOrg;
    document.getElementById('poster-headline').textContent = POST.posterHeadline;
    document.getElementById('poster-subtext').textContent  = POST.posterSubtext;
    document.getElementById('poster-date').textContent     = POST.posterDate;
    document.getElementById('poster-desc').textContent     = POST.posterDesc;
    document.getElementById('poster-handle').textContent   = POST.posterHandle + ' ✉';
    document.getElementById('poster-colleges').innerHTML   =
      POST.posterColleges.map(c => `<div class="p-college">${c}</div>`).join('');
  } else {
    const annCard = document.getElementById('ann-card');
    if (annCard) {
      annCard.innerHTML = `
        <div class="pinned-empty">
          <svg viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/></svg>
          <div class="pinned-empty-text">No announcements yet</div>
        </div>`;
    }
  }

  /* ── View More / Less for pinned announcement ── */
  if (POST) {
    (function () {
      const body = document.getElementById('post-body');
      const btn  = document.getElementById('view-more-btn');
      let expanded = false;
      body.classList.add('is-clamped');
      requestAnimationFrame(() => {
        if (body.scrollHeight > body.clientHeight) {
          btn.classList.add('visible');
        } else {
          body.classList.remove('is-clamped');
        }
      });
      btn.addEventListener('click', function () {
        expanded = !expanded;
        body.classList.toggle('is-clamped', !expanded);
        btn.textContent = expanded ? 'View less ▴' : 'View more ▾';
      });
    })();

    /* ── Media / image grid ── */
    const mediaGridEl2 = document.getElementById('media-grid');
    const imgs = POST.images || [];
    if (imgs.length > 0) {
      document.getElementById('poster-card-inner').style.display = 'none';
      const shown    = Math.min(imgs.length, 4);
      const extra    = imgs.length - shown;
      const countCls = imgs.length === 1 ? 'count-1'
                     : imgs.length === 2 ? 'count-2'
                     : imgs.length === 3 ? 'count-3'
                     : 'count-4';
      const cells = imgs.slice(0, shown).map((src, i) => {
        const isLast = i === shown - 1 && extra > 0;
        return `<div class="gi"><img src="${src}" alt="post image"/>${isLast ? `<div class="gi-more">+${extra + 1}</div>` : ''}</div>`;
      }).join('');
      const grid = document.createElement('div');
      grid.className = `img-grid ${countCls}`;
      grid.innerHTML = cells;
      mediaGridEl2.insertBefore(grid, mediaGridEl2.querySelector('.poster-hint').nextSibling);
    }
  }

  /* ════════════════════════════════════════
     FEED POSTS
  ════════════════════════════════════════ */

function renderFeedPosts() {
  const posts = window.FEED_POSTS || [];
  const feed = document.getElementById('feed-posts');
  if (!feed) return;

  if (posts.length === 0) {
    feed.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="empty-state-title">No posts yet</div>
          <div class="empty-state-sub">Be the first one to share something with your fellow TUPians!</div>
        </div>`;
    return;
  }

  feed.innerHTML = posts.map((fp, idx) => {
    const avatarHtml = fp.photoSrc ?
      `<img class="feed-avatar" src="${fp.photoSrc}" alt="${fp.name}"/>` :
      `<div class="feed-avatar-ph"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

    // Safety: Header / Repost logic
    const headerMeta = fp.repost ?
      `<div class="feed-meta">
            <div class="feed-name">
              <svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle;margin-right:3px;"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              ${fp.name} <span style="font-weight:600;color:var(--muted);">reposted</span>
            </div>
            <div class="feed-time">${fp.time}</div>
           </div>` :
      `<div class="feed-meta">
            <div class="feed-name">${fp.name}</div>
            <div class="feed-time">${fp.time}</div>
           </div>`;

    // Safety Check for Quote
    const quoteHtml = (fp.quote && fp.quote.body) ? `
        <div class="feed-quote">
          <div class="feed-quote-header">
            ${fp.quote.photoSrc ? `<div class="feed-quote-avatar"><img src="${fp.quote.photoSrc}"/></div>` : `<div class="feed-quote-avatar"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`}
            <span class="feed-quote-name">${fp.quote.name}</span>
          </div>
          <div class="feed-quote-body">${fp.quote.body.replace(/\n/g, '<br>')}</div>
        </div>` : '';

    const imageTag = fp.postImage 
    ? `<img src="${fp.postImage}" class="feed-post-img" style="width:100%; border-radius:8px; margin-top:10px; display:block;">` 
    : '';

    const bodyHtml = fp.body ? `
    <div class="feed-body" id="feed-body-${idx}">${fp.body}</div>
    ${imageTag} <button class="feed-view-more" id="feed-vm-${idx}">View more ▾</button>` : (imageTag ? imageTag : '');

    // Safety Check for Comments
    const firstComment = (fp.commentList && fp.commentList.length > 0) ? fp.commentList[0] : null;
    const commentPreviewHtml = (fp.comments > 0 && firstComment) ? `
        <div class="feed-comments-section">
          <button class="feed-view-comments" data-post="${idx}">View all ${fp.comments} comments</button>
          <div class="feed-comment-preview">
            <div class="feed-comment-avatar">
              ${firstComment.photoSrc ? `<img src="${firstComment.photoSrc}"/>` : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
            </div>
            <div class="feed-comment-bubble">
              <div class="feed-comment-name">${firstComment.name}</div>
              <div class="feed-comment-text">${firstComment.text}</div>
            </div>
          </div>
        </div>` : '';

    return `
      <div class="feed-post">
        <div class="feed-post-header">
          ${avatarHtml}
          ${headerMeta}
          <button class="post-menu-btn" data-post="${idx}">
            <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
          </button>
          <div class="post-menu-dropdown" id="post-menu-${idx}">
            <button class="post-menu-item" data-post="${idx}" data-action="report">Report Post</button>
          </div>
        </div>
        ${bodyHtml}
        ${quoteHtml}
        <div class="feed-reactions">
          <button class="feed-reaction-btn ${fp.isLikedByMe ? 'heart-active' : ''}" data-id="${fp.id}" data-type="like">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="likes-count">${fp.likes || 0}</span> Heart
          </button>
          <button class="feed-reaction-btn" data-id="${fp.id}" data-type="comment" data-post="${idx}">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="comments-count">${fmt(fp.comments)}</span> Comments
          </button>
          <button class="feed-reaction-btn ${fp.isRepostedByMe ? 'repost-active' : ''}" data-id="${fp.id}" data-type="repost">
            <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <span class="reposts-count">${fp.reposts || 0}</span> Repost
          </button>
        </div>
        ${commentPreviewHtml}
      </div>`;
  }).join('');

  posts.forEach((fp, idx) => {
    if (!fp.body) return;
    const bodyEl = document.getElementById(`feed-body-${idx}`);
    const vmBtn = document.getElementById(`feed-vm-${idx}`);
    if (!bodyEl || !vmBtn) return;
    bodyEl.classList.add('is-clamped');
    if (bodyEl.scrollHeight > bodyEl.clientHeight) {
      vmBtn.classList.add('visible');
    }
    vmBtn.onclick = () => {
      const isExpanded = bodyEl.classList.toggle('is-clamped');
      vmBtn.textContent = isExpanded ? 'View more ▾' : 'View less ▴';
    };
  });
}

window.renderFeedPosts = renderFeedPosts;

  /* ════════════════════════════════════════
     LIGHTBOX
  ════════════════════════════════════════ */

  const lightbox    = document.getElementById('lightbox');
  const lbImg       = document.getElementById('lightbox-img');
  const openLB      = src => { lbImg.src = src; lightbox.classList.add('open'); };
  const closeLB     = ()  => { lightbox.classList.remove('open'); lbImg.src = ''; };
  const mediaGridEl = document.getElementById('media-grid');

  if (mediaGridEl) {
    mediaGridEl.addEventListener('click', () => {
      if (POST && POST.images && POST.images.length > 0) openLB(POST.images[0]);
    });
  }
  document.getElementById('lightbox-close').addEventListener('click', closeLB);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLB(); });

  /* ════════════════════════════════════════
     COMMENT MODAL
  ════════════════════════════════════════ */

  const commentOverlay = document.getElementById('comment-modal-overlay');
  const commentList    = document.getElementById('comment-list');

  window.renderComments = function(postIdx) {
    const fp = window.FEED_POSTS ? window.FEED_POSTS[postIdx] : null;
    const listElement = document.getElementById('comment-list'); 
    if (!fp || !listElement) return;

    listElement.innerHTML = (fp.commentList || []).map((c, cIdx) => {
    if(cIdx === 0) console.log("First comment data:", c);

    let rawPhoto = c.photoURL;
   
    if (c.isOwn && (rawPhoto === 'anon' || !rawPhoto)) {
            rawPhoto = window.cachedPhoto;
      }

    const validPhoto = (rawPhoto && rawPhoto !== 'anon') ? rawPhoto : null;
    const avatarHtml = window.getAvatar(validPhoto, c.author);
    

        return `
        <div class="comment-item" id="comment-item-${postIdx}-${cIdx}">
            <div class="comment-item-avatar">${avatarHtml}</div>
            <div class="comment-item-content">
                <div class="comment-item-bubble" id="comment-bubble-${postIdx}-${cIdx}">
                    <div class="comment-item-name">${c.author || "Anonymous User"}</div>
                    <div class="comment-item-text" id="comment-text-${postIdx}-${cIdx}">${c.text}</div>
                </div>
                <div class="comment-edit-wrap" id="comment-edit-${postIdx}-${cIdx}">
                    <input class="comment-edit-input" id="comment-edit-input-${postIdx}-${cIdx}" value="${c.text}"/>
                    <button class="comment-edit-save" data-post="${postIdx}" data-comment="${cIdx}">
                        <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                    <button class="comment-edit-cancel" data-post="${postIdx}" data-comment="${cIdx}">✕</button>
                </div>
                <div class="comment-item-time">${c.time || ''}</div>
                ${c.isOwn ? `
                <div class="comment-item-actions">
                    <button class="comment-action-btn edit-btn" data-post="${postIdx}" data-comment="${cIdx}">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                    </button>
                    <button class="comment-action-btn delete-btn" data-post="${postIdx}" data-comment="${cIdx}">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        Delete
                    </button>
                </div>` : ''}
            </div>
        </div>`;
    }).join('');

    attachCommentListeners(listElement);
};

  function attachCommentListeners(listElement) {
    if (!listElement || listElement._commentListenersAttached) return;
    listElement._commentListenersAttached = true;

    listElement.addEventListener('click', async function(e) {
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const pIdx = deleteBtn.dataset.post;
        const cIdx = deleteBtn.dataset.comment;
        const post = window.FEED_POSTS[pIdx];
        const comment = post.commentList[cIdx];

        if (confirm("Delete this comment?")) {
          try {
            await window.deleteComment(post.id, comment.id);
            showToast("Deleted!");
          } catch (err) {
            console.error(err);
          }
        }
        return;
      }

      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) {
        const pIdx = editBtn.dataset.post;
        const cIdx = editBtn.dataset.comment;
        const bubble = document.getElementById(`comment-bubble-${pIdx}-${cIdx}`);
        const editWrap = document.getElementById(`comment-edit-${pIdx}-${cIdx}`);
        if (bubble) bubble.style.display = 'none';
        if (editWrap) editWrap.style.display = 'flex';
        return;
      }

      const cancelBtn = e.target.closest('.comment-edit-cancel');
      if (cancelBtn) {
        const p = cancelBtn.dataset.post;
        const c = cancelBtn.dataset.comment;
        const bubble = document.getElementById(`comment-bubble-${p}-${c}`);
        const editWrap = document.getElementById(`comment-edit-${p}-${c}`);
        if (bubble) bubble.style.display = '';
        if (editWrap) editWrap.classList.remove('open');
        return;
      }

      const saveBtn = e.target.closest('.comment-edit-save');
      if (saveBtn) {
        const pIdx = saveBtn.dataset.post;
        const cIdx = saveBtn.dataset.comment;
        const post = window.FEED_POSTS[pIdx];
        const commentData = post.commentList[cIdx];
        const commentId = commentData.id;
        const input = document.getElementById(`comment-edit-input-${pIdx}-${cIdx}`);
        if (!input) return;
        const newText = input.value.trim();
        if (!newText) return;

        const textEl = document.getElementById(`comment-text-${pIdx}-${cIdx}`);
        const bubble = document.getElementById(`comment-bubble-${pIdx}-${cIdx}`);
        const editWrap = document.getElementById(`comment-edit-${pIdx}-${cIdx}`);
        if (textEl) textEl.textContent = newText;
        if (bubble) bubble.style.display = '';
        if (editWrap) editWrap.classList.remove('open');

        try {
          await saveCommentEdit(post.id, commentId, newText);
          showToast('Comment updated.');
        } catch (err) {
          console.error('Failed to save edit:', err);
          showToast('Error updating comment.');
        }
      }
    });
  }

  function openCommentModal(postIdx) {
    const overlay = document.getElementById('comment-modal-overlay');
    const inputAvatar = document.getElementById('comment-input-avatar'); 
    const inputField = document.getElementById('comment-input-field');

    const currentUser = window.auth ? window.auth.currentUser : null;

    if (inputAvatar && currentUser) {
        inputAvatar.innerHTML = window.avatarHtmlFor(currentUser.photoURL, currentUser.displayName);
    }

    if (overlay) {
        overlay.dataset.post = postIdx;
        overlay.classList.add('open');

        if (window.renderComments) {
            window.renderComments(postIdx);
        }

        if (inputField) {
            setTimeout(() => inputField.focus(), 150);
        }
    }
  }

  function closeCommentModal() { 
    const overlay = document.getElementById('comment-modal-overlay');
    const inputField = document.getElementById('comment-input-field');
    if (overlay) overlay.classList.remove('open');

    if (inputField) inputField.value = '';
  }

  document.getElementById('comment-modal-close').addEventListener('click', closeCommentModal);
  commentOverlay.addEventListener('click', e => { if (e.target === commentOverlay) closeCommentModal(); });
  window.openCommentModal = openCommentModal;


  /* ════════════════════════════════════════
     CREATE POST MODAL
  ════════════════════════════════════════ */

  const overlay    = document.getElementById('create-post-overlay');
  const textarea   = document.getElementById('post-textarea');
  const submitBtn  = document.getElementById('modal-submit-btn');
  const attachWrap = document.getElementById('modal-attachments');
  const fileInput  = document.getElementById('modal-file-input');
  const anonToggle = document.getElementById('modal-anon-toggle');

  function openModal()  { overlay.classList.add('open'); setTimeout(() => textarea.focus(), 100); }
  function closeModal() { 
    if (overlay) overlay.classList.remove('open'); 

    if (typeof window.resetPostModal === 'function') {
        window.resetPostModal();
    } else {
        console.warn("resetPostModal function not found!");
    }
  }

  document.getElementById('open-create-post').addEventListener('click', openModal);

  document.getElementById('btn-add-photo').addEventListener('click', e => {
    e.stopPropagation();
    openModal();
    setTimeout(() => fileInput.click(), 150);
  });

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  textarea.addEventListener('input', function () {
    submitBtn.disabled = this.value.trim().length === 0;
  });

  anonToggle.addEventListener('change', function () {
    const nameEl   = document.getElementById('modal-user-name');
    const avatarEl = document.getElementById('modal-avatar');
    if (this.checked) {
      nameEl.textContent = 'Anonymous Puto';
      avatarEl.innerHTML = `<img src="../assets/images/anon_avatar.jpg" alt="Anonymous" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      nameEl.textContent = USER.name;
      avatarEl.innerHTML = USER.photoSrc
        ? `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    }
  });

  document.getElementById('modal-photo-btn').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', function () {
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const thumb     = document.createElement('img');
        thumb.src       = e.target.result;
        thumb.className = 'modal-attach-thumb';
        thumb.title     = 'Click to remove';
        thumb.addEventListener('click', () => thumb.remove());
        attachWrap.appendChild(thumb);
      };
      reader.readAsDataURL(file);
    });
  });

  /* ════════════════════════════════════════
     QUICK ACTION BUTTONS
  ════════════════════════════════════════ */

  // BACKEND TEAM: wire these
  document.getElementById('btn-settings').addEventListener('click', () => { console.log('Settings'); });
  document.getElementById('btn-likes')?.addEventListener('click',    () => {});
  document.getElementById('btn-thumbsup')?.addEventListener('click', () => {});
  document.getElementById('btn-reposts')?.addEventListener('click',  () => {});

  /* ════════════════════════════════════════
     KEYBOARD SHORTCUTS
  ════════════════════════════════════════ */

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLB(); closeModal(); closeCommentModal(); }
  });

  /* ════════════════════════════════════════
     SIDEBAR NAV — smooth sliding teardrop
  ════════════════════════════════════════ */

  (function () {
    const navWrap  = document.getElementById('sidebar-nav');
    const teardrop = document.getElementById('nav-teardrop');
    const navBtns  = Array.from(navWrap.querySelectorAll('.nav-btn'));
    const profBtn  = document.getElementById('sidebar-avatar-wrap');
    const allBtns  = [...navBtns, profBtn];
    const TD_BASE_H = 66;

    function moveTo(item) {
      const wrapRect = navWrap.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const centerY  = itemRect.top + itemRect.height / 2 - wrapRect.top;
      teardrop.style.top = (centerY - TD_BASE_H / 2) + 'px';
    }

    navBtns.forEach(item => {
      item.addEventListener('click', function () {
        allBtns.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        moveTo(this);
        console.log('Navigate to:', this.dataset.route);
      });
    });

    profBtn.addEventListener('click', function () {
      allBtns.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      moveTo(this);
      console.log('Navigate to: profile');
    });

    /* Snap to active button on load (no transition) */
    const active = navWrap.querySelector('.nav-btn.active');
    if (active) {
      teardrop.style.transition = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        moveTo(active);
        teardrop.style.transition = '';
      }));
    }
  })();

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

})();

window.renderFeedPosts = renderFeedPosts;
window.FEED_POSTS = FEED_POSTS;