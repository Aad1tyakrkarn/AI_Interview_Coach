import {
  Edit,
  SimpleForm,
  SelectInput,
  BooleanInput,
  TextField,
  EmailField,
  Toolbar,
  SaveButton,
} from 'react-admin';

const UserEditToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm toolbar={<UserEditToolbar />}>
      <TextField source="id" />
      <EmailField source="email" />
      <TextField source="fullName" label="Full Name" />
      <SelectInput
        source="role"
        choices={[
          { id: 'admin', name: 'Admin' },
          { id: 'user', name: 'User' },
          { id: 'interviewer', name: 'Interviewer' },
        ]}
      />
      <BooleanInput source="isActive" label="Active" />
      <BooleanInput source="isVerified" label="Email Verified" />
    </SimpleForm>
  </Edit>
);
