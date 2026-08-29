# YatraSetu — Project Context

## 1. Project Title

**YatraSetu: A Cloud-Based Smart Destination Management Platform**

---

## 2. Project Overview

YatraSetu is a final-year Computer Science Engineering project specializing in Cloud Computing.

The project is being developed by a group of four students.

YatraSetu is a centralized cloud-based Smart Destination Management Platform designed to address fragmentation in tourism information and destination-management activities.

The platform connects:

* Tourists
* Destination Managers
* Tourism Stakeholders
* Administrators

The platform integrates tourism information, destination management, stakeholder coordination, tourist feedback, visitor statistics, analytics, reports, and decision-support information.

---

# 3. Research Background

The project is based on research in the Travel and Tourism domain, particularly:

* Smart Tourism
* Heritage Tourism
* Sustainable Tourism
* Destination Management
* Digital Tourism
* Cloud Computing in Tourism

The literature review covers India-focused and international research, mainly from 2021–2026, with stronger emphasis on recent literature.

---

# 4. Research Observation

The research identified fragmentation within existing tourism ecosystems.

Tourism information and services may be distributed across different platforms and sources.

Tourists may need different sources for:

* Destinations
* Attractions
* Events
* Tourism information
* Trip planning

Destination managers may face difficulties with:

* Centralized tourism information
* Visitor information
* Feedback management
* Analytics
* Stakeholder coordination
* Decision support

The project therefore focuses on integrating these functions into a unified platform.

### Important Positioning

Do not claim that no similar tourism system exists.

The project should instead be presented as addressing the identified fragmentation through integration.

---

# 5. Problem Statement

> Current tourism ecosystems are fragmented, providing isolated services for tourists while offering limited decision-support capabilities for destination managers and insufficient collaboration among tourism stakeholders.

---

# 6. Proposed Solution

YatraSetu is a centralized cloud-based Smart Destination Management Platform.

It connects:

**Tourists**

**Destination Managers**

**Tourism Stakeholders**

**Administrators**

The platform combines:

* Destination information
* Attraction information
* Tourism events
* Tourist services
* Basic trip planning
* Stakeholder information
* Stakeholder coordination
* Tourist feedback
* Visitor statistics
* Analytics
* Reports
* Decision-support information

into one platform.

---

# 7. Main Objective

The objective is to provide a unified platform that supports both:

### Tourist-facing functionality

and

### Destination-management functionality

The system should provide tourists with centralized tourism information and basic planning capabilities while giving destination managers tools for managing tourism information, understanding visitor activity, reviewing feedback, viewing analytics, generating reports, and making data-informed decisions.

---

# 8. User Roles

## 8.1 Tourist

The Tourist is the primary tourism-experience user.

Tourists can:

* Register
* Login
* Explore destinations
* View attractions
* View tourism events
* View tourism information
* Perform basic trip planning
* Submit feedback

---

## 8.2 Destination Manager

The Destination Manager manages tourism information and destination activity.

Destination Managers can:

* Add destinations
* Update destinations
* Manage destinations
* Add/update/manage attractions
* Create/manage tourism events
* View visitor statistics
* View feedback
* View analytics
* View reports
* Access decision-support information

---

## 8.3 Tourism Stakeholder

Tourism Stakeholders contribute tourism-related information and coordinate with destination managers.

They can:

* Maintain relevant information
* Share relevant information
* Coordinate with destination managers

The stakeholder module should remain focused on tourism coordination and information sharing.

---

## 8.4 Administrator

The Administrator manages the overall platform.

Administrators can:

* Manage users
* Manage roles
* Manage platform content
* Control access

---

# 9. Core Modules

## Module 1 — Authentication and User Management

Includes:

* Registration
* Login
* Logout
* Password hashing
* JWT authentication
* Role-based access control
* Protected functionality
* User management
* Role management

---

## Module 2 — Destination Management

Destination Managers can:

* Add destinations
* Update destinations
* Manage destination information

Tourists can:

* Browse destinations
* View destination details

Possible destination information:

* Name
* Description
* Location
* Images
* Tourism information

---

## Module 3 — Attraction Management

Destination Managers can:

* Add attractions
* Update attractions
* Manage attractions

Tourists can:

* Explore attractions
* View attraction details

Attractions should be associated with destinations through database relationships.

---

## Module 4 — Tourism Event Management

