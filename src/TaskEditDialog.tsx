import { Dialog, DialogTitle, DialogContent, FormControl, TextField, DialogActions, Button, TextFieldProps, Rating, Typography, RatingProps } from "@mui/material";
import { useRef, useState } from "react";
import { TaskProps } from "./TaskCard";

export interface TaskEditDialogProps {
  open: boolean
  onCancel?: ()=>void,
  onOk?: ()=>void,
  taskRef?: React.MutableRefObject<TaskProps | null>,
}

function TaskEditDialog(props:TaskEditDialogProps) {

  if (props.taskRef && !(props.taskRef.current)) {
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
        <Button variant="outlined" onClick={props?.onCancel}>CANCEL</Button>
        <Button variant="contained" onClick={props?.onOk}>OK</Button>
      </DialogActions>
    </Dialog>
  )
}

export default TaskEditDialog;