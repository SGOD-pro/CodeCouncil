# Requirements Document

## Introduction

This document specifies the requirements for a real-time collaborative code editing backend using WebSocket technology. The system enables multiple users to join virtual rooms where they can chat, edit code files collaboratively, and save snapshots of their work. The backend is built with Node.js, Express, and the ws library, using in-memory storage for simplicity.

## Glossary

- **WebSocket_Server**: The Node.js server that handles WebSocket connections and manages real-time communication
- **Room**: A virtual space where users collaborate, containing messages, files, and snapshots
- **Client**: A WebSocket connection representing a user in a room
- **Snapshot**: A saved version of a file at a specific point in time with a descriptive label
- **Demo_Data**: Pre-populated sample content automatically injected into specific rooms

## Requirements

### Requirement 1: Server Initialization

**User Story:** As a system administrator, I want the WebSocket server to start on a specific port with proper configuration, so that clients can connect reliably.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL listen on port 3001
2. WHEN the server starts successfully, THE WebSocket_Server SHALL log "CodeCouncil WS running on port 3001"
3. THE WebSocket_Server SHALL enable CORS to allow connections from all origins
4. THE WebSocket_Server SHALL use Express for HTTP handling and ws library for WebSocket connections
5. THE WebSocket_Server SHALL provide a GET /health HTTP endpoint that returns JSON with status 'ok' and the number of active rooms

### Requirement 2: Room Management

**User Story:** As a developer, I want rooms to be created automatically when users join, so that collaboration spaces are available on demand.

#### Acceptance Criteria

1. WHEN a client joins a non-existent room, THE WebSocket_Server SHALL create the room with an empty state
2. THE WebSocket_Server SHALL store each room with properties: id, name, messages array, files object, and snapshots array
3. WHEN room ALPHA-4291 is created, THE WebSocket_Server SHALL inject Demo_Data into the room
4. WHEN all clients disconnect from a room, THE WebSocket_Server SHALL retain the room data in memory

### Requirement 3: Client Connection Management

**User Story:** As a user, I want to join a room with my identity, so that other users can see who I am.

#### Acceptance Criteria

1. WHEN a client sends a JOIN_ROOM event with roomId, userName, and avatarColor, THE WebSocket_Server SHALL add the client to the specified room
2. WHEN a client joins a room, THE WebSocket_Server SHALL send back a ROOM_STATE event containing messages, files, snapshots, and current users
3. WHEN a client joins a room, THE WebSocket_Server SHALL broadcast a USER_JOINED event to all other clients in the room
4. WHEN a client disconnects, THE WebSocket_Server SHALL remove the client from the clients Map
5. WHEN a client disconnects, THE WebSocket_Server SHALL broadcast a USER_LEFT event to remaining clients in the room

### Requirement 4: Real-time Messaging

**User Story:** As a user, I want to send messages to my room, so that I can communicate with collaborators in real-time.

#### Acceptance Criteria

1. WHEN a client sends a SEND_MESSAGE event with roomId, userName, avatarColor, and content, THE WebSocket_Server SHALL create a message with id, userName, avatarColor, content, and timestamp
2. WHEN a message is created, THE WebSocket_Server SHALL save it to the room's messages array
3. WHEN a message is saved, THE WebSocket_Server SHALL broadcast a NEW_MESSAGE event to all clients in the room
4. WHEN broadcasting NEW_MESSAGE, THE WebSocket_Server SHALL send the event to all clients including the original sender

### Requirement 5: File Operations

**User Story:** As a user, I want to create, update, and delete files in my room, so that I can manage the codebase collaboratively.

#### Acceptance Criteria

1. WHEN a client sends a CREATE_FILE event with roomId and fileName, THE WebSocket_Server SHALL add the file to the room's files object
2. WHEN a file is created, THE WebSocket_Server SHALL broadcast a FILE_CREATED event to all clients in the room
3. WHEN a client sends an UPDATE_FILE event with roomId, fileName, and content, THE WebSocket_Server SHALL update the file content in the room's files object
4. WHEN a file is updated, THE WebSocket_Server SHALL broadcast a FILE_UPDATED event to all clients in the room
5. WHEN a client sends a DELETE_FILE event with roomId and fileName, THE WebSocket_Server SHALL remove the file from the room's files object
6. WHEN a file is deleted, THE WebSocket_Server SHALL broadcast a FILE_DELETED event to all clients in the room

### Requirement 6: Snapshot Management

**User Story:** As a user, I want to save snapshots of files with descriptive labels, so that I can track the evolution of my code and revert if needed.

#### Acceptance Criteria

1. WHEN a client sends a SAVE_SNAPSHOT event with roomId, fileName, content, and label, THE WebSocket_Server SHALL create a snapshot with id, fileName, content, label, and timestamp
2. WHEN a snapshot is created, THE WebSocket_Server SHALL add it to the room's snapshots array
3. WHEN a snapshot is saved, THE WebSocket_Server SHALL broadcast a SNAPSHOT_SAVED event to all clients in the room

### Requirement 7: Demo Data Injection

**User Story:** As a developer, I want specific rooms to have pre-populated demo data, so that users can immediately see example content.

#### Acceptance Criteria

1. WHEN room ALPHA-4291 is created, THE WebSocket_Server SHALL inject 3 sample messages from users Arjun, Priya, and CodeCouncil AI
2. WHEN room ALPHA-4291 is created, THE WebSocket_Server SHALL inject 3 sample files: authController.js, styles.css, and index.html with sample content
3. WHEN room ALPHA-4291 is created, THE WebSocket_Server SHALL inject 5 snapshots of authController.js labeled from v1 Clean to v5 Fixed

### Requirement 8: Data Storage

**User Story:** As a system architect, I want all data stored in memory using Map objects, so that the system remains simple without database dependencies.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL use a Map object to store rooms with roomId as the key
2. THE WebSocket_Server SHALL use a Map object to store clients with WebSocket connection as the key
3. THE WebSocket_Server SHALL store client information including roomId, userName, and avatarColor
4. THE WebSocket_Server SHALL maintain all room data in memory throughout the server lifecycle

### Requirement 9: Project Configuration

**User Story:** As a developer, I want proper npm scripts and dependencies configured, so that I can easily run and develop the server.

#### Acceptance Criteria

1. THE package.json SHALL include a start script that runs "node server.js"
2. THE package.json SHALL include a dev script that runs "nodemon server.js"
3. THE package.json SHALL list express, ws, and cors as dependencies
4. THE package.json SHALL list nodemon as a devDependency
5. THE WebSocket_Server SHALL be implemented in a single file: Backend/server.js
