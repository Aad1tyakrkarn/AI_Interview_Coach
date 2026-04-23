import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  TextInput,
  SelectInput,
  FunctionField,
} from 'react-admin';
import { Chip } from '@mui/material';

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
};

const priorityColors: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const ticketFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <SelectInput
    key="status"
    source="status"
    choices={[
      { id: 'open', name: 'Open' },
      { id: 'in_progress', name: 'In Progress' },
      { id: 'resolved', name: 'Resolved' },
      { id: 'closed', name: 'Closed' },
    ]}
  />,
  <SelectInput
    key="priority"
    source="priority"
    choices={[
      { id: 'low', name: 'Low' },
      { id: 'medium', name: 'Medium' },
      { id: 'high', name: 'High' },
      { id: 'critical', name: 'Critical' },
    ]}
  />,
];

export const TicketList = () => (
  <List
    filters={ticketFilters}
    sort={{ field: 'createdAt', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid rowClick="show">
      <TextField source="subject" />
      <ReferenceField source="userId" reference="users" link="show" label="User">
        <TextField source="email" />
      </ReferenceField>
      <FunctionField
        label="Status"
        render={(record: any) => (
          <Chip
            label={record?.status}
            size="small"
            color={statusColors[record?.status] || 'default'}
          />
        )}
      />
      <FunctionField
        label="Priority"
        render={(record: any) => (
          <Chip
            label={record?.priority}
            size="small"
            color={priorityColors[record?.priority] || 'default'}
            variant={record?.priority === 'critical' ? 'filled' : 'outlined'}
          />
        )}
      />
      <TextField source="assignedTo" label="Assigned To" />
      <DateField source="createdAt" label="Created" showTime />
    </Datagrid>
  </List>
);
