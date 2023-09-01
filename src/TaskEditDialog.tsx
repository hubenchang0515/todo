import { Dialog, DialogTitle, DialogContent, FormControl, TextField, DialogActions, Button, Rating, Typography, Snackbar, Alert } from "@mui/material";
import { TaskProps } from "./TaskCard";
import { useState } from "react";

export interface TaskEditDialogProps {
  open: boolean
  onCancel?: ()=>void,
  onOk?: ()=>void,
  taskRef?: React.MutableRefObject<TaskProps | null>,
}

function TaskEditDialog(props:TaskEditDialogProps) {

  if (props.taskRef) {
    props.taskRef.current = {title:"", description:"", rating:3, date:new Date()}
  }

  const setTitle = (value:string) => {
    if (props.taskRef?.current) {
      props.taskRef.current.title = value
    }
  }

  const setDescription = (value:string) => {
    if (props.taskRef?.current) {
      props.taskRef.current.description = value
    }
  }

  const setRating = (value:number) => {
    if (props.taskRef?.current) {
      props.taskRef.current.rating = value
    }
  }

  const [alert, setAlert] = useState(false);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setAlert(false);
  };


  const onOk = () => {
    setAlert(false);

    if (props.taskRef?.current && props.taskRef.current.title.trim() === "") {
      setAlert(true);
      return;
    }

    if (props.onOk) {
      props.onOk();
    }
  };

  const onCancel = () => {
    setAlert(false);

    if (props.onCancel) {
      props.onCancel();
    }
  }

  return (
      <Dialog open={props.open}>
      <DialogTitle>Add Task</DialogTitle>
      <DialogContent sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' },}}>
        <FormControl fullWidth>
          <TextField label="Task Title" variant="outlined" onChange={(e) => {setTitle(e.target.value)}}/>
          <TextField label="Task Description" variant="outlined" multiline rows={4} onChange={(e) => {setDescription(e.target.value)}}/>
        </FormControl>
        <Typography component="legend">Rating</Typography>
        <Rating name="simple-controlled" defaultValue={3} onChange={(_, value) => {setRating(Number(value))}}/>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel}>CANCEL</Button>
        <Button variant="contained" onClick={onOk}>OK</Button>
      </DialogActions>
      <Snackbar 
        anchorOrigin={{vertical: "bottom", horizontal: "center"  }} open={alert} onClose={handleClose}>
        <Alert elevation={6} onClose={handleClose} variant="filled" severity="error">
          Task title should not be empty.
        </Alert>
      </Snackbar>
    </Dialog>
  )
}

export default TaskEditDialog;