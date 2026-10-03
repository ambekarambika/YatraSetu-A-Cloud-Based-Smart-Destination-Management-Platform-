# YatraSetu — Product Requirements Document

## 1. Product Identity

**Product:** YatraSetu  
**Full title:** YatraSetu: A Cloud-Based Smart Destination Management Platform  
**Type:** Final-Year Group Project  
**Domain:** Travel & Tourism, Smart Tourism, Destination Management, Cloud Computing, Web Application Development

YatraSetu is a centralized platform connecting:
- Tourists
- Destination Managers
- Tourism Stakeholders
- Administrators

It is a destination-management platform, not a hotel/flight booking marketplace.

## 2. Problem

Current tourism ecosystems are fragmented. Tourist information, attractions, events, local stakeholder information, feedback, and destination-management information often exist across separate systems.

The project addresses this fragmentation by bringing destination information, management activities, stakeholder coordination, feedback, analytics, reporting, and decision-support information into one role-based platform.

## 3. Main Objective

Design and develop a cloud-based Smart Destination Management Platform that integrates:
- destination information,
- attraction management,
- event management,
- tourist services,
- stakeholder coordination,
- feedback,
- analytics,
- reporting,
- decision-support information.

## 4. Users and Roles

### 4.1 Destination Manager

The management-side user responsible for destination operations.

Requirements:
- secure login,
- manage destination information,
- manage attractions,
- manage tourism events,
- view stakeholder information,
- coordinate/share information with stakeholders,
- view tourist feedback and ratings,
- view visitor statistics,
- view analytics,
- generate basic reports,
- view decision-support information.

### 4.2 Tourist

The tourism-consumer user.

Requirements:
- register/login,
- explore destinations,
- view attractions,
- view events,
- search/explore tourism information,
- create basic trip plans,
- save/view trips,
- submit feedback and ratings,
- manage profile.

### 4.3 Tourism Stakeholder

A local tourism service provider, guide, business, or other destination stakeholder.

Requirements:
- register/login,
- manage profile,
- maintain tourism information/services,
- share information with the Destination Manager,
- view manager-shared information,
- receive destination updates,
- participate in coordination.

### 4.4 Administrator

Platform-level management role.

Requirements:
- manage users,
- manage roles/access,
- manage platform content,
- perform administrative controls,
- support platform-level audit/management functions.

## 5. Functional Requirements

### FR-01 Authentication
Users can register/login and receive role-appropriate access.

### FR-02 Role-Based Access
The system restricts features according to Tourist, Destination Manager, Stakeholder, and Administrator roles.

### FR-03 Destination Management
Managers can create, update, view, and manage destination information.

### FR-04 Attraction Management
Managers can manage attraction information.

### FR-05 Event Management
Managers can create and manage tourism events.

### FR-06 Tourist Exploration
Tourists can explore destination, attraction, and event information.

### FR-07 Trip Planning
Tourists can create and view basic trip plans.

### FR-08 Stakeholder Management
Managers can view and coordinate with tourism stakeholders.

### FR-09 Stakeholder Information Sharing
Stakeholders can maintain and share relevant tourism information/services.

### FR-10 Feedback
Tourists can submit feedback and ratings.

### FR-11 Visitor Statistics
Managers can view visitor-related statistics generated from available system data.

### FR-12 Analytics
Managers can view destination activity, visitor, attraction, event, and feedback-related analytics.

### FR-13 Reports
Managers can generate basic reports using system data.

### FR-14 Decision Support
The platform presents data signals, observations, and management considerations. It does not make decisions automatically.

## 6. Acceptance Criteria

- **AC1:** Authentication and RBAC work for the four roles.
- **AC2:** Managers can manage destinations, attractions, and events.
- **AC3:** Tourists can explore information and perform basic trip planning.
- **AC4:** Stakeholders can share information/coordinate and tourists can submit feedback.
- **AC5:** Managers can access visitor statistics, feedback analytics, dashboards, reports, and decision-support information.

## 7. Non-Functional Requirements

### Usability
Interfaces should be understandable to a student developer and realistic for intended users.

### Performance
Use lightweight frontend technologies and avoid unnecessary dependencies.

### Maintainability
Keep code modular, readable, and free of unnecessary duplication.

### Security
- password hashing,
- JWT-based authentication,
- RBAC,
- input validation,
- environment variables for secrets,
- CORS configuration,
- HTTPS in deployment.

### Scalability
The architecture should support growth beyond the initial sample destination through structured data and cloud deployment.

### Compatibility
Frontend should use standard HTML5/CSS3/JavaScript and modern browsers.

## 8. Deployment Requirements

Planned architecture:
- Frontend: web deployment.
- Backend: FastAPI deployment, with Render as the current deployment target.
- Database: PostgreSQL.
- Selected Google Cloud services/APIs may be used where they provide genuine project functionality.

The project must not claim that the entire system is hosted on GCP unless that is actually implemented.

## 9. Out of Scope

- Hotel booking
- Flight booking
- Payment processing
- Large OTA marketplace
- Travel-agency management
- Blockchain
- Digital Twins
- Advanced IoT
- Forced AI/ML prediction
- Unnecessary microservices
- National-scale government/ERP integration

## 10. Current Product Status

Public interfaces and authentication UI are frozen/approved.

The shared application UI system exists.

The Destination Manager workspace has been substantially implemented across ten pages, but **Phase 6A is not yet considered fully complete/final**.

Backend, database, and real authentication/integration are still planned.

Next planned role UI:
**Tourism Stakeholder**, followed by Tourist and Administrator.

## 11. Important Product Principle

The platform should help managers understand destination conditions and make informed decisions. It should not automatically make management decisions on behalf of them.
