import {
  Show,
  TabbedShowLayout,
  TextField,
  EmailField,
  BooleanField,
  DateField,
  NumberField,
  ReferenceManyField,
  Datagrid,
  FunctionField,
} from 'react-admin';
import { Chip, Box, Typography } from '@mui/material';

export const UserShow = () => (
  <Show>
    <TabbedShowLayout>
      <TabbedShowLayout.Tab label="Profile">
        <TextField source="id" />
        <EmailField source="email" />
        <TextField source="fullName" label="Full Name" />
        <FunctionField
          label="Role"
          render={(record: any) => (
            <Chip
              label={record?.role}
              size="small"
              color={
                record?.role === 'admin'
                  ? 'error'
                  : record?.role === 'interviewer'
                    ? 'warning'
                    : 'default'
              }
            />
          )}
        />
        <BooleanField source="isVerified" label="Email Verified" />
        <BooleanField source="isActive" label="Active" />
        <DateField source="createdAt" label="Registered" showTime />
        <DateField source="lastLoginAt" label="Last Login" showTime />
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Interviews">
        <ReferenceManyField
          reference="interviews"
          target="userId"
          label=""
          sort={{ field: 'startedAt', order: 'DESC' }}
        >
          <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="mode" />
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
                        : 'default'
                  }
                />
              )}
            />
            <TextField source="jobRole" label="Job Role" />
            <TextField source="difficulty" />
            <NumberField source="overallScore" label="Score" />
            <DateField source="startedAt" label="Started" showTime />
          </Datagrid>
        </ReferenceManyField>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Stats">
        <FunctionField
          label="Summary"
          render={(record: any) => (
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Interview Count
                </Typography>
                <Typography variant="h5">
                  {record?.interviewCount ?? '--'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Session Count
                </Typography>
                <Typography variant="h5">
                  {record?.sessionCount ?? '--'}
                </Typography>
              </Box>
            </Box>
          )}
        />
      </TabbedShowLayout.Tab>
    </TabbedShowLayout>
  </Show>
);
