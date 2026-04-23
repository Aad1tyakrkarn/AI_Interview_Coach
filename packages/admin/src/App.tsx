import { Admin, Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';

import { dataProvider } from './providers/dataProvider';
import { authProvider } from './providers/authProvider';
import { AdminLayout } from './components/common/AdminLayout';

import { Dashboard } from './pages/Dashboard';
import { SystemHealth } from './pages/SystemHealth';
import { PeakUsage } from './pages/PeakUsage';
import { AuditLogs } from './pages/AuditLogs';

import { UserList } from './resources/users/UserList';
import { UserShow } from './resources/users/UserShow';
import { UserEdit } from './resources/users/UserEdit';

import { QuestionList } from './resources/questions/QuestionList';
import { QuestionCreate } from './resources/questions/QuestionCreate';
import { QuestionEdit } from './resources/questions/QuestionEdit';
import { QuestionShow } from './resources/questions/QuestionShow';

import { InterviewList } from './resources/interviews/InterviewList';
import { InterviewShow } from './resources/interviews/InterviewShow';
import { LiveMonitor } from './resources/interviews/LiveMonitor';

import { TicketList } from './resources/tickets/TicketList';
import { TicketShow } from './resources/tickets/TicketShow';
import { TicketEdit } from './resources/tickets/TicketEdit';

import { FeedbackList } from './resources/feedback/FeedbackList';
import { FeedbackReview } from './resources/feedback/FeedbackReview';

import { ModelList } from './resources/ml/ModelList';
import { DriftDashboard } from './resources/ml/DriftDashboard';
import { RetrainTrigger } from './resources/ml/RetrainTrigger';

import PeopleIcon from '@mui/icons-material/People';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import FeedbackIcon from '@mui/icons-material/Feedback';
import SmartToyIcon from '@mui/icons-material/SmartToy';

export const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    dashboard={Dashboard}
    layout={AdminLayout}
  >
    <Resource
      name="users"
      list={UserList}
      show={UserShow}
      edit={UserEdit}
      icon={PeopleIcon}
      options={{ label: 'Users' }}
    />
    <Resource
      name="questions"
      list={QuestionList}
      create={QuestionCreate}
      edit={QuestionEdit}
      show={QuestionShow}
      icon={QuizIcon}
      options={{ label: 'Questions' }}
    />
    <Resource
      name="interviews"
      list={InterviewList}
      show={InterviewShow}
      icon={AssignmentIcon}
      options={{ label: 'Interviews' }}
    />
    <Resource
      name="tickets"
      list={TicketList}
      show={TicketShow}
      edit={TicketEdit}
      icon={ConfirmationNumberIcon}
      options={{ label: 'Tickets' }}
    />
    <Resource
      name="feedback"
      list={FeedbackList}
      show={FeedbackReview}
      icon={FeedbackIcon}
      options={{ label: 'Feedback' }}
    />
    <Resource
      name="ml-models"
      list={ModelList}
      icon={SmartToyIcon}
      options={{ label: 'ML Models' }}
    />
    <CustomRoutes>
      <Route path="/system-health" element={<SystemHealth />} />
      <Route path="/peak-usage" element={<PeakUsage />} />
      <Route path="/audit-logs" element={<AuditLogs />} />
      <Route path="/interviews/live-monitor" element={<LiveMonitor />} />
      <Route path="/ml-models/drift" element={<DriftDashboard />} />
      <Route path="/ml-models/retrain" element={<RetrainTrigger />} />
    </CustomRoutes>
  </Admin>
);
