import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import { Avatar, IconButton, Rating, Typography } from '@mui/material';
import { blue } from '@mui/material/colors';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined';

export enum TaskState {
  TODO,
  DONE,
  GIVE_UP,
};

export interface TaskProps {
  id?: number,
  state?: TaskState,
  title: string,
  description: string,
  date: Date,
  rating: number,
};

export interface TaskCardProps extends TaskProps {
  onDelete?: (task:TaskProps)=>void,
  onEdit?: (task:TaskProps)=>void,
  onDone?: (task:TaskProps)=>void,
  onRedo?: (task:TaskProps)=>void,
};


function TaskCard(props:TaskCardProps) {
  const firstButtonStyle = {
    marginLeft: "auto",
  };

  const dateFormat = {year:"numeric", month:"long", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric"} as const;
  const onDelete = () => {
    if (props.onDelete && props.id) {
      props.onDelete(props as TaskProps);
    }
  }

  const onEdit = () => {
    if (props.onEdit && props) {
      props.onEdit(props as TaskProps);
    }
  }

  const onDone = () => {
    if (props.onDone && props.id) {
      props.onDone(props as TaskProps);
    }
  }

  const onRedo = () => {
    if (props.onRedo && props.id) {
      props.onRedo(props as TaskProps);
    }
  }

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
            <Avatar sx={{ bgcolor: blue[500] }} aria-label="recipe">
                {props.title.toUpperCase()[0]}
            </Avatar>
        }
        title={props.title}
        subheader={props.date.toLocaleDateString(navigator.language, dateFormat)}>
      </CardHeader>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
            {props.description}
        </Typography>
      </CardContent>
      <CardActions>
        <Rating name="read-only" value={props.rating} readOnly/>
          <IconButton style={firstButtonStyle} onClick={onDelete}>
            <DeleteSweepOutlinedIcon color="secondary"/>
          </IconButton>
          <IconButton onClick={onEdit}>
            <EditNoteOutlinedIcon color="primary"/>
          </IconButton>
          { props.state === TaskState.TODO ? 
            <IconButton color="primary" onClick={onDone}>
              <PlaylistAddCheckOutlinedIcon/>
            </IconButton> 
            :
            <IconButton color="primary" onClick={onRedo}>
              <PlaylistAddOutlinedIcon/>
            </IconButton>
          }
      </CardActions>
    </Card>
  );
}

export default TaskCard;