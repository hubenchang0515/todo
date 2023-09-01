import Container from '@mui/material/Container';
import TaskCard, { TaskProps, TaskState } from './TaskCard';
import { AppBar, Box, Fab, IconButton, Pagination, Stack, Tab, Tabs, Toolbar } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import AddIcon from '@mui/icons-material/Add'
import React, { useEffect, useRef, useState } from 'react';
import TaskEditDialog from './TaskEditDialog';

function App(): JSX.Element {
  const dbName = "todo";
  const dbVersion = 1;
  const tableName = "task";
  const pageSize = 10;
  const stateIndex = "stateIndex";

  const fabStyle = {
    position: 'fixed',
    bottom: 16,
    right: 16,
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

  // add task
  const addTask = (task: TaskProps) => {
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

  const setTaskState = (id:number, state:TaskState) => {
    console.log(`setTaskState id=${id} state=${state}`);
    if (db) {
      const request = db.transaction([tableName], 'readwrite')
        .objectStore(tableName)
        .get(id);

      request.onsuccess = () => {
        if (request.result) {
          let task = request.result;
          task.state = state;
          const request2 = db.transaction([tableName], 'readwrite')
                          .objectStore(tableName)
                          .put(task);
          request2.onsuccess = () => {
            setTrigger(!trigger);
          }
        }
      }

      request.onerror = (error) => {
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
        setTaskList(tasks);
      }
    }
  }

  useEffect(() => {
    if (db) {
      showPagition(db, taskStateTab);
      showTaskList(db, taskStateTab, page, pageSize);
    }
  }, [db, taskStateTab, page, pageSize, trigger]);

  const taskRef = useRef<TaskProps | null>(null);

  const [open, setOpen] = useState(false);

  const handleClickAddButton = () => {
    setOpen(true);
  };

  const handleClickCancelButton = () => {
    setOpen(false);
  };

  const handleClickOkButton = () => {
    if (!(taskRef.current))
      return;

    let task = {
      state: TaskState.TODO,
      title: taskRef.current.title,
      description: taskRef.current.description,
      date: new Date(),
      rating: taskRef.current?.rating,
    }

    addTask(task);
    setOpen(false);
  };

  const handleClickDeleteButton = (id:number) => {
    if (taskStateTab === TaskState.TODO) {
      setTaskState(id, TaskState.GIVE_UP);
    } else {
      delTask(id);
    }
  }

  const handleClickDoneButton = (id:number) => {
    setTaskState(id, TaskState.DONE);
  }

  const handleTabChange = (event: React.SyntheticEvent, value: number) => {
    console.log("handleTabChange", value)
    setTaskStateTab(value);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    console.log("handlePageChange", value)
    setPage(value - 1);
  }

  return (
    <Box sx={{ flexGrow: 2 }}>
      <Stack spacing={2}>

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
          </Toolbar>
        </AppBar>

        <Container fixed>
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
                        onDone={handleClickDoneButton} />
            })}
          </Stack>
        </Container>

        {pageCount > 1 && 
          <Pagination 
            count={pageCount} 
            page={page + 1} 
            onChange={handlePageChange} 
            color="primary" 
            style={paginationStyle} />}

        <br />
      </Stack>

      <Fab sx={fabStyle} color="primary" aria-label="add" onClick={handleClickAddButton}>
        <AddIcon />
      </Fab>

      <TaskEditDialog
        open={open}
        onCancel={handleClickCancelButton}
        onOk={handleClickOkButton}
        taskRef={taskRef} />
    </Box>
  );
}

export default App;
