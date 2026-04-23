import {
  List,
  Datagrid,
  TextField,
  EmailField,
  BooleanField,
  DateField,
  TextInput,
  SelectInput,
  BooleanInput,
  FunctionField,
} from 'react-admin';
import { Chip } from '@mui/material';

const userFilters = [
  <TextInput key="q" source="q" label="Search email/name" alwaysOn />,
  <SelectInput
    key="role"
    source="role"
    choices={[
      { id: 'admin', name: 'Admin' },
      { id: 'user', name: 'User' },
      { id: 'interviewer', name: 'Interviewer' },
    ]}
  />,
  <BooleanInput key="isVerified" source="isVerified" label="Verified" />,
];

export const UserList = () => (
  <List
    filters={userFilters}
    sort={{ field: 'lastLoginAt', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <EmailField source="email" />
      <TextField source="fullName" label="Name" />
      <FunctionField
        label="Role"
        render={(record: any) => (
          <Chip
            label={record.role}
            size="small"
            color={record.role === 'admin' ? 'error' : record.role === 'interviewer' ? 'warning' : 'default'}
            variant="outlined"
          />
        )}
      />
      <BooleanField source="isVerified" label="Verified" />
      <BooleanField source="isActive" label="Active" />
      <DateField source="lastLoginAt" label="Last Login" showTime />
      <DateField source="createdAt" label="Registered" />
    </Datagrid>
  </List>
);
