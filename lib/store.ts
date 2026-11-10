import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { Group, Link } from "./types";

/**
 * The archive's storage: users/{uid}/groups and users/{uid}/links in
 * Firestore, or memory on the demo page.
 */
export type Collection = "groups" | "links";
export type Op =
  | { type: "set"; col: "groups"; doc: Group }
  | { type: "set"; col: "links"; doc: Link }
  | { type: "update"; col: Collection; id: string; patch: object }
  | { type: "delete"; col: Collection; id: string };
export type Snapshot = { groups: Group[]; links: Link[] };
export type Store = {
  subscribe(onData: (s: Snapshot) => void, onError: () => void): () => void;
  read(): Promise<Snapshot>;
  write(ops: Op[]): Promise<void>;
};

export function sortSnapshot(s: Snapshot): Snapshot {
  return {
    groups: [...s.groups].sort((a, b) => a.position - b.position),
    links: [...s.links].sort(
      (a, b) =>
        a.position - b.position || a.created_at.localeCompare(b.created_at),
    ),
  };
}

/** Firestore allows 500 writes per batch. */
const BATCH = 450;

export function firestoreStore(db: Firestore, uid: string): Store {
  const col = (name: Collection) => collection(db, "users", uid, name);
  const rows = <T>(docs: { id: string; data(): object }[]) =>
    docs.map((d) => ({ ...d.data(), id: d.id }) as T);
  return {
    subscribe(onData, onError) {
      let groups: Group[] | null = null;
      let links: Link[] | null = null;
      const emit = () =>
        groups && links && onData(sortSnapshot({ groups, links }));
      const stops = [
        onSnapshot(
          col("groups"),
          (s) => {
            groups = rows<Group>(s.docs);
            emit();
          },
          onError,
        ),
        onSnapshot(
          col("links"),
          (s) => {
            links = rows<Link>(s.docs);
            emit();
          },
          onError,
        ),
      ];
      return () => stops.forEach((stop) => stop());
    },
    async read() {
      const [g, l] = await Promise.all([
        getDocs(col("groups")),
        getDocs(col("links")),
      ]);
      return sortSnapshot({
        groups: rows<Group>(g.docs),
        links: rows<Link>(l.docs),
      });
    },
    async write(ops) {
      for (let i = 0; i < ops.length; i += BATCH) {
        const batch = writeBatch(db);
        for (const op of ops.slice(i, i + BATCH)) {
          if (op.type === "set") {
            const { id, ...data } = op.doc;
            batch.set(doc(col(op.col), id), data);
          } else if (op.type === "update") {
            batch.update(doc(col(op.col), op.id), { ...op.patch });
          } else {
            batch.delete(doc(col(op.col), op.id));
          }
        }
        await batch.commit();
      }
    },
  };
}

/** Demo page: data stays in the page. */
export function memoryStore(data: Snapshot): Store {
  return {
    subscribe(onData) {
      onData(sortSnapshot(data));
      return () => {};
    },
    read: async () => sortSnapshot(data),
    write: async () => {},
  };
}
