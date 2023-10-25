import Peer, { DataConnection } from "peerjs";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Snackbar, Alert, Stack, AlertColor, LinearProgress} from "@mui/material";
import { useEffect, useState } from "react";
import { ContentCopyOutlined } from "@mui/icons-material";

function exportData(peer:Peer, db:IDBDatabase, tableName:string) {
    peer.on("connection", (conn:DataConnection) => {

        conn.on("open", () => {
            const request = db.transaction([tableName], 'readonly')
                .objectStore(tableName)
                .openCursor();

            request.onsuccess = () => {
                let cursor = request.result;
                if (cursor == null) {
                    conn.close();
                    return;
                }

                let task = {
                    id: cursor.value.id,
                    state: cursor.value.state,
                    title: cursor.value.title,
                    description: cursor.value.description,
                    date: cursor.value.date,
                    rating: cursor.value.rating,
                };
                
                conn.send(task);
                cursor.continue();
            };
        });
    });
}

function importData(peer:Peer, id:string, db:IDBDatabase, tableName:string) {
    let conn = peer.connect(id);
    conn.on("open", () => {
        const request = db.transaction([tableName], 'readwrite')
                .objectStore(tableName)
                .clear();
        request.onsuccess = () => {
            conn.on("data", (data:any) => {
                let task = {
                    id: data.id,
                    state: data.state,
                    title: data.title,
                    description: data.description,
                    date: new Date(data.date),
                    rating: data.rating,
                }

                db.transaction([tableName], 'readwrite')
                    .objectStore(tableName)
                    .put(task);
            });
        };
    });
    return conn;
}

interface TaskCardProps {
    open: boolean,
    db?: IDBDatabase,
    tableName?: string,
    onClose?: ()=>void,
    onImport?: ()=>void,
}

function SyncDialog(props:TaskCardProps) {
    const [peer, setPeer] = useState<Peer>();

    const [peerId, setPeerId] = useState("");

    const [waiting, setWaiting] = useState(true);

    const [messageShow, setMessageShow] = useState(false);
    const [messageColor, setMessageColor] = useState<AlertColor>("info");
    const [message, setMessage] = useState("");

    const onClose = () => {
        props.onClose?.();
    };

    const onImport = () => {
        if (peerId === peer?.id) {
            setMessageColor("error");
            setMessage("Cannot import from current browser");
            setMessageShow(true);
            return;
        }
        if (peer && props.db && props.tableName) {
            setWaiting(true);
            let conn = importData(peer, peerId, props.db, props.tableName);

            conn.on("close", () => {
                props.onImport?.();
                setMessageColor("success");
                setMessage("Import Finished");
                setMessageShow(true);
                setWaiting(false);
            });
        }
    }

    useEffect(() => {
        if (props.open && !(peer?.id)) {
            setWaiting(true);
            let peer = new Peer();
            peer.on("open", (id:string) => {
                setPeer(peer);
                setWaiting(false);
                if (props.db && props.tableName) {
                    exportData(peer, props.db, props.tableName);
                }
            });
            peer.on("error", (err) => {
                if (err) {
                    setMessageColor("error");
                    setMessage(`${err}`);
                    setMessageShow(true);
                    setWaiting(true);
                }
            });
        } else if(!props.open){
            setMessageShow(false);
            peer?.disconnect();
        }
    }, [props.open, props.db, props.tableName, peer]);

    return (
        <Dialog open={props.open} maxWidth="md" fullWidth={true}>
            <DialogTitle>Sync</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                <Button 
                    variant="outlined" 
                    startIcon={<ContentCopyOutlined />}
                    disabled={waiting}
                    onClick={() => {
                        if (peer) {
                            navigator.clipboard.writeText(peer.id).then(() =>{
                                setMessageColor("success");
                                setMessage(`Copied Host ID: ${peer?.id}`);
                                setMessageShow(true);
                            });
                        }
                    }}>
                    Host ID: {peer?.id?? "Waiting For ID"}
                </Button>
                <Alert severity="info">
                    <strong>Info:</strong> This dialog cannot be closed during synchronization.
                </Alert>
                <Alert severity="warning">
                    <strong>Warning:</strong> Import from other device will clear current databse.
                </Alert>
                <TextField 
                    label="Peer ID" 
                    variant="outlined" 
                    disabled={waiting}
                    autoFocus
                    onChange={(e) => {setPeerId(e.target.value);}}
                />
                {waiting ? <LinearProgress /> : <></>}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>CLOSE</Button>
                <Button variant="contained" onClick={onImport} disabled={waiting}>IMPORT</Button>
            </DialogActions>

            <Snackbar 
                anchorOrigin={{vertical: "bottom", horizontal: "center"}} open={messageShow} onClose={()=>{setMessageShow(false);}}>
                <Alert elevation={6} onClose={()=>{setMessageShow(false);}} variant="filled" severity={messageColor}>
                    {message}
                </Alert>
            </Snackbar>
        </Dialog>
    )
}

export default SyncDialog;


