import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { initialSafetyEvents, initialTasks, operator, SafetyEvent, Task, TaskStatus } from '@/data/mock';

type Incident = { id: string; type: string; severity: string; description: string; time: string };

type AppState = {
  operatorId: string;
  signIn: (id: string) => void;
  signOut: () => void;
  tasks: Task[];
  setTaskStatus: (id: string, status: TaskStatus) => void;
  alertActive: boolean;
  acknowledgeAlert: () => void;
  safetyEvents: SafetyEvent[];
  incidents: Incident[];
  submitIncident: (i: Omit<Incident, 'id' | 'time'>) => Incident;
};

const Ctx = createContext<AppState | null>(null);

const clock = () =>
  new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

/** In-memory session store. Swap internals for API calls when the backend lands. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [operatorId, setOperatorId] = useState(operator.id);
  const [tasks, setTasks] = useState(initialTasks);
  const [alertActive, setAlertActive] = useState(true);
  const [safetyEvents, setSafetyEvents] = useState(initialSafetyEvents);
  const [incidents, setIncidents] = useState<Incident[]>([
    { id: 'INC-1024', type: 'Proximity Hazard', severity: 'HIGH', description: 'Worker in blindspot', time: '09:41' },
  ]);

  const setTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
  }, []);

  const acknowledgeAlert = useCallback(() => {
    setAlertActive(false);
    setSafetyEvents((ev) => [
      { time: clock(), title: 'Person Detected (2.8m, Rear Swing)', detail: 'Acknowledged by operator', resolved: true },
      ...ev,
    ]);
  }, []);

  const submitIncident = useCallback(
    (i: Omit<Incident, 'id' | 'time'>) => {
      const created: Incident = {
        ...i,
        id: `INC-${1024 + incidents.length}`,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      };
      setIncidents((list) => [created, ...list]);
      return created;
    },
    [incidents.length],
  );

  const value = useMemo<AppState>(
    () => ({
      operatorId,
      signIn: setOperatorId,
      signOut: () => setOperatorId(operator.id),
      tasks,
      setTaskStatus,
      alertActive,
      acknowledgeAlert,
      safetyEvents,
      incidents,
      submitIncident,
    }),
    [operatorId, tasks, setTaskStatus, alertActive, acknowledgeAlert, safetyEvents, incidents, submitIncident],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppStateProvider>');
  return v;
}
