# University AIGC Prompt Coursework & Assessment Management Platform

An integrated academic coursework and evaluation platform designed for university digital art and AIGC design courses. It enables students to scan-to-login, complete structured prompt engineering iterations (6 classroom assignments + 1 final exam) with 9-image comparative grids, and export comprehensive PDF portfolios, while providing teachers with custom template authoring, multi-dimensional rubric grading, weighted grade aggregation, and class learning analytics dashboards.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Please review the core workflow configurations and architectural choices below:

- **Prompt Iteration & 9-Image Grids**: Each assignment requires $\ge 3$ distinct prompt evolution rounds. In each round, the student documents their conceptual intent, prompt modifications, negative prompts, and inspects a $3\times3$ (9 images) generation array with high-resolution lightbox inspection and selection.
- **Custom Assignment Template Builder (Confirmed New Feature)**: Teachers can create, preview, edit, and save reusable assignment templates specifying concept descriptions, minimum prompt rounds (default 3), image requirement specifications (9-grid resolution, aspect ratio, style guides), rubric score allocations, and submission deadlines. New classroom or exam assignments can be spawned directly from these templates.
- **Role Switching & Student QR Login**: Provides both a realistic simulated QR-code mobile/desktop student login portal (with Student ID, Full Name, Class) and a secure Teacher Management Console with one-click role switching for testing and grading demonstrations.
- **Grading & Academic Weighing**: Default weighting is 60% classroom assignments (10% each across 6 assignments) + 40% final exam assignment, with automatic score calculation, letter grade conversion, and exportable gradebooks.
- **Comprehensive PDF Portfolio**: Client-side high-fidelity PDF report generation documenting student credentials, assignment objectives, prompt iteration lineage (Round 1 $\to$ Round 2 $\to$ Round 3+), 9-image grids with highlighted hero selections, reflection essays, and teacher rubric marks.

---

### 1. Overview & Core Concept

- **What It Does**: Bridges hands-on generative AI practice and formal university curriculum assessment. Students log in via simulated student ID or QR scan, explore assignment concepts, iteratively refine prompts across multiple rounds, evaluate 9-grid AI visual outputs, reflect on prompt changes, and compile an archival PDF. Instructors manage assignments through custom reusable templates, review full prompt evolution histories, grade against academic rubrics, and analyze class performance on an interactive visual dashboard.
- **Target Audience**: University students taking Generative AI, Digital Media Art, Industrial Design, or Creative Computing courses, along with course instructors and teaching assistants.
- **Key Value**: Replaces chaotic screenshot submissions with a standardized, auditable academic process that measures *prompt engineering evolution and conceptual thinking* rather than just a single prompt.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Student Onboarding & Verification**:
   - Welcome view with Course Title, Semester info, and dual login: Simulated QR Code Scan or Direct ID entry (Student ID, Name, Class/Major).
   - Student Dashboard displaying timeline of 6 Classroom Assignments (`#01` to `#06`) and 1 Final Capstone Exam, showing status (Not Started, In Progress, Submitted, Graded).
2. **Assignment Workspace (The 3-Round Iteration Engine)**:
   - **Header & Concept Deck**: Academic briefing, concept theory, artistic goals, rubric criteria, and deadline countdown.
   - **Iterative Rounds Timeline (`Round 1` $\to$ `Round 2` $\to$ `Round 3`+)**:
     - *Prompt Formulation*: Concept goal, positive prompt, negative prompt, model parameters (aspect ratio, artistic style, guidance).
     - *9-Image Grid*: $3\times 3$ thumbnail layout with high-resolution modal inspection, selection badges, and diff comparison.
     - *Evolution & Reflection Note*: "What changed from the previous round and why?"
   - **Final Submission & PDF Synthesis**: Checks that at least 3 rounds are completed before allowing final submission. Generates a multi-page PDF summary report with cover metadata, prompts, image grids, and student reflection.
3. **Teacher Management & Template Studio**:
   - **Class Analytics Dashboard**: Completion funnel, average scores per assignment, prompt iteration depth distribution, and class-wide grade distribution histogram.
   - **Custom Assignment Template Studio**: Create, edit, and duplicate reusable templates with fields for Concept Explanation, Required Prompt Rounds, Image Grid Guidelines, Rubric Criteria weights, and Default Deadlines.
   - **Student Grading Console**: Side-by-side submission viewer inspecting student prompt evolution, 9-grid image matrices, student reflections, rubric scoring sliders (Concept, Prompt Craft, Visual Coherence, Reflection), and teacher feedback.
   - **Gradebook & Export**: Aggregated final scores (6 classroom + 1 final exam), ranking, grade curve, and CSV/Excel export.

#### Visual Identity & Design System
- **Theme & Direction**: Modern Academic Studio — scholarly, refined, and utilitarian without generic AI slop. 
- **Palette (60-30-10 discipline)**:
  - *Dominant Canvas (60%)*: Crisp background (`#F8FAFC` light / `#0B0F19` dark mode ready) with subtle structural grid.
  - *Structural Surfaces (30%)*: Deep slate headers (`#0F172A`), clean cards with hairline borders (`border-slate-200 / border-slate-800`), and unboxed text metadata with typographic bullets (`·`).
  - *Focal Accents (10%)*: Academic Royal Indigo (`#3B82F6` / `#2563EB`) and Emerald (`#059669`) for positive status indicators.
