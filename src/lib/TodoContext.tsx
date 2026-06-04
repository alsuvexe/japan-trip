import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed_by: string[];
  assignees: string[];
  category: string;
  due_date: string | null;
}

const LS_KEY = 'japan_trip_tasks';

function readCache(): Todo[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Todo[];
  } catch { /* ignore */ }
  return [];
}

interface TodoContextValue {
  todos: Todo[];
  loading: boolean;
  addTodo: (payload: Omit<Todo, 'id'>) => Promise<void>;
  updateTodo: (id: string, payload: Partial<Omit<Todo, 'id'>>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  togglePersonCompletion: (todo: Todo, person: string) => Promise<void>;
  toggleAllAssignees: (todo: Todo) => Promise<void>;
}

const TodoContext = createContext<TodoContextValue | null>(null);

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>(() => readCache());
  const [loading, setLoading] = useState(true);
  const initialised = useRef(false);

  // Persist every change to localStorage
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(todos)); } catch { /* ignore */ }
  }, [todos]);

  // Fetch from Supabase once on mount — overwrites cache with source of truth
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setTodos(data.map((t) => ({
            ...t,
            assignees: Array.isArray(t.assignees) ? t.assignees : [],
            completed_by: Array.isArray(t.completed_by) ? t.completed_by : [],
          })));
        }
        setLoading(false);
      });
  }, []);

  const syncTodoToCalendar = useCallback(async (todoId: string, title: string, dueDate: string | null, assignee: string) => {
    await supabase.from('calendar_events').delete().eq('source', 'todo').eq('source_id', todoId);
    if (dueDate) {
      await supabase.from('calendar_events').insert({ title, event_date: dueDate, category: 'task', source: 'todo', source_id: todoId, assignee });
    }
  }, []);

  const addTodo = useCallback(async (payload: Omit<Todo, 'id'>) => {
    const { data } = await supabase.from('todos').insert(payload).select().maybeSingle();
    if (data) {
      setTodos((prev) => [...prev, {
        ...data,
        assignees: data.assignees ?? [],
        completed_by: data.completed_by ?? [],
      }]);
      await syncTodoToCalendar(data.id, payload.title, payload.due_date, payload.assignees[0] ?? '');
    }
  }, [syncTodoToCalendar]);

  const updateTodo = useCallback(async (id: string, payload: Partial<Omit<Todo, 'id'>>) => {
    const { data } = await supabase.from('todos').update(payload).eq('id', id).select().maybeSingle();
    if (data) {
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...payload } : t));
      if (payload.title !== undefined) {
        await syncTodoToCalendar(id, payload.title, payload.due_date ?? null, (payload.assignees ?? [])[0] ?? '');
      }
    }
  }, [syncTodoToCalendar]);

  const deleteTodo = useCallback(async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('todos').delete().eq('id', id);
    await supabase.from('calendar_events').delete().eq('source', 'todo').eq('source_id', id);
  }, []);

  const togglePersonCompletion = useCallback(async (todo: Todo, person: string) => {
    const alreadyDone = todo.completed_by.includes(person);
    const next = alreadyDone
      ? todo.completed_by.filter((p) => p !== person)
      : [...todo.completed_by, person];
    setTodos((prev) => prev.map((t) => t.id === todo.id ? { ...t, completed_by: next } : t));
    await supabase.from('todos').update({ completed_by: next }).eq('id', todo.id);
  }, []);

  const toggleAllAssignees = useCallback(async (todo: Todo) => {
    const allDone = todo.assignees.every((a) => todo.completed_by.includes(a));
    const next = allDone
      ? todo.completed_by.filter((p) => !todo.assignees.includes(p))
      : [...new Set([...todo.completed_by, ...todo.assignees])];
    setTodos((prev) => prev.map((t) => t.id === todo.id ? { ...t, completed_by: next } : t));
    await supabase.from('todos').update({ completed_by: next }).eq('id', todo.id);
  }, []);

  return (
    <TodoContext.Provider value={{ todos, loading, addTodo, updateTodo, deleteTodo, togglePersonCompletion, toggleAllAssignees }}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodos must be used inside TodoProvider');
  return ctx;
}

// Shared helpers — same logic as TodoList so both sections agree
export const PEOPLE = ['Papa', 'Mama', 'Loli', 'Alberto'] as const;
export type Person = typeof PEOPLE[number];

export function calcPersonPct(todos: Todo[], person: Person): number {
  const assigned = todos.filter((t) => t.assignees.includes(person));
  if (assigned.length === 0) return 0;
  const done = assigned.filter((t) => t.completed_by.includes(person)).length;
  return Math.round((done / assigned.length) * 100);
}

export function calcOverallProgress(todos: Todo[]): number {
  const pcts = PEOPLE.map((p) => {
    const assigned = todos.filter((t) => t.assignees.includes(p));
    if (assigned.length === 0) return null;
    const done = assigned.filter((t) => t.completed_by.includes(p)).length;
    return Math.round((done / assigned.length) * 100);
  }).filter((p): p is number => p !== null);
  if (pcts.length > 0) return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  if (todos.length === 0) return 0;
  return Math.round((todos.filter((t) => t.completed_by.length > 0).length / todos.length) * 100);
}

export function isFullyDone(todo: Todo): boolean {
  if (todo.assignees.length === 0) return todo.completed_by.length > 0;
  return todo.assignees.every((a) => todo.completed_by.includes(a));
}
