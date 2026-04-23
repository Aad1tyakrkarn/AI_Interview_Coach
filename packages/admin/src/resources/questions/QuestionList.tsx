import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  FunctionField,
  TextInput,
  SelectInput,
  BooleanInput,
  DateField,
} from 'react-admin';
import { Chip, Box } from '@mui/material';

const questionFilters = [
  <TextInput key="q" source="q" label="Search text" alwaysOn />,
  <SelectInput
    key="category"
    source="category"
    choices={[
      { id: 'behavioral', name: 'Behavioral' },
      { id: 'technical', name: 'Technical' },
      { id: 'situational', name: 'Situational' },
      { id: 'system-design', name: 'System Design' },
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
  <BooleanInput key="isActive" source="isActive" label="Active" />,
];

export const QuestionList = () => (
  <List
    filters={questionFilters}
    sort={{ field: 'createdAt', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid rowClick="show">
      <FunctionField
        label="Text"
        render={(record: any) =>
          record.text && record.text.length > 80
            ? `${record.text.substring(0, 80)}...`
            : record.text ?? ''
        }
      />
      <FunctionField
        label="Category"
        render={(record: any) => (
          <Chip label={record.category} size="small" variant="outlined" />
        )}
      />
      <FunctionField
        label="Difficulty"
        render={(record: any) => (
          <Chip
            label={record.difficulty}
            size="small"
            color={
              record.difficulty === 'hard'
                ? 'error'
                : record.difficulty === 'medium'
                  ? 'warning'
                  : 'success'
            }
          />
        )}
      />
      <FunctionField
        label="Tags"
        render={(record: any) => {
          const tags = record.tags || record.jobRoles || [];
          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {tags.slice(0, 3).map((tag: string, i: number) => (
                <Chip key={i} label={tag} size="small" variant="outlined" />
              ))}
              {tags.length > 3 && (
                <Chip label={`+${tags.length - 3}`} size="small" />
              )}
            </Box>
          );
        }}
      />
      <BooleanField source="isActive" label="Active" />
      <DateField source="createdAt" label="Created" />
    </Datagrid>
  </List>
);
