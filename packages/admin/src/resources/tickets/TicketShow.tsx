import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  RichTextField,
  ReferenceField,
  FunctionField,
} from 'react-admin';
import { Chip, Box, Typography } from '@mui/material';

export const TicketShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="subject" />
      <FunctionField
        label="Status"
        render={(record: any) => (
          <Chip
            label={record?.status}
            color={
              record?.status === 'resolved'
                ? 'success'
                : record?.status === 'in_progress'
                  ? 'warning'
                  : record?.status === 'open'
                    ? 'info'
                    : 'default'
            }
          />
        )}
      />
      <FunctionField
        label="Priority"
        render={(record: any) => (
          <Chip
            label={record?.priority}
            color={
              record?.priority === 'critical' || record?.priority === 'high'
                ? 'error'
                : record?.priority === 'medium'
                  ? 'warning'
                  : 'success'
            }
          />
        )}
      />
      <ReferenceField source="userId" reference="users" link="show" label="Submitted By">
        <FunctionField
          render={(record: any) => (
            <Box>
              <Typography variant="body2">{record?.email}</Typography>
              {record?.fullName && (
                <Typography variant="caption" color="textSecondary">
                  {record.fullName}
                </Typography>
              )}
            </Box>
          )}
        />
      </ReferenceField>
      <TextField source="assignedTo" label="Assigned To" />
      <RichTextField source="description" />
      <TextField source="resolution" label="Resolution" />
      <DateField source="createdAt" label="Created" showTime />
      <DateField source="updatedAt" label="Updated" showTime />
    </SimpleShowLayout>
  </Show>
);
