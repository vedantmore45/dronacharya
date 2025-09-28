# Dronacharya - Drone Survey Management System
## Comprehensive Technical Documentation

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Documentation](#backend-documentation)
5. [Frontend Documentation](#frontend-documentation)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Features and Functionality](#features-and-functionality)
9. [Installation and Setup](#installation-and-setup)
10. [Development Guidelines](#development-guidelines)
11. [Deployment](#deployment)
12. [Future Enhancements](#future-enhancements)

---

## Project Overview

**Dronacharya** is a comprehensive full-stack MERN (MongoDB, Express.js, React.js, Node.js) application designed for planning, managing, and monitoring autonomous drone survey missions. The system provides mission planning with waypoints, fleet management, real-time status tracking, and survey reporting capabilities.

### Key Features
- **Mission Planning**: Create and configure drone survey missions with waypoints and survey areas
- **Fleet Management**: Manage drone inventory with real-time status tracking
- **Real-time Monitoring**: Live telemetry data and mission progress tracking
- **Interactive Mapping**: Visual representation of missions and drone locations
- **Analytics & Reporting**: Comprehensive reporting dashboard with charts and statistics
- **WebSocket Integration**: Real-time updates for mission status and telemetry

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   MongoDB       │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └──────────────►│   Socket.IO     │
                        │  (Real-time)    │
                        └─────────────────┘
```

### Component Architecture

```
Dronacharya/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── features/       # Feature-based components
│   │   │   ├── missions/   # Mission management
│   │   │   ├── drones/     # Drone fleet management
│   │   │   ├── map/        # Interactive mapping
│   │   │   └── reports/    # Analytics & reporting
│   │   ├── lib/           # Utilities and API client
│   │   └── store.js       # Redux store configuration
│   └── package.json
└── server/                 # Node.js Backend
    ├── controllers/        # Business logic
    ├── models/            # Database schemas
    ├── routes/            # API endpoints
    ├── config/            # Database configuration
    └── index.js           # Server entry point
```

---

## Technology Stack

### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.IO**: Real-time bidirectional communication
- **CORS**: Cross-origin resource sharing

### Frontend Technologies
- **React 19.1.1**: JavaScript library for building user interfaces
- **Vite**: Build tool and development server
- **Redux Toolkit**: State management
- **Leaflet**: Interactive maps
- **Recharts**: Data visualization
- **Axios**: HTTP client
- **Socket.IO Client**: Real-time communication

### Development Tools
- **ESLint**: Code linting
- **Nodemon**: Development server auto-restart
- **Git**: Version control

---

## Backend Documentation

### Server Structure

#### Entry Point (`server/index.js`)
The main server file that:
- Configures Express application
- Sets up middleware (CORS, JSON parsing)
- Connects to MongoDB
- Initializes Socket.IO for real-time communication
- Registers API routes
- Starts the server on port 5000

#### Database Configuration (`server/config/db.js`)
- Handles MongoDB connection
- Uses environment variables for connection string
- Provides error handling and connection status logging

### Data Models

#### 1. Drone Model (`server/models/Drone.js`)
```javascript
{
  name: String (required),
  serialNumber: String (required, unique),
  model: String (required),
  status: Enum ['available', 'in-mission', 'charging', 'maintenance', 'offline'],
  batteryLevel: Number (0-100),
  lastLocation: GeoJSON Point,
  lastCommunication: Date,
  assignedMission: ObjectId (ref: Mission)
}
```

#### 2. Mission Model (`server/models/Mission.js`)
```javascript
{
  name: String (required),
  description: String,
  surveyArea: GeoJSON Polygon,
  flightPath: [{
    latitude: Number,
    longitude: Number,
    altitude: Number
  }],
  altitude: Number (required),
  dataCollectionParameters: {
    frequency: Enum ['low', 'medium', 'high'],
    sensors: [String],
    overlapPercentage: Number (0-100)
  },
  missionPattern: Enum ['manual', 'crosshatch', 'perimeter'],
  patternParameters: {
    lineSpacing: Number,
    angle: Number,
    perimeterOffset: Number
  },
  status: Enum ['pending', 'in_progress', 'completed', 'aborted', 'paused'],
  droneId: ObjectId (ref: Drone),
  userId: ObjectId (ref: User),
  startTime: Date,
  endTime: Date
}
```

#### 3. Telemetry Model (`server/models/Telemetry.js`)
```javascript
{
  droneId: ObjectId (ref: Drone, required),
  missionId: ObjectId (ref: Mission),
  location: GeoJSON Point (required),
  altitude: Number (required),
  speed: Number,
  batteryLevel: Number (0-100, required),
  missionStatus: Enum ['starting', 'in progress', 'completed', 'aborted', 'paused'],
  timestamp: Date
}
```

#### 4. Report Model (`server/models/Report.js`)
```javascript
{
  missionId: ObjectId (ref: Mission),
  droneId: ObjectId (ref: Drone),
  userId: ObjectId (ref: User, required),
  reportType: Enum ['mission_summary', 'overall_org'],
  reportDate: Date,
  summary: String,
  flightStatistics: {
    duration: Number,
    distance: Number,
    coverage: Number,
    maxAltitude: Number,
    avgSpeed: Number
  },
  overallOrgStatistics: {
    totalSurveysDone: Number,
    totalFlightHours: Number,
    totalAreaCovered: Number
  },
  generatedBy: ObjectId (ref: User),
  status: Enum ['generated', 'pending_review', 'approved']
}
```

### Controllers

#### 1. Drone Controller (`server/controllers/droneController.js`)
- `createDrone`: Create new drone
- `getDrones`: Get all drones
- `getDroneById`: Get single drone
- `updateDrone`: Update drone information
- `deleteDrone`: Remove drone from system

#### 2. Mission Controller (`server/controllers/missionController.js`)
- `createMission`: Create new mission
- `getMissions`: Get all missions
- `getMissionById`: Get single mission
- `updateMission`: Update mission details
- `deleteMission`: Remove mission
- `pauseMission`: Pause active mission
- `resumeMission`: Resume paused mission
- `startMission`: Start pending mission
- `abortMission`: Abort mission
- `completeMission`: Mark mission as completed

#### 3. Telemetry Controller (`server/controllers/telemetryController.js`)
- `createTelemetry`: Add telemetry data (with Socket.IO broadcast)
- `getTelemetry`: Get all telemetry data
- `getTelemetryByDroneId`: Get telemetry for specific drone

#### 4. Report Controller (`server/controllers/reportController.js`)
- `createReport`: Generate new report
- `getReports`: Get all reports
- `getReportById`: Get single report
- `updateReport`: Update report
- `deleteReport`: Remove report

### API Routes

#### Drone Routes (`/api/drones`)
- `POST /` - Create drone
- `GET /` - Get all drones
- `GET /:id` - Get drone by ID
- `PUT /:id` - Update drone
- `DELETE /:id` - Delete drone

#### Mission Routes (`/api/missions`)
- `POST /` - Create mission
- `GET /` - Get all missions
- `GET /:id` - Get mission by ID
- `PUT /:id` - Update mission
- `DELETE /:id` - Delete mission
- `PUT /:id/pause` - Pause mission
- `PUT /:id/resume` - Resume mission
- `PUT /:id/start` - Start mission
- `PUT /:id/abort` - Abort mission
- `PUT /:id/complete` - Complete mission

#### Telemetry Routes (`/api/telemetry`)
- `POST /` - Create telemetry data
- `GET /` - Get all telemetry
- `GET /drone/:droneId` - Get telemetry by drone

#### Report Routes (`/api/reports`)
- `POST /` - Create report
- `GET /` - Get all reports
- `GET /:id` - Get report by ID
- `PUT /:id` - Update report
- `DELETE /:id` - Delete report

---

## Frontend Documentation

### Application Structure

#### Main App Component (`client/src/App.jsx`)
- Tab-based navigation system
- State management for active tab
- Renders different components based on selected tab
- Persistent tab selection using localStorage

#### Feature Components

##### 1. Mission Form (`client/src/features/missions/MissionForm.jsx`)
**Purpose**: Create and configure new drone survey missions

**Key Features**:
- Mission details input (name, description, altitude)
- Survey area definition using coordinate points
- Waypoint management with latitude, longitude, and altitude
- Data collection parameters configuration
- Mission pattern selection (manual, crosshatch, perimeter)
- Pattern-specific parameters (line spacing, angle, perimeter offset)
- Sensor selection (RGB, Thermal, LiDAR)
- Form validation and error handling

**State Management**:
- Local state for form inputs
- Waypoint array management
- Survey area polygon coordinates
- Real-time form validation

##### 2. Drone Dashboard (`client/src/features/drones/DroneDashboard.jsx`)
**Purpose**: Manage drone fleet inventory and monitor drone status

**Key Features**:
- Drone statistics overview (total, available, in-mission, charging)
- Drone grid display with status cards
- Add new drone functionality
- Real-time battery level visualization
- Location display and management
- Status color coding and indicators

**State Management**:
- Drone list state
- Loading and error states
- Form state for new drone creation

##### 3. Mission Monitoring (`client/src/features/missions/MissionMonitoring.jsx`)
**Purpose**: Monitor active missions and view real-time telemetry

**Key Features**:
- Interactive map integration
- Mission status tracking
- Real-time telemetry updates via WebSocket
- Mission action controls (start, pause, resume, abort, complete)
- Progress tracking and ETA calculation
- Mission card display with detailed information

**State Management**:
- Mission list state
- Telemetry data state
- WebSocket connection management
- Real-time updates handling

##### 4. Reports Dashboard (`client/src/features/reports/ReportsDashboard.jsx`)
**Purpose**: Generate and view analytics reports

**Key Features**:
- Statistics overview cards
- Mission status distribution charts
- Flight duration trends
- Distance vs altitude analysis
- Mission pattern distribution
- Data visualization using Recharts

**State Management**:
- Report data state
- Mission statistics calculation
- Chart data generation

##### 5. Drone Map (`client/src/features/map/DroneMap.jsx`)
**Purpose**: Interactive mapping component for mission visualization

**Key Features**:
- Leaflet map integration
- Mission area polygon display
- Flight path visualization
- Waypoint markers with numbering
- Real-time drone position tracking
- Animated drone movement for active missions
- Interactive popups with detailed information
- Map legend and controls

**State Management**:
- Map instance management
- Marker and path references
- Animation control
- Real-time position updates

### State Management

#### Redux Store (`client/src/store.js`)
- Configured with Redux Toolkit
- Currently includes counter slice (example)
- Ready for expansion with additional slices

#### API Client (`client/src/lib/api.js`)
- Axios-based HTTP client
- Configurable base URL
- Centralized API configuration

### Styling

#### CSS Architecture (`client/src/App.css`)
- Component-based styling
- Responsive design implementation
- Color scheme and theming
- Interactive element styling
- Map and chart styling
- Mobile-first responsive design

**Key Style Categories**:
- App layout and navigation
- Form styling and validation
- Card-based component layouts
- Interactive map styling
- Chart and visualization styling
- Responsive breakpoints

---

## Database Schema

### Collections Overview

1. **drones**: Drone fleet management
2. **missions**: Mission planning and execution
3. **telemetry**: Real-time drone data
4. **reports**: Analytics and reporting
5. **users**: User management (placeholder)

### Relationships

```
Users ──┐
        ├── Missions (userId)
        └── Reports (userId, generatedBy)

Drones ──┐
         ├── Missions (droneId)
         └── Telemetry (droneId)

Missions ──┐
           ├── Telemetry (missionId)
           └── Reports (missionId)
```

### Indexing Strategy

- **Drones**: `serialNumber` (unique), `status`
- **Missions**: `status`, `droneId`, `userId`, `createdAt`
- **Telemetry**: `droneId`, `timestamp`, `missionId`
- **Reports**: `reportType`, `reportDate`, `userId`

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Currently no authentication implemented. All endpoints are public.

### Response Format
```json
{
  "success": boolean,
  "data": object | array,
  "count": number (for list endpoints),
  "error": string (for error responses)
}
```

### Error Handling
- **400**: Bad Request (validation errors)
- **404**: Not Found (resource not found)
- **500**: Internal Server Error

### Rate Limiting
Not currently implemented.

---

## Features and Functionality

### 1. Mission Planning
- **Waypoint Management**: Define flight paths with precise coordinates
- **Survey Area Definition**: Create polygon areas for survey coverage
- **Mission Patterns**: Support for manual, crosshatch, and perimeter patterns
- **Data Collection Configuration**: Set sensors, frequency, and overlap parameters
- **Altitude Management**: Configure flight altitude for missions

### 2. Fleet Management
- **Drone Inventory**: Add, update, and remove drones from fleet
- **Status Tracking**: Real-time status monitoring (available, in-mission, charging, maintenance, offline)
- **Battery Monitoring**: Visual battery level indicators
- **Location Tracking**: Last known position display
- **Communication Status**: Last communication timestamp

### 3. Real-time Monitoring
- **Live Telemetry**: Real-time drone position and status updates
- **Mission Progress**: Visual progress tracking for active missions
- **Interactive Maps**: Real-time drone position on interactive maps
- **WebSocket Integration**: Live updates without page refresh
- **Mission Controls**: Start, pause, resume, abort, and complete missions

### 4. Analytics and Reporting
- **Mission Statistics**: Overview of mission completion rates
- **Flight Analytics**: Duration, distance, and altitude trends
- **Fleet Performance**: Drone utilization and performance metrics
- **Visual Charts**: Interactive charts and graphs
- **Export Capabilities**: Report generation and export

### 5. Interactive Mapping
- **Mission Visualization**: Display mission areas and flight paths
- **Real-time Tracking**: Live drone position updates
- **Waypoint Display**: Numbered waypoint markers
- **Area Coverage**: Survey area polygon visualization
- **Map Controls**: Zoom, pan, and legend controls

---

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Backend Setup

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create `.env` file in server directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/dronacharya
   PORT=5000
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create `.env` file in client directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

### Database Setup

1. **Start MongoDB service**:
   ```bash
   mongod
   ```

2. **Create database** (optional):
   ```bash
   mongo
   use dronacharya
   ```

### Full Application Startup

1. **Start MongoDB**
2. **Start Backend**: `cd server && npm run dev`
3. **Start Frontend**: `cd client && npm run dev`
4. **Access Application**: `http://localhost:5173`

---

## Development Guidelines

### Code Style
- Use ESLint configuration provided
- Follow React best practices
- Use meaningful variable and function names
- Add comments for complex logic

### Git Workflow
- Use feature branches for new features
- Write descriptive commit messages
- Test before committing
- Use pull requests for code review

### API Development
- Follow RESTful conventions
- Use consistent response formats
- Implement proper error handling
- Add input validation

### Frontend Development
- Use functional components with hooks
- Implement proper state management
- Follow responsive design principles
- Optimize for performance

### Database Design
- Use appropriate data types
- Implement proper indexing
- Follow MongoDB best practices
- Plan for scalability

---

## Deployment

### Production Environment Setup

#### Backend Deployment
1. **Environment Variables**:
   ```env
   NODE_ENV=production
   MONGO_URI=mongodb://production-server:27017/dronacharya
   PORT=5000
   ```

2. **Build and Start**:
   ```bash
   npm start
   ```

#### Frontend Deployment
1. **Build for Production**:
   ```bash
   npm run build
   ```

2. **Serve Static Files**:
   Use nginx, Apache, or CDN to serve built files

#### Database Deployment
- Use MongoDB Atlas for cloud deployment
- Configure replica sets for high availability
- Set up proper backup strategies

### Docker Deployment (Optional)

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## Future Enhancements

### Planned Features

1. **User Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - User management system

2. **Advanced Mission Planning**
   - 3D mission visualization
   - Weather integration
   - Flight path optimization
   - Collision avoidance

3. **Enhanced Analytics**
   - Machine learning insights
   - Predictive maintenance
   - Performance optimization
   - Custom report generation

4. **Mobile Application**
   - React Native mobile app
   - Offline capability
   - Push notifications
   - Field data collection

5. **Integration Capabilities**
   - Third-party drone APIs
   - GIS system integration
   - Cloud storage integration
   - External reporting systems

6. **Advanced Features**
   - Multi-drone coordination
   - Automated mission scheduling
   - Emergency response protocols
   - Compliance reporting

### Technical Improvements

1. **Performance Optimization**
   - Database query optimization
   - Caching implementation
   - CDN integration
   - Code splitting

2. **Security Enhancements**
   - API rate limiting
   - Input sanitization
   - HTTPS enforcement
   - Security headers

3. **Monitoring & Logging**
   - Application monitoring
   - Error tracking
   - Performance metrics
   - Audit logging

4. **Testing**
   - Unit testing
   - Integration testing
   - End-to-end testing
   - Performance testing

---

## Conclusion

Dronacharya is a comprehensive drone survey management system that provides end-to-end functionality for planning, executing, and monitoring drone missions. The system is built with modern web technologies and follows best practices for scalability and maintainability.

The modular architecture allows for easy extension and customization, while the real-time capabilities provide immediate feedback and monitoring capabilities. The system is ready for production deployment with proper environment configuration and can be easily extended with additional features as requirements evolve.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Maintained By**: Development Team
