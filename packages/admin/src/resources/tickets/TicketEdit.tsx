import {
  Edit,
  SimpleForm,
  SelectInput,
  TextInput,
  TextField,
  Toolbar,
  SaveButton,
} from 'react-admin';

const TicketEditToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const TicketEdit = () => (
  <Edit>
    <SimpleForm toolbar={<TicketEditToolbar />}>
      <TextField source="id" />
      <TextField source="subject" />
      <SelectInput
        source="status"
        choices={[
          { id: 'open', name: 'Open' },
          { id: 'in_progress', name: 'In Progress' },
          { id: 'resolved', name: 'Resolved' },
          { id: 'closed', name: 'Closed' },
        ]}
      />
      <SelectInput
        source="priority"
        choices={[
          { id: 'low', name: 'Low' },
          { id: 'medium', name: 'Medium' },
          { id: 'high', name: 'High' },
          { id: 'critical', name: 'Critical' },
        ]}
      />
      <TextInput source="assignedTo" label="Assigned To" />
      <TextInput
        source="resolution"
        label="Resolution"
        multiline
        fullWidth
        rows={4}
      />
    </SimpleForm>
  </Edit>
);