Destination Managers can:

* Create events
* Update events
* Manage events

Tourists can:

* View upcoming events
* View event details

Possible event data:

* Event name
* Description
* Date
* Time
* Location
* Destination
* Image
* Status

---

## Module 5 — Tourist Services

Tourists can:

* Explore destinations
* Explore attractions
* View tourism information
* View events
* Use basic trip-planning functionality

---

## Module 6 — Basic Trip Planning

Tourists can create basic trip plans.

A trip plan may contain:

* Destination
* Attractions
* Events
* Dates
* Basic itinerary information

The trip planner should remain simple.

It is not a complete commercial travel-booking system.

---

## Module 7 — Stakeholder Management

Stakeholders can:

* Maintain relevant information
* Share information
* Coordinate with destination managers

The implementation should be simple and useful.

---

## Module 8 — Stakeholder Coordination

The system should support coordination between:

**Tourism Stakeholders ↔ Destination Managers**

Possible functionality may include:

* Information sharing
* Coordination requests
* Updates
* Status

Avoid creating a complete social-network or complex messaging platform.

---

## Module 9 — Tourist Feedback

Tourists can submit feedback.

Possible feedback data:

* Rating
* Comment
* Destination
* Date
* User

Destination Managers can:

* View feedback
* Analyze feedback

Feedback should contribute to analytics and decision support.

---

## Module 10 — Visitor Statistics

The system can collect visitor-related information.

Destination Managers can view statistics such as:

* Visitor count
* Destination visits
* Attraction visits
* Event activity where data is available
* Feedback counts

Only display statistics supported by actual collected data.

Demo data may be used during development and demonstration.

---

## Module 11 — Analytics

Destination Managers should have access to useful analytics.

Possible analytics:

* Visitor trends
* Popular destinations
* Popular attractions
* Event activity
* Feedback ratings
* Feedback trends
* Visitor distribution
* Basic comparisons

Charts should communicate useful information rather than simply decorate the dashboard.

---

## Module 12 — Reports

Destination Managers can generate basic reports.

Reports may contain:

* Visitor statistics
* Feedback summaries
* Destination information
* Attraction information
* Event information
* Analytics summaries

---

## Module 13 — Decision Support

Decision support should provide useful data-based information to Destination Managers.

Possible insights include:

* Most visited destinations
* Popular attractions
* Visitor trends
* Feedback patterns
* Areas requiring attention
* Tourism activity comparisons

Decision support should use actual application data.

Complex AI is not required.

---

## Module 14 — Administration

Administrators manage:

* Users
* Roles
* Platform content
* Access

---

# 10. Functional Requirements

## Authentication

Users should be able to securely register and log in.

The system should identify the user's role and provide appropriate access.

---

## Destination Management

Destination Managers should be able to add, update, and manage destinations.

Tourists should be able to view destination information.

---

## Attraction Management

Destination Managers should be able to manage attractions.

Tourists should be able to explore attractions.

---

## Event Management

Destination Managers should be able to create and manage tourism events.

Tourists should be able to view upcoming events.

---

## Tourist Services

Tourists should be able to:

* Explore destinations
* Explore attractions
* View events
* View tourism information
* Create basic trip plans

---

## Stakeholder Functionality

Stakeholders should be able to:

* Maintain information
* Share information
* Coordinate with destination managers

---

## Feedback

Tourists should be able to submit feedback.

Destination Managers should be able to view and analyze feedback.

---

## Analytics and Decision Support

Destination Managers should be able to view:

* Visitor statistics
* Feedback analytics
* Dashboards
* Reports
* Decision-support information

---

# 11. Acceptance Criteria

The project should satisfy these five acceptance criteria:

1. **Users can securely register, log in, and access features according to their assigned roles.**

2. **Destination managers can add, update, and manage destinations, attractions, and tourism events.**

3. **Tourists can explore destination information, attractions, events, and use basic trip-planning functionality.**

4. **Tourism stakeholders can share relevant information and coordinate with destination managers, while tourists can submit feedback.**

5. **Destination managers can view visitor statistics, feedback analytics, dashboards, and generate basic reports for decision support.**

---

# 12. Technology Stack

## Frontend

**HTML5**

**CSS3**

**JavaScript**

No React.

---

## Backend

**Python**

**FastAPI**

**REST APIs**

---

## Database

