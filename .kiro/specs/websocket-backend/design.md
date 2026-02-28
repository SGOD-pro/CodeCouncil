# Design Document: WebSocket Backend for CodeCouncil

## Overview

The WebSocket backend is a real-time collaborative code editing server built with Node.js, Express, and the ws library. It enables multiple users to join virtual rooms where they can chat, edit files collaboratively, and save snapshots of their work. The system uses in-memory storage with Map objects for simplicity, avoiding database dependencies.

The server handles WebSocket connections for real-time bidirectional communication and provides a simple HTTP health check endpoint. All data is stored in memory and persists for the lifetime of the server process.

## Architecture

### High-Level Architecture

```
┌─────────────┐         WebSocket          ┌──────────────────┐
│   Client    │◄──────────────────────────►│  WebSocket       │
│  (Browser)  │         Connection          │  Server          │
└─────────────┘                             │  (Express + ws)  │
                                            └──────────────────┘
┌─────────────┐         HTTP GET                    │
│   Browser   │◄────────────────────────────────────┤
│  /health    │         JSON Response               │
└─────────────┘                                     │
                                                    ▼
                                            ┌──────────────────┐
                                            │  In-Memory       │
                                            │  Storage         │
                                            │  (Map objects)   │
                                            └──────────────────┘
```

### Component Architecture

The system consists of three main layers:

1. **Transport Layer**: Express HTTP server + WebSocket server (ws library)
2. **Business Logic Layer**: Event handlers for room management, messaging, file operations, and snapshots
3. **Data Layer**: In-memory Map objects for rooms and clients

### Technology Stack

- **Runtime**: Node.js
- **HTTP Framework**: Express
- **WebSocket Library**: ws
- **CORS**: cors middleware
- **Development**: nodemon for auto-reload

## Components and Interfaces

### Data Structures

#### Room Object
```javascript
{
  id: string,           // Unique room identifier (e.g., "ALPHA-4291")
  name: string,         // Human-readable room name
  messages: [           // Array of message objects
    {
      id: string,       // Unique message ID (UUID or timestamp-based)
      userName: string,
      avatarColor: string,
      content: string,
      timestamp: number // Unix timestamp in milliseconds
    }
  ],
  files: {              // Object mapping fileName to content
    [fileName]: string  // File content as string
  },
  snapshots: [          // Array of snapshot objects
    {
      id: string,       // Unique snapshot ID
      fileName: string,
      content: string,
      label: string,    // Descriptive label (e.g., "v1 Clean")
      timestamp: number
    }
  ]
}
```

#### Client Object
```javascript
{
  roomId: string,       // ID of the room the client is in
  userName: string,     // Display name of the user
  avatarColor: string   // Hex color code for avatar
}
```

#### Storage Maps
```javascript
// Map: roomId (string) → Room object
const rooms = new Map();

// Map: WebSocket connection → Client object
const clients = new Map();
```

### WebSocket Event Protocol

#### Client → Server Events

1. **JOIN_ROOM**
```javascript
{
  type: 'JOIN_ROOM',
  roomId: string,
  userName: string,
  avatarColor: string
}
```

2. **SEND_MESSAGE**
```javascript
{
  type: 'SEND_MESSAGE',
  roomId: string,
  userName: string,
  avatarColor: string,
  content: string
}
```

3. **UPDATE_FILE**
```javascript
{
  type: 'UPDATE_FILE',
  roomId: string,
  fileName: string,
  content: string
}
```

4. **SAVE_SNAPSHOT**
```javascript
{
  type: 'SAVE_SNAPSHOT',
  roomId: string,
  fileName: string,
  content: string,
  label: string
}
```

5. **CREATE_FILE**
```javascript
{
  type: 'CREATE_FILE',
  roomId: string,
  fileName: string
}
```

6. **DELETE_FILE**
```javascript
{
  type: 'DELETE_FILE',
  roomId: string,
  fileName: string
}
```

#### Server → Client Events

