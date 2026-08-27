## Meridian lite

`meridian-lite` is a lightweight, offline-first sync SDK for Expo (React Native) and React Web. It implements the transactional outbox pattern on the client. The SDK stores changes in a local database (SQLite on native, IndexedDB on web) when offline, and syncs them in order when online.

Unlike the full [Meridian SDK](https://github.com/giridhar7632/meridian), Meridian Lite does not require a backend. It uses inversion of control (IoC). You supply an `onSync` callback that dictates how the client pushes local mutations to your database, REST API, or GraphQL server.

### Features

- **Zero backend dependencies.** The SDK syncs with any database or API.
- **Universal platform support.** The SDK uses `expo-sqlite` on iOS and Android, and `idb-keyval` on web.
- **FIFO order.** The SDK processes pending mutations in strict first-in, first-out order.
- **Built-in query caching.** Fetch, cache, and automatically invalidate local or remote queries using `useQuery` and `useMeridianMutation`.
- **Optimistic local writes.** Update local database tables immediately before enqueuing mutations to the outbox.
- **Retry and dead-letter queue.** Automatically retries failed syncs with configurable thresholds.
- **SQLite migrations.** Appending migrations to the config bootstraps and updates local tables like `todos` or `users` on native devices, without manual SQLite connection management.

### Installation

Install the library:

```bash
npm install meridian-lite
```

### Peer dependencies

Install these dependencies in your project:

- **Expo and React Native.** `expo-sqlite`, `expo-crypto`, and `expo-network`
- **Web.** `idb-keyval`

### How to use Meridian Lite effectively

In an offline-first app, your local database is the source of truth for your UI:

1. **Read from local database.** Use `useQuery` to read directly from your local SQLite tables. Your UI renders instantly, offline or online.
2. **Write to local database and outbox.** When a user creates or edits data, use `useMeridianMutation`. Write changes directly to your local table in `onMutate` for instant UI updates, while the SDK enqueues the mutation in the local outbox table.
3. **Automatic background sync.** When online, Meridian Lite reads pending records from the outbox in strict FIFO order and calls your `onSync` callback to update your server.
4. **Auto-invalidation.** Once a mutation syncs, `useMeridianMutation` invalidates matching query keys so `useQuery` automatically re-runs and updates your UI with any server changes.

### Developer guide

#### 1. Wrap your app with `MeridianProvider`

Place `MeridianProvider` at the root of your application. Pass your database scope, migrations, and sync callback to the provider:

```tsx
import React from "react";
import { MeridianProvider, type MutationRecord } from "meridian-lite";

// 1. Define local SQLite tables for your app.
// Meridian Lite runs these migrations on native startup.
const databaseMigrations = [
  `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0
  );`
];

// 2. Define how local mutations sync to your server.
const handleSync = async (mutation: MutationRecord) => {
  const response = await fetch("https://api.my-app.com/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mutation),
  });

  if (!response.ok) {
    // Throwing an error halts the FIFO queue.
    // Meridian Lite retries the mutation on the next network cycle.
    throw new Error(`Sync failed with status ${response.status}`);
  }
};

export default function App() {
  return (
    <MeridianProvider
      appName="todo_app" // Scopes SQLite db to "meridian_lite_todo_app.db"
      migrations={databaseMigrations} // Runs migrations on native launch
      onSync={handleSync}
      maxRetries={5}
      onDeadLetter={(mutation, error) => {
        console.error("Mutation failed permanently:", mutation, error);
      }}
    >
      <MainApp />
    </MeridianProvider>
  );
}
```

### 2. Reading local database tables with `useQuery`

Use `useQuery` to read from your local SQLite database:

