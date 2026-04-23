import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  NumberField,
  TextInput,
  SelectInput,
  FunctionField,
} from 'react-admin';
import { Chip } from '@mui/material';

const interviewFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <SelectInput
    key="mode"
    source="mode"
    choices={[
      { id: 'voice', name: 'Voice' },
      { id: 'video', name: 'Video' },
      { id: 'text', name: 'Text' },
    ]}
  />,
  <SelectInput
    key="status"
    source="status"
    choices={[
      { id: 'scheduled', name: 'Scheduled' },
      { id: 'in_progress', name: 'In Progress' },
      { id: 'completed', name: 'Completed' },
      { id: 'cancelled', name: 'Cancelled' },
    ]}
  />,
  <SelectInput
    key="difficulty"
    source="difficulty"
    choices={[
      { id: 'easy', name: 'Easy' },
      { id: 'medium', name: 'Medium' },
      { id: 'hard', name: 'Hard' },
    ]}
  />,
];

export const InterviewList = () => (
  <List
    filters={interviewFilters}
    sort={{ field: 'startedAt', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <ReferenceField source="userId" reference="users" link="show" label="User">
        <TextField source="email" />
      </ReferenceField>
      <TextField source="title" label="Title" />
      <FunctionField
        label="Mode"
        render={(record: any) => (
          <Chip label={record?.mode} size="small" variant="outlined" />
        )}
      />
      <FunctionField
        label="Status"
        render={(record: any) => (
          <Chip
            label={record?.status}
            size="small"
            color={
              record?.status === 'completed'
                ? 'success'
                : record?.status === 'in_progress'
                  ? 'warning'
                  : record?.status === 'cancelled'
                    ? 'error'
                    : 'default'
            }
          />
        )}
      />
      <FunctionField
        label="Difficulty"
        render={(record: any) => (
          <Chip
            label={record?.difficulty}
            size="small"
            color={
              record?.difficulty === 'hard'
                ? 'error'
                : record?.difficulty === 'medium'
                  ? 'warning'
                  : 'success'
            }
          />
        )}
      />
      <NumberField source="overallScore" label="Score" />
      <DateField source="startedAt" label="Date" showTime />
    </Datagrid>
  </List>
);
