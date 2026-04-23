import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  ArrayInput,
  SimpleFormIterator,
  BooleanInput,
  NumberInput,
  required,
} from 'react-admin';

export const QuestionEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput
        source="text"
        multiline
        fullWidth
        rows={4}
        label="Question Text"
        validate={required()}
      />
      <SelectInput
        source="category"
        choices={[
          { id: 'behavioral', name: 'Behavioral' },
          { id: 'technical', name: 'Technical' },
          { id: 'situational', name: 'Situational' },
          { id: 'system-design', name: 'System Design' },
        ]}
        validate={required()}
      />
      <TextInput source="subcategory" />
      <SelectInput
        source="difficulty"
        choices={[
          { id: 'easy', name: 'Easy' },
          { id: 'medium', name: 'Medium' },
          { id: 'hard', name: 'Hard' },
        ]}
        validate={required()}
      />
      <TextInput
        source="expectedAnswer"
        multiline
        fullWidth
        rows={3}
        label="Expected Answer"
      />
      <ArrayInput source="hints" label="Hints">
        <SimpleFormIterator>
          <TextInput source="" label="Hint" fullWidth />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="tags" label="Tags">
        <SimpleFormIterator>
          <TextInput source="" label="Tag" />
        </SimpleFormIterator>
      </ArrayInput>
      <TextInput source="roleId" label="Role ID" />
      <NumberInput
        source="timeLimitSeconds"
        label="Time Limit (seconds)"
        min={0}
      />
      <BooleanInput source="isActive" label="Active" />
    </SimpleForm>
  </Edit>
);