```tsx
import React from "react";
import { useQuery } from "meridian-lite";
import * as SQLite from "expo-sqlite";

interface Todo {
  id: string;
  title: string;
  done: number;
}

export function TodoList() {
  // Reads directly from the local SQLite database for instant UI rendering
  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: async () => {
      const db = await SQLite.openDatabaseAsync("meridian_lite_todo_app.db");
      return db.getAllAsync<Todo>("SELECT * FROM todos ORDER BY id DESC");
    },
  });

  if (isLoading) return <p>Loading todos...</p>;

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>
          {todo.title} {todo.done ? "(completed)" : ""}
        </li>
      ))}
    </ul>
  );
}
```

### 3. Writing to local storage and outbox with `useMeridianMutation`

Use `useMeridianMutation` to apply local updates immediately and enqueue background sync:

```tsx
import React, { useState } from "react";
import { useMeridianMutation } from "meridian-lite";
import * as SQLite from "expo-sqlite";

export function CreateTodo() {
  const [title, setTitle] = useState("");

  const { mutate, isOnline, isSyncing } = useMeridianMutation({
    // Automatically refetches ["todos"] after mutation and sync
    invalidateKeys: [["todos"]],

    // 1. Optimistic write: insert directly into local SQLite table
    onMutate: async ({ payload }) => {
      const { id, title: todoTitle } = payload as { id: string; title: string };
      const db = await SQLite.openDatabaseAsync("meridian_lite_todo_app.db");
      await db.runAsync(
        "INSERT INTO todos (id, title, done) VALUES (?, ?, 0)",
        id,
        todoTitle
      );
    },
  });

  const handleSave = async () => {
    if (!title.trim()) return;

    const todoId = Date.now().toString();

    // 2. Enqueues mutation to outbox table and triggers onSync when online
    await mutate("create_todo", { id: todoId, title });
    setTitle("");
  };

  return (
    <div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <button onClick={handleSave} disabled={isSyncing}>
        {isSyncing ? "Syncing..." : "Add Todo"}
      </button>
      <p>Device status: {isOnline ? "Online" : "Offline (saving locally)"}</p>
    </div>
  );
}
```

### 4. Direct outbox storage access

For debugging or queue inspection, use `getStorage` to interact directly with the underlying outbox:

```tsx
import { getStorage } from "meridian-lite";

async function inspectOutbox() {
  const storage = await getStorage("todo_app");
  const pending = await storage.getPending();
  console.log(`Pending outbox records: ${pending.length}`, pending);
}
```

### 5. Schema evolution and migrations (native SQLite)

Manage schema updates carefully when changing database tables, such as adding columns or indexes.

Meridian Lite tracks SQLite migrations using `PRAGMA user_version`:
- Each index in the `migrations` array corresponds to a database version. For example, `migrations[0]` updates the database to version 1, and `migrations[1]` updates it to version 2.
- On startup, the SDK checks the database version. It runs only the migrations appended to the end of the array, then updates the version state.
- This prevents duplicate migrations from running and crashing the app.

#### Example: Deploying an update with a new column

1. **Initial release (version 1).**
```tsx
const databaseMigrations = [
  // Version 1
  `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0
  );`
];
```

2. **Next release (version 2) adding a description column.**
Append the update statement to the end of the `migrations` array:
```tsx
const databaseMigrations = [
  // Version 1 (runs for new installs)
  `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0
  );`,
  
  // Version 2 (runs for existing installs)
  `ALTER TABLE todos ADD COLUMN description TEXT;`
];
```

---

## How the sync loop works

1. When offline, running a mutation appends it to the local outbox.
2. When online, Meridian Lite reads all pending outbox records.
3. The loop processes each record sequentially and waits for the `onSync` promise to resolve.
4. If `onSync` resolves, the SDK deletes the record from the outbox and invalidates linked query keys.
5. If `onSync` rejects because of a server or network error, the mutation retry count increments. If it reaches `maxRetries`, the SDK removes the mutation and fires `onDeadLetter`. Otherwise, the loop stops to preserve FIFO order.
6. The sync loop runs again on network changes or manual calls to `sync()`.