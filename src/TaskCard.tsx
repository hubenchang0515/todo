import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import { Avatar, IconButton, Rating, Typography } from '@mui/material';
import { blue } from '@mui/material/colors';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';

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
  onDelete?: (id:number)=>void,
  onDone?: (id:number)=>void,
};


function TaskCard(props:TaskCardProps) {
  const firstButtonStyle = {
    marginLeft: "auto",
  };

  const dateFormat = {year:"numeric", month:"long", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric"} as const;
  const onDelete = () => {
    if (props.onDelete && props.id) {
      props.onDelete(props.id);
    }
  }

  const onDone = () => {
    if (props.onDone && props.id) {
      props.onDone(props.id);
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
          <IconButton disabled={props.state !== TaskState.TODO} onClick={onDone}>
            <PlaylistAddCheckOutlinedIcon color={props.state !== TaskState.TODO ? "disabled" : "primary"} />
          </IconButton>
      </CardActions>
    </Card>
  );
}

export default TaskCard;