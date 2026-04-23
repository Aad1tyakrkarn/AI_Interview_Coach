import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  ReferenceField,
  TextInput,
  FunctionField,
} from 'react-admin';
import { Chip } from '@mui/material';

const feedbackFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
];

export const FeedbackList = () => (
  <List
    filters={feedbackFilters}
    sort={{ field: 'createdAt', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <ReferenceField source="userId" reference="users" link="show" label="User">
        <TextField source="email" />
      </ReferenceField>
      <ReferenceField
        source="interviewId"
        reference="interviews"
        link="show"
        label="Interview"
      >
        <TextField source="id" />
      </ReferenceField>
      <FunctionField
        label="Score"
        render={(record: any) => {
          const score = record?.rating ?? record?.score;
          if (score == null) return '--';
          return (
            <Chip
              label={score}
              size="small"
              color={score >= 4 ? 'success' : score >= 3 ? 'warning' : 'error'}
            />
          );
        }}
      />
      <DateField source="createdAt" label="Date" showTime />
    </Datagrid>
  </List>
);
