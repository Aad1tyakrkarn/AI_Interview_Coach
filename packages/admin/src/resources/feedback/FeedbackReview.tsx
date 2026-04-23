import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  NumberField,
  ReferenceField,
  RichTextField,
  FunctionField,
  useRecordContext,
  useUpdate,
  useNotify,
  useRefresh,
} from 'react-admin';
import { Button, Box, Typography, Chip } from '@mui/material';

const ReviewActions = () => {
  const record = useRecordContext();
  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

  if (!record || record.reviewed) return null;

  const handleMarkReviewed = () => {
    update(
      'feedback',
      { id: record.id, data: { reviewed: true }, previousData: record },
      {
        onSuccess: () => {
          notify('Feedback marked as reviewed');
          refresh();
        },
        onError: () => {
          notify('Error marking feedback as reviewed', { type: 'error' });
        },
      },
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button variant="contained" color="primary" onClick={handleMarkReviewed}>
        Mark as Reviewed
      </Button>
    </Box>
  );
};

const ReportSummary = () => {
  const record = useRecordContext();
  if (!record) return null;

  const strengths = record.strengths || [];
  const weaknesses = record.weaknesses || [];
  const score = record.rating ?? record.score ?? record.overallScore;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Report Summary
      </Typography>

      {score != null && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Overall Score
          </Typography>
          <Typography variant="h4" color="primary">
            {typeof score === 'number' && score <= 5 ? `${score}/5` : score}
          </Typography>
        </Box>
      )}

      {strengths.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="success.main" gutterBottom>
            Strengths
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {strengths.map((s: string, i: number) => (
              <Chip key={i} label={s} size="small" color="success" variant="outlined" />
            ))}
          </Box>
        </Box>
      )}

      {weaknesses.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="error.main" gutterBottom>
            Areas for Improvement
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {weaknesses.map((w: string, i: number) => (
              <Chip key={i} label={w} size="small" color="error" variant="outlined" />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export const FeedbackReview = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
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
      <NumberField source="rating" label="Rating" />
      <RichTextField source="comment" label="Feedback Comment" />
      <FunctionField
        label="Reviewed"
        render={(record: any) => (
          <Chip
            label={record?.reviewed ? 'Reviewed' : 'Pending Review'}
            color={record?.reviewed ? 'success' : 'warning'}
            size="small"
          />
        )}
      />
      <DateField source="createdAt" label="Created" showTime />
      <ReportSummary />
      <ReviewActions />
    </SimpleShowLayout>
  </Show>
);
