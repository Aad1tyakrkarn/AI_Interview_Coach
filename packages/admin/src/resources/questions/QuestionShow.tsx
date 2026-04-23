import {
  Show,
  SimpleShowLayout,
  TextField,
  BooleanField,
  DateField,
  NumberField,
  FunctionField,
} from 'react-admin';
import { Chip, Box } from '@mui/material';

export const QuestionShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="text" label="Question Text" sx={{ whiteSpace: 'pre-wrap' }} />
      <FunctionField
        label="Category"
        render={(record: any) => (
          <Chip label={record?.category} variant="outlined" />
        )}
      />
      <TextField source="subcategory" label="Subcategory" />
      <FunctionField
        label="Difficulty"
        render={(record: any) => (
          <Chip
            label={record?.difficulty}
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
      <TextField source="expectedAnswer" label="Expected Answer" sx={{ whiteSpace: 'pre-wrap' }} />
      <FunctionField
        label="Hints"
        render={(record: any) => {
          const hints = record?.hints || [];
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {hints.length > 0
                ? hints.map((hint: string, i: number) => (
                    <Chip key={i} label={hint} size="small" variant="outlined" />
                  ))
                : '--'}
            </Box>
          );
        }}
      />
      <FunctionField
        label="Tags"
        render={(record: any) => {
          const tags = record?.tags || record?.jobRoles || [];
          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {tags.length > 0
                ? tags.map((tag: string, i: number) => (
                    <Chip key={i} label={tag} size="small" color="primary" variant="outlined" />
                  ))
                : '--'}
            </Box>
          );
        }}
      />
      <TextField source="roleId" label="Role ID" />
      <NumberField source="timeLimitSeconds" label="Time Limit (seconds)" />
      <BooleanField source="isActive" label="Active" />
      <DateField source="createdAt" label="Created" showTime />
      <DateField source="updatedAt" label="Updated" showTime />
    </SimpleShowLayout>
  </Show>
);