1. **ROOM_STATE** (sent to joining client only)
```javascript
{
  type: 'ROOM_STATE',
  messages: Array<Message>,
  files: Object<fileName, content>,
  snapshots: Array<Snapshot>,
  users: Array<{userName, avatarColor}>
}
```

2. **USER_JOINED** (broadcast to room except sender)
```javascript
{
  type: 'USER_JOINED',
  userName: string
}
```

3. **USER_LEFT** (broadcast to room)
```javascript
{
  type: 'USER_LEFT',
  userName: string
}
```

4. **NEW_MESSAGE** (broadcast to all in room including sender)
```javascript
{
  type: 'NEW_MESSAGE',
  message: {
    id: string,
    userName: string,
    avatarColor: string,
    content: string,
    timestamp: number
  }
}
```

5. **FILE_UPDATED** (broadcast to room)
```javascript
{
  type: 'FILE_UPDATED',
  fileName: string,
  content: string
}
```

6. **FILE_CREATED** (broadcast to room)
```javascript
{
  type: 'FILE_CREATED',
  fileName: string
}
```

7. **FILE_DELETED** (broadcast to room)
```javascript
{
  type: 'FILE_DELETED',
  fileName: string
}
```

8. **SNAPSHOT_SAVED** (broadcast to room)
```javascript
{
  type: 'SNAPSHOT_SAVED',
  snapshot: {
    id: string,
    fileName: string,
    content: string,
    label: string,
    timestamp: number
  }
}
```

### HTTP Endpoints

#### GET /health
Returns server health status and room count.

**Response:**
```javascript
{
  status: 'ok',
  rooms: number  // Count of active rooms
}
```

### Core Functions

#### createRoom(roomId)
Creates a new room with the given ID. If roomId is "ALPHA-4291", injects demo data.

**Parameters:**
- roomId: string

**Returns:** Room object

**Side Effects:**
- Adds room to rooms Map
- If roomId === "ALPHA-4291", populates with demo data

#### getDemoData()
Returns demo data structure for room ALPHA-4291.

**Returns:** Object with messages, files, and snapshots arrays

**Demo Data Content:**
- 3 messages from Arjun, Priya, and CodeCouncil AI
- 3 files: authController.js, styles.css, index.html
- 5 snapshots of authController.js (v1 Clean → v5 Fixed)

#### broadcastToRoom(roomId, event, excludeWs)
Sends an event to all clients in a room, optionally excluding one connection.

**Parameters:**
- roomId: string
- event: object (will be JSON.stringified)
- excludeWs: WebSocket (optional) - connection to exclude from broadcast

**Side Effects:**
- Sends event to all matching clients via WebSocket

#### getUsersInRoom(roomId)
Returns array of users currently in a room.

**Parameters:**
- roomId: string

**Returns:** Array<{userName, avatarColor}>

#### generateId()
Generates a unique ID for messages and snapshots.

**Returns:** string (UUID or timestamp-based)

## Data Models

### Message Model
- **id**: Unique identifier (string)
- **userName**: Display name of sender (string)
- **avatarColor**: Hex color code (string, e.g., "#FF5733")
- **content**: Message text (string)
- **timestamp**: Creation time (number, Unix milliseconds)

### File Model
Simple key-value mapping:
- **Key**: fileName (string)
- **Value**: content (string)

### Snapshot Model
- **id**: Unique identifier (string)
- **fileName**: Name of file being snapshotted (string)
- **content**: File content at snapshot time (string)
- **label**: Descriptive label (string, e.g., "v1 Clean")
- **timestamp**: Creation time (number, Unix milliseconds)

### Room Model
- **id**: Unique room identifier (string)
- **name**: Human-readable name (string)
- **messages**: Array of Message objects
- **files**: Object mapping fileName to content
- **snapshots**: Array of Snapshot objects

### Client Model
- **roomId**: ID of room client is in (string)
- **userName**: Display name (string)
- **avatarColor**: Hex color code (string)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

