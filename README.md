# 🏭 flexiScheduler — Digital Twin-Based Dynamic Scheduling

### Smart Production Scheduling for Automobile Parts Manufacturing

**flexiScheduler** is a React-based frontend prototype for a Digital Twin-powered dynamic production scheduling dashboard designed for automobile parts manufacturing. It presents a virtual view of factory operations, production schedules, machine health, and simulated manufacturing disruptions through a modern, interactive interface.

The project aims to demonstrate how digital manufacturing systems can help production teams understand machine conditions, visualize job schedules, and explore scheduling strategies when unexpected events affect production.

<p align="center">
  <strong>Digital Twin · Smart Manufacturing · Dynamic Scheduling · Industry 4.0</strong>
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Proposed Solution](#-proposed-solution)
- [Features](#-features)
- [Scheduling Algorithms](#-scheduling-algorithms)
- [Manufacturing Use Case](#-manufacturing-use-case)
- [System Workflow](#-system-workflow)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Key Performance Indicators](#-key-performance-indicators)
- [Current Limitations](#-current-limitations)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

Automobile parts manufacturing involves multiple machines, different processing times, production deadlines, and dependencies on material availability. A fixed production schedule can become inefficient when a machine breaks down, an urgent order arrives, or raw materials are delayed.

flexiScheduler presents a Digital Twin-based dashboard concept for visualizing production activities and exploring how dynamic scheduling can support more responsive manufacturing operations.

The interface uses a cinematic automotive-inspired design with interactive dashboard elements, factory performance indicators, and a production timeline.

## ❗ Problem Statement

Traditional production scheduling often relies on predefined plans that may not adapt quickly to unexpected events.

Common manufacturing challenges include:

- Machine breakdowns that interrupt production.
- Rush orders that require changes to existing schedules.
- Material delays that prevent jobs from starting on time.
- Uneven machine utilization and production bottlenecks.
- Missed delivery deadlines and increased job tardiness.
- Limited visibility into the impact of scheduling decisions.

These challenges can increase production lead time, reduce operational efficiency, and affect customer satisfaction.

**Objective:** Develop a Digital Twin-based dynamic scheduling interface for an automobile parts manufacturing factory that demonstrates production monitoring, scheduling concepts, disruption scenarios, and manufacturing performance indicators.

## 💡 Proposed Solution

flexiScheduler provides a frontend dashboard that represents the proposed digital manufacturing environment.

The interface includes:

1. A landing page introducing the project.
2. Factory KPI cards for monitoring illustrative production metrics.
3. A machine health panel for viewing simulated machine conditions.
4. A Gantt-style production timeline for visualizing job schedules.
5. Interactive scenarios for machine breakdowns, rush orders, and material delays.
6. An event log and notifications for displaying simulated events.
7. A workflow modal explaining the proposed system process.

The long-term objective is to connect the frontend to a scheduling engine and a Digital Twin model that can evaluate production conditions and calculate revised schedules.

## ✨ Features

### 🖥️ Interactive Frontend

- Responsive React-based interface.
- Automotive-inspired visual design.
- Scroll-friendly landing page and dashboard sections.
- Interactive UI elements using React state.
- Illustrative factory imagery.

### 🏭 Factory Monitoring

- Factory KPI cards.
- Simulated machine health indicators.
- Production schedule visualization.
- Gantt-style timeline for manufacturing jobs.

### ⚙️ Disruption Simulation

- Simulated machine breakdown scenarios.
- Rush order interaction.
- Material delay interaction.
- Event log and toast notifications.
- Workflow modal for explaining system operations.

### 📊 Production Analytics Concept

The dashboard is designed around manufacturing indicators such as:

- Makespan.
- Machine utilization.
- Job tardiness.
- Production completion.
- Overall production flow.

**Note:** The current repository is a frontend-only prototype. Its scheduling information and KPI values are illustrative, and disruption interactions simulate interface state changes rather than running a validated production optimization engine.

## 🧠 Scheduling Algorithms

The project focuses on three standard scheduling rules relevant to production planning.

### 1. FCFS — First Come, First Served

Jobs are scheduled in the order they arrive.

**Example:** If jobs arrive in the order A, B, C, they are processed in that same order.

**Advantages**
- Simple to understand and implement.
- Preserves job arrival order.
- Provides a straightforward baseline for schedule comparison.

**Limitation**
- A long job can delay several shorter jobs behind it.

### 2. SPT — Shortest Processing Time

Jobs with the shortest processing times are prioritized.

**Example:** If processing times are A = 8 hours, B = 3 hours, and C = 5 hours, the SPT order is B → C → A.

**Advantages**
- Can reduce average flow time in a single-machine setting under standard assumptions.
- Helps identify schedules that prioritize shorter jobs.

**Limitation**
- Long jobs may experience extended waits, and due dates are not directly prioritized.

### 3. EDD — Earliest Due Date

Jobs are scheduled according to their due dates, starting with the earliest deadline.

**Example:** If the due dates are A = Day 5, B = Day 2, and C = Day 4, the EDD order is B → C → A.

**Advantages**
- Prioritizes jobs with earlier delivery deadlines.
- Provides a useful baseline for studying deadline performance.

**Limitation**
- Does not directly minimize every measure of tardiness or account for all machine and material constraints.

### Algorithm Comparison

| Algorithm | Priority | Main consideration |
|---|---|---|
| FCFS | Arrival order | Simplicity and fairness of arrival order |
| SPT | Shortest processing time | Average flow time |
| EDD | Earliest due date | Deadline prioritization |

These are basic dispatching rules. A realistic automobile parts factory may require job-shop or flexible job-shop scheduling, where jobs need multiple operations on different machines.

Actual performance depends on the production constraints and the metric being optimized.

## 🚘 Manufacturing Use Case

The intended application is an automobile parts manufacturing facility that produces components such as:

- Engine components.
- Shafts and brackets.
- Gearbox housings.
- Metal fittings.
- Machined automotive components.

A production order may pass through several stages, such as machining, drilling, milling, grinding, and finishing.

For example, if a CNC machine breaks down while processing an engine component, the proposed system could evaluate the affected jobs, identify available alternative resources where feasible, and generate a revised production schedule.

This recovery process is a **future system capability**, not a validated feature of the current frontend.

## 🔄 System Workflow

The intended end-to-end workflow is:

1. **Input production data:** Collect job IDs, processing times, due dates, and machine requirements.
2. **Represent factory operations:** Maintain a virtual representation of the production environment.
3. **Select a scheduling strategy:** Use FCFS, SPT, EDD, or a more advanced optimization approach.
4. **Generate the schedule:** Assign jobs to appropriate resources while respecting production constraints.
5. **Detect disruptions:** Identify machine failures, rush orders, or material delays.
6. **Evaluate affected jobs:** Determine which operations and deadlines may be impacted.
7. **Reschedule production:** Recalculate the schedule using the selected strategy and current constraints.
8. **Evaluate performance:** Compare makespan, utilization, flow time, and tardiness.
9. **Visualize the outcome:** Present the production timeline and relevant indicators in the dashboard.

The current frontend demonstrates the visualization and simulated interaction aspects of this workflow.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React 18 | Frontend components and UI state |
| JavaScript | Application logic |
| Vite 6 | Development server and production build |
| CSS | Layout, responsive styling, and visual effects |
| Lucide React | Interface icons |
| Unsplash | Illustrative factory imagery |
| Google Fonts | Typography |
| Git and GitHub | Version control and repository hosting |

The current repository does not include a production backend, database, live sensor integration, or validated scheduling optimization engine.

## 📁 Project Structure

```text
flexiScheduler/
├── src/                 # React application source
├── index.html           # Application HTML entry point
├── package.json         # Dependencies and npm scripts
├── package-lock.json    # Locked dependency versions
├── .gitignore           # Git ignore rules
└── README.md            # Project documentation
```

The `src/` directory contains the application source code. Refer to the repository for the exact component and stylesheet organization.

## 🚀 Installation and Setup

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/) — version 18 or newer.
- npm — included with Node.js.
- [Visual Studio Code](https://code.visualstudio.com/) — recommended editor.
- Git — for cloning the repository.

### Step 1: Clone the Repository

```bash
git clone https://github.com/adidhanu77-cloud/flexiScheduler.git
```

### Step 2: Navigate to the Project

```bash
cd flexiScheduler
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start the Development Server

```bash
npm run dev
```

### Step 5: Open the Application

Open the local URL displayed in your terminal. With the default Vite configuration, this is usually:

```text
http://localhost:5173
```

### Build for Production

To create an optimized production build, run:

```bash
npm run build
```

To preview the generated build locally, run:

```bash
npm run preview
```

## 📈 Key Performance Indicators

The proposed scheduling system can use the following metrics to evaluate production performance.

| Metric | Description |
|---|---|
| Makespan | Time from the start of the production schedule until all scheduled jobs are complete. |
| Machine Utilization | Percentage of available machine time spent processing jobs. |
| Total Tardiness | Sum of the positive delays beyond individual job due dates. |
| Average Flow Time | Average time jobs spend in the system from release to completion. |
| Job Completion Rate | Proportion of jobs completed within a defined observation period. |

These indicators can help compare scheduling rules and investigate how disruptions affect production performance.

The values displayed by the current frontend are illustrative and should not be treated as measured factory performance.

## ⚠️ Current Limitations

The current implementation is a frontend prototype with simulated data and interactions.

- No backend scheduling engine is included.
- FCFS, SPT, and EDD are described as scheduling concepts; the current prototype does not establish that real algorithm calculations are executed.
- Machine breakdowns, rush orders, and material delays simulate UI changes rather than validated rescheduling.
- No database or persistent production history is connected.
- No real-time IoT sensors, PLCs, or industrial equipment are integrated.
- KPI values are illustrative rather than derived from live production data.
- Factory imagery and externally hosted fonts require an internet connection.

This project is intended for educational, demonstration, and further development purposes. It is not a production-ready industrial control system.

## 🔮 Future Enhancements

Potential improvements include:

- Implement FCFS, SPT, and EDD as actual scheduling functions.
- Add a Python backend using FastAPI or Flask.
- Develop flexible job-shop scheduling with machine and operation constraints.
- Introduce a database for jobs, machines, schedules, and production history.
- Generate revised schedules when disruptions occur.
- Add interactive Gantt charts with job dependencies and machine allocations.
- Compare algorithms using makespan, tardiness, flow time, and utilization.
- Add optimization approaches such as Genetic Algorithms or Particle Swarm Optimization.
- Build a 3D factory visualization for the Digital Twin.
- Integrate IoT sensors and real-time machine telemetry.
- Explore predictive maintenance using machine-condition data.
- Deploy the frontend and backend for remote access.

## 🎓 Applications

The project is relevant to:

- Automobile parts manufacturing.
- Smart factories and Industry 4.0.
- Digital Twin-based manufacturing.
- Flexible Job Shop Scheduling.
- Production planning and control.
- Manufacturing optimization research.
- Academic projects and engineering demonstrations.

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork this repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Commit your changes with a descriptive message.
5. Push your branch to your fork.
6. Open a pull request describing the improvement.

## 📄 License

No license has been specified in this README. Before distributing or reusing the code, add an appropriate license file to the repository and update this section accordingly.

## 👨‍💻 Author

**Adidhanu77-cloud**

- GitHub: [@adidhanu77-cloud](https://github.com/adidhanu77-cloud)
- Repository: [flexiScheduler](https://github.com/adidhanu77-cloud/flexiScheduler)

---

⭐ If you find this project interesting, consider starring the repository!

**Project summary:** flexiScheduler is a React frontend prototype demonstrating a Digital Twin-based dynamic scheduling dashboard for automobile parts manufacturing, with factory visualization, production timelines, simulated disruptions, and a foundation for future scheduling optimization.