**PostgreSQL**

---

## DevOps / Deployment

**Google Cloud Platform**

**Render**

**Git**

**GitHub**

---

## Development Tools

**Antigravity**

**VS Code**

**Postman**

**GitHub**

---

# 13. Role of Technologies

## HTML/CSS/JavaScript

Used for:

* Landing page
* Navigation
* Login/register UI
* Dashboards
* Forms
* Tourism pages
* Management interfaces

---

## FastAPI

Used for:

* REST APIs
* Backend logic
* Authentication
* Authorization
* Destination management
* Attractions
* Events
* Feedback
* Stakeholder functionality
* Analytics
* Reports

---

## PostgreSQL

Used as the relational database.

Stores:

* Users
* Roles
* Destinations
* Attractions
* Events
* Stakeholders
* Feedback
* Trip plans
* Visitor statistics
* Analytics-related data

---

## Render

Used for application deployment/hosting.

---

## Google Cloud Platform

Used for selected cloud services/APIs where actually required.

Potential uses:

* Maps/location services
* Cloud storage
* Other suitable cloud APIs

The exact service should be selected based on actual project requirements.

---

## Git and GitHub

Used for:

* Version control
* Source-code management
* Collaboration
* Project history

---

## Postman

Used for:

* REST API testing
* Request testing
* Response validation

---

# 14. Cloud Architecture

YatraSetu follows a cloud-based web application architecture.

```text
                         USERS
                           |
                           v
                +---------------------+
                |    HTML/CSS/JS      |
                |      Frontend       |
                +----------+----------+
                           |
                        REST API
                           |
                           v
                +---------------------+
                |   FastAPI Backend   |
                |       Render        |
                +----------+----------+
                           |
                 +---------+---------+
                 |                   |
                 v                   v
          +-------------+    +----------------+
          | PostgreSQL  |    | Google Cloud   |
          |  Database   |    | Services/APIs  |
          +-------------+    +----------------+
```

Main application flow:

```text
Users
 ↓
HTML/CSS/JavaScript
 ↓
REST API
 ↓
FastAPI
 ↓
PostgreSQL
```

FastAPI may additionally communicate with selected Google Cloud services/APIs.

---

# 15. Frontend Structure

Initial structure:

```text
frontend/
│
├── index.html
├── login.html
├── register.html
│
├── dashboards/
│   ├── tourist.html
│   ├── manager.html
│   ├── stakeholder.html
│   └── admin.html
│
├── css/
│   └── style.css
│
├── js/
│   └── main.js
│
└── assets/
    ├── images/
    └── icons/
```

The structure may evolve when additional files are genuinely required.

---

# 16. Landing Page

The landing page should contain:

```text
Navbar
 ↓
Hero Section
 ↓
About YatraSetu
 ↓
Key Features
 ↓
Explore Destinations
 ↓
How It Works
 ↓
Call to Action
 ↓
Footer
```

The landing page should clearly communicate:

* What YatraSetu is
* What problem it addresses
* Who uses it
* What it provides

---

# 17. Dashboard Concepts

## Tourist Dashboard

Potential areas:

* Profile
* Explore destinations
* Attractions
* Events
* Trip plans
* Feedback

---

## Destination Manager Dashboard

Potential areas:

* Overview
* Destinations
* Attractions
* Events
* Visitors
* Feedback
* Analytics
* Reports
* Decision Support

---

## Stakeholder Dashboard

Potential areas:

* Profile/information
* Shared information
* Coordination
* Requests/updates
* Status

---

## Administrator Dashboard

Potential areas:

* Users
* Roles
* Platform content
* Access control
* Platform overview

---

# 18. Database Entities

Initial entities:

```text
users
roles
destinations
attractions
events
stakeholders
feedback
trip_plans
visitor_statistics
```

Before final implementation:

1. Create ER diagram.
2. Identify entities.
3. Identify primary keys.
4. Identify foreign keys.
5. Identify relationships.
6. Check cardinality.
7. Review normalization.
8. Verify the design.
9. Implement PostgreSQL schema.

---

# 19. Backend Structure

Suggested structure:

```text
backend/
│
├── app/
│   ├── main.py
│   ├── database.py
│   │
│   ├── models/
│   ├── schemas/
│   ├── routes/
│   ├── services/
│   └── auth/
│
├── .env
├── .gitignore
└── requirements.txt
```

