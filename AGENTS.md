YatraSetu/
├── AGENTS.md
├── docs/
│   └── YatraSetu_Project_Context.md
├── frontend/
├── backend/
├── database/
└── README.md

# YatraSetu — Development Rules

These rules apply to the entire project and must be followed for every implementation, modification, debugging task, refactoring, and feature addition.

## Minimal Implementation Rule

* Build only what is explicitly required by the project requirements or the current task.
* Always prefer the simplest clean solution that fully solves the problem.
* Do not over-engineer simple functionality.
* Do not create architecture for hypothetical future requirements.
* Do not add features just to make the project look advanced.
* Do not create extra files, pages, components, functions, classes, utilities, services, abstractions, or folders unless genuinely needed.
* Do not duplicate existing functionality.
* Do not rewrite working code unless there is a specific reason.
* If something can be solved simply, do not introduce a complicated solution.
* Do not add functionality merely because it is technically possible.
* Before adding anything, ask: **"Is this required for the current task or defined project scope?"**
* If not, do not add it.
* When multiple solutions are valid, choose the simplest reliable and maintainable solution.

## Project Scope Rule

* Stay within the defined YatraSetu project scope.
* Do not invent additional features, pages, modules, workflows, UI sections, integrations, or technologies.
* Do not turn YatraSetu into a complete commercial travel platform.
* Do not add hotel booking, flight booking, payment processing, or complete travel-agency functionality.
* Do not add Digital Twin, Blockchain, advanced IoT, complex AI/ML, or large government/ERP integrations unless explicitly approved.
* Do not add AI simply because the project uses the term "Smart Tourism."
* Do not claim functionality that has not actually been implemented.
* Do not claim that no similar tourism system exists.
* Do not change the project concept without discussion and approval.

## Technology Rule

Use the technology stack defined in the project context.

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Backend

* Python
* FastAPI
* REST APIs

### Database

* PostgreSQL

### Cloud / Deployment

* Render
* Google Cloud Platform where actually required

### Development / Version Control

* Git
* GitHub
* Postman

### Strict Frontend Rule

* Do NOT use React.
* Do NOT introduce Angular or Vue.
* Do NOT replace Vanilla JavaScript with a frontend framework.
* Do NOT introduce a framework simply because it is popular.
* Do NOT add a library when HTML, CSS, JavaScript, or browser APIs are sufficient.

## Change Rule

Before modifying existing code:

1. Inspect the existing implementation.
2. Understand what the existing code does.
3. Identify exactly what needs to change.
4. Change only what is necessary.
5. Preserve existing working functionality.
6. Test the change.
7. Verify that unrelated functionality was not broken.

Never blindly overwrite working code.

## Dependency Rule

* Do not install a package unless it is genuinely necessary.
* Prefer existing dependencies and native platform capabilities.
* Prefer standard HTML, CSS, JavaScript, Python, and FastAPI functionality when sufficient.
* Do not add a dependency simply because it makes development easier if the requirement can reasonably be solved without it.
* Before installing a dependency, determine whether it is actually required.
* Avoid unnecessary frontend frameworks and UI libraries.
* Avoid unnecessary backend packages.

## Code Volume Rule

More code does not mean a better solution.

Prefer:

**simple → readable → maintainable → testable**

over:

**complex → over-engineered → unnecessarily large**

* Keep functions focused.
* Avoid unnecessary abstractions.
* Avoid unnecessary design patterns.
* Avoid deeply nested logic when a simpler structure is possible.
* Do not create utilities for one-time operations unless genuinely useful.
* Do not optimize prematurely.
* Do not create large amounts of code for a small requirement.

## Beginner-Friendly Code Rule

The project must remain understandable to a final-year engineering student who is learning web development.

* Use clear variable and function names.
* Keep logic straightforward.
* Avoid unnecessary advanced programming patterns.
* Avoid unnecessary abstractions.
* Explain important implementation decisions.
* Prefer code that can be understood and explained during a project viva.
* Do not hide simple logic behind unnecessarily complicated architecture.

## Frontend Rule

