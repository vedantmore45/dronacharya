# Dronacharya
Drone Survey Management System (Dronacharya) – A full-stack MERN application for planning, managing, and monitoring autonomous drone survey missions. Includes mission planning with waypoints, fleet management, real-time status tracking, and survey reporting.

Project Summary:

- How did I approach the problem?

  - I approached the problem by first breaking down the requirements into modular components — mission planning, fleet management, monitoring, and reporting.
  - I set up the backend using Node.js, Express, and MongoDB to handle data persistence and APIs, while the frontend was built with React to provide a responsive, state-managed UI.
  - I started with schema definitions to capture missions, drones, and reports, then layered APIs on top for CRUD operations.
  -  Finally, I integrated the client and server, focusing on usability through forms, dashboards, and visualizations.

- The trade-offs I considered during development:

  - I chose MongoDB over relational databases for flexibility in handling dynamic mission data (e.g., varying coordinates and drone stats). The trade-off is less rigid structure, but it made iteration faster.

  - For hosting, I used Render (server) and Vercel (client) because they offer free tiers and easy deployment pipelines, though at the cost of limited scaling compared to full cloud providers.

  - I focused on mission management and monitoring only, leaving out live video/data feeds, which was a conscious trade-off aligned with project scope.

- My strategy for ensuring safety and adaptability in the system:

  - I used environment variables for sensitive data like MONGO_URI, ensuring database credentials were not exposed in the codebase.

  - By modularizing schemas and APIs, the system can easily adapt to new drone models, mission parameters, or reporting needs.

  - I enabled CORS configuration and controlled client-server communication to prevent unauthorized access.
 
- Hosted Frontend Application : [Dronacharya App](https://dronacharya-iota.vercel.app)
- Hosted Backend Application : [DronacharyaBackend](https://dronacharya-backend.onrender.com)
- Open both the links simultaneuosly.

Video Link : https://youtu.be/ZdnaNuWbw1c



