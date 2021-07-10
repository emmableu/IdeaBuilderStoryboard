import React from 'react';
import {makeStyles, ThemeProvider} from '@material-ui/core/styles';
import {Drawer, Box, Button, CssBaseline, Grid} from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import DashboardTitleBar from "./DashboardTitleBar";
import ProjectMenu from "./ProjectMenu";
import {Add} from "@material-ui/icons";
import globalConfig from "../../globalConfig";
import ProjectTable from "./ProjectTable";
import NewProjectButton from "./NewProjectButton";
import {useDispatch, useSelector} from "react-redux";
import Cookies from "js-cookie";
import {fetchDashboardByUserID} from "../../redux/features/dashboardSlice";
import { Skeleton } from 'antd';
import {LoadingSkeleton} from "./LoadingSkeleton";

const drawerWidth = globalConfig.projectDrawerWidth;

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
    },
    appBar: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    // necessary for content to be below app bar
    toolbar: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(3),
    },
    addButtonContainer: {
        "& span": {
            textTransform: "none",
        },
        width: "100%",
        padding: "10px 0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    projectTableGrid: {
        padding: "30px 0 0 0"
    }
}));
const DashboardPage = () => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const userID = Cookies.get('userID');
    const projectList = useSelector(state =>
        state.dashboard.value===null? null: state.dashboard.value.projectListJSON());

    React.useEffect(() =>
    {
        if (userID !== undefined) {
            dispatch(fetchDashboardByUserID(userID));
        }
    }, []);


    return (
        <ThemeProvider theme={globalConfig.dashboardTheme()}>
        <div className={classes.root}>
            <CssBaseline />
            <DashboardTitleBar userID={userID}/>
            <Drawer
                className={classes.drawer}
                variant="permanent"
                classes={{
                    paper: classes.drawerPaper,
                }}
                anchor="left"
            >
                <div className={classes.toolbar} />
                <Divider />
                <div className={classes.addButtonContainer}>
                 <NewProjectButton />
                </div>
                <ProjectMenu/>
            </Drawer>
            <main className={classes.content}>
                <div className={classes.toolbar} />
                <Box style={{height: "5vh"}}/>
                <Grid container justifyContent="center" alignItems="center" spacing={3}>
                <Grid item xs={10}>
                    {(projectList === null) && <LoadingSkeleton/>}
                    {(projectList !== null) && <ProjectTable projectList={projectList}/>}
                </Grid>
                </Grid>
            </main>
        </div>
        </ThemeProvider>
    );
}


export default DashboardPage;