* Use HTML5, CSS3, and Vanilla JavaScript.
* Keep the interface professional, modern, responsive, and tourism-oriented.
* Maintain consistent design across pages.
* Reuse existing CSS and JavaScript where appropriate.
* Do not create duplicate styles or scripts unnecessarily.
* Do not add excessive animations.
* Do not add decorative elements that do not provide value.
* Do not create fake functionality merely for visual appearance.
* Ensure relevant pages work on desktop, tablet, and mobile.
* Use semantic HTML where appropriate.
* Keep forms and navigation clear and usable.

## Backend Rule

* Use Python and FastAPI.
* Use REST APIs for frontend-backend communication.
* Keep routes logically organized.
* Validate incoming data.
* Use appropriate HTTP methods and status codes.
* Keep business logic separate when separation is genuinely useful.
* Do not create unnecessary backend layers.
* Protect APIs according to user roles.
* Do not expose sensitive implementation details through API responses.

## Database Rule

* Use PostgreSQL.
* Understand database relationships before implementing the final schema.
* Use appropriate primary keys and foreign keys.
* Maintain referential integrity.
* Avoid unnecessary data duplication.
* Do not create tables without understanding their relationships.
* Do not add database fields without a genuine requirement.
* Keep database models consistent with backend models and APIs.
* Database changes must be tested.

## Authentication and Authorization Rule

Use secure authentication and authorization.

Required concepts include:

* Password hashing
* JWT authentication
* Role-Based Access Control
* Protected APIs
* Input validation
* Environment variables

The project has four primary roles:

* Tourist

* Destination Manager

* Tourism Stakeholder

* Administrator

* Frontend role restrictions alone are not sufficient.

* Backend authorization must enforce permissions.

* A user must not gain another role's permissions by manually calling an API.

* Never store plaintext passwords.

## Security Rule

Never expose or commit:

* Database passwords

* JWT secrets

* API keys

* GCP credentials

* Access tokens

* Private credentials

* Use environment variables.

* Use `.env` for local secrets.

* Ensure `.env` is included in `.gitignore`.

* Never hardcode secrets into frontend JavaScript.

* Do not commit credentials to GitHub.

## Cloud Rule

* Render is the planned application deployment platform.
* Google Cloud services should only be used when they provide a genuine project requirement.
* Do not add GCP services simply to make the architecture look advanced.
* Do not claim a cloud service is being used if it has not actually been implemented.
* Do not claim the entire application is hosted on GCP unless that is actually true.
* Every cloud service must have a clear purpose.

## Data Authenticity Rule

* Do not fabricate real-world tourism statistics.
* Do not claim real-time information unless the system actually receives real-time data.
* Do not claim government integration unless it actually exists.
* Do not claim official partnerships or endorsements unless they actually exist.
* Sample/demo data may be used for development and demonstration.
* Clearly distinguish sample/demo data from real data.

## No Fake Functionality Rule

Do not make a feature appear functional when it is only a visual prototype.

Clearly distinguish between:

* UI prototype
* Frontend implementation
* Backend implementation
* Database integration
* Fully connected functionality

Do not use hardcoded values to falsely represent live database functionality.

## Module Rule

Only implement modules defined in the project context unless a new module is explicitly approved.

Core modules include:

1. Authentication and User Management
2. Destination Management
3. Attraction Management
4. Tourism Event Management
5. Tourist Services
6. Basic Trip Planning
7. Stakeholder Management
8. Stakeholder Coordination
9. Tourist Feedback
10. Visitor Statistics
11. Analytics
12. Reports
13. Decision Support
14. Administration

## Development Order Rule

Follow the planned development sequence.

Do not unnecessarily jump between stages.

Preferred order:

**Project Setup**
→ **Frontend Foundation**
→ **Landing Page**
→ **Navigation**
→ **Login/Register UI**
→ **Dashboards**
→ **Database/ER Design**
→ **FastAPI Backend**
→ **PostgreSQL**
→ **Authentication**
→ **RBAC**
→ **Destination Management**
→ **Attractions**
→ **Events**
→ **Tourist Services**
→ **Trip Planning**
→ **Stakeholder Management**
→ **Feedback**
→ **Analytics**
→ **Reports**
→ **Decision Support**
→ **GCP Integration**
→ **Testing**
→ **Deployment**
→ **Final Integration**

## Incremental Development Rule

Do not build the entire application in one operation.