- **Typography**: Clean display headings with `Plus Jakarta Sans` / `Inter`, crisp numerical tables with tabular numbers, and monospace font for prompt tokens.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Custom Template Studio vs Fixed Assignment Hardcoding**
  - *Chosen Approach*: Implement a full Template Engine storing custom assignment templates in persistent state. Teachers can instantiate assignments from templates or customize existing assignments on the fly.
  - *Why*: Accommodates syllabus changes across different academic semesters and courses while satisfying the user's explicit request.
- **Decision 2: 9-Image Generation Mechanism**
  - *Chosen Approach*: Dual-mode image generation engine. Integrates Gemini API for prompt expansion and live generation, backed by a domain-curated 9-image visual asset pool corresponding to design styles (Photorealism, Cyberpunk, Watercolor, Surrealism, Bauhaus, Minimalist 3D) so students always receive 9 consistent, high-fidelity images even without API keys or under rate limits.
  - *Why*: Guarantees zero broken images and reliable classroom testing without network fragility.
- **Decision 3: Client-Side Robust PDF Generation**
  - *Chosen Approach*: Printable structured HTML-to-PDF / window print layout engine and programmatic PDF canvas synthesis.
  - *Why*: Completely self-contained, high resolution, renders 9-image grids cleanly without clipping or CORS issues.
- **Decision 4: State Persistence & Seeded Data**
  - *Chosen Approach*: Centralized `localStorage` repository with realistic sample data pre-seeded (3 student submissions across different stages, complete 6+1 assignments, 3 pre-built teacher templates).
  - *Why*: Allows immediate, rich evaluation by teachers and testers out of the box without manual preliminary data entry.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Application Shell                             │
│  ┌───────────────────────┬───────────────────────┬──────────────────┐  │
│  │   Top Bar Contract    │  Student / Teacher    │ Demo Quick-Fill  │  │
│  │  (Wordmark + Nav)     │     Role Switcher     │ & Preset Loader  │  │
│  └───────────────────────┴───────────────────────┴──────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────────────────┐             ┌────────────────────────────────┐
│      Student Experience       │             │       Teacher Experience       │
├───────────────────────────────┤             ├────────────────────────────────┤
│ • QR / ID Login & Verification│             │ • Visual Analytics Dashboard   │
│ • 6+1 Assignment Board        │             │ • Template Builder Studio      │
│ • Multi-Round Prompt Studio   │             │ • Assignment Roster & Review   │
│ • 9-Image Grid & Lightbox     │             │ • Rubric Grading & Feedback    │
│ • PDF Summary Report Export   │             │ • Weighted Gradebook & Export  │
└───────────────┬───────────────┘             └────────────────┬───────────────┘
                │                                              │
                └───────────────────────┬──────────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   CourseState Manager (Storage & Logic)                │
│  ┌─────────────────────┬─────────────────────┬──────────────────────┐  │
│  │  Student Profiles   │  Assignments & 6+1  │  Templates & Rubrics │  │
│  │  (ID, Name, Major)  │  Prompts / 9-Grids  │  Grading & Weights   │  │
│  └─────────────────────┴─────────────────────┴──────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key Data Models
- `AssignmentTemplate`: `id`, `title`, `courseType`, `conceptBrief`, `requiredRounds` ($\ge 3$), `imageCountPerRound` (9), `aspectRatio`, `rubricCriteria` (array of name, weight, maxScore), `deadlineDays`.
- `Assignment`: `id`, `templateId`, `assignmentNumber` (1–6 for classroom, 7 for final exam), `title`, `isFinalExam`, `conceptOverview`, `deadline`, `status`.
- `PromptRound`: `roundNumber` (1, 2, 3+), `intentDescription`, `positivePrompt`, `negativePrompt`, `styleParams`, `images` (array of 9 image URLs + metadata), `selectedImageIndex`, `reflection`.
- `StudentSubmission`: `id`, `studentId`, `studentName`, `studentClass`, `assignmentId`, `rounds` (PromptRound[]), `submittedAt`, `status`, `grade` (score, rubricBreakdown, feedback, gradedAt).

---

### 5. Implementation Sequence
1. **Data Models & Pre-seeded Course State**: Create types, default 6 classroom + 1 final exam assignments, templates, sample student roster, and localStorage synchronizer.
2. **Student Module**:
   - Simulated QR-code login modal with quick student selection.
   - Assignment navigator (6 classroom + 1 final exam).
   - Iteration workspace with prompt inputs, prompt optimizer, 9-image generation grid, image lightbox modal, and reflection editor.
   - Multi-page PDF Summary Report generator with complete prompt history and 9-grid imagery.
3. **Teacher Custom Template Studio**:
   - Interactive template builder with predefined fields (concept, prompt round requirements, image specifications, rubric items, deadlines).
   - Template library with "Apply to New Assignment" or "Export/Duplicate" actions.
4. **Teacher Grading & Gradebook**:
   - Student submission inspector with side-by-side prompt history and 9-image inspection.
   - Multi-factor rubric scoring slider interface with autosave and feedback comments.
   - Weighted final grade calculation matrix (6平时 + 1期末) and CSV exporter.
5. **Data Visualization Dashboard**:
   - Visual charts for score distributions, prompt iteration depth, assignment completion funnel, and class trend comparisons.
6. **Polishing & Verification**:
   - Responsive layouts, strict accessibility, zero broken images, compile check with `compile_applet`.
