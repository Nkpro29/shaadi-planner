import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BudgetPage } from './screens/Budget';
import { CalendarPage } from './screens/Calendar';
import { Dashboard } from './screens/Dashboard';
import { EventsPage } from './screens/Events';
import { FamilyPage } from './screens/Family';
import { GiftsPage } from './screens/Gifts';
import { GuestsPage } from './screens/Guests';
import { MediaPage } from './screens/Media';
import { ShoppingPage } from './screens/Shopping';
import { TasksPage } from './screens/Tasks';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="family" element={<FamilyPage />} />
        <Route path="gifts" element={<GiftsPage />} />
        <Route path="guests" element={<GuestsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
