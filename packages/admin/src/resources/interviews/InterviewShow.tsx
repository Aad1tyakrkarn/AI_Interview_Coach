import {
  Show,
  TabbedShowLayout,
  TextField,
  DateField,
  NumberField,
  ReferenceField,
  FunctionField,
} from 'react-admin';
import { Chip, Box, Typography } from '@mui/material';
import { formatDuration } from '../../utils/formatters';

export const InterviewShow = () => (
  <Show>
    <TabbedShowLayout>
      <TabbedShowLayout.Tab label="Details">
        <TextField source="id" />
        <ReferenceField source="userId" reference="users" link="show" label="User">
          <TextField source="email" />
        </ReferenceField>
        <TextField source="title" label="Title" />
        <FunctionField
          label="Mode"
          render={(record: any) => (
            <Chip label={record?.mode} variant="outlined" />
          )}
        />
        <FunctionField
          label="Status"
          render={(record: any) => (
            <Chip
              label={record?.status}
              color={
                record?.status === 'completed'
                  ? 'success'
                  : record?.status === 'in_progress'
                    ? 'warning'
                    : record?.status === 'cancelled'
                      ? 'error'
                      : 'default'
              }
            />
          )}
        />
        <TextField source="jobRole" label="Job Role" />
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
        <DateField source="startedAt" label="Started" showTime />
        <DateField source="completedAt" label="Completed" showTime />
        <FunctionField
          label="Duration"
          render={(record: any) =>
            record?.duration ? formatDuration(record.duration) : '--'
          }
        />
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Scores">
        <FunctionField
          label="Score Summary"
          render={(record: any) => (
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Overall Score
                </Typography>
                <Typography variant="h4" color="primary">
                  {record?.overallScore != null
                    ? `${record.overallScore.toFixed(1)}%`
                    : '--'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Technical
                </Typography>
                <Typography variant="h5">
                  {record?.technicalScore != null
                    ? `${record.technicalScore.toFixed(1)}%`
                    : '--'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Communication
                </Typography>
                <Typography variant="h5">
                  {record?.communicationScore != null
                    ? `${record.communicationScore.toFixed(1)}%`
                    : '--'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Problem Solving
                </Typography>
                <Typography variant="h5">
                  {record?.problemSolvingScore != null
                    ? `${record.problemSolvingScore.toFixed(1)}%`
                    : '--'}
                </Typography>
              </Box>
            </Box>
          )}
        />
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Questions">
        <FunctionField
          label="Questions & Answers"
          render={(record: any) => {
            const questions = record?.questions || [];
            if (questions.length === 0) {
              return (
                <Typography color="textSecondary">
                  No questions recorded for this interview.
                </Typography>
              );
            }
            return (
              <Box>
                {questions.map((q: any, i: number) => (
                  <Box
                    key={i}
                    sx={{
                      mb: 2,
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Q{i + 1}: {q.text || q.question || '--'}
                    </Typography>
                    {q.answer && (
                      <Typography variant="body2" color="textSecondary">
                        Answer: {q.answer}
                      </Typography>
                    )}
                    {q.score != null && (
                      <Chip
                        label={`Score: ${q.score}`}
                        size="small"
                        sx={{ mt: 1 }}
                        color={q.score >= 70 ? 'success' : q.score >= 40 ? 'warning' : 'error'}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            );
          }}
        />
      </TabbedShowLayout.Tab>
    </TabbedShowLayout>
  </Show>
);