Potential API groups:

```text
/api/auth
/api/users
/api/destinations
/api/attractions
/api/events
/api/stakeholders
/api/feedback
/api/trips
/api/analytics
/api/reports
```

---

# 20. Security Requirements

Minimum security requirements:

* Password hashing
* JWT authentication
* Role-Based Access Control
* Protected APIs
* Input validation
* Environment variables
* CORS configuration
* Secure database credentials
* HTTPS during deployment

Never place secrets directly in GitHub.

---

# 21. Development Approach

The project should be developed incrementally.

Preferred flow:

```text
Landing Page
 ↓
Navigation
 ↓
Login/Register UI
 ↓
Authentication Backend
 ↓
Dashboard
 ↓
Destination UI
 ↓
Destination API
 ↓
PostgreSQL
 ↓
Real Data
```

Then repeat the same pattern for other modules.

---

# 22. Development Order

### Step 1

Development environment setup

### Step 2

GitHub repository

### Step 3

Project structure

### Step 4

Landing page

### Step 5

Login/register UI

### Step 6

Basic dashboards

### Step 7

ER diagram/database design

### Step 8

PostgreSQL setup

### Step 9

FastAPI setup

### Step 10

FastAPI + PostgreSQL connection

### Step 11

Authentication

### Step 12

JWT + RBAC

### Step 13

Destination management

### Step 14

Attraction management

### Step 15

Tourism events

### Step 16

Tourist services and trip planning

### Step 17

Stakeholder management and coordination

### Step 18

Feedback

### Step 19

Analytics

### Step 20

Reports

### Step 21

Decision support

### Step 22

Required Google Cloud integration

### Step 23

Testing

### Step 24

Render deployment

### Step 25

Final integration, testing and demonstration

---

# 23. Sprint Plan

## Sprint 1 — Project Setup, Resource Gathering & Frontend Foundation

Includes:

* Development environment
* Git/GitHub
* Tourism data/resources
* UI resources
* Frontend structure
* Landing page
* Navigation
* Login
* Registration
* Dashboards
* Role-based UI
* Authentication UI

---

## Sprint 2 — Destination & Tourist Services

Includes:

* Destination management
* Attraction management
* Tourism event management
* Destination exploration
* Tourism information
* Basic trip planning

---

## Sprint 3 — Stakeholder & Decision Support

Includes:

* Stakeholder management
* Information sharing
* Stakeholder coordination
* Tourist feedback
* Visitor statistics
* Analytics dashboard
* Reports

---

## Sprint 4 — Backend Integration, Testing & Deployment

Includes:

* FastAPI integration
* PostgreSQL integration
* API integration
* Frontend/backend connectivity
* Functional testing
* Cloud deployment
* Bug fixing

---

# 24. Project Scope

YatraSetu focuses on a selected tourism destination/study area.

Core scope:

* Destination management
* Attraction management
* Tourism events
* Tourist information
* Basic trip planning
* Stakeholder management
* Stakeholder coordination
* Feedback collection
* Visitor statistics
* Analytics
* Reports
* Decision support
* Role-based access
* Cloud-based application services

---

# 25. Outside Current Scope

The following are NOT core features:

* Complete hotel booking
* Complete flight booking
* Online payment processing
* Complete travel agency operations
* National-level tourism management
* Advanced IoT infrastructure
* Digital Twins
* Blockchain
* Complex AI automation
* Large government integrations
* Large ERP integrations

These may only be considered as future enhancements if required.

---

# 26. Important Project Positioning

Do not say:

> "We invented a completely new tourism platform."

Use:

> "Our project addresses the identified fragmentation by integrating tourism information, destination management, stakeholder coordination, feedback, analytics, and decision-support functionality into a unified cloud-based platform."

Do not say:

> "No similar system exists."

Use:

> "Our literature review identified a need for greater integration of these functions within a unified destination-management platform."

---

# 27. Final System Goal

YatraSetu should become a:

**Professional, understandable, functional, cloud-based Smart Destination Management Platform**

using:

**HTML + CSS + JavaScript**

↓

**FastAPI + REST APIs**

↓

**PostgreSQL**

↓

**Render + selected Google Cloud services**

with:

**Git + GitHub + Postman**

The project should be technically sound, understandable to the student developers, demonstrable during the final presentation, and defensible during the project viva.