For every major feature:

1. Understand the requirement.
2. Inspect existing code.
3. Plan the smallest suitable implementation.
4. Implement it.
5. Run it.
6. Test it.
7. Fix problems.
8. Verify existing functionality.
9. Continue only after the current feature is working.

Follow:

**Design → Implement → Run → Test → Fix → Verify → Continue**

## No Unnecessary Refactoring Rule

Do not refactor working code merely because another coding style is preferred.

Refactor only when:

* It fixes a real problem.
* It is required for a new feature.
* It removes genuine duplication.
* It improves maintainability significantly.
* It is required by the project architecture.

## No Silent Architecture Changes Rule

Do not silently change:

* Technology stack
* Frontend architecture
* Backend framework
* Database
* Deployment architecture
* Authentication method
* Major API structure
* Major database relationships

If a significant architecture change is necessary:

1. Explain the problem.
2. Explain the available options.
3. Recommend the simplest suitable option.
4. Obtain approval before making the change.

## Testing Rule

Every major implementation must be tested.

Before completing a task:

* Run the application.
* Test the affected functionality.
* Check browser console errors where relevant.
* Check API responses where relevant.
* Check database behavior where relevant.
* Check responsive behavior for relevant frontend changes.
* Verify that existing functionality still works.

Do not claim that a feature works without testing it.

## Error Handling Rule

When an error occurs:

1. Read the actual error.
2. Identify the root cause.
3. Fix the underlying issue.
4. Test the fix.
5. Verify that the fix did not break another feature.

Do not randomly modify unrelated files.

Do not hide errors using unnecessary workarounds.

## File Structure Rule

* Keep the project structure simple.
* Create files only when genuinely required.
* Reuse existing files when appropriate.
* Do not create duplicate files with overlapping responsibilities.
* Do not create dozens of files for a simple feature.
* Keep frontend, backend, database, and documentation logically separated.

## Documentation Rule

Document important technical decisions when necessary.

Documentation should explain meaningful information such as:

* Architecture decisions
* Database relationships
* API behavior
* Setup requirements
* Important implementation decisions
* Known limitations

Do not create unnecessary documentation that simply repeats the code.

## Git Rule

Use Git for meaningful changes.

Prefer clear commit messages such as:

* `feat: add landing page`
* `feat: add login UI`
* `feat: add destination management`
* `fix: correct form validation`
* `feat: add visitor analytics`

Do not commit:

* `.env`
* passwords
* API keys
* credentials
* temporary files
* unnecessary generated files

## Decision Rule

When multiple technical solutions are possible:

1. Identify the options.
2. Explain the important differences.
3. Recommend the simplest suitable solution.
4. Prefer maintainability.
5. Prefer the existing technology stack.
6. Avoid unnecessary complexity.

Do not silently choose a complicated technology or architecture.

## Explanation Rule

Before implementing a significant feature:

* Briefly explain what is being built.
* Explain why it is needed.
* Identify the files that will be affected.
* Explain important implementation decisions.

Do not overwhelm the project owner with unnecessary technical detail.

## User Approval Rule

Do not wait for approval for every small coding decision.

Proceed independently when:

* The requirement is clear.
* The change is small.
* It follows the existing architecture.
* It does not introduce new technology.
* It does not change project scope.

Ask for approval when:

* The requirement is ambiguous.
* A major architectural change is required.
* A new technology is needed.
* A new major feature is being proposed.
* Existing requirements conflict.
* The implementation would significantly increase project complexity.

## Final Check

Before finishing every task, check:

* Did I add anything that wasn't requested?
* Did I add a feature outside the project scope?
* Did I create unnecessary files?
* Did I install an unnecessary dependency?
* Could the implementation be simpler?
* Did I introduce unnecessary abstraction?
* Did I modify code that did not need modification?
* Did I preserve working functionality?
* Did I test the implementation?
* Did I expose any secret?
* Did I introduce a technology that was not approved?
* Did I create fake or misleading functionality?
* Can the implementation be explained clearly during a project viva?

If yes to any unnecessary-change question, simplify it before finishing.

## Core Principle

Always prefer:

**Required → Simple → Correct → Tested → Maintainable**

over:

**Extra → Complex → Unnecessary → Untested**
