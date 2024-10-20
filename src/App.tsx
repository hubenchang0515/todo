import Container from '@mui/material/Container';
import TaskCard, { TaskProps, TaskState } from './TaskCard';
import { AppBar, Box, createTheme, CssBaseline, Fab, IconButton, Pagination, PaletteMode, Stack, Tab, Tabs, Toolbar } from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import AddIcon from '@mui/icons-material/Add'
import React, { useEffect, useRef, useState } from 'react';
import TaskEditDialog from './TaskEditDialog';
import SyncDialog from './SyncDialog';
import { ThemeProvider } from '@emotion/react';

function App(): JSX.Element {
  const dbName = "todo";
  const dbVersion = 1;
  const tableName = "task";
  const pageSize = 10;
  const stateIndex = "stateIndex";

  const fabStyle = {
    position: 'fixed',
    bottom: 32,
    right: 32,
  };

  const paginationStyle = {
    marginLeft: "auto",
    marginRight: "auto",
  }

  const [db, setDb] = useState<IDBDatabase>();
  const [taskStateTab, setTaskStateTab] = useState(TaskState.TODO);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [taskList, setTaskList] = useState<TaskProps[]>([]);
  const [trigger, setTrigger] = useState(false);

  // init database
  useEffect(() => {
    document.documentElement.lang = navigator.language;
    let db: IDBDatabase;
    const request = window.indexedDB.open(dbName, dbVersion);

    request.onerror = () => {
      alert("Cannot open IndexedDB");
    };

    request.onsuccess = () => {
      db = request.result;
      setDb(db);
    }

    request.onupgradeneeded = () => {
      db = request.result;

      let objectStore;
      if (!db.objectStoreNames.contains(tableName)) {
        objectStore = db.createObjectStore(tableName, {
          keyPath: 'id',
          autoIncrement: true,
        });
      } else {
        objectStore = db.transaction([tableName]).objectStore(tableName)
      }

      if (!objectStore.indexNames.contains(stateIndex)) {
        objectStore.createIndex(stateIndex, "state", { unique: false }); // 组合索引
      } 
    }
  }, []);

  // erase fields
  const eraseTaskProps = (t: TaskProps, eraseId:boolean=false) => {
    if (eraseId) {
      return {
        state: t.state,
        title: t.title,
        description: t.description,
        date: t.date,
        rating: t.rating,
      };
    } else {
      return {
        id: t.id,
        state: t.state,
        title: t.title,
        description: t.description,
        date: t.date,
        rating: t.rating,
      };
    }
  }

  // add task
  const addTask = (task: TaskProps) => {
    task = eraseTaskProps(task, true);
    console.log(`addTask task=${task}`);
    if (db) {
      const request = db.transaction([tableName], 'readwrite')
        .objectStore(tableName)
        .add(task);

      request.onsuccess = function () {
        setTrigger(!trigger);
      }

      request.onerror = function () {
        alert('Cannot write database');
      }
    }
  }

  // edit task
  const modifyTask = (task:TaskProps) => {
    task = eraseTaskProps(task);
    console.log(`modifyTask task=${task}`);
    if (db) {
      const request = db.transaction([tableName], 'readwrite')
        .objectStore(tableName)
        .put(task);

      request.onsuccess = function () {
        setTrigger(!trigger);
      }

      request.onerror = function () {
        alert('Cannot write database');
      }
    }
  }

  // delete task
  const delTask = (id: number) => {
    console.log(`delTask id=${id}`);
    if (db) {
      const request = db.transaction([tableName], 'readwrite')
        .objectStore(tableName)
        .delete(id);

      request.onsuccess = () => {
        setTrigger(!trigger);
      }

      request.onerror = () => {
        alert('Cannot write database');
      }
    }
  }

  // show pagination
  const showPagition = (db: IDBDatabase, state:TaskState) => {
    console.log(`showPagition state=${state}`);
    const request = db.transaction([tableName], 'readwrite')
      .objectStore(tableName)
      .index(stateIndex)
      .count(IDBKeyRange.only(state));

    request.onsuccess = () => {
      console.log(request.result)
      setPageCount(Math.ceil(request.result / pageSize));
    }
  }

  // show task list
  const showTaskList = (db: IDBDatabase, state:TaskState, page: number = 0, pageSize: number = 10) => {
    console.log(`showTaskList state=${state} page=${page} pageSize=${pageSize}`)
    const request = db.transaction([tableName], 'readonly')
      .objectStore(tableName)
      .index(stateIndex)
      .openCursor(IDBKeyRange.only(state));

    let tasks: TaskProps[] = [];
    let begin = true;
    request.onsuccess = () => {
      let cursor = request.result;
      if (cursor && tasks.length < pageSize) {

        if (begin && page > 0) {
          cursor.advance(page*pageSize);
          begin = false;
          return;
        }

        tasks.push({
          id: cursor.value.id,
          state: cursor.value.state,
          title: cursor.value.title,
          description: cursor.value.description,
          date: cursor.value.date,
          rating: cursor.value.rating,
        });
        
        cursor.continue();
      } else {
        if (tasks.length > 0) {
          setTaskList(tasks);
        } else if (page > 0) {
          setPage(page - 1);
        } else {
          setTaskList([]);
        }
      }
    }
  }

  useEffect(() => {
    if (db) {
      showPagition(db, taskStateTab);
      showTaskList(db, taskStateTab, page, pageSize);
    }
  }, [db, taskStateTab, page, pageSize, trigger]);

  const taskRef:React.MutableRefObject<TaskProps | null> = useRef<TaskProps>(null);

  const [open, setOpen] = useState(false);
  
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  const handleClickAddButton = () => {
    taskRef.current = {title:"", description:"", rating:3, date:new Date()}
    setOpen(true);
  };

  const handleClickCancelButton = () => {
    setOpen(false);
  };

  const handleClickOkButton = () => {
    if (!(taskRef.current))
      return;

    if (taskRef.current.id) {
      let task = {...taskRef.current}
      modifyTask(task);
    } else {
      let task = {
        ...taskRef.current,
        state: TaskState.TODO,
        date: new Date(),
      }
      addTask(task);
      setTaskStateTab(TaskState.TODO);
    }
    setOpen(false);
  };

  const handleClickDeleteButton = (task:TaskProps) => {
    if (task.state === TaskState.TODO) {
      let newTask = {
        ...task,
        state: TaskState.GIVE_UP,
      };
      modifyTask(newTask);
    } else if (task.id) {
      delTask(task.id);
    }
  }

  const handleClickEdit = (task:TaskProps) => {
    taskRef.current = {...task};
    setOpen(true);
  }

  const handleClickDoneButton = (task:TaskProps) => {
    let newTask = {
      ...task,
      state: TaskState.DONE,
    };
    modifyTask(newTask);
  }

  const handleClickRedoButton = (task:TaskProps) => {
    let newTask = {
      ...task,
      state: TaskState.TODO,
    };
    modifyTask(newTask);
  }

  const handleTabChange = (event: React.SyntheticEvent, value: number) => {
    console.log("handleTabChange", value)
    setTaskStateTab(value);
    setPage(0);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    console.log("handlePageChange", value)
    setPage(value - 1);
  }

  const params = new URLSearchParams(window.location.search);

  const theme = createTheme({
    palette: {
      mode: (params.get('theme')??'light') as PaletteMode ,
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <Box sx={{ flexGrow: 2, minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar variant="dense">
            <IconButton
              size="small"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              href='https://github.com/hubenchang0515/todo/'
              target='_blank'
            >
              <GitHubIcon />
            </IconButton>
            <Tabs 
              value={taskStateTab}
              indicatorColor="secondary"
              textColor="inherit"
              variant="fullWidth"
              onChange={handleTabChange}>
              <Tab label="To do"/>
              <Tab label="Done"/>
              <Tab label="Give up"/>
            </Tabs>
            <IconButton
              size="small"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ ml: "auto", mr:2 }}
              onClick={()=>{setSyncDialogOpen(true);}}>
              <LinkOutlinedIcon />
            </IconButton>
            <IconButton
              size="small"
              edge="start"
              color="inherit"
              aria-label="menu"
              href='https://github.com/hubenchang0515/todo/blob/master/document/USAGE.md'
              target='_blank'
            >
              <HelpOutlineOutlinedIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <br />

        <Container maxWidth="lg">
          <Stack spacing={2}>
            {taskList?.map((item, index) => {
              return <TaskCard 
                        key={index} 
                        title={item.title} 
                        description={item.description} 
                        date={item.date} 
                        rating={item.rating}
                        id={item.id}
                        state={item.state}
                        onDelete={handleClickDeleteButton}
                        onEdit={handleClickEdit}
                        onDone={handleClickDoneButton}
                        onRedo={handleClickRedoButton} />
            })}
          </Stack>
          <br />
          {pageCount > 1 && 
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Pagination 
              count={pageCount} 
              page={page + 1} 
              onChange={handlePageChange} 
              color="primary" 
              style={paginationStyle} 
            />
          </Box>
          }

          <br />
        </Container>

        <Fab sx={fabStyle} color="primary" aria-label="add" onClick={handleClickAddButton}>
          <AddIcon />
        </Fab>

        <TaskEditDialog
          open={open}
          onCancel={handleClickCancelButton}
          onOk={handleClickOkButton}
          taskRef={taskRef} />

        <SyncDialog
          open={syncDialogOpen}
          db={db}
          tableName={tableName}
          onClose={() => {
            setSyncDialogOpen(false);
          }}
          onImport={() => {
            setTrigger(!trigger);
          }}/>
      </Box>
    </ThemeProvider>
  );
}

export default App;
