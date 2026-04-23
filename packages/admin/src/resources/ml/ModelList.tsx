import {
  List,
  Datagrid,
  TextField,
  NumberField,
  BooleanField,
  DateField,
  FunctionField,
} from 'react-admin';
import { Chip } from '@mui/material';

export const ModelList = () => (
  <List sort={{ field: 'deployedAt', order: 'DESC' }} perPage={25}>
    <Datagrid bulkActionButtons={false}>
      <TextField source="modelName" label="Model Name" />
      <TextField source="version" />
      <FunctionField
        label="Accuracy"
        render={(record: any) => {
          const accuracy = record?.accuracy;
          if (accuracy == null) return '--';
          const pct = accuracy <= 1 ? (accuracy * 100).toFixed(1) : accuracy.toFixed(1);
          return (
            <Chip
              label={`${pct}%`}
              size="small"
              color={
                Number(pct) >= 90
                  ? 'success'
                  : Number(pct) >= 80
                    ? 'warning'
                    : 'error'
              }
            />
          );
        }}
      />
      <FunctionField
        label="Status"
        render={(record: any) => (
          <Chip
            label={record?.isActive ? 'Active' : 'Inactive'}
            size="small"
            color={record?.isActive ? 'success' : 'default'}
            variant={record?.isActive ? 'filled' : 'outlined'}
          />
        )}
      />
      <DateField source="deployedAt" label="Deployed" showTime />
    </Datagrid>
  </List>
);
